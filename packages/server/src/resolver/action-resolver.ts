import type { GameState, ClientIntent, PlayerState, Result, SelectTeamIntent } from '@mugen/shared';
import {
  IntentType,
  GamePhase,
  TurnPhase,
  STARTING_LIFE,
  ACTIVE_UNIT_COUNT,
} from '@mugen/shared';
import {
  TurnEngine,
  GameEngine,
  StartingPlacementEngine,
} from '@mugen/shared';
import type { Lobby } from '../lobby/lobby-manager.js';

export function createInitialGameState(lobby: Lobby): Result<GameState> {
  const players: PlayerState[] = lobby.players.map((lp) => ({
    id: lp.id,
    name: lp.name,
    life: STARTING_LIFE,
    maxLife: STARTING_LIFE,
    team: { activeUnits: [], reserveUnits: [], locked: false },
    units: [],
    hand: { cards: [] },
    deck: { cards: lp.selectedDeck }, // Put the 16-card deck in the deck field for processing
    mainDeck: { cards: [] }, // Let GameEngine.createGame populate this
    discardPile: { cards: [] }, // Let GameEngine.createGame populate this
    isEliminated: false,
    isReady: lp.isReady,
    isConnected: true,
    reserveLockedUntilNextTurn: false,
  }));

  const gameResult = GameEngine.createGame(players);
  if (!gameResult.ok) {
    return gameResult;
  }

  return {
    ok: true,
    value: {
      ...gameResult.value,
      phase: GamePhase.PRE_GAME,
    },
  };
}

export function resolveIntent(
  state: GameState,
  playerId: string,
  intent: ClientIntent
): Result<GameState> {
  // For game-phase intents (team selection/locking), player order doesn't matter
  if (intent.type === IntentType.SELECT_TEAM || intent.type === IntentType.LOCK_TEAM) {
    return resolvePreGameIntent(state, playerId, intent);
  }

  // For in-game intents, verify it's the player's turn
  if (state.phase === GamePhase.IN_PROGRESS) {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return { ok: false, error: `Not your turn (current player: ${currentPlayer?.name})` };
    }
    return resolveGameIntent(state, playerId, intent);
  }

  return { ok: false, error: `Cannot process intent in phase ${state.phase}` };
}

function resolvePreGameIntent(
  state: GameState,
  playerId: string,
  intent: ClientIntent
): Result<GameState> {
  if (state.phase !== GamePhase.PRE_GAME) {
    return { ok: false, error: 'Not in pre-game phase' };
  }

  switch (intent.type) {
    case IntentType.SELECT_TEAM: {
      const selectIntent = intent as SelectTeamIntent;

      if (!selectIntent.activeUnits || !selectIntent.reserveUnits) {
        return { ok: false, error: 'SELECT_TEAM must include activeUnits and reserveUnits arrays' };
      }

      if (selectIntent.activeUnits.length !== ACTIVE_UNIT_COUNT) {
        return { ok: false, error: `Must have exactly ${ACTIVE_UNIT_COUNT} active units` };
      }

      const updatedPlayers = state.players.map(player => {
        if (player.id === playerId) {
          return {
            ...player,
            team: {
              activeUnits: selectIntent.activeUnits,
              reserveUnits: selectIntent.reserveUnits,
              locked: false,
            },
          };
        }
        return player;
      });

      return { ok: true, value: { ...state, players: updatedPlayers } };
    }

    case IntentType.LOCK_TEAM: {
      const playerToLock = state.players.find(p => p.id === playerId);
      if (!playerToLock) {
        return { ok: false, error: 'Player not found' };
      }

      if (playerToLock.team.activeUnits.length !== ACTIVE_UNIT_COUNT) {
        return { ok: false, error: `Cannot lock team: must have exactly ${ACTIVE_UNIT_COUNT} active units` };
      }

      const updatedPlayers = state.players.map(player => {
        if (player.id === playerId) {
          return {
            ...player,
            team: {
              ...player.team,
              locked: true,
            },
          };
        }
        return player;
      });

      const allLocked = updatedPlayers.every(p => p.team.locked === true);
      
      if (allLocked) {
        // Use initializeMatchUnits for correct color assignment, player-scoped
        // occupant IDs, bench unit creation, and deterministic player ordering.
        const preGameState: GameState = { ...state, players: updatedPlayers };
        const initResult = StartingPlacementEngine.initializeMatchUnits(preGameState);
        if (!initResult.ok) {
          return { ok: false, error: initResult.error };
        }
        return { ok: true, value: initResult.value };
      }

      return { ok: true, value: { ...state, players: updatedPlayers } };
    }

    default:
      return { ok: false, error: `Invalid intent for pre-game: ${intent.type}` };
  }
}

function resolveGameIntent(
  state: GameState,
  playerId: string,
  intent: ClientIntent
): Result<GameState> {
  switch (intent.type) {
    case IntentType.ADVANCE_PHASE:
      return TurnEngine.advancePhase(state);

    case IntentType.END_TURN: {
      if (state.turnPhase !== TurnPhase.END) {
        // Auto-advance to END phase first
        let current = state;
        while (current.turnPhase !== TurnPhase.END) {
          const advanced = TurnEngine.advancePhase(current);
          if (!advanced.ok) break;
          current = advanced.value;
        }
        return TurnEngine.endTurn(current);
      }
      return TurnEngine.endTurn(state);
    }

    case IntentType.MOVE_UNIT:
      return TurnEngine.processMove(state, playerId, intent.unitId, intent.target);

    case IntentType.USE_ABILITY:
      return TurnEngine.processAbility(state, playerId, intent.unitId, intent.targetId ?? null);

    case IntentType.ATTACK:
      return TurnEngine.processAttack(state, playerId, intent.attackerId, intent.defenderId);

    case IntentType.DEPLOY_RESERVE:
      return TurnEngine.deployReserve(state, playerId, intent.unitId, intent.position);

    default:
      return { ok: false, error: `Unknown intent type: ${(intent as ClientIntent).type}` };
  }
}

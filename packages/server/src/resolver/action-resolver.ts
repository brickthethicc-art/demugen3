import type { GameState, ClientIntent, PlayerState, Result, SelectTeamIntent, DiscardCardIntent, SummonToBenchIntent, PlaySorceryIntent } from '@mugen/shared';
import {
  IntentType,
  GamePhase,
  TurnPhase,
  STARTING_LIFE,
  ACTIVE_UNIT_COUNT,
  MAX_HAND_SIZE,
} from '@mugen/shared';
import {
  TurnEngine,
  GameEngine,
  StartingPlacementEngine,
} from '@mugen/shared';
import { canPlaySorcery, executeSorceryEffect, discardSorceryCard } from '@mugen/shared';
import type { Lobby } from '../lobby/lobby-manager.js';

const NON_TARGET_SORCERY_IDS = new Set(['s03', 's09', 's10', 's16', 's17', 's19', 's21']);

function validateSorceryIntentTargets(cardId: string, intent: PlaySorceryIntent): Result<null> {
  if (NON_TARGET_SORCERY_IDS.has(cardId)) {
    return { ok: true, value: null };
  }

  if (cardId === 's18') {
    if (!intent.targetUnitId || !intent.targetOwnerId || !intent.targetUnitId2 || !intent.targetOwnerId2) {
      return { ok: false, error: 'Dimensional Swap requires two complete targets' };
    }

    if (intent.targetUnitId === intent.targetUnitId2 && intent.targetOwnerId === intent.targetOwnerId2) {
      return { ok: false, error: 'Cannot swap a unit with itself' };
    }

    return { ok: true, value: null };
  }

  if (!intent.targetUnitId || !intent.targetOwnerId) {
    return { ok: false, error: `Sorcery ${cardId} requires a target unit and target owner` };
  }

  return { ok: true, value: null };
}

export function createInitialGameState(lobby: Lobby): Result<GameState> {
  const players: PlayerState[] = lobby.players.map((lp) => {
    const player = {
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
    };
    return player;
  });

  const gameResult = GameEngine.createGame(players);
  if (!gameResult.ok) {
    return gameResult;
  }

  const result = {
    ok: true,
    value: {
      ...gameResult.value,
      phase: GamePhase.PRE_GAME,
    },
  } as const;

  return result;
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

  // DISCARD_CARD can be processed for the current player regardless of turn phase
  // (hand limit enforcement must not be blocked by phase restrictions)
  if (intent.type === IntentType.DISCARD_CARD && state.phase === GamePhase.IN_PROGRESS) {
    return resolveDiscardCard(state, playerId, intent as DiscardCardIntent);
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
  let intentResult: Result<GameState>;

  switch (intent.type) {
    case IntentType.ADVANCE_PHASE:
      intentResult = TurnEngine.advancePhase(state);
      break;

    case IntentType.END_TURN: {
      if (state.turnPhase !== TurnPhase.END) {
        // Auto-advance to END phase first
        let current = state;
        while (current.turnPhase !== TurnPhase.END) {
          const advanced = TurnEngine.advancePhase(current);
          if (!advanced.ok) break;
          current = advanced.value;
        }
        intentResult = TurnEngine.endTurn(current);
        break;
      }
      intentResult = TurnEngine.endTurn(state);
      break;
    }

    case IntentType.MOVE_UNIT:
      intentResult = TurnEngine.processMove(state, playerId, intent.unitId, intent.target);
      break;

    case IntentType.USE_ABILITY:
      intentResult = TurnEngine.processAbility(state, playerId, intent.unitId, intent.targetId ?? null, intent.targetOwnerId ?? null);
      break;

    case IntentType.ATTACK:
      intentResult = TurnEngine.processAttack(state, playerId, intent.attackerId, intent.defenderId, intent.defenderOwnerId);
      break;

    case IntentType.DEPLOY_RESERVE:
      intentResult = TurnEngine.deployReserve(state, playerId, intent.unitId, intent.position);
      break;

    case IntentType.SUMMON_TO_BENCH:
      intentResult = TurnEngine.summonToBench(state, playerId, (intent as SummonToBenchIntent).cardId);
      break;

    case IntentType.PLAY_SORCERY: {
      const sorceryIntent = intent as PlaySorceryIntent;
      
      // Validate that the sorcery can be played
      const validation = canPlaySorcery(state, playerId, sorceryIntent.cardId);
      if (!validation.ok) {
        return { ok: false, error: validation.error };
      }

      const { card, playerIndex } = validation.value;

      // Validate target payload shape before effect execution
      const targetValidation = validateSorceryIntentTargets(card.id, sorceryIntent);
      if (!targetValidation.ok) {
        return { ok: false, error: targetValidation.error };
      }

      // Execute the sorcery effect
      const effectResult = executeSorceryEffect(
        state,
        playerId,
        card,
        sorceryIntent.targetUnitId,
        sorceryIntent.targetOwnerId,
        sorceryIntent.targetUnitId2,
        sorceryIntent.targetOwnerId2
      );

      if (!effectResult.ok) {
        return { ok: false, error: effectResult.error };
      }

      // Discard the sorcery card after effect resolves
      const finalState = discardSorceryCard(effectResult.value, playerIndex, card);

      intentResult = { ok: true, value: finalState };
      break;
    }

    default:
      return { ok: false, error: `Unknown intent type: ${(intent as ClientIntent).type}` };
  }

  if (!intentResult.ok) {
    return intentResult;
  }

  return finalizeInProgressState(intentResult.value);
}

function finalizeInProgressState(state: GameState): Result<GameState> {
  if (state.phase !== GamePhase.IN_PROGRESS) {
    return { ok: true, value: state };
  }

  const alivePlayers = state.players.filter((player) => !player.isEliminated);
  if (alivePlayers.length <= 1) {
    return GameEngine.transitionPhase(state, GamePhase.ENDED);
  }

  return { ok: true, value: state };
}

function resolveDiscardCard(
  state: GameState,
  playerId: string,
  intent: DiscardCardIntent
): Result<GameState> {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return { ok: false, error: 'Player not found' };
  }

  const player = state.players[playerIndex]!;

  if (player.hand.cards.length <= MAX_HAND_SIZE) {
    return { ok: false, error: 'Hand size is within limit, no discard needed' };
  }

  const cardIndex = player.hand.cards.findIndex(c => c.id === intent.cardId);
  if (cardIndex === -1) {
    return { ok: false, error: `Card ${intent.cardId} not found in hand` };
  }

  const discardedCard = player.hand.cards[cardIndex]!;
  const newHandCards = player.hand.cards.filter((_, i) => i !== cardIndex);
  const newDiscardCards = [...player.discardPile.cards, discardedCard];

  const updatedPlayers = state.players.map((p, i) =>
    i === playerIndex
      ? {
          ...p,
          hand: { cards: newHandCards },
          discardPile: { cards: newDiscardCards },
        }
      : p
  );

  return { ok: true, value: { ...state, players: updatedPlayers } };
}

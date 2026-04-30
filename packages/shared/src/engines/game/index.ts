import type { GameState, PlayerState } from '../../types/index.js';
import {
  GamePhase,
  TurnPhase,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MAX_DECK_SIZE,
} from '../../types/index.js';
import type { Result } from '../../types/actions.js';
import { createBoardState } from '../board/index.js';
import { shuffleDeck, initializePlayerDeck } from '../card/index.js';
import { generateDefaultWalls } from '../../utils/walls.js';

export function createGame(players: PlayerState[]): Result<GameState> {
  if (players.length < MIN_PLAYERS) {
    return {
      ok: false,
      error: `Minimum ${MIN_PLAYERS} players required, got ${players.length}`,
    };
  }
  if (players.length > MAX_PLAYERS) {
    return {
      ok: false,
      error: `Maximum ${MAX_PLAYERS} players allowed, got ${players.length}`,
    };
  }

  // Initialize players with shuffled decks and empty hands
  const initializedPlayers = players.map((player, index) => {
    // Shuffle the player's deck
    const shuffledDeck = shuffleDeck(player.deck);
    
    // Players start with empty hands (cards drawn on second turn)
    const emptyHand = { cards: [] };
    
    // Initialize mainDeck + discardPile from the 16-card player deck if present
    let mainDeck = player.mainDeck ?? { cards: [] };
    let discardPile = player.discardPile ?? { cards: [] };
    if (player.deck && player.deck.cards.length === MAX_DECK_SIZE) {
      const seed = Date.now() + index;
      const result = initializePlayerDeck(player.deck.cards, seed);
      mainDeck = result.mainDeck;
      discardPile = result.discardPile;
    }

    const initializedPlayer = {
      ...player,
      deck: shuffledDeck,
      hand: emptyHand,
      mainDeck,
      discardPile,
    };
    
    return initializedPlayer;
  });

  const board = createBoardState();

  return {
    ok: true,
    value: {
      id: `game-${Date.now()}`,
      phase: GamePhase.LOBBY,
      turnPhase: TurnPhase.MOVE,
      currentPlayerIndex: 0,
      players: initializedPlayers,
      board,
      walls: generateDefaultWalls(board.width, board.height),
      turnNumber: 1,
      turnRotation: 0,
      movesUsedThisTurn: 0,
      winnerId: null,
    },
  };
}

export function transitionPhase(
  state: GameState,
  targetPhase: GamePhase
): Result<GameState> {
  const { phase } = state;

  if (targetPhase === GamePhase.PRE_GAME) {
    if (phase !== GamePhase.LOBBY) {
      return { ok: false, error: `Cannot transition from ${phase} to PRE_GAME` };
    }
    const allReady = state.players.every((p) => p.isReady);
    if (!allReady) {
      return { ok: false, error: 'All players must be ready to start pre-game' };
    }
    return { ok: true, value: { ...state, phase: GamePhase.PRE_GAME } };
  }

  if (targetPhase === GamePhase.IN_PROGRESS) {
    if (phase !== GamePhase.PRE_GAME) {
      return { ok: false, error: `Cannot transition from ${phase} to IN_PROGRESS` };
    }
    const allLocked = state.players.every((p) => p.team.locked);
    if (!allLocked) {
      return { ok: false, error: 'All teams must be locked before starting game' };
    }
    return { ok: true, value: { ...state, phase: GamePhase.IN_PROGRESS } };
  }

  if (targetPhase === GamePhase.ENDED) {
    if (phase !== GamePhase.IN_PROGRESS) {
      return { ok: false, error: `Cannot transition from ${phase} to ENDED` };
    }
    const alive = state.players.filter((p) => !p.isEliminated);
    const winner = alive.length === 1 ? alive[0]! : null;
    return {
      ok: true,
      value: {
        ...state,
        phase: GamePhase.ENDED,
        winnerId: winner?.id ?? null,
      },
    };
  }

  return { ok: false, error: `Invalid target phase: ${targetPhase}` };
}

export function getActivePlayer(state: GameState): PlayerState {
  return state.players[state.currentPlayerIndex]!;
}

export function getAlivePlayers(state: GameState): PlayerState[] {
  return state.players.filter((p) => !p.isEliminated);
}

export function eliminatePlayer(state: GameState, playerId: string): Result<GameState> {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) {
    return { ok: false, error: `Player ${playerId} not found` };
  }

  const newPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, isEliminated: true, life: 0 } : p
  );

  return {
    ok: true,
    value: { ...state, players: newPlayers },
  };
}

import type { GameState, PlayerColor } from '../../types/index.js';

/**
 * Fixed color assignment by player index.
 * Player 1 → Red, Player 2 → Blue, Player 3 → Yellow, Player 4 → Green
 */
export const PLAYER_COLOR_MAP: Record<number, PlayerColor> = {
  0: 'red',
  1: 'blue',
  2: 'yellow',
  3: 'green',
};

/**
 * Return the color for the given player index (0-based).
 * Falls back to 'red' for out-of-range indices.
 */
export function getPlayerColor(playerIndex: number): PlayerColor {
  return PLAYER_COLOR_MAP[playerIndex] ?? 'red';
}

/**
 * Assign deterministic colors to every player in the game state.
 * Pure function — returns a new GameState; does not mutate.
 */
export function assignPlayerColors(gameState: GameState): GameState {
  const updatedPlayers = gameState.players.map((player, index) => ({
    ...player,
    color: getPlayerColor(index),
  }));

  return {
    ...gameState,
    players: updatedPlayers,
  };
}

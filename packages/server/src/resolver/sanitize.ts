import type { GameState, PlayerState } from '@mugen/shared';

export function sanitizeForPlayer(state: GameState, playerId: string): GameState {
  const sanitizedPlayers = state.players.map((p): PlayerState => {
    if (p.id === playerId) {
      return p; // Keep all data for current player including mainDeck and discardPile
    }
    return {
      ...p,
      hand: { cards: [] },
      deck: { cards: [] },
      mainDeck: { cards: [] }, // Hide opponent's main deck
      discardPile: { cards: [] }, // Hide opponent's discard pile
    };
  });

  return {
    ...state,
    players: sanitizedPlayers,
  };
}

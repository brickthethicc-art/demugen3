export function sanitizeForPlayer(state, playerId) {
    const sanitizedPlayers = state.players.map((p) => {
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
//# sourceMappingURL=sanitize.js.map
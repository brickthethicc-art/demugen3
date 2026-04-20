import { MAX_PLAYERS, MIN_PLAYERS, MAX_DECK_SIZE } from '@mugen/shared';
function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
export function createLobby(hostId, hostName) {
    return {
        code: generateCode(),
        hostId,
        players: [{ id: hostId, name: hostName, isReady: false, selectedDeck: [] }],
        gameStarted: false,
        disbanded: false,
    };
}
export function joinLobby(lobby, playerId, playerName) {
    if (lobby.gameStarted) {
        return { ok: false, error: 'Game has already started' };
    }
    if (lobby.players.length >= MAX_PLAYERS) {
        return { ok: false, error: `Lobby is full (max ${MAX_PLAYERS} players)` };
    }
    const exists = lobby.players.some((p) => p.id === playerId);
    if (exists) {
        return { ok: false, error: 'Player already in lobby' };
    }
    return {
        ok: true,
        value: {
            ...lobby,
            players: [...lobby.players, { id: playerId, name: playerName, isReady: false, selectedDeck: [] }],
        },
    };
}
export function setReady(lobby, playerId, ready) {
    const playerIdx = lobby.players.findIndex((p) => p.id === playerId);
    if (playerIdx === -1) {
        return { ok: false, error: `Player ${playerId} not found in lobby` };
    }
    const newPlayers = lobby.players.map((p) => p.id === playerId ? { ...p, isReady: ready } : p);
    return {
        ok: true,
        value: { ...lobby, players: newPlayers },
    };
}
export function setSelectedDeck(lobby, playerId, deck) {
    console.log('=== DEBUG: setSelectedDeck ===');
    console.log(`Player ${playerId} setting deck with ${deck.length} cards`);
    if (deck.length > 0) {
        console.log(`First card: ${JSON.stringify(deck[0])}`);
    }
    const playerIdx = lobby.players.findIndex((p) => p.id === playerId);
    if (playerIdx === -1) {
        console.log(`ERROR: Player ${playerId} not found in lobby`);
        return { ok: false, error: `Player ${playerId} not found in lobby` };
    }
    const newPlayers = lobby.players.map((p) => p.id === playerId ? { ...p, selectedDeck: deck } : p);
    console.log(`Deck set successfully for player ${playerId}`);
    return {
        ok: true,
        value: { ...lobby, players: newPlayers },
    };
}
export function leaveLobby(lobby, playerId) {
    if (playerId === lobby.hostId) {
        return {
            ok: true,
            value: { ...lobby, disbanded: true },
        };
    }
    const newPlayers = lobby.players.filter((p) => p.id !== playerId);
    return {
        ok: true,
        value: { ...lobby, players: newPlayers },
    };
}
export function startGame(lobby) {
    if (lobby.players.length < MIN_PLAYERS) {
        return { ok: false, error: `Need at least ${MIN_PLAYERS} players to start` };
    }
    const allReady = lobby.players.every((p) => p.isReady);
    if (!allReady) {
        return { ok: false, error: 'All players must be ready to start' };
    }
    // Debug: Log player deck data before validation
    console.log('=== DEBUG: startGame Deck Validation ===');
    for (const player of lobby.players) {
        console.log(`Player ${player.name} (${player.id}):`);
        console.log(`  - selectedDeck length: ${player.selectedDeck.length}`);
        console.log(`  - isReady: ${player.isReady}`);
        if (player.selectedDeck.length > 0) {
            console.log(`  - first card: ${JSON.stringify(player.selectedDeck[0])}`);
        }
    }
    // Validate that all players have a complete deck (16 cards)
    for (const player of lobby.players) {
        if (player.selectedDeck.length !== MAX_DECK_SIZE) {
            return {
                ok: false,
                error: `Player ${player.name} must have exactly ${MAX_DECK_SIZE} cards in their deck (has ${player.selectedDeck.length})`
            };
        }
    }
    return {
        ok: true,
        value: { ...lobby, gameStarted: true },
    };
}
//# sourceMappingURL=lobby-manager.js.map
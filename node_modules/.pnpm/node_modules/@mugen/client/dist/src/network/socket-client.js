import { io } from 'socket.io-client';
import { IntentType } from '@mugen/shared';
import { useGameStore } from '../store/game-store.js';
let socket = null;
let pendingDeck = null;
function flushPendingDeck() {
    if (pendingDeck && socket?.connected) {
        console.log('Socket: Flushing pendingDeck with', pendingDeck.length, 'cards');
        socket.emit('set_selected_deck', { deck: pendingDeck });
        pendingDeck = null;
    }
}
export function connect(url) {
    if (socket?.connected)
        return;
    socket = io(url, { autoConnect: true });
    const store = useGameStore.getState();
    socket.on('connected', (data) => {
        store.setPlayerId(data.playerId);
    });
    socket.on('lobby_created', (data) => {
        store.setLobbyCode(data.code);
        flushPendingDeck();
    });
    socket.on('lobby_joined', (data) => {
        store.setLobbyCode(data.code);
        flushPendingDeck();
    });
    socket.on('lobby_updated', (lobby) => {
        store.setLobbyPlayers(lobby.players);
    });
    socket.on('game_state', (state) => {
        console.log('Socket: Received game_state:', state.phase);
        console.log('Socket: Current player index:', state.currentPlayerIndex);
        console.log('Socket: Players count:', state.players.length);
        if (state.players[0]) {
            console.log('Socket: Player 1 mainDeck cards:', state.players[0].mainDeck?.cards?.length ?? 0);
        }
        store.setGameState(state);
    });
    socket.on('error', (data) => {
        store.setError(data.message);
    });
    socket.on('intent_error', (data) => {
        store.setError(data.message);
    });
    socket.on('team_locked', (data) => {
        const store = useGameStore.getState();
        const isCurrentPlayer = data.playerId === store.playerId;
        store.setQueueStatus(isCurrentPlayer, data.readyCount, data.totalCount, data.readyCount < data.totalCount);
    });
    socket.on('player_disconnected', (_data) => {
        // Handled via lobby_updated / game_state
    });
}
export function disconnect() {
    socket?.disconnect();
    socket = null;
}
export function createLobby(name) {
    socket?.emit('create_lobby', { name });
}
export function joinLobby(code, name) {
    socket?.emit('join_lobby', { code, name });
}
export function setReady(ready) {
    socket?.emit('set_ready', { ready });
}
export function setSelectedDeck(deck) {
    console.log('=== DEBUG: Client Socket setSelectedDeck ===');
    console.log('Socket connected:', socket?.connected);
    console.log('Socket id:', socket?.id);
    console.log('Sending deck data:', deck.length, 'cards');
    console.log('Emitting set_selected_deck event');
    if (!socket) {
        console.log('WARN: Socket not initialized yet — queuing deck for later');
        pendingDeck = deck;
        return;
    }
    if (!socket.connected) {
        console.log('WARN: Socket not connected yet — queuing deck for later');
        pendingDeck = deck;
        return;
    }
    socket.emit('set_selected_deck', { deck });
    console.log('set_selected_deck event emitted');
}
export function startGame() {
    socket?.emit('start_game');
}
export function confirmStartingUnits(units) {
    socket?.emit('confirm_starting_units', { units });
}
export function sendIntent(intent) {
    socket?.emit('game_intent', intent);
}
export function sendDiscardCard(cardId) {
    sendIntent({ type: IntentType.DISCARD_CARD, cardId });
}
export function getSocket() {
    return socket;
}
//# sourceMappingURL=socket-client.js.map
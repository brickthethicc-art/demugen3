import { io, Socket } from 'socket.io-client';
import type { ClientIntent, GameState } from '@mugen/shared';
import { useGameStore } from '../store/game-store.js';

let socket: Socket | null = null;
let pendingDeck: any[] | null = null;

function flushPendingDeck(): void {
  if (pendingDeck && socket?.connected) {
    console.log('Socket: Flushing pendingDeck with', pendingDeck.length, 'cards');
    socket.emit('set_selected_deck', { deck: pendingDeck });
    pendingDeck = null;
  }
}

export function connect(url: string): void {
  if (socket?.connected) return;

  socket = io(url, { autoConnect: true });
  const store = useGameStore.getState();

  socket.on('connected', (data: { playerId: string }) => {
    store.setPlayerId(data.playerId);
  });

  socket.on('lobby_created', (data: { code: string }) => {
    store.setLobbyCode(data.code);
    flushPendingDeck();
  });

  socket.on('lobby_joined', (data: { code: string }) => {
    store.setLobbyCode(data.code);
    flushPendingDeck();
  });

  socket.on('lobby_updated', (lobby: { players: { id: string; name: string; isReady: boolean }[] }) => {
    store.setLobbyPlayers(lobby.players);
  });

  socket.on('game_state', (state: GameState) => {
    console.log('Socket: Received game_state:', state.phase);
    console.log('Socket: Current player index:', state.currentPlayerIndex);
    console.log('Socket: Players count:', state.players.length);
    if (state.players[0]) {
      console.log('Socket: Player 1 mainDeck cards:', state.players[0].mainDeck?.cards?.length ?? 0);
    }
    store.setGameState(state);
  });

  socket.on('error', (data: { message: string }) => {
    store.setError(data.message);
  });

  socket.on('intent_error', (data: { message: string }) => {
    store.setError(data.message);
  });

  socket.on('player_disconnected', (_data: { playerId: string }) => {
    // Handled via lobby_updated / game_state
  });
}

export function disconnect(): void {
  socket?.disconnect();
  socket = null;
}

export function createLobby(name: string): void {
  socket?.emit('create_lobby', { name });
}

export function joinLobby(code: string, name: string): void {
  socket?.emit('join_lobby', { code, name });
}

export function setReady(ready: boolean): void {
  socket?.emit('set_ready', { ready });
}

export function setSelectedDeck(deck: any[]): void {
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

export function startGame(): void {
  socket?.emit('start_game');
}

export function confirmStartingUnits(units: any[]): void {
  socket?.emit('confirm_starting_units', { units });
}

export function sendIntent(intent: ClientIntent): void {
  socket?.emit('game_intent', intent);
}

export function getSocket(): Socket | null {
  return socket;
}

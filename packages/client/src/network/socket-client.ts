import { io, Socket } from 'socket.io-client';
import type { ClientIntent, GameState } from '@mugen/shared';
import { IntentType } from '@mugen/shared';
import { useGameStore } from '../store/game-store.js';

let socket: Socket | null = null;
let pendingDeck: any[] | null = null;

function flushPendingDeck(): void {
  if (pendingDeck && socket?.connected) {
    socket.emit('set_selected_deck', { deck: pendingDeck });
    pendingDeck = null;
  }
}

export function connect(url: string): void {
  if (socket) {
    if (socket.connected) {
      return;
    }
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }

  const store = useGameStore.getState();
  socket = io(url, {
    autoConnect: true,
    timeout: 10000,
    transports: ['websocket', 'polling'], // Allow WebSocket with polling fallback
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    store.setError(null); // Clear any previous connection errors
  });

  socket.on('disconnect', (_reason) => {
    store.setError('Disconnected from server');
  });

  socket.on('connect_error', (error) => {
    store.setError(`Failed to connect to server: ${error.message || 'Connection timeout'}`);
  });

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
    store.setGameState(state);
  });

  socket.on('error', (data: { message: string }) => {
    store.setError(data.message);
  });

  socket.on('intent_error', (data: { message: string }) => {
    const currentStore = useGameStore.getState();
    currentStore.setError(data.message);
    if (currentStore.sorceryModeActive) {
      currentStore.exitSorceryMode();
    }
  });

  socket.on('team_locked', (data: { playerId: string; readyCount: number; totalCount: number }) => {
    const store = useGameStore.getState();
    const isCurrentPlayer = data.playerId === store.playerId;
    const localPlayerReady = store.isPlayerReady || isCurrentPlayer;
    
    store.setQueueStatus(
      localPlayerReady,
      data.readyCount,
      data.totalCount,
      data.readyCount < data.totalCount
    );
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
  if (!socket) {
    const store = useGameStore.getState();
    store.setError('Socket not initialized. Please try again.');
    return;
  }
  
  if (!socket.connected) {
    const store = useGameStore.getState();
    store.setError('Not connected to server. Please wait and try again.');
    return;
  }
  
  socket.emit('create_lobby', { name });
}

export function joinLobby(code: string, name: string): void {
  if (!socket) {
    const store = useGameStore.getState();
    store.setError('Socket not initialized. Please try again.');
    return;
  }
  
  if (!socket.connected) {
    const store = useGameStore.getState();
    store.setError('Not connected to server. Please wait and try again.');
    return;
  }
  
  socket.emit('join_lobby', { code, name });
}

export function setReady(ready: boolean): void {
  socket?.emit('set_ready', { ready });
}

export function setSelectedDeck(deck: any[]): void {
  if (!socket) {
    pendingDeck = deck;
    return;
  }
  
  if (!socket.connected) {
    pendingDeck = deck;
    return;
  }
  
  socket.emit('set_selected_deck', { deck });
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

export function sendDiscardCard(cardId: string): void {
  sendIntent({ type: IntentType.DISCARD_CARD, cardId } as ClientIntent);
}

export function getSocket(): Socket | null {
  return socket;
}

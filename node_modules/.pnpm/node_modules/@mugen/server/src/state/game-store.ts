import type { GameState } from '@mugen/shared';
import type { Lobby } from '../lobby/lobby-manager.js';

export interface ServerState {
  lobbies: Map<string, Lobby>;
  games: Map<string, GameState>;
  playerToLobby: Map<string, string>;
  playerToGame: Map<string, string>;
}

export function createServerState(): ServerState {
  return {
    lobbies: new Map(),
    games: new Map(),
    playerToLobby: new Map(),
    playerToGame: new Map(),
  };
}

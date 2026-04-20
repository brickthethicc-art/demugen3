import type { GameState } from '@mugen/shared';
import type { Lobby } from '../lobby/lobby-manager.js';
export interface ServerState {
    lobbies: Map<string, Lobby>;
    games: Map<string, GameState>;
    playerToLobby: Map<string, string>;
    playerToGame: Map<string, string>;
}
export declare function createServerState(): ServerState;
//# sourceMappingURL=game-store.d.ts.map
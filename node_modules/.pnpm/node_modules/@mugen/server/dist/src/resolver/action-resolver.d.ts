import type { GameState, ClientIntent, Result } from '@mugen/shared';
import type { Lobby } from '../lobby/lobby-manager.js';
export declare function createInitialGameState(lobby: Lobby): Result<GameState>;
export declare function resolveIntent(state: GameState, playerId: string, intent: ClientIntent): Result<GameState>;
//# sourceMappingURL=action-resolver.d.ts.map
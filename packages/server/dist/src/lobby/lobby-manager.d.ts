import type { Result, Card } from '@mugen/shared';
export interface LobbyPlayer {
    id: string;
    name: string;
    isReady: boolean;
    selectedDeck: Card[];
}
export interface Lobby {
    code: string;
    hostId: string;
    players: LobbyPlayer[];
    gameStarted: boolean;
    disbanded: boolean;
}
export declare function createLobby(hostId: string, hostName: string): Lobby;
export declare function joinLobby(lobby: Lobby, playerId: string, playerName: string): Result<Lobby>;
export declare function setReady(lobby: Lobby, playerId: string, ready: boolean): Result<Lobby>;
export declare function setSelectedDeck(lobby: Lobby, playerId: string, deck: Card[]): Result<Lobby>;
export declare function leaveLobby(lobby: Lobby, playerId: string): Result<Lobby>;
export declare function startGame(lobby: Lobby): Result<Lobby>;
//# sourceMappingURL=lobby-manager.d.ts.map
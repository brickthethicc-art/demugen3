import { Socket } from 'socket.io-client';
import type { ClientIntent } from '@mugen/shared';
export declare function connect(url: string): void;
export declare function disconnect(): void;
export declare function createLobby(name: string): void;
export declare function joinLobby(code: string, name: string): void;
export declare function setReady(ready: boolean): void;
export declare function setSelectedDeck(deck: any[]): void;
export declare function startGame(): void;
export declare function confirmStartingUnits(units: any[]): void;
export declare function sendIntent(intent: ClientIntent): void;
export declare function sendDiscardCard(cardId: string): void;
export declare function getSocket(): Socket | null;
//# sourceMappingURL=socket-client.d.ts.map
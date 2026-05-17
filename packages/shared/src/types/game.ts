import type { PlayerState } from './player.js';
import type { BoardState } from './board.js';
import type { Position } from './board.js';

export enum GamePhase {
  LOBBY = 'LOBBY',
  PRE_GAME = 'PRE_GAME',
  IN_PROGRESS = 'IN_PROGRESS',
  ENDED = 'ENDED',
}

export enum TurnPhase {
  STANDBY = 'STANDBY',
  MOVE = 'MOVE',
  ABILITY = 'ABILITY',
  ATTACK = 'ATTACK',
  END = 'END',
}

export interface GameState {
  id: string;
  phase: GamePhase;
  turnPhase: TurnPhase;
  currentPlayerIndex: number;
  players: PlayerState[];
  board: BoardState;
  walls: Position[];
  turnNumber: number;
  turnRotation: number;
  pendingTurnStartDraw?: boolean;
  movesUsedThisTurn: number;
  winnerId: string | null;
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const MAX_MOVES_PER_TURN = 3;

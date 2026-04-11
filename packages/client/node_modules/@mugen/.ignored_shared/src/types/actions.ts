import type { Position } from './board.js';

export enum IntentType {
  MOVE_UNIT = 'MOVE_UNIT',
  USE_ABILITY = 'USE_ABILITY',
  ATTACK = 'ATTACK',
  END_TURN = 'END_TURN',
  SELECT_TEAM = 'SELECT_TEAM',
  LOCK_TEAM = 'LOCK_TEAM',
  PLAY_CARD = 'PLAY_CARD',
  ADVANCE_PHASE = 'ADVANCE_PHASE',
  DEPLOY_RESERVE = 'DEPLOY_RESERVE',
}

export interface MoveUnitIntent {
  type: IntentType.MOVE_UNIT;
  unitId: string;
  target: Position;
}

export interface UseAbilityIntent {
  type: IntentType.USE_ABILITY;
  unitId: string;
  targetId?: string;
  targetPosition?: Position;
}

export interface AttackIntent {
  type: IntentType.ATTACK;
  attackerId: string;
  defenderId: string;
}

export interface EndTurnIntent {
  type: IntentType.END_TURN;
}

export interface SelectTeamIntent {
  type: IntentType.SELECT_TEAM;
  unitCardIds: string[];
  activeUnits: import('./card.js').UnitCard[];
  reserveUnits: import('./card.js').UnitCard[];
}

export interface LockTeamIntent {
  type: IntentType.LOCK_TEAM;
}

export interface AdvancePhaseIntent {
  type: IntentType.ADVANCE_PHASE;
}

export interface DeployReserveIntent {
  type: IntentType.DEPLOY_RESERVE;
  unitId: string;
  position: Position;
}

export type ClientIntent =
  | MoveUnitIntent
  | UseAbilityIntent
  | AttackIntent
  | EndTurnIntent
  | SelectTeamIntent
  | LockTeamIntent
  | AdvancePhaseIntent
  | DeployReserveIntent;

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

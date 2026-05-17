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
  DISCARD_CARD = 'DISCARD_CARD',
  SUMMON_TO_BENCH = 'SUMMON_TO_BENCH',
  PLAY_SORCERY = 'PLAY_SORCERY',
}

export interface MoveUnitIntent {
  type: IntentType.MOVE_UNIT;
  unitId: string;
  target: Position;
}

export interface UseAbilityIntent {
  type: IntentType.USE_ABILITY;
  unitId: string;
  /**
   * Optional AbilityDefinition.id selecting one of `unit.card.abilities`.
   * Required when the unit defines multiple abilities; if omitted, the server
   * falls back to the legacy primary `unit.card.ability` (backward compatible).
   */
  abilityId?: string;
  targetId?: string;
  targetOwnerId?: string;
  targetPosition?: Position;
}

export interface AttackIntent {
  type: IntentType.ATTACK;
  attackerId: string;
  defenderId: string;
  defenderOwnerId: string;
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

export interface DiscardCardIntent {
  type: IntentType.DISCARD_CARD;
  cardId: string;
}

export interface SummonToBenchIntent {
  type: IntentType.SUMMON_TO_BENCH;
  cardId: string;
}

export interface PlaySorceryIntent {
  type: IntentType.PLAY_SORCERY;
  cardId: string;
  targetUnitId?: string;
  targetOwnerId?: string;
  targetUnitId2?: string;
  targetOwnerId2?: string;
}

export type ClientIntent =
  | MoveUnitIntent
  | UseAbilityIntent
  | AttackIntent
  | EndTurnIntent
  | SelectTeamIntent
  | LockTeamIntent
  | AdvancePhaseIntent
  | DeployReserveIntent
  | DiscardCardIntent
  | SummonToBenchIntent
  | PlaySorceryIntent;

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

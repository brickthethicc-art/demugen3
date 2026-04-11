import type { UnitCard, Hand, Deck } from './card.js';
import type { Position } from './board.js';

export type PlayerColor = 'red' | 'blue' | 'yellow' | 'green';

export interface UnitInstance {
  card: UnitCard;
  currentHp: number;
  position: Position | null;
  ownerId: string;
  color?: PlayerColor;
  hasMovedThisTurn: boolean;
  hasUsedAbilityThisTurn: boolean;
  hasAttackedThisTurn: boolean;
  combatModifiers: CombatModifier[];
}

export interface CombatModifier {
  type: CombatModifierType;
  duration: number;
}

export enum CombatModifierType {
  NO_COUNTERATTACK = 'NO_COUNTERATTACK',
  ATK_BUFF = 'ATK_BUFF',
  HP_BUFF = 'HP_BUFF',
}

export interface PlayerTeam {
  activeUnits: UnitCard[];
  reserveUnits: UnitCard[];
  locked: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  color?: PlayerColor;
  life: number;
  maxLife: number;
  team: PlayerTeam;
  units: UnitInstance[];
  hand: Hand;
  deck: Deck;
  isEliminated: boolean;
  isReady: boolean;
  isConnected: boolean;
  reserveLockedUntilNextTurn: boolean;
}

export const STARTING_LIFE = 24;

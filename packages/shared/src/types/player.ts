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
  /**
   * Per-ability cooldown tracking, keyed by AbilityDefinition.id.
   * Value is turns remaining until the ability is usable again.
   * Missing/zero entries mean the ability is ready.
   * Decremented for the active player's units at startTurn.
   */
  abilityCooldowns?: Record<string, number>;
}

export interface CombatModifier {
  type: CombatModifierType;
  duration: number;
  value?: number;
}

export enum CombatModifierType {
  NO_COUNTERATTACK = 'NO_COUNTERATTACK',
  ATK_BUFF = 'ATK_BUFF',
  HP_BUFF = 'HP_BUFF',
  ATK_DEBUFF = 'ATK_DEBUFF',
  MOVEMENT_DEBUFF = 'MOVEMENT_DEBUFF',
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
  mainDeck: Deck;
  discardPile: Deck;
  isEliminated: boolean;
  isReady: boolean;
  isConnected: boolean;
  reserveLockedUntilNextTurn: boolean;
}

export const STARTING_LIFE = 24;

export enum CardType {
  UNIT = 'UNIT',
  SORCERY = 'SORCERY',
}

export interface AbilityDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  abilityType: AbilityType;
}

export enum AbilityType {
  DAMAGE = 'DAMAGE',
  HEAL = 'HEAL',
  BUFF = 'BUFF',
  MODIFIER = 'MODIFIER',
}

export interface UnitCard {
  id: string;
  name: string;
  cardType: CardType.UNIT;
  hp: number;
  maxHp: number;
  atk: number;
  movement: number;
  range: number;
  ability: AbilityDefinition;
  cost: number;
}

export interface SorceryCard {
  id: string;
  name: string;
  cardType: CardType.SORCERY;
  cost: number;
  effect: string;
}

export type Card = UnitCard | SorceryCard;

export interface Deck {
  cards: Card[];
}

export interface Hand {
  cards: Card[];
}

export const MAX_DECK_SIZE = 16;
export const MAX_HAND_SIZE = 4;
export const MAX_TEAM_SIZE = 6;
export const ACTIVE_UNIT_COUNT = 3;
export const RESERVE_UNIT_COUNT = 3;
export const MAX_TEAM_COST = 40;

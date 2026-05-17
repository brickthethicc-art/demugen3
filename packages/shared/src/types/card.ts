export enum CardType {
  UNIT = 'UNIT',
  SORCERY = 'SORCERY',
}

export interface AbilityDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  cooldown?: number;
  abilityType: AbilityType;
}

export enum AbilityType {
  DAMAGE = 'DAMAGE',
  HEAL = 'HEAL',
  BUFF = 'BUFF',
  MODIFIER = 'MODIFIER',
}

export type CardFrameStyle = 'standard' | 'legendary' | 'promo';
export type ArtAspectRatio = 'portrait' | 'landscape' | 'square';
export type TextLayout = 'standard' | 'compact' | 'expanded';
export type StatDisplayField = 'atk' | 'hp' | 'movement' | 'range';

export interface CardFramework {
  frameworkVersion: string;
  cardFrameStyle: CardFrameStyle;
  borderTheme: string;
  artAspectRatio: ArtAspectRatio;
  textLayout: TextLayout;
  hasSpecialBorder: boolean;
  hasAnimatedElements: boolean;
  backgroundPattern?: string;
  customImage?: string;
  frameworkCompliant: boolean;
  frameworkLastUpdated: string;
}

export const CARD_FRAMEWORK_VERSION = '1.0.0';
export const CARD_FRAMEWORK_BASELINE_UPDATED_AT = '2026-05-03T00:00:00.000Z';
export const DEFAULT_STAT_DISPLAY_ORDER: readonly StatDisplayField[] = ['atk', 'hp', 'movement', 'range'];

export function createDefaultCardFramework(overrides: Partial<CardFramework> = {}): CardFramework {
  return {
    frameworkVersion: CARD_FRAMEWORK_VERSION,
    cardFrameStyle: 'standard',
    borderTheme: 'default',
    artAspectRatio: 'portrait',
    textLayout: 'standard',
    hasSpecialBorder: false,
    hasAnimatedElements: false,
    frameworkCompliant: true,
    frameworkLastUpdated: CARD_FRAMEWORK_BASELINE_UPDATED_AT,
    ...overrides,
  };
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
  abilities?: AbilityDefinition[];
  cost: number;
  framework?: CardFramework;
  statDisplayOrder?: StatDisplayField[];
  abilityIconId?: string;
}

export interface SorceryCard {
  id: string;
  name: string;
  cardType: CardType.SORCERY;
  cost: number;
  effect: string;
  framework?: CardFramework;
  effectIconId?: string;
  targetIndicator?: string;
}

export type Card = UnitCard | SorceryCard;

export interface Deck {
  cards: Card[];
}

export interface Hand {
  cards: Card[];
}

export const HIDDEN_CARD_ID_PREFIX = '__hidden_card__';

export function isHiddenCardId(cardId: string): boolean {
  return cardId.startsWith(HIDDEN_CARD_ID_PREFIX);
}

export const MAX_DECK_SIZE = 16;
export const MAX_HAND_SIZE = 4;
export const MAX_TEAM_SIZE = 6;
export const ACTIVE_UNIT_COUNT = 3;
export const RESERVE_UNIT_COUNT = 3;
export const MAX_TEAM_COST = 40;
export const PLAYER_DECK_SIZE = 10;
export const FIELD_CARD_COUNT = 6;

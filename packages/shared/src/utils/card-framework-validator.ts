import {
  CardType,
  CARD_FRAMEWORK_VERSION,
  DEFAULT_STAT_DISPLAY_ORDER,
} from '../types/index.js';
import type {
  ArtAspectRatio,
  Card,
  CardFrameStyle,
  CardFramework,
  StatDisplayField,
  TextLayout,
  UnitCard,
} from '../types/index.js';

const VALID_CARD_FRAME_STYLES: readonly CardFrameStyle[] = ['standard', 'legendary', 'promo'];
const VALID_ART_ASPECT_RATIOS: readonly ArtAspectRatio[] = ['portrait', 'landscape', 'square'];
const VALID_TEXT_LAYOUTS: readonly TextLayout[] = ['standard', 'compact', 'expanded'];

export interface FrameworkValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function hasValidStatDisplayOrder(order: StatDisplayField[]): boolean {
  if (order.length !== DEFAULT_STAT_DISPLAY_ORDER.length) {
    return false;
  }

  const expected = new Set(DEFAULT_STAT_DISPLAY_ORDER);
  const actual = new Set(order);

  if (actual.size !== expected.size) {
    return false;
  }

  return Array.from(actual).every((field) => expected.has(field));
}

function validateFrameworkValues(framework: CardFramework, errors: string[], warnings: string[]): void {
  if (!framework.frameworkVersion) {
    errors.push('Missing framework version');
  } else if (framework.frameworkVersion !== CARD_FRAMEWORK_VERSION) {
    warnings.push(
      `Framework version ${framework.frameworkVersion} differs from current ${CARD_FRAMEWORK_VERSION}`
    );
  }

  if (!VALID_CARD_FRAME_STYLES.includes(framework.cardFrameStyle)) {
    errors.push(`Invalid cardFrameStyle: ${framework.cardFrameStyle}`);
  }

  if (!VALID_ART_ASPECT_RATIOS.includes(framework.artAspectRatio)) {
    errors.push(`Invalid artAspectRatio: ${framework.artAspectRatio}`);
  }

  if (!VALID_TEXT_LAYOUTS.includes(framework.textLayout)) {
    errors.push(`Invalid textLayout: ${framework.textLayout}`);
  }

  if (!framework.borderTheme || framework.borderTheme.trim().length === 0) {
    errors.push('Missing borderTheme');
  }

  if (!framework.frameworkLastUpdated || Number.isNaN(Date.parse(framework.frameworkLastUpdated))) {
    errors.push('frameworkLastUpdated must be a valid ISO timestamp');
  }

  if (!framework.frameworkCompliant) {
    warnings.push('Card marked as not framework compliant');
  }
}

function validateUnitCardRules(card: UnitCard, errors: string[]): void {
  if (!card.statDisplayOrder) {
    errors.push('Unit cards must define statDisplayOrder');
    return;
  }

  if (!hasValidStatDisplayOrder(card.statDisplayOrder)) {
    errors.push('Unit card statDisplayOrder must contain atk, hp, movement, range exactly once');
  }
}

export function validateCardFramework(card: Card): FrameworkValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!card.framework) {
    errors.push('Missing framework object');
    return { isValid: false, errors, warnings };
  }

  validateFrameworkValues(card.framework, errors, warnings);

  if (card.cardType === CardType.UNIT) {
    validateUnitCardRules(card, errors);
    if (card.cost >= 7 && card.framework.cardFrameStyle !== 'legendary') {
      warnings.push('High-cost unit cards (>=7) should use legendary frame style');
    }
  }

  if (card.cardType === CardType.SORCERY && card.cost >= 5 && card.framework.cardFrameStyle !== 'legendary') {
    warnings.push('High-cost sorcery cards (>=5) should use legendary frame style');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateAllCards(cards: Card[]): Map<string, FrameworkValidationResult> {
  const results = new Map<string, FrameworkValidationResult>();

  for (const card of cards) {
    results.set(card.id, validateCardFramework(card));
  }

  return results;
}

export function enforceFrameworkCompliance(cards: Card[]): boolean {
  const results = validateAllCards(cards);
  const errorLines: string[] = [];

  for (const [cardId, result] of results.entries()) {
    if (!result.isValid) {
      errorLines.push(`Card ${cardId} failed framework validation: ${result.errors.join('; ')}`);
    }
  }

  if (errorLines.length > 0) {
    throw new Error(`Framework compliance check failed.\n${errorLines.join('\n')}`);
  }

  return true;
}

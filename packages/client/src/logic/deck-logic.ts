import type { Card } from '@mugen/shared';
import { CardType, AbilityType, MAX_DECK_SIZE } from '@mugen/shared';

export interface CardFilters {
  cardType?: CardType;
  cost?: number;
  abilityType?: AbilityType;
  search?: string;
}

export interface DeckStats {
  totalCards: number;
  averageCost: number;
  unitCount: number;
  sorceryCount: number;
  costCurve: Record<number, number>;
}

export interface DeckValidation {
  valid: boolean;
  errors: string[];
}

export function validateDeck(cards: Card[]): DeckValidation {
  const errors: string[] = [];
  if (cards.length !== MAX_DECK_SIZE) {
    errors.push(
      `Deck must contain exactly ${MAX_DECK_SIZE} cards, currently has ${cards.length}`
    );
  }
  return { valid: errors.length === 0, errors };
}

export function canAddCard(deckCards: Card[]): boolean {
  return deckCards.length < MAX_DECK_SIZE;
}

export function filterCards(cards: Card[], filters: CardFilters): Card[] {
  let result = cards;

  if (filters.cardType != null) {
    result = result.filter((c) => c.cardType === filters.cardType);
  }

  if (filters.cost != null) {
    result = result.filter((c) => c.cost === filters.cost);
  }

  if (filters.abilityType != null) {
    result = result.filter(
      (c) =>
        c.cardType === CardType.UNIT &&
        c.ability.abilityType === filters.abilityType
    );
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((c) => c.name.toLowerCase().includes(q));
  }

  return result;
}

export function getDeckStats(cards: Card[]): DeckStats {
  if (cards.length === 0) {
    return {
      totalCards: 0,
      averageCost: 0,
      unitCount: 0,
      sorceryCount: 0,
      costCurve: {},
    };
  }

  const totalCost = cards.reduce((sum, c) => sum + c.cost, 0);
  const unitCount = cards.filter((c) => c.cardType === CardType.UNIT).length;
  const sorceryCount = cards.filter((c) => c.cardType === CardType.SORCERY).length;

  const costCurve: Record<number, number> = {};
  cards.forEach((c) => {
    costCurve[c.cost] = (costCurve[c.cost] ?? 0) + 1;
  });

  return {
    totalCards: cards.length,
    averageCost: totalCost / cards.length,
    unitCount,
    sorceryCount,
    costCurve,
  };
}

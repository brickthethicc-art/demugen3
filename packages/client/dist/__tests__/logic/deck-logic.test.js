import { describe, it, expect } from 'vitest';
import { ALL_CARDS, ALL_UNITS, ALL_SORCERIES } from '../../src/data/cards.js';
import { validateDeck, filterCards, getDeckStats, canAddCard, } from '../../src/logic/deck-logic.js';
import { CardType, AbilityType } from '@mugen/shared';
const makeDeck16 = () => ALL_CARDS.slice(0, 16);
describe('validateDeck', () => {
    it('returns valid for exactly 16 cards', () => {
        const result = validateDeck(makeDeck16());
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
    });
    it('returns invalid for 0 cards', () => {
        const result = validateDeck([]);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });
    it('returns invalid for 15 cards', () => {
        const result = validateDeck(ALL_CARDS.slice(0, 15));
        expect(result.valid).toBe(false);
    });
    it('returns invalid for 17 cards', () => {
        const result = validateDeck(ALL_CARDS.slice(0, 17));
        expect(result.valid).toBe(false);
    });
    it('error message includes expected count', () => {
        const result = validateDeck(ALL_CARDS.slice(0, 10));
        expect(result.errors[0]).toContain('16');
    });
});
describe('canAddCard', () => {
    it('returns true when deck has fewer than 16 cards', () => {
        expect(canAddCard(ALL_CARDS.slice(0, 5))).toBe(true);
    });
    it('returns true when deck is empty', () => {
        expect(canAddCard([])).toBe(true);
    });
    it('returns false when deck has 16 cards', () => {
        expect(canAddCard(makeDeck16())).toBe(false);
    });
    it('returns true when deck has 15 cards', () => {
        expect(canAddCard(ALL_CARDS.slice(0, 15))).toBe(true);
    });
});
describe('filterCards', () => {
    it('returns all cards when no filters applied', () => {
        const result = filterCards(ALL_CARDS, {});
        expect(result.length).toBe(ALL_CARDS.length);
    });
    it('filters by UNIT type', () => {
        const result = filterCards(ALL_CARDS, { cardType: CardType.UNIT });
        expect(result.length).toBe(ALL_UNITS.length);
        result.forEach((c) => expect(c.cardType).toBe(CardType.UNIT));
    });
    it('filters by SORCERY type', () => {
        const result = filterCards(ALL_CARDS, { cardType: CardType.SORCERY });
        expect(result.length).toBe(ALL_SORCERIES.length);
        result.forEach((c) => expect(c.cardType).toBe(CardType.SORCERY));
    });
    it('filters by cost', () => {
        const result = filterCards(ALL_CARDS, { cost: 3 });
        result.forEach((c) => expect(c.cost).toBe(3));
        expect(result.length).toBeGreaterThan(0);
    });
    it('filters by ability type (units only)', () => {
        const result = filterCards(ALL_CARDS, { abilityType: AbilityType.HEAL });
        result.forEach((c) => {
            expect(c.cardType).toBe(CardType.UNIT);
            if (c.cardType === CardType.UNIT) {
                expect(c.ability.abilityType).toBe(AbilityType.HEAL);
            }
        });
        expect(result.length).toBeGreaterThan(0);
    });
    it('filters by search query (name, case insensitive)', () => {
        const result = filterCards(ALL_CARDS, { search: 'flame' });
        result.forEach((c) => expect(c.name.toLowerCase()).toContain('flame'));
        expect(result.length).toBeGreaterThan(0);
    });
    it('search matches partial names', () => {
        const result = filterCards(ALL_CARDS, { search: 'dra' });
        result.forEach((c) => expect(c.name.toLowerCase()).toContain('dra'));
    });
    it('combines multiple filters', () => {
        const result = filterCards(ALL_CARDS, { cardType: CardType.UNIT, cost: 3 });
        result.forEach((c) => {
            expect(c.cardType).toBe(CardType.UNIT);
            expect(c.cost).toBe(3);
        });
    });
    it('returns empty when no cards match', () => {
        const result = filterCards(ALL_CARDS, { search: 'xyznonexistent' });
        expect(result.length).toBe(0);
    });
});
describe('getDeckStats', () => {
    it('returns zero stats for empty deck', () => {
        const stats = getDeckStats([]);
        expect(stats.totalCards).toBe(0);
        expect(stats.averageCost).toBe(0);
        expect(stats.unitCount).toBe(0);
        expect(stats.sorceryCount).toBe(0);
    });
    it('calculates total cards correctly', () => {
        const deck = makeDeck16();
        const stats = getDeckStats(deck);
        expect(stats.totalCards).toBe(16);
    });
    it('calculates average cost', () => {
        const deck = makeDeck16();
        const stats = getDeckStats(deck);
        const expectedAvg = deck.reduce((sum, c) => sum + c.cost, 0) / deck.length;
        expect(stats.averageCost).toBeCloseTo(expectedAvg, 2);
    });
    it('counts units and sorceries', () => {
        const deck = makeDeck16();
        const stats = getDeckStats(deck);
        const units = deck.filter((c) => c.cardType === CardType.UNIT).length;
        const sorceries = deck.filter((c) => c.cardType === CardType.SORCERY).length;
        expect(stats.unitCount).toBe(units);
        expect(stats.sorceryCount).toBe(sorceries);
    });
    it('provides cost curve distribution', () => {
        const deck = makeDeck16();
        const stats = getDeckStats(deck);
        const totalFromCurve = Object.values(stats.costCurve).reduce((a, b) => a + b, 0);
        expect(totalFromCurve).toBe(deck.length);
    });
});
//# sourceMappingURL=deck-logic.test.js.map
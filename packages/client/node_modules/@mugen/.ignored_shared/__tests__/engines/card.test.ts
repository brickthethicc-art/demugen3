import { describe, it, expect, beforeEach } from 'vitest';
import { createUnit, resetIdCounter } from '../factories.js';
import {
  createDeck,
  drawCards,
  shuffleDeck,
  getHandSize,
} from '../../src/engines/card/index.js';
import { MAX_DECK_SIZE, MAX_HAND_SIZE } from '../../src/types/index.js';
import type { Card, Deck, Hand } from '../../src/types/index.js';

describe('CardEngine', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('createDeck', () => {
    it('given 16 card definitions — returns deck of 16', () => {
      const cards: Card[] = Array.from({ length: 16 }, () => createUnit());
      const result = createDeck(cards);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.cards).toHaveLength(MAX_DECK_SIZE);
      }
    });

    it('given < 16 cards — returns error', () => {
      const cards: Card[] = Array.from({ length: 10 }, () => createUnit());
      const result = createDeck(cards);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('16');
      }
    });

    it('given > 16 cards — returns error', () => {
      const cards: Card[] = Array.from({ length: 20 }, () => createUnit());
      const result = createDeck(cards);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('16');
      }
    });
  });

  describe('drawCards', () => {
    function makeDeck(count: number): Deck {
      return { cards: Array.from({ length: count }, () => createUnit()) };
    }

    function makeHand(count: number): Hand {
      return { cards: Array.from({ length: count }, () => createUnit()) };
    }

    it('hand empty, deck has cards — draws up to hand limit (4)', () => {
      const deck = makeDeck(10);
      const hand = makeHand(0);
      const result = drawCards(deck, hand);
      expect(result.hand.cards).toHaveLength(MAX_HAND_SIZE);
      expect(result.deck.cards).toHaveLength(6);
    });

    it('hand already full (4) — draws nothing', () => {
      const deck = makeDeck(10);
      const hand = makeHand(4);
      const result = drawCards(deck, hand);
      expect(result.hand.cards).toHaveLength(4);
      expect(result.deck.cards).toHaveLength(10);
    });

    it('deck empty — draws nothing, no error', () => {
      const deck = makeDeck(0);
      const hand = makeHand(0);
      const result = drawCards(deck, hand);
      expect(result.hand.cards).toHaveLength(0);
      expect(result.deck.cards).toHaveLength(0);
    });

    it('deck has fewer than needed — draws remaining', () => {
      const deck = makeDeck(2);
      const hand = makeHand(0);
      const result = drawCards(deck, hand);
      expect(result.hand.cards).toHaveLength(2);
      expect(result.deck.cards).toHaveLength(0);
    });

    it('hand has 2 cards — draws 2 more to reach limit', () => {
      const deck = makeDeck(10);
      const hand = makeHand(2);
      const result = drawCards(deck, hand);
      expect(result.hand.cards).toHaveLength(4);
      expect(result.deck.cards).toHaveLength(8);
    });
  });

  describe('shuffleDeck', () => {
    it('returns deck with same cards in (potentially) different order', () => {
      const cards: Card[] = Array.from({ length: 16 }, (_, i) =>
        createUnit({ id: `card-${i}` })
      );
      const deck: Deck = { cards: [...cards] };
      const shuffled = shuffleDeck(deck);

      expect(shuffled.cards).toHaveLength(16);

      const originalIds = deck.cards.map((c: Card) => c.id).sort();
      const shuffledIds = shuffled.cards.map((c: Card) => c.id).sort();
      expect(shuffledIds).toEqual(originalIds);
    });

    it('does not mutate original deck', () => {
      const cards: Card[] = Array.from({ length: 16 }, (_, i) =>
        createUnit({ id: `card-${i}` })
      );
      const deck: Deck = { cards: [...cards] };
      const originalOrder = [...deck.cards];
      shuffleDeck(deck);
      expect(deck.cards).toEqual(originalOrder);
    });
  });

  describe('getHandSize', () => {
    it('returns current hand count', () => {
      const hand = { cards: [createUnit(), createUnit()] };
      expect(getHandSize(hand)).toBe(2);
    });

    it('returns 0 for empty hand', () => {
      const hand = { cards: [] as Card[] };
      expect(getHandSize(hand)).toBe(0);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { createUnit, resetIdCounter } from '../factories.js';
import type { Card, Deck } from '../../src/types/index.js';
import {
  seededShuffle,
  initializePlayerDeck,
  drawOne,
  discardCard,
  FIELD_CARD_COUNT,
  PLAYER_DECK_SIZE,
} from '../../src/engines/card/index.js';

function makeCards(count: number): Card[] {
  return Array.from({ length: count }, (_, i) =>
    createUnit({ id: `card-${i}` })
  );
}

describe('Deck + Discard Pile System', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  // ─── Seeded Shuffle ──────────────────────────────────────────────
  describe('seededShuffle', () => {
    it('produces a deterministic order for a given seed', () => {
      const deck: Deck = { cards: makeCards(10) };
      const a = seededShuffle(deck, 42);
      const b = seededShuffle(deck, 42);
      expect(a.cards.map(c => c.id)).toEqual(b.cards.map(c => c.id));
    });

    it('produces a different order for a different seed', () => {
      const deck: Deck = { cards: makeCards(10) };
      const a = seededShuffle(deck, 42);
      const b = seededShuffle(deck, 99);
      // Very unlikely to be same order
      const aIds = a.cards.map(c => c.id);
      const bIds = b.cards.map(c => c.id);
      expect(aIds).not.toEqual(bIds);
    });

    it('does not mutate the original deck', () => {
      const cards = makeCards(10);
      const deck: Deck = { cards: [...cards] };
      const originalIds = deck.cards.map(c => c.id);
      seededShuffle(deck, 42);
      expect(deck.cards.map(c => c.id)).toEqual(originalIds);
    });

    it('preserves all cards (no loss or duplication)', () => {
      const deck: Deck = { cards: makeCards(10) };
      const shuffled = seededShuffle(deck, 42);
      const originalIds = [...deck.cards.map(c => c.id)].sort();
      const shuffledIds = [...shuffled.cards.map(c => c.id)].sort();
      expect(shuffledIds).toEqual(originalIds);
    });
  });

  // ─── Deck Initialization ─────────────────────────────────────────
  describe('initializePlayerDeck', () => {
    it('places exactly FIELD_CARD_COUNT (6) cards on the field', () => {
      const cards = makeCards(10);
      const result = initializePlayerDeck(cards, 42);
      expect(result.fieldCards).toHaveLength(FIELD_CARD_COUNT);
    });

    it('puts remaining cards into mainDeck', () => {
      const cards = makeCards(10);
      const result = initializePlayerDeck(cards, 42);
      expect(result.mainDeck.cards).toHaveLength(10 - FIELD_CARD_COUNT);
    });

    it('starts with an empty discard pile', () => {
      const cards = makeCards(10);
      const result = initializePlayerDeck(cards, 42);
      expect(result.discardPile.cards).toHaveLength(0);
    });

    it('deck order is consistent for the same seed', () => {
      const cards = makeCards(10);
      const a = initializePlayerDeck(cards, 42);
      const b = initializePlayerDeck(cards, 42);
      expect(a.mainDeck.cards.map(c => c.id)).toEqual(
        b.mainDeck.cards.map(c => c.id)
      );
      expect(a.fieldCards.map(c => c.id)).toEqual(
        b.fieldCards.map(c => c.id)
      );
    });

    it('total card count always equals input size', () => {
      const cards = makeCards(10);
      const result = initializePlayerDeck(cards, 42);
      const total =
        result.fieldCards.length +
        result.mainDeck.cards.length +
        result.discardPile.cards.length;
      expect(total).toBe(10);
    });

    it('no duplication of cards', () => {
      const cards = makeCards(10);
      const result = initializePlayerDeck(cards, 42);
      const allIds = [
        ...result.fieldCards.map(c => c.id),
        ...result.mainDeck.cards.map(c => c.id),
        ...result.discardPile.cards.map(c => c.id),
      ];
      const unique = new Set(allIds);
      expect(unique.size).toBe(allIds.length);
    });

    it('rejects input that does not have PLAYER_DECK_SIZE cards', () => {
      expect(() => initializePlayerDeck(makeCards(5), 42)).toThrow();
      expect(() => initializePlayerDeck(makeCards(15), 42)).toThrow();
    });
  });

  // ─── Draw Mechanics ──────────────────────────────────────────────
  describe('drawOne', () => {
    it('removes the top card from the deck', () => {
      const deck: Deck = { cards: makeCards(4) };
      const topId = deck.cards[0]!.id;
      const result = drawOne(deck);
      expect(result.card!.id).toBe(topId);
      expect(result.deck.cards).toHaveLength(3);
    });

    it('deck size decreases by 1', () => {
      const deck: Deck = { cards: makeCards(4) };
      const result = drawOne(deck);
      expect(result.deck.cards).toHaveLength(deck.cards.length - 1);
    });

    it('returns null card when deck is empty', () => {
      const deck: Deck = { cards: [] };
      const result = drawOne(deck);
      expect(result.card).toBeNull();
      expect(result.deck.cards).toHaveLength(0);
    });

    it('does not mutate the original deck', () => {
      const deck: Deck = { cards: makeCards(4) };
      const originalLength = deck.cards.length;
      drawOne(deck);
      expect(deck.cards).toHaveLength(originalLength);
    });
  });

  // ─── Discard Mechanics ───────────────────────────────────────────
  describe('discardCard', () => {
    it('adds a destroyed card to the discard pile', () => {
      const pile: Deck = { cards: [] };
      const card = createUnit({ id: 'destroyed-1' });
      const result = discardCard(pile, card);
      expect(result.cards).toHaveLength(1);
      expect(result.cards[0]!.id).toBe('destroyed-1');
    });

    it('preserves order — newest card on top (end of array)', () => {
      const first = createUnit({ id: 'first' });
      const second = createUnit({ id: 'second' });
      let pile: Deck = { cards: [] };
      pile = discardCard(pile, first);
      pile = discardCard(pile, second);
      expect(pile.cards[pile.cards.length - 1]!.id).toBe('second');
      expect(pile.cards[0]!.id).toBe('first');
    });

    it('does not mutate the original pile', () => {
      const pile: Deck = { cards: [] };
      const card = createUnit({ id: 'x' });
      discardCard(pile, card);
      expect(pile.cards).toHaveLength(0);
    });
  });

  // ─── State Integrity (integration-level) ─────────────────────────
  describe('state integrity across operations', () => {
    it('drawing + discarding preserves total card count of 10', () => {
      const cards = makeCards(10);
      const init = initializePlayerDeck(cards, 42);

      // Draw all cards from mainDeck, discard them
      let currentDeck = init.mainDeck;
      let currentDiscard = init.discardPile;
      while (currentDeck.cards.length > 0) {
        const { card, deck: newDeck } = drawOne(currentDeck);
        currentDeck = newDeck;
        if (card) {
          currentDiscard = discardCard(currentDiscard, card);
        }
      }

      const total =
        init.fieldCards.length +
        currentDeck.cards.length +
        currentDiscard.cards.length;
      expect(total).toBe(10);
    });

    it('no card IDs are duplicated after multiple draws and discards', () => {
      const cards = makeCards(10);
      const init = initializePlayerDeck(cards, 42);

      let currentDeck = init.mainDeck;
      let currentDiscard = init.discardPile;
      const drawn: Card[] = [];
      while (currentDeck.cards.length > 0) {
        const { card, deck: newDeck } = drawOne(currentDeck);
        currentDeck = newDeck;
        if (card) {
          drawn.push(card);
          currentDiscard = discardCard(currentDiscard, card);
        }
      }

      const allIds = [
        ...init.fieldCards.map(c => c.id),
        ...currentDeck.cards.map(c => c.id),
        ...currentDiscard.cards.map(c => c.id),
      ];
      expect(new Set(allIds).size).toBe(allIds.length);
    });
  });
});

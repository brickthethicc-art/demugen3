import { describe, it, expect, beforeEach } from 'vitest';
import { useDeckStore } from '../../src/store/deck-store.js';
import { ALL_CARDS } from '../../src/data/cards.js';
import { CardType } from '@mugen/shared';
import type { Card } from '@mugen/shared';

const card1 = ALL_CARDS[0]!;
const card2 = ALL_CARDS[1]!;
const makeDeck16 = (): Card[] => ALL_CARDS.slice(0, 16);

describe('DeckStore', () => {
  beforeEach(() => {
    useDeckStore.getState().resetDeckBuilder();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('starts with empty deck', () => {
      expect(useDeckStore.getState().currentDeck).toEqual([]);
    });

    it('starts with empty deck name', () => {
      expect(useDeckStore.getState().deckName).toBe('');
    });

    it('starts with no active slot', () => {
      expect(useDeckStore.getState().activeSlot).toBeNull();
    });

    it('starts with empty search', () => {
      expect(useDeckStore.getState().searchQuery).toBe('');
    });

    it('starts with null type filter', () => {
      expect(useDeckStore.getState().typeFilter).toBeNull();
    });

    it('starts with null cost filter', () => {
      expect(useDeckStore.getState().costFilter).toBeNull();
    });

    it('starts with null ability filter', () => {
      expect(useDeckStore.getState().abilityFilter).toBeNull();
    });
  });

  describe('addCardToDeck', () => {
    it('adds a card to empty deck', () => {
      useDeckStore.getState().addCardToDeck(card1);
      expect(useDeckStore.getState().currentDeck).toEqual([card1]);
    });

    it('adds multiple cards', () => {
      useDeckStore.getState().addCardToDeck(card1);
      useDeckStore.getState().addCardToDeck(card2);
      expect(useDeckStore.getState().currentDeck.length).toBe(2);
    });

    it('does not add beyond 16 cards', () => {
      makeDeck16().forEach((c) => useDeckStore.getState().addCardToDeck(c));
      const extra = ALL_CARDS[16]!;
      useDeckStore.getState().addCardToDeck(extra);
      expect(useDeckStore.getState().currentDeck.length).toBe(16);
    });
  });

  describe('removeCardFromDeck', () => {
    it('removes a card by index', () => {
      useDeckStore.getState().addCardToDeck(card1);
      useDeckStore.getState().addCardToDeck(card2);
      useDeckStore.getState().removeCardFromDeck(0);
      expect(useDeckStore.getState().currentDeck).toEqual([card2]);
    });

    it('does nothing for out-of-bounds index', () => {
      useDeckStore.getState().addCardToDeck(card1);
      useDeckStore.getState().removeCardFromDeck(5);
      expect(useDeckStore.getState().currentDeck.length).toBe(1);
    });
  });

  describe('filters', () => {
    it('sets search query', () => {
      useDeckStore.getState().setSearchQuery('fire');
      expect(useDeckStore.getState().searchQuery).toBe('fire');
    });

    it('sets type filter', () => {
      useDeckStore.getState().setTypeFilter(CardType.UNIT);
      expect(useDeckStore.getState().typeFilter).toBe(CardType.UNIT);
    });

    it('clears type filter with null', () => {
      useDeckStore.getState().setTypeFilter(CardType.UNIT);
      useDeckStore.getState().setTypeFilter(null);
      expect(useDeckStore.getState().typeFilter).toBeNull();
    });

    it('sets cost filter', () => {
      useDeckStore.getState().setCostFilter(3);
      expect(useDeckStore.getState().costFilter).toBe(3);
    });

    it('clears filters', () => {
      useDeckStore.getState().setSearchQuery('test');
      useDeckStore.getState().setTypeFilter(CardType.UNIT);
      useDeckStore.getState().setCostFilter(3);
      useDeckStore.getState().clearFilters();
      expect(useDeckStore.getState().searchQuery).toBe('');
      expect(useDeckStore.getState().typeFilter).toBeNull();
      expect(useDeckStore.getState().costFilter).toBeNull();
      expect(useDeckStore.getState().abilityFilter).toBeNull();
    });
  });

  describe('deck management', () => {
    it('sets deck name', () => {
      useDeckStore.getState().setDeckName('My Deck');
      expect(useDeckStore.getState().deckName).toBe('My Deck');
    });

    it('sets active slot', () => {
      useDeckStore.getState().setActiveSlot(2);
      expect(useDeckStore.getState().activeSlot).toBe(2);
    });

    it('loads a deck into the builder', () => {
      const deck = makeDeck16();
      useDeckStore.getState().loadDeckIntoBuilder('Loaded', 1, deck);
      expect(useDeckStore.getState().currentDeck).toEqual(deck);
      expect(useDeckStore.getState().deckName).toBe('Loaded');
      expect(useDeckStore.getState().activeSlot).toBe(1);
    });

    it('clears deck', () => {
      useDeckStore.getState().addCardToDeck(card1);
      useDeckStore.getState().setDeckName('Test');
      useDeckStore.getState().clearDeck();
      expect(useDeckStore.getState().currentDeck).toEqual([]);
      expect(useDeckStore.getState().deckName).toBe('');
      expect(useDeckStore.getState().activeSlot).toBeNull();
    });
  });

  describe('resetDeckBuilder', () => {
    it('resets everything', () => {
      useDeckStore.getState().addCardToDeck(card1);
      useDeckStore.getState().setSearchQuery('test');
      useDeckStore.getState().setDeckName('Test');
      useDeckStore.getState().resetDeckBuilder();
      expect(useDeckStore.getState().currentDeck).toEqual([]);
      expect(useDeckStore.getState().searchQuery).toBe('');
      expect(useDeckStore.getState().deckName).toBe('');
    });
  });
});

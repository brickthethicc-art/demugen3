import { describe, it, expect } from 'vitest';
import { drawInitialHand } from '../../src/engines/game-initialization/index.js';
import { createUnit, createSorcery } from '../factories.js';
import { MAX_HAND_SIZE } from '../../src/types/index.js';
import type { Deck } from '../../src/types/index.js';

function makeDeck(cards: number = 16): Deck {
  const deckCards = [];
  for (let i = 0; i < cards; i++) {
    if (i % 3 === 0) {
      deckCards.push(createUnit({ id: `unit-${i}`, cost: (i % 8) + 1 }));
    } else {
      deckCards.push(createSorcery({ id: `sorcery-${i}`, cost: (i % 6) + 1 }));
    }
  }
  return { cards: deckCards };
}

describe('drawInitialHand', () => {
  it('draws 4 cards from 16-card deck', () => {
    const deck = makeDeck(16);
    const result = drawInitialHand(deck);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.hand.cards).toHaveLength(4);
    expect(result.value.remainingDeck.cards).toHaveLength(12);
    expect(result.value.hand.cards[0]).toBe(deck.cards[0]);
    expect(result.value.hand.cards[3]).toBe(deck.cards[3]);
  });

  it('draws exactly MAX_HAND_SIZE cards', () => {
    const deck = makeDeck(10);
    const result = drawInitialHand(deck);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.hand.cards).toHaveLength(MAX_HAND_SIZE);
  });

  it('preserves deck order after draw', () => {
    const deck = makeDeck(8);
    const result = drawInitialHand(deck);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    // Hand should have first 4 cards
    expect(result.value.hand.cards).toEqual(deck.cards.slice(0, 4));
    // Remaining deck should have last 4 cards
    expect(result.value.remainingDeck.cards).toEqual(deck.cards.slice(4));
  });

  it('handles deck with exactly 4 cards', () => {
    const deck = makeDeck(4);
    const result = drawInitialHand(deck);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.hand.cards).toHaveLength(4);
    expect(result.value.remainingDeck.cards).toHaveLength(0);
  });

  it('returns error for empty deck', () => {
    const deck: Deck = { cards: [] };
    const result = drawInitialHand(deck);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('insufficient cards');
    }
  });

  it('returns error for deck with fewer than 4 cards', () => {
    const deck = makeDeck(3);
    const result = drawInitialHand(deck);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('insufficient cards');
    }
  });

  it('does not mutate original deck', () => {
    const deck = makeDeck(16);
    const originalDeck = JSON.parse(JSON.stringify(deck));
    drawInitialHand(deck);
    
    expect(deck).toEqual(originalDeck);
  });
});

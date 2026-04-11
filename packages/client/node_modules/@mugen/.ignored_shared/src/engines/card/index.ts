import type { Card, Deck, Hand } from '../../types/index.js';
import { MAX_DECK_SIZE, MAX_HAND_SIZE } from '../../types/index.js';
import type { Result } from '../../types/actions.js';

export function createDeck(cards: Card[]): Result<Deck> {
  if (cards.length !== MAX_DECK_SIZE) {
    return {
      ok: false,
      error: `Deck must contain exactly ${MAX_DECK_SIZE} cards, got ${cards.length}`,
    };
  }
  return { ok: true, value: { cards: [...cards] } };
}

export function drawCards(
  deck: Deck,
  hand: Hand
): { deck: Deck; hand: Hand } {
  const slotsAvailable = MAX_HAND_SIZE - hand.cards.length;
  if (slotsAvailable <= 0 || deck.cards.length === 0) {
    return { deck: { cards: [...deck.cards] }, hand: { cards: [...hand.cards] } };
  }

  const drawCount = Math.min(slotsAvailable, deck.cards.length);
  const drawn = deck.cards.slice(0, drawCount);
  const remainingDeck = deck.cards.slice(drawCount);

  return {
    deck: { cards: remainingDeck },
    hand: { cards: [...hand.cards, ...drawn] },
  };
}

export function shuffleDeck(deck: Deck): Deck {
  const cards = [...deck.cards];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return { cards };
}

export function getHandSize(hand: Hand): number {
  return hand.cards.length;
}

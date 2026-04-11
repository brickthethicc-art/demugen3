import type { Card, Deck, Hand } from '../../types/index.js';
import { MAX_DECK_SIZE, MAX_HAND_SIZE, PLAYER_DECK_SIZE, FIELD_CARD_COUNT } from '../../types/index.js';
import type { Result } from '../../types/actions.js';

export { PLAYER_DECK_SIZE, FIELD_CARD_COUNT } from '../../types/index.js';

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

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle(deck: Deck, seed: number): Deck {
  const cards = [...deck.cards];
  const rng = mulberry32(seed);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return { cards };
}

export function initializePlayerDeck(
  cards: Card[],
  seed: number
): { fieldCards: Card[]; mainDeck: Deck; discardPile: Deck } {
  if (cards.length !== PLAYER_DECK_SIZE && cards.length !== MAX_DECK_SIZE) {
    throw new Error(
      `Player deck must contain exactly ${PLAYER_DECK_SIZE} or ${MAX_DECK_SIZE} cards, got ${cards.length}`
    );
  }
  const shuffled = seededShuffle({ cards: [...cards] }, seed);
  const fieldCards = shuffled.cards.slice(0, FIELD_CARD_COUNT);
  const mainDeck: Deck = { cards: shuffled.cards.slice(FIELD_CARD_COUNT) };
  const discardPile: Deck = { cards: [] };
  return { fieldCards, mainDeck, discardPile };
}

export function drawOne(deck: Deck): { card: Card | null; deck: Deck } {
  if (deck.cards.length === 0) {
    return { card: null, deck: { cards: [] } };
  }
  const [top, ...rest] = deck.cards;
  return { card: top!, deck: { cards: rest } };
}

export function discardCard(pile: Deck, card: Card): Deck {
  return { cards: [...pile.cards, card] };
}

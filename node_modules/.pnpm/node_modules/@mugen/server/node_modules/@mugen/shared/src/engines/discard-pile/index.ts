import type { Card, UnitInstance, PlayerState } from '../../types/index.js';

export interface DiscardPileEntry {
  card: Card;
  timestamp: number;
  source: 'unit_death' | 'sorcery_played' | 'other';
  unitInstance?: UnitInstance; // For unit deaths, track the instance details
}

export interface DiscardPileState {
  entries: DiscardPileEntry[];
  count: number;
}

/**
 * Adds a card to the discard pile with chronological tracking
 */
export function addToDiscardPile(
  player: PlayerState,
  card: Card,
  source: DiscardPileEntry['source'],
  unitInstance?: UnitInstance
): PlayerState {
  return {
    ...player,
    discardPile: {
      cards: [...player.discardPile.cards, card],
    },
  };
}

/**
 * Gets the discard pile entries in chronological order (newest first)
 */
export function getDiscardPileEntries(player: PlayerState): DiscardPileEntry[] {
  // Create entries from discard pile cards (we don't store timestamps in the basic Deck type)
  // For now, we'll simulate chronological order based on array position
  return player.discardPile.cards.map((card, index) => ({
    card,
    timestamp: Date.now() - (player.discardPile.cards.length - index) * 1000, // Simulate chronological order
    source: 'other' as const,
  }));
}

/**
 * Gets the discard pile count
 */
export function getDiscardPileCount(player: PlayerState): number {
  return player.discardPile.cards.length;
}

/**
 * Handles unit death by adding the unit's card to the discard pile
 */
export function handleUnitDeath(
  player: PlayerState,
  unitInstance: UnitInstance
): PlayerState {
  return addToDiscardPile(
    player,
    unitInstance.card,
    'unit_death',
    unitInstance
  );
}

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/store/game-store.js';
import { ALL_CARDS } from '../../src/data/cards.js';
import type { Card } from '@mugen/shared';

const makeDeck16 = (): Card[] => ALL_CARDS.slice(0, 16);

describe('Selected Deck (game-store)', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('starts with null selectedDeck', () => {
    expect(useGameStore.getState().selectedDeck).toBeNull();
  });

  it('sets selectedDeck', () => {
    const deck = makeDeck16();
    useGameStore.getState().setSelectedDeck(deck);
    expect(useGameStore.getState().selectedDeck).toEqual(deck);
  });

  it('clears selectedDeck with null', () => {
    useGameStore.getState().setSelectedDeck(makeDeck16());
    useGameStore.getState().setSelectedDeck(null);
    expect(useGameStore.getState().selectedDeck).toBeNull();
  });

  it('reset clears selectedDeck', () => {
    useGameStore.getState().setSelectedDeck(makeDeck16());
    useGameStore.getState().reset();
    expect(useGameStore.getState().selectedDeck).toBeNull();
  });
});

import type { Card } from '@mugen/shared';
import {
  CardType,
  AbilityType,
  createDefaultCardFramework,
  DEFAULT_STAT_DISPLAY_ORDER,
} from '@mugen/shared';

// Create a test 16-card deck for debugging
export function createTestDeck(): Card[] {
  return Array.from({ length: 16 }, (_, i) => ({
    id: `test-card-${i}`,
    name: `Test Unit ${i + 1}`,
    cardType: CardType.UNIT,
    hp: 5 + Math.floor(i / 4),
    maxHp: 5 + Math.floor(i / 4),
    atk: 3 + Math.floor(i / 6),
    movement: 2,
    range: 1,
    ability: {
      id: `test-ability-${i}`,
      name: `Test Ability ${i + 1}`,
      description: 'A test ability for debugging',
      cost: 2,
      abilityType: AbilityType.DAMAGE,
    },
    cost: 3 + (i % 3),
    framework: createDefaultCardFramework(),
    statDisplayOrder: [...DEFAULT_STAT_DISPLAY_ORDER],
  }));
}

// Save a test deck to localStorage for debugging
export function saveTestDeck(): void {
  const deck = createTestDeck();
  const STORAGE_KEY = 'mugen-saved-decks';
  const existingData = localStorage.getItem(STORAGE_KEY);
  let data = existingData ? JSON.parse(existingData) : { slots: new Array(5).fill(null) };
  
  data.slots[0] = {
    name: 'Test Deck (Debug)',
    cards: deck,
    savedAt: Date.now(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  console.log('Test deck saved to slot 0 with', deck.length, 'cards');
}

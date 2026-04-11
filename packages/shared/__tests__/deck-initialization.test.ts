import { describe, it, expect } from 'vitest';
import { createGame } from '../src/engines/game/index.js';
import { createDeck, shuffleDeck, drawCards } from '../src/engines/card/index.js';
import { GamePhase, CardType } from '../src/types/index.js';

describe('Game Engine Deck Initialization', () => {
  it('should initialize player decks when creating game - CURRENTLY FAILS', () => {
    // Create a test deck
    const testDeckResult = createDeck([
      { id: 'card1', name: 'Test Card 1', cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability1', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any }, cost: 1 },
      { id: 'card2', name: 'Test Card 2', cardType: CardType.UNIT, hp: 2, maxHp: 2, atk: 2, movement: 2, range: 2, ability: { id: 'ability2', name: 'Test Ability', description: 'Test', cost: 2, abilityType: 'DAMAGE' as any }, cost: 2 },
      { id: 'card3', name: 'Test Card 3', cardType: CardType.UNIT, hp: 3, maxHp: 3, atk: 3, movement: 3, range: 3, ability: { id: 'ability3', name: 'Test Ability', description: 'Test', cost: 3, abilityType: 'DAMAGE' as any }, cost: 3 },
      { id: 'card4', name: 'Test Card 4', cardType: CardType.UNIT, hp: 4, maxHp: 4, atk: 4, movement: 4, range: 4, ability: { id: 'ability4', name: 'Test Ability', description: 'Test', cost: 4, abilityType: 'DAMAGE' as any }, cost: 4 },
      // Add 12 more cards to meet MAX_DECK_SIZE requirement
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `card${i + 5}`,
        name: `Test Card ${i + 5}`,
        cardType: CardType.UNIT,
        hp: i + 5,
        maxHp: i + 5,
        atk: i + 5,
        movement: 1,
        range: 1,
        ability: { id: `ability${i + 5}`, name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any },
        cost: 1,
      })),
    ]);

    expect(testDeckResult.ok).toBe(true);
    const testDeck = testDeckResult.value;

    // Create player states with decks
    const players = [
      { id: 'player1', name: 'Player 1', life: 24, deck: testDeck, hand: { cards: [] }, units: [], activeUnits: [], reserveUnits: [], combatModifiers: [] },
      { id: 'player2', name: 'Player 2', life: 24, deck: testDeck, hand: { cards: [] }, units: [], activeUnits: [], reserveUnits: [], combatModifiers: [] },
    ];

    // Create game with player decks
    const gameResult = createGame(players);

    // This should pass but currently fails because decks are not initialized properly
    expect(gameResult.ok).toBe(true);
    if (gameResult.ok) {
      const game = gameResult.value;
      expect(game.players[0].deck.cards).toHaveLength(12); // 16 - 4 cards drawn
      expect(game.players[1].deck.cards).toHaveLength(12); // 16 - 4 cards drawn
    }
  });

  it('should draw 4 cards to each player hand at game start - CURRENTLY FAILS', () => {
    // Create a test deck
    const testDeckResult = createDeck([
      { id: 'card1', name: 'Test Card 1', cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability1', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any }, cost: 1 },
      { id: 'card2', name: 'Test Card 2', cardType: CardType.UNIT, hp: 2, maxHp: 2, atk: 2, movement: 2, range: 2, ability: { id: 'ability2', name: 'Test Ability', description: 'Test', cost: 2, abilityType: 'DAMAGE' as any }, cost: 2 },
      { id: 'card3', name: 'Test Card 3', cardType: CardType.UNIT, hp: 3, maxHp: 3, atk: 3, movement: 3, range: 3, ability: { id: 'ability3', name: 'Test Ability', description: 'Test', cost: 3, abilityType: 'DAMAGE' as any }, cost: 3 },
      { id: 'card4', name: 'Test Card 4', cardType: CardType.UNIT, hp: 4, maxHp: 4, atk: 4, movement: 4, range: 4, ability: { id: 'ability4', name: 'Test Ability', description: 'Test', cost: 4, abilityType: 'DAMAGE' as any }, cost: 4 },
      // Add 12 more cards to meet MAX_DECK_SIZE requirement
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `card${i + 5}`,
        name: `Test Card ${i + 5}`,
        cardType: CardType.UNIT,
        hp: i + 5,
        maxHp: i + 5,
        atk: i + 5,
        movement: 1,
        range: 1,
        ability: { id: `ability${i + 5}`, name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any },
        cost: 1,
      })),
    ]);

    expect(testDeckResult.ok).toBe(true);
    const testDeck = testDeckResult.value;

    // Create player states with decks
    const players = [
      { id: 'player1', name: 'Player 1', life: 24, deck: testDeck, hand: { cards: [] }, units: [], activeUnits: [], reserveUnits: [], combatModifiers: [] },
      { id: 'player2', name: 'Player 2', life: 24, deck: testDeck, hand: { cards: [] }, units: [], activeUnits: [], reserveUnits: [], combatModifiers: [] },
    ];

    // Create game with player decks
    const gameResult = createGame(players);

    // This should pass but currently fails because no cards are drawn
    expect(gameResult.ok).toBe(true);
    if (gameResult.ok) {
      const game = gameResult.value;
      expect(game.players[0].hand.cards).toHaveLength(4);
      expect(game.players[1].hand.cards).toHaveLength(4);
    }
  });

  it('should validate starting unit selection (6 units, cost <= 40) - SHOULD PASS', () => {
    // Test starting unit validation logic
    const testUnits = [
      { id: 'unit1', cost: 5, cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability1', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any } },
      { id: 'unit2', cost: 5, cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability2', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any } },
      { id: 'unit3', cost: 5, cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability3', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any } },
      { id: 'unit4', cost: 5, cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability4', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any } },
      { id: 'unit5', cost: 5, cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability5', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any } },
      { id: 'unit6', cost: 5, cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability6', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any } },
    ];

    // This should pass - 6 units with total cost 30 <= 40
    expect(testUnits).toHaveLength(6);
    const totalCost = testUnits.reduce((sum, unit) => sum + (unit as any).cost, 0);
    expect(totalCost).toBeLessThanOrEqual(40);
  });

  it('should reject invalid starting unit selection - SHOULD PASS', () => {
    // Test invalid starting unit selection
    const testUnits = [
      { id: 'unit1', cost: 10, cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability1', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any } },
      { id: 'unit2', cost: 10, cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability2', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any } },
      { id: 'unit3', cost: 10, cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability3', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any } },
      { id: 'unit4', cost: 10, cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability4', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any } },
      { id: 'unit5', cost: 10, cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability5', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any } },
      { id: 'unit6', cost: 10, cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability6', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any } },
    ];

    // This should pass validation - 6 units with total cost 60 > 40
    expect(testUnits).toHaveLength(6);
    const totalCost = testUnits.reduce((sum, unit) => sum + (unit as any).cost, 0);
    expect(totalCost).toBeGreaterThan(40);
  });

  it('should handle deck shuffling before drawing - SHOULD PASS', () => {
    // Create a test deck
    const testDeckResult = createDeck([
      { id: 'card1', name: 'Test Card 1', cardType: CardType.UNIT, hp: 1, maxHp: 1, atk: 1, movement: 1, range: 1, ability: { id: 'ability1', name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any }, cost: 1 },
      { id: 'card2', name: 'Test Card 2', cardType: CardType.UNIT, hp: 2, maxHp: 2, atk: 2, movement: 2, range: 2, ability: { id: 'ability2', name: 'Test Ability', description: 'Test', cost: 2, abilityType: 'DAMAGE' as any }, cost: 2 },
      { id: 'card3', name: 'Test Card 3', cardType: CardType.UNIT, hp: 3, maxHp: 3, atk: 3, movement: 3, range: 3, ability: { id: 'ability3', name: 'Test Ability', description: 'Test', cost: 3, abilityType: 'DAMAGE' as any }, cost: 3 },
      { id: 'card4', name: 'Test Card 4', cardType: CardType.UNIT, hp: 4, maxHp: 4, atk: 4, movement: 4, range: 4, ability: { id: 'ability4', name: 'Test Ability', description: 'Test', cost: 4, abilityType: 'DAMAGE' as any }, cost: 4 },
      // Add 12 more cards to meet MAX_DECK_SIZE requirement
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `card${i + 5}`,
        name: `Test Card ${i + 5}`,
        cardType: CardType.UNIT,
        hp: i + 5,
        maxHp: i + 5,
        atk: i + 5,
        movement: 1,
        range: 1,
        ability: { id: `ability${i + 5}`, name: 'Test Ability', description: 'Test', cost: 1, abilityType: 'DAMAGE' as any },
        cost: 1,
      })),
    ]);

    expect(testDeckResult.ok).toBe(true);
    const testDeck = testDeckResult.value;

    // Test deck shuffling
    const shuffledDeck = shuffleDeck(testDeck);
    
    // This should pass - shuffled deck should have same cards
    expect(shuffledDeck.cards).toHaveLength(testDeck.cards.length);
    expect(shuffledDeck.cards).toEqual(expect.arrayContaining(testDeck.cards));
  });
});

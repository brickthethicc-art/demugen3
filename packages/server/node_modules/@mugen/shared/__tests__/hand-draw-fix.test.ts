import { describe, it, expect } from 'vitest';
import { createGame } from '../src/engines/game/index.js';
import { startTurn, endTurn } from '../src/engines/turn/index.js';
import { createDeck } from '../src/engines/card/index.js';
import { CardType } from '../src/types/index.js';

describe('Hand Draw Fix - Players start with empty hands', () => {
  it('should create game with empty hands and draw cards on second turn', () => {
    // Create a test deck with 16 cards
    const testDeckResult = createDeck([
      ...Array.from({ length: 16 }, (_, i) => ({
        id: `card${i + 1}`,
        name: `Test Card ${i + 1}`,
        cardType: CardType.UNIT,
        hp: 1,
        maxHp: 1,
        atk: 1,
        movement: 1,
        range: 1,
        ability: { 
          id: `ability${i + 1}`, 
          name: 'Test Ability', 
          description: 'Test', 
          cost: 1, 
          abilityType: 'DAMAGE' as any 
        },
        cost: 1,
      })),
    ]);

    expect(testDeckResult.ok).toBe(true);
    const testDeck = testDeckResult.value!;

    // Create minimal player states
    const players = [
      {
        id: 'player1',
        name: 'Player 1',
        life: 24,
        maxLife: 24,
        deck: testDeck,
        hand: { cards: [] },
        units: [],
        activeUnits: [],
        reserveUnits: [],
        combatModifiers: [],
        isReady: true,
        isEliminated: false,
        team: { units: [], locked: true },
        mainDeck: { cards: [] },
        discardPile: { cards: [] },
      },
      {
        id: 'player2',
        name: 'Player 2',
        life: 24,
        maxLife: 24,
        deck: testDeck,
        hand: { cards: [] },
        units: [],
        activeUnits: [],
        reserveUnits: [],
        combatModifiers: [],
        isReady: true,
        isEliminated: false,
        team: { units: [], locked: true },
        mainDeck: { cards: [] },
        discardPile: { cards: [] },
      },
    ];

    // Create game
    const gameResult = createGame(players);
    expect(gameResult.ok).toBe(true);
    const game = gameResult.value!;

    // Verify: Players start with empty hands
    expect(game.players[0].hand.cards).toHaveLength(0);
    expect(game.players[1].hand.cards).toHaveLength(0);
    
    // Verify: 10 cards in main deck (16 total - 6 starting units in discard pile)
    expect(game.players[0].mainDeck.cards).toHaveLength(10);
    expect(game.players[1].mainDeck.cards).toHaveLength(10);

    // Start first turn for Player 1 (turnRotation = 0) - should NOT draw cards
    const firstTurnState = startTurn(game);
    
    // Verify: Still no cards in hand after first turn
    expect(firstTurnState.players[0].hand.cards).toHaveLength(0);
    expect(firstTurnState.players[1].hand.cards).toHaveLength(0);
    expect(firstTurnState.turnRotation).toBe(0);

    // End Player 1's turn - advances to Player 2
    const afterP1EndResult = endTurn(firstTurnState);
    expect(afterP1EndResult.ok).toBe(true);
    const afterP1End = afterP1EndResult.value!;
    expect(afterP1End.currentPlayerIndex).toBe(1); // Player 2's turn
    expect(afterP1End.turnRotation).toBe(0);

    // Start Player 2's first turn - should NOT draw cards
    const p2FirstTurn = startTurn(afterP1End);
    expect(p2FirstTurn.players[0].hand.cards).toHaveLength(0);
    expect(p2FirstTurn.players[1].hand.cards).toHaveLength(0);
    expect(p2FirstTurn.turnRotation).toBe(0);

    // End Player 2's turn - advances back to Player 1, increments rotation
    const afterP2EndResult = endTurn(p2FirstTurn);
    expect(afterP2EndResult.ok).toBe(true);
    const afterP2End = afterP2EndResult.value!;
    expect(afterP2End.currentPlayerIndex).toBe(0); // Back to Player 1
    expect(afterP2End.turnRotation).toBe(1); // Now rotation is 1!

    // Start Player 1's second turn (turnRotation = 1) - should draw 1 card
    const p1SecondTurn = startTurn(afterP2End);
    
    // Debug: Check turn rotation and deck state
    console.log('After Player 1 second turn - turnRotation:', p1SecondTurn.turnRotation);
    console.log('Player 1 main deck size:', p1SecondTurn.players[0].mainDeck.cards.length);
    console.log('Player 1 hand size:', p1SecondTurn.players[0].hand.cards.length);
    
    // Verify: Player 1 now has 1 card in hand (drew on second turn)
    expect(p1SecondTurn.players[0].hand.cards).toHaveLength(1);
    expect(p1SecondTurn.players[1].hand.cards).toHaveLength(0); // Player 2 hasn't had second turn yet
    expect(p1SecondTurn.turnRotation).toBe(1);
  });
});

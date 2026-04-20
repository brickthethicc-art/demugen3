import { describe, it, expect, beforeEach } from 'vitest';
import { createUnit, createSorcery, resetIdCounter } from './factories.js';
import { createDeck, drawCards, shuffleDeck } from '../src/engines/card/index.js';
import { createGame } from '../src/engines/game/index.js';
import { MAX_HAND_SIZE, GamePhase } from '../src/types/index.js';

describe('Game Start Investigation - Failing Tests', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('Bug 1: Card draw mechanics work but are not called during game start', () => {
    it('drawCards function works correctly - SHOULD PASS', () => {
      // Verify the drawCards function itself works
      const cards = Array.from({ length: 16 }, (_, i) => 
        createUnit({ id: `card-${i}`, cost: 5 })
      );
      
      const deckResult = createDeck(cards);
      expect(deckResult.ok).toBe(true);
      if (!deckResult.ok) return;

      const shuffledDeck = shuffleDeck(deckResult.value);
      const initialHand = { cards: [] };
      
      const { deck: remainingDeck, hand: drawnHand } = drawCards(shuffledDeck, initialHand);
      
      // This should work - the drawCards function is correct
      expect(drawnHand.cards).toHaveLength(MAX_HAND_SIZE);
      expect(remainingDeck.cards).toHaveLength(cards.length - MAX_HAND_SIZE);
    });

    it('Game creation does not automatically draw cards - DOCUMENTS BUG', () => {
      // Create minimal player states
      const players = [
        {
          id: 'player1',
          name: 'Player 1',
          life: 24,
          maxLife: 24,
          team: { activeUnits: [], reserveUnits: [], locked: false },
          units: [],
          hand: { cards: [] },
          deck: { cards: [] },
          isEliminated: false,
          isReady: true,
          isConnected: true,
          reserveLockedUntilNextTurn: false,
        },
        {
          id: 'player2',
          name: 'Player 2',
          life: 24,
          maxLife: 24,
          team: { activeUnits: [], reserveUnits: [], locked: false },
          units: [],
          hand: { cards: [] },
          deck: { cards: [] },
          isEliminated: false,
          isReady: true,
          isConnected: true,
          reserveLockedUntilNextTurn: false,
        }
      ];

      const gameResult = createGame(players);
      expect(gameResult.ok).toBe(true);
      if (!gameResult.ok) return;

      const gameState = gameResult.value;

      // Game creation doesn't handle deck initialization or card drawing
      expect(gameState.phase).toBe(GamePhase.LOBBY);
      expect(gameState.players[0]?.hand.cards).toHaveLength(0);
      expect(gameState.players[0]?.deck.cards).toHaveLength(0);

      // This documents the bug: Game creation doesn't initialize decks or draw cards
      // The deck and draw functions exist but aren't called during game initialization
    });
  });

  describe('Bug 2: Starting unit selection missing integration', () => {
    it('PRE_GAME phase exists but no unit selection mechanism - DOCUMENTS BUG', () => {
      const players = [
        {
          id: 'player1',
          name: 'Player 1',
          life: 24,
          maxLife: 24,
          team: { activeUnits: [], reserveUnits: [], locked: false },
          units: [],
          hand: { cards: [] },
          deck: { cards: [] },
          isEliminated: false,
          isReady: true,
          isConnected: true,
          reserveLockedUntilNextTurn: false,
        }
      ];

      const gameResult = createGame(players);
      expect(gameResult.ok).toBe(true);
      if (!gameResult.ok) return;

      const gameState = gameResult.value;

      // Game can be in PRE_GAME phase but no mechanism for unit selection
      expect(gameState.phase).toBe(GamePhase.LOBBY);
      
      // Even if manually set to PRE_GAME, no unit selection infrastructure exists
      const preGameState = { ...gameState, phase: GamePhase.PRE_GAME };
      expect(preGameState.players[0]?.team.activeUnits).toHaveLength(0);
      expect(preGameState.players[0]?.team.locked).toBe(false);

      // This documents the bug: PRE_GAME phase exists but:
      // 1. No connection to client-side deck selection
      // 2. No unit selection intent handling
      // 3. No UI trigger mechanism
    });

    it('Client deck data never transferred to game state - DOCUMENTS BUG', () => {
      // Simulate what should happen: client selects deck, deck becomes part of game state
      const selectedDeck = [
        ...Array.from({ length: 12 }, () => createUnit({ cost: 5 })),
        ...Array.from({ length: 4 }, () => createSorcery({ cost: 3 }))
      ];
      
      const deckResult = createDeck(selectedDeck);
      expect(deckResult.ok).toBe(true);
      if (!deckResult.ok) return;

      // But in current implementation, this deck never reaches the game state
      const players = [
        {
          id: 'player1',
          name: 'Player 1',
          life: 24,
          maxLife: 24,
          team: { activeUnits: [], reserveUnits: [], locked: false },
          units: [],
          hand: { cards: [] },
          deck: { cards: [] }, // Empty - should contain selectedDeck
          isEliminated: false,
          isReady: true,
          isConnected: true,
          reserveLockedUntilNextTurn: false,
        }
      ];

      const gameResult = createGame(players);
      expect(gameResult.ok).toBe(true);
      if (!gameResult.ok) return;

      const gameState = gameResult.value;
      
      // Player deck is empty - selectedDeck from client never transferred
      expect(gameState.players[0]?.deck.cards).toHaveLength(0);
      
      // Unit cards available for selection but not accessible
      const unitCards = selectedDeck.filter(card => card.cardType === 'UNIT');
      expect(unitCards.length).toBeGreaterThan(0);
      // But StartingUnitSelection component can't access these
    });
  });

  describe('Integration Flow Issues', () => {
    it('Complete game start flow has missing integration points - DOCUMENTS BUGS', () => {
      // This test documents all the missing connections in the game start flow
      
      // 1. Deck Selection -> Game State: Missing
      // Client stores selectedDeck but never sends to server
      
      // 2. Game State -> Card Draw: Missing  
      // Even if deck existed, no automatic card draw on game start
      
      // 3. PRE_GAME -> UI Trigger: Missing
      // App.tsx routes PRE_GAME to 'game' screen, not 'pregame' screen
      
      // 4. Unit Selection -> Server: Missing
      // No intent handling for SELECT_TEAM or LOCK_TEAM
      
      const players = [
        {
          id: 'player1',
          name: 'Player 1',
          life: 24,
          maxLife: 24,
          team: { activeUnits: [], reserveUnits: [], locked: false },
          units: [],
          hand: { cards: [] },
          deck: { cards: [] },
          isEliminated: false,
          isReady: true,
          isConnected: true,
          reserveLockedUntilNextTurn: false,
        }
      ];

      const gameResult = createGame(players);
      expect(gameResult.ok).toBe(true);
      if (!gameResult.ok) return;

      const gameState = gameResult.value;

      // All these should be populated but aren't:
      expect(gameState.players[0]?.deck.cards).toHaveLength(0); // Missing deck init
      expect(gameState.players[0]?.hand.cards).toHaveLength(0); // Missing card draw  
      expect(gameState.players[0]?.team.activeUnits).toHaveLength(0); // Missing unit selection
      expect(gameState.players[0]?.team.locked).toBe(false); // Missing team locking
      
      // The flow breaks at multiple integration points
    });
  });
});

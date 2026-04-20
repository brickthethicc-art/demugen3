import { describe, it, expect } from 'vitest';
import {
  createPlayer,
  createUnit,
  createUnitInstance,
} from '../factories.js';
import { startTurn } from '../../src/engines/turn/index.js';
import { TurnPhase } from '../../src/types/index.js';
import { createGame } from '../../src/engines/game/index.js';

describe('StartTurn Debug', () => {
  it('debug startTurn with hand size limit', () => {
    const unit1 = createUnit({ id: 'u1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    const unit2 = createUnit({ id: 'u2', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
    const unit3 = createUnit({ id: 'u3', atk: 4, hp: 6, maxHp: 6, movement: 1, range: 1, cost: 5 });
    
    const activeUnit1 = createUnitInstance({ card: unit1, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 0 } });
    const activeUnit2 = createUnitInstance({ card: unit2, currentHp: 8, ownerId: 'p1', position: { x: 1, y: 0 } });
    const activeUnit3 = createUnitInstance({ card: unit3, currentHp: 6, ownerId: 'p1', position: { x: 2, y: 0 } });
    
    // Create player with mainDeck that has cards to draw
    const p1 = createPlayer({
      id: 'p1',
      life: 24,
      isReady: true,
      units: [activeUnit1, activeUnit2, activeUnit3], // 3 active units
      team: {
        activeUnits: [unit1, unit2, unit3],
        reserveUnits: [], // No bench units
        locked: true,
      },
      discardPile: { cards: [] },
      mainDeck: { cards: [unit1, unit2, unit3, unit1, unit2, unit3] }, // 6 cards in deck
    });
    const p2 = createPlayer({ id: 'p2', life: 24, isReady: true, units: [], team: { activeUnits: [], reserveUnits: [], locked: true } });

    const state = createGame([p1, p2]);
    if (!state.ok) {
      expect.fail('Failed to create game state');
      return;
    }

    // Set turnRotation to 1 to enable card drawing
    const gameStateWithRotation = { ...state.value, turnRotation: 1 };

    console.log('Player 1 hand after creation:', gameStateWithRotation.players[0]!.hand);
    console.log('Player 1 mainDeck after creation:', gameStateWithRotation.players[0]!.mainDeck);
    console.log('Before startTurn - Hand size:', gameStateWithRotation.players[0]!.hand.cards.length);
    console.log('Before startTurn - Deck size:', gameStateWithRotation.players[0]!.mainDeck.cards.length);

    // Start turn should draw a card and trigger standby phase
    const newTurnState = startTurn(gameStateWithRotation);
    
    console.log('After startTurn - Hand size:', newTurnState.players[0]!.hand.cards.length);
    console.log('After startTurn - Turn phase:', newTurnState.turnPhase);

    expect(newTurnState.players[0]!.hand.cards.length).toBe(1); // Should draw 1 card
    expect(newTurnState.turnPhase).toBe(TurnPhase.MOVE); // Should NOT trigger standby phase (only 1 card)
  });
});

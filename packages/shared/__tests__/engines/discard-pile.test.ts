import { describe, it, expect } from 'vitest';
import {
  createPlayer,
  createUnit,
  createUnitInstance,
  createBoard,
} from '../factories.js';
import { processAttack, processAbility } from '../../src/engines/turn/index.js';
import { TurnPhase } from '../../src/types/index.js';
import { placeUnit } from '../../src/engines/board/index.js';
import { createGame } from '../../src/engines/game/index.js';

describe('Discard Pile - Unit Death', () => {
  it('sends destroyed units to discard pile after combat', () => {
    const attackerCard = createUnit({ id: 'attacker', atk: 10, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    const defenderCard = createUnit({ id: 'defender', atk: 3, hp: 5, maxHp: 5, movement: 2, range: 1, cost: 5 });
    
    const attackerUnit = createUnitInstance({ card: attackerCard, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 28 } });
    const defenderUnit = createUnitInstance({ card: defenderCard, currentHp: 5, ownerId: 'p2', position: { x: 0, y: 29 } });

    const p1 = createPlayer({ 
      id: 'p1', 
      life: 24, 
      isReady: true, 
      units: [attackerUnit], 
      team: { activeUnits: [attackerCard], reserveUnits: [], locked: true },
      discardPile: { cards: [] }
    });
    const p2 = createPlayer({ 
      id: 'p2', 
      life: 24, 
      isReady: true, 
      units: [defenderUnit], 
      team: { activeUnits: [defenderCard], reserveUnits: [], locked: true },
      discardPile: { cards: [] }
    });

    let board = createBoard();
    let r = placeUnit(board, 'p1-attacker', { x: 0, y: 28 });
    if (r.ok) board = r.value;
    r = placeUnit(board, 'p2-defender', { x: 0, y: 29 });
    if (r.ok) board = r.value;

    const baseState = createGame([p1, p2]);
    if (!baseState.ok) {
      expect.fail('Failed to create base game state');
      return;
    }

    const state = {
      ...baseState.value,
      turnPhase: TurnPhase.ATTACK,
      board,
      currentPlayerIndex: 0,
    };

    // p1 attacks p2 - defender should die (10 ATK vs 5 HP)
    const result = processAttack(state, 'p1', 'attacker', 'defender', 'p2');
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Check that defender's card is in p2's discard pile
      const p2After = result.value.players[1]!;
      expect(p2After.discardPile.cards).toHaveLength(1);
      expect(p2After.discardPile.cards[0]!.id).toBe('defender');
      
      // Check that defender unit is removed from board
      expect(p2After.units).toHaveLength(0);
      
      // Attacker should still be alive (took 3 counter damage, 10 - 3 = 7 HP)
      const p1After = result.value.players[0]!;
      expect(p1After.units).toHaveLength(1);
      expect(p1After.units[0]!.currentHp).toBe(7);
      expect(p1After.discardPile.cards).toHaveLength(0); // Attacker didn't die
    }
  });

  it('sends both units to discard pile when both die in combat', () => {
    const attackerCard = createUnit({ id: 'attacker', atk: 5, hp: 5, maxHp: 5, movement: 2, range: 1, cost: 5 });
    const defenderCard = createUnit({ id: 'defender', atk: 5, hp: 5, maxHp: 5, movement: 2, range: 1, cost: 5 });
    
    const attackerUnit = createUnitInstance({ card: attackerCard, currentHp: 5, ownerId: 'p1', position: { x: 0, y: 28 } });
    const defenderUnit = createUnitInstance({ card: defenderCard, currentHp: 5, ownerId: 'p2', position: { x: 0, y: 29 } });

    const p1 = createPlayer({ 
      id: 'p1', 
      life: 24, 
      isReady: true, 
      units: [attackerUnit], 
      team: { activeUnits: [attackerCard], reserveUnits: [], locked: true },
      discardPile: { cards: [] }
    });
    const p2 = createPlayer({ 
      id: 'p2', 
      life: 24, 
      isReady: true, 
      units: [defenderUnit], 
      team: { activeUnits: [defenderCard], reserveUnits: [], locked: true },
      discardPile: { cards: [] }
    });

    let board = createBoard();
    let r = placeUnit(board, 'p1-attacker', { x: 0, y: 28 });
    if (r.ok) board = r.value;
    r = placeUnit(board, 'p2-defender', { x: 0, y: 29 });
    if (r.ok) board = r.value;

    const baseState = createGame([p1, p2]);
    if (!baseState.ok) {
      expect.fail('Failed to create base game state');
      return;
    }

    const state = {
      ...baseState.value,
      turnPhase: TurnPhase.ATTACK,
      board,
      currentPlayerIndex: 0,
    };

    // Both units have 5 ATK vs 5 HP - both should die
    const result = processAttack(state, 'p1', 'attacker', 'defender', 'p2');
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Both players should have 1 card in their discard pile
      const p1After = result.value.players[0]!;
      const p2After = result.value.players[1]!;
      
      expect(p1After.discardPile.cards).toHaveLength(1);
      expect(p1After.discardPile.cards[0]!.id).toBe('attacker');
      expect(p1After.units).toHaveLength(0);
      
      expect(p2After.discardPile.cards).toHaveLength(1);
      expect(p2After.discardPile.cards[0]!.id).toBe('defender');
      expect(p2After.units).toHaveLength(0);
    }
  });

  it('sends destroyed units to discard pile after ability damage', () => {
    const attackerCard = createUnit({ 
      id: 'attacker', 
      atk: 3, 
      hp: 10, 
      maxHp: 10, 
      movement: 2, 
      range: 3, 
      cost: 5,
      ability: { 
        id: 'damage-ability', 
        name: 'Fatal Strike', 
        description: 'Deal 3 damage', 
        cost: 0, 
        abilityType: 'DAMAGE' as any 
      }
    });
    const defenderCard = createUnit({ id: 'defender', atk: 3, hp: 3, maxHp: 3, movement: 2, range: 1, cost: 5 });
    
    const attackerUnit = createUnitInstance({ card: attackerCard, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 28 } });
    const defenderUnit = createUnitInstance({ card: defenderCard, currentHp: 3, ownerId: 'p2', position: { x: 0, y: 29 } });

    const p1 = createPlayer({ 
      id: 'p1', 
      life: 24, 
      isReady: true, 
      units: [attackerUnit], 
      team: { activeUnits: [attackerCard], reserveUnits: [], locked: true },
      discardPile: { cards: [] }
    });
    const p2 = createPlayer({ 
      id: 'p2', 
      life: 24, 
      isReady: true, 
      units: [defenderUnit], 
      team: { activeUnits: [defenderCard], reserveUnits: [], locked: true },
      discardPile: { cards: [] }
    });

    let board = createBoard();
    let r = placeUnit(board, 'p1-attacker', { x: 0, y: 28 });
    if (r.ok) board = r.value;
    r = placeUnit(board, 'p2-defender', { x: 0, y: 29 });
    if (r.ok) board = r.value;

    const baseState = createGame([p1, p2]);
    if (!baseState.ok) {
      expect.fail('Failed to create base game state');
      return;
    }

    const state = {
      ...baseState.value,
      turnPhase: TurnPhase.ABILITY,
      board,
      currentPlayerIndex: 0,
    };

    // Use damage ability that should kill the defender (3 HP - 3 damage = 0)
    const result = processAbility(state, 'p1', 'attacker', null, 'defender', 'p2');
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Check that defender's card is in p2's discard pile
      const p2After = result.value.players[1]!;
      expect(p2After.discardPile.cards).toHaveLength(1);
      expect(p2After.discardPile.cards[0]!.id).toBe('defender');
      
      // Check that defender unit is removed from board
      expect(p2After.units).toHaveLength(0);
      
      // Attacker should still be alive
      const p1After = result.value.players[0]!;
      expect(p1After.units).toHaveLength(1);
      expect(p1After.discardPile.cards).toHaveLength(0); // Attacker didn't die
    }
  });

  it('tracks discard pile count correctly', () => {
    const attackerCard = createUnit({ id: 'attacker', atk: 10, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    const defenderCard = createUnit({ id: 'defender', atk: 3, hp: 5, maxHp: 5, movement: 2, range: 1, cost: 5 });
    
    const attackerUnit = createUnitInstance({ card: attackerCard, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 28 } });
    const defenderUnit = createUnitInstance({ card: defenderCard, currentHp: 5, ownerId: 'p2', position: { x: 0, y: 29 } });

    // Start with some cards already in discard pile
    const p1 = createPlayer({ 
      id: 'p1', 
      life: 24, 
      isReady: true, 
      units: [attackerUnit], 
      team: { activeUnits: [attackerCard], reserveUnits: [], locked: true },
      discardPile: { cards: [createUnit({ id: 'existing1', atk: 1, hp: 1, maxHp: 1, movement: 1, range: 1, cost: 1 })] }
    });
    const p2 = createPlayer({ 
      id: 'p2', 
      life: 24, 
      isReady: true, 
      units: [defenderUnit], 
      team: { activeUnits: [defenderCard], reserveUnits: [], locked: true },
      discardPile: { cards: [createUnit({ id: 'existing2', atk: 1, hp: 1, maxHp: 1, movement: 1, range: 1, cost: 1 })] }
    });

    let board = createBoard();
    let r = placeUnit(board, 'p1-attacker', { x: 0, y: 28 });
    if (r.ok) board = r.value;
    r = placeUnit(board, 'p2-defender', { x: 0, y: 29 });
    if (r.ok) board = r.value;

    const baseState = createGame([p1, p2]);
    if (!baseState.ok) {
      expect.fail('Failed to create base game state');
      return;
    }

    const state = {
      ...baseState.value,
      turnPhase: TurnPhase.ATTACK,
      board,
      currentPlayerIndex: 0,
    };

    // p1 attacks p2 - defender should die
    const result = processAttack(state, 'p1', 'attacker', 'defender', 'p2');
    expect(result.ok).toBe(true);
    if (result.ok) {
      // p1 should still have 1 card (unchanged)
      const p1After = result.value.players[0]!;
      expect(p1After.discardPile.cards).toHaveLength(1);
      
      // p2 should now have 2 cards (1 existing + 1 new)
      const p2After = result.value.players[1]!;
      expect(p2After.discardPile.cards).toHaveLength(2);
      expect(p2After.discardPile.cards[0]!.id).toBe('existing2'); // Original card
      expect(p2After.discardPile.cards[1]!.id).toBe('defender'); // New card from death
    }
  });
});

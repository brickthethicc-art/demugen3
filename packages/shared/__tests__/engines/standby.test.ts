import { describe, it, expect } from 'vitest';
import {
  createPlayer,
  createUnit,
  createUnitInstance,
  createBoard,
} from '../factories.js';
import { startTurn, deployReserve, playCard, advancePhase } from '../../src/engines/turn/index.js';
import { TurnPhase, MAX_HAND_SIZE } from '../../src/types/index.js';
import { placeUnit } from '../../src/engines/board/index.js';
import { createGame } from '../../src/engines/game/index.js';
import { shouldTriggerStandbyPhase } from '../../src/engines/standby/index.js';

describe('Standby Phase', () => {
  it('triggers when player has bench units but fewer than 3 active units', () => {
    const unit1 = createUnit({ id: 'u1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    const benchUnit = createUnit({ id: 'bench1', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
    
    const activeUnit = createUnitInstance({ card: unit1, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 0 } });
    
    const p1 = createPlayer({
      id: 'p1',
      life: 24,
      isReady: true,
      units: [activeUnit],
      team: {
        activeUnits: [unit1],
        reserveUnits: [benchUnit], // Has bench units
        locked: true,
      },
      hand: { cards: [] }, // Within hand limit
      discardPile: { cards: [] },
    });
    const p2 = createPlayer({ id: 'p2', life: 24, isReady: true, units: [], team: { activeUnits: [], reserveUnits: [], locked: true } });

    const state = createGame([p1, p2]);
    if (!state.ok) {
      expect.fail('Failed to create game state');
      return;
    }

    // Start turn should trigger standby phase
    const newTurnState = startTurn(state.value);
    expect(newTurnState.turnPhase).toBe(TurnPhase.STANDBY);
  });

  it('triggers when player exceeds hand size limit', () => {
    const unit1 = createUnit({ id: 'u1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    const unit2 = createUnit({ id: 'u2', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
    const unit3 = createUnit({ id: 'u3', atk: 4, hp: 6, maxHp: 6, movement: 1, range: 1, cost: 5 });
    
    const activeUnit1 = createUnitInstance({ card: unit1, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 0 } });
    const activeUnit2 = createUnitInstance({ card: unit2, currentHp: 8, ownerId: 'p1', position: { x: 1, y: 0 } });
    const activeUnit3 = createUnitInstance({ card: unit3, currentHp: 6, ownerId: 'p1', position: { x: 2, y: 0 } });
    
    // Create player with 6 cards in mainDeck to simulate having too many cards
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

    // Simulate having one card over the hand limit
    let currentState = state.value;
    currentState.players[0]!.hand = { cards: [unit1, unit2, unit3, unit1, unit2] };
    
    // Set turnRotation to 1 to enable card drawing
    currentState = { ...currentState, turnRotation: 1 };

    // Start turn should draw one card and trigger standby phase
    const newTurnState = startTurn(currentState);
    expect(newTurnState.players[0]!.hand.cards.length).toBe(MAX_HAND_SIZE + 2);
    expect(newTurnState.turnPhase).toBe(TurnPhase.STANDBY);
  });

  it('triggers when both conditions are met', () => {
    const unit1 = createUnit({ id: 'u1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    const unit2 = createUnit({ id: 'u2', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
    const unit3 = createUnit({ id: 'u3', atk: 4, hp: 6, maxHp: 6, movement: 1, range: 1, cost: 5 });
    const benchUnit = createUnit({ id: 'bench1', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
    
    const activeUnit = createUnitInstance({ card: unit1, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 0 } });
    
    const p1 = createPlayer({
      id: 'p1',
      life: 24,
      isReady: true,
      units: [activeUnit], // Only 1 active unit
      team: {
        activeUnits: [unit1],
        reserveUnits: [benchUnit], // Has bench units
        locked: true,
      },
      hand: { cards: [unit1, unit2, unit3, unit1, unit2, unit3] }, // 6 cards (exceeds limit)
      discardPile: { cards: [] },
    });
    const p2 = createPlayer({ id: 'p2', life: 24, isReady: true, units: [], team: { activeUnits: [], reserveUnits: [], locked: true } });

    const state = createGame([p1, p2]);
    if (!state.ok) {
      expect.fail('Failed to create game state');
      return;
    }

    // Start turn should trigger standby phase
    const newTurnState = startTurn(state.value);
    expect(newTurnState.turnPhase).toBe(TurnPhase.STANDBY);
  });

  it('does not trigger when no conditions are met', () => {
    const unit1 = createUnit({ id: 'u1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    const unit2 = createUnit({ id: 'u2', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
    const unit3 = createUnit({ id: 'u3', atk: 4, hp: 6, maxHp: 6, movement: 1, range: 1, cost: 5 });
    
    const activeUnit1 = createUnitInstance({ card: unit1, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 0 } });
    const activeUnit2 = createUnitInstance({ card: unit2, currentHp: 8, ownerId: 'p1', position: { x: 1, y: 0 } });
    const activeUnit3 = createUnitInstance({ card: unit3, currentHp: 6, ownerId: 'p1', position: { x: 2, y: 0 } });
    
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
      hand: { cards: [unit1, unit2] }, // 2 cards (within limit)
      discardPile: { cards: [] },
    });
    const p2 = createPlayer({ id: 'p2', life: 24, isReady: true, units: [], team: { activeUnits: [], reserveUnits: [], locked: true } });

    const state = createGame([p1, p2]);
    if (!state.ok) {
      expect.fail('Failed to create game state');
      return;
    }

    // Start turn should NOT trigger standby phase
    const newTurnState = startTurn(state.value);
    expect(newTurnState.turnPhase).toBe(TurnPhase.MOVE);
  });

  it('exits standby phase after deploying bench unit', () => {
    const unit1 = createUnit({ id: 'u1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    const benchUnit = createUnit({ id: 'bench1', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
    
    const activeUnit = createUnitInstance({ card: unit1, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 0 } });
    
    const p1 = createPlayer({
      id: 'p1',
      life: 24,
      isReady: true,
      units: [activeUnit],
      team: {
        activeUnits: [unit1],
        reserveUnits: [benchUnit],
        locked: true,
      },
      hand: { cards: [] }, // Within hand limit
      discardPile: { cards: [] },
    });
    const p2 = createPlayer({ id: 'p2', life: 24, isReady: true, units: [], team: { activeUnits: [], reserveUnits: [], locked: true } });

    let board = createBoard();
    let r = placeUnit(board, 'p1-u1', { x: 0, y: 0 });
    if (r.ok) board = r.value;

    const state = createGame([p1, p2]);
    if (!state.ok) {
      expect.fail('Failed to create game state');
      return;
    }

    // Start turn triggers standby phase
    const newTurnState = startTurn({ ...state.value, board });
    expect(newTurnState.turnPhase).toBe(TurnPhase.STANDBY);

    // Deploy bench unit should exit standby phase
    const deployResult = deployReserve(newTurnState, 'p1', 'bench1', { x: 1, y: 0 });
    expect(deployResult.ok).toBe(true);
    if (deployResult.ok) {
      expect(deployResult.value.turnPhase).toBe(TurnPhase.MOVE);
    }
  });

  it('exits standby phase after discarding cards', () => {
    const unit1 = createUnit({ id: 'u1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    const unit2 = createUnit({ id: 'u2', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
    const unit3 = createUnit({ id: 'u3', atk: 4, hp: 6, maxHp: 6, movement: 1, range: 1, cost: 5 });
    
    const activeUnit1 = createUnitInstance({ card: unit1, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 0 } });
    const activeUnit2 = createUnitInstance({ card: unit2, currentHp: 8, ownerId: 'p1', position: { x: 1, y: 0 } });
    const activeUnit3 = createUnitInstance({ card: unit3, currentHp: 6, ownerId: 'p1', position: { x: 2, y: 0 } });
    
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
      mainDeck: { cards: [unit1, unit2, unit3] }, // 3 cards in deck
    });
    const p2 = createPlayer({ id: 'p2', life: 24, isReady: true, units: [], team: { activeUnits: [], reserveUnits: [], locked: true } });

    let board = createBoard();
    let r = placeUnit(board, 'p1-u1', { x: 0, y: 0 });
    if (r.ok) board = r.value;
    r = placeUnit(board, 'p1-u2', { x: 1, y: 0 });
    if (r.ok) board = r.value;
    r = placeUnit(board, 'p1-u3', { x: 2, y: 0 });
    if (r.ok) board = r.value;

    const state = createGame([p1, p2]);
    if (!state.ok) {
      expect.fail('Failed to create game state');
      return;
    }

    // Create unique cards for proper discard testing
    const unit4 = createUnit({ id: 'u4', atk: 1, hp: 5, maxHp: 5, movement: 2, range: 1, cost: 5 });
    const unit5 = createUnit({ id: 'u5', atk: 2, hp: 7, maxHp: 7, movement: 2, range: 1, cost: 5 });
    const unit6 = createUnit({ id: 'u6', atk: 3, hp: 9, maxHp: 9, movement: 2, range: 1, cost: 5 });

    // Simulate having 6 cards in hand (exceeds limit) and set turnRotation to 1
    let currentState = { ...state.value, board, turnRotation: 1 };
    currentState.players[0]!.hand = { cards: [unit1, unit2, unit3, unit4, unit5, unit6] }; // 6 unique cards

    // Start turn should trigger standby phase
    const newTurnState = startTurn(currentState);
    expect(newTurnState.turnPhase).toBe(TurnPhase.STANDBY);

    // Discard one card — still above MAX_HAND_SIZE.
    const discardResult1 = playCard(newTurnState, 'p1', 'u1');
    expect(discardResult1.ok).toBe(true);
    if (discardResult1.ok) {
      expect(discardResult1.value.turnPhase).toBe(TurnPhase.STANDBY);

      // Discard second card — hand size is valid, but summon step can still block standby exit.
      const discardResult2 = playCard(discardResult1.value, 'p1', 'u2');
      expect(discardResult2.ok).toBe(true);
      if (!discardResult2.ok) return;
      expect(discardResult2.value.players[0]!.hand.cards.length).toBe(MAX_HAND_SIZE);

      const advanceResult = advancePhase(discardResult2.value);
      expect(advanceResult.ok).toBe(false);
    }
  });

  it('correctly identifies standby phase status', () => {
    const unit1 = createUnit({ id: 'u1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    const unit2 = createUnit({ id: 'u2', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
    const unit3 = createUnit({ id: 'u3', atk: 4, hp: 6, maxHp: 6, movement: 1, range: 1, cost: 5 });
    const benchUnit = createUnit({ id: 'bench1', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
    
    const activeUnit = createUnitInstance({ card: unit1, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 0 } });
    
    const p1 = createPlayer({
      id: 'p1',
      life: 24,
      isReady: true,
      units: [activeUnit], // Only 1 active unit
      team: {
        activeUnits: [unit1],
        reserveUnits: [benchUnit], // Has bench units
        locked: true,
      },
      hand: { cards: [unit1, unit2, unit3, unit1, unit2, unit3] }, // 6 cards (exceeds limit)
      discardPile: { cards: [] },
    });

    const status = shouldTriggerStandbyPhase(p1);
    expect(status.isActive).toBe(true);
    expect(status.needsBenchDeployment).toBe(true);
    expect(status.needsHandDiscard).toBe(true);
    // With priority-based messaging, discard step shows first (step 1 before step 2)
    expect(status.message).toBe('Hand size exceeded. Please discard down to the maximum limit.');
    expect(status.canProgress).toBe(false);
  });

  it('requires summon-to-bench before standby can progress when summon is available', () => {
    const boardUnit1 = createUnit({ id: 'board1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    const boardUnit2 = createUnit({ id: 'board2', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
    const boardUnit3 = createUnit({ id: 'board3', atk: 4, hp: 6, maxHp: 6, movement: 1, range: 1, cost: 5 });
    const summonableHandUnit = createUnit({ id: 'hand-unit', atk: 2, hp: 7, maxHp: 7, movement: 2, range: 1, cost: 4 });
    const tooExpensiveHandUnit = createUnit({ id: 'hand-expensive', atk: 5, hp: 9, maxHp: 9, movement: 2, range: 1, cost: 30 });

    const activeUnit1 = createUnitInstance({ card: boardUnit1, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 0 } });
    const activeUnit2 = createUnitInstance({ card: boardUnit2, currentHp: 8, ownerId: 'p1', position: { x: 1, y: 0 } });
    const activeUnit3 = createUnitInstance({ card: boardUnit3, currentHp: 6, ownerId: 'p1', position: { x: 2, y: 0 } });

    const p1WithSummon = createPlayer({
      id: 'p1',
      life: 24,
      isReady: true,
      units: [activeUnit1, activeUnit2, activeUnit3],
      team: {
        activeUnits: [boardUnit1, boardUnit2, boardUnit3],
        reserveUnits: [],
        locked: true,
      },
      hand: { cards: [summonableHandUnit] },
      discardPile: { cards: [] },
    });

    const p1WithoutSummon = {
      ...p1WithSummon,
      hand: { cards: [tooExpensiveHandUnit] },
    };

    const statusWithSummon = shouldTriggerStandbyPhase(p1WithSummon);
    expect(statusWithSummon.canSummonToBench).toBe(true);
    expect(statusWithSummon.message).toBe('You must summon a unit from your hand to the bench (costs LP).');
    expect(statusWithSummon.canProgress).toBe(false);

    const statusWithoutSummon = shouldTriggerStandbyPhase(p1WithoutSummon);
    expect(statusWithoutSummon.canSummonToBench).toBe(false);
    expect(statusWithoutSummon.canProgress).toBe(true);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGameState,
  createPlayer,
  createUnit,
  createUnitInstance,
  createBoard,
  resetIdCounter,
} from '../factories.js';
import {
  startTurn,
  advancePhase,
  processMove,
  processAbility,
  processAttack,
  endTurn,
  deployReserve,
  checkReserveLocks,
} from '../../src/engines/turn/index.js';
import {
  TurnPhase,
  GamePhase,
} from '../../src/types/index.js';
import type { GameState, UnitInstance, Position } from '../../src/types/index.js';
import { placeUnit } from '../../src/engines/board/index.js';

function setupGameInProgress(): GameState {
  const unit1 = createUnit({ id: 'u1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
  const unit2 = createUnit({ id: 'u2', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
  const unit3 = createUnit({ id: 'u3', atk: 4, hp: 6, maxHp: 6, movement: 1, range: 1, cost: 5 });
  const unit4 = createUnit({ id: 'u4', atk: 3, hp: 7, maxHp: 7, movement: 2, range: 1, cost: 5 });
  const unit5 = createUnit({ id: 'u5', atk: 2, hp: 9, maxHp: 9, movement: 2, range: 1, cost: 5 });
  const unit6 = createUnit({ id: 'u6', atk: 5, hp: 5, maxHp: 5, movement: 1, range: 1, cost: 5 });

  const p1Units: UnitInstance[] = [
    createUnitInstance({ card: unit1, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 0 } }),
    createUnitInstance({ card: unit2, currentHp: 8, ownerId: 'p1', position: { x: 1, y: 0 } }),
    createUnitInstance({ card: unit3, currentHp: 6, ownerId: 'p1', position: { x: 2, y: 0 } }),
  ];

  const p2Units: UnitInstance[] = [
    createUnitInstance({ card: unit4, currentHp: 7, ownerId: 'p2', position: { x: 0, y: 29 } }),
    createUnitInstance({ card: unit5, currentHp: 9, ownerId: 'p2', position: { x: 1, y: 29 } }),
    createUnitInstance({ card: unit6, currentHp: 5, ownerId: 'p2', position: { x: 2, y: 29 } }),
  ];

  const p1 = createPlayer({
    id: 'p1',
    life: 24,
    isReady: true,
    units: p1Units,
    team: {
      activeUnits: [unit1, unit2, unit3],
      reserveUnits: [],
      locked: true,
    },
  });

  const p2 = createPlayer({
    id: 'p2',
    life: 24,
    isReady: true,
    units: p2Units,
    team: {
      activeUnits: [unit4, unit5, unit6],
      reserveUnits: [],
      locked: true,
    },
  });

  let board = createBoard();
  for (const u of p1Units) {
    if (u.position) {
      const r = placeUnit(board, u.card.id, u.position);
      if (r.ok) board = r.value;
    }
  }
  for (const u of p2Units) {
    if (u.position) {
      const r = placeUnit(board, u.card.id, u.position);
      if (r.ok) board = r.value;
    }
  }

  return createGameState({
    phase: GamePhase.IN_PROGRESS,
    turnPhase: TurnPhase.MOVE,
    currentPlayerIndex: 0,
    players: [p1, p2],
    board,
    turnNumber: 1,
    turnRotation: 0,
    movesUsedThisTurn: 0,
  });
}

describe('TurnEngine', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('startTurn', () => {
    it('returns state in MOVE phase for current player', () => {
      const state = setupGameInProgress();
      const result = startTurn(state);
      expect(result.turnPhase).toBe(TurnPhase.MOVE);
      expect(result.movesUsedThisTurn).toBe(0);
    });
  });

  describe('advancePhase', () => {
    it('MOVE → ABILITY — valid', () => {
      const state = setupGameInProgress();
      const result = advancePhase(state);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.turnPhase).toBe(TurnPhase.ABILITY);
      }
    });

    it('ABILITY → ATTACK — valid', () => {
      const state = { ...setupGameInProgress(), turnPhase: TurnPhase.ABILITY };
      const result = advancePhase(state);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.turnPhase).toBe(TurnPhase.ATTACK);
      }
    });

    it('ATTACK → END — valid', () => {
      const state = { ...setupGameInProgress(), turnPhase: TurnPhase.ATTACK };
      const result = advancePhase(state);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.turnPhase).toBe(TurnPhase.END);
      }
    });

    it('END phase — cannot advance further (use endTurn)', () => {
      const state = { ...setupGameInProgress(), turnPhase: TurnPhase.END };
      const result = advancePhase(state);
      expect(result.ok).toBe(false);
    });
  });

  describe('processMove', () => {
    it('valid unit and target — unit moves, move count incremented', () => {
      const state = setupGameInProgress();
      const result = processMove(state, 'p1', 'u1', { x: 0, y: 1 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.movesUsedThisTurn).toBe(1);
      }
    });

    it('3 moves already used — returns error', () => {
      const state = { ...setupGameInProgress(), movesUsedThisTurn: 3 };
      const result = processMove(state, 'p1', 'u1', { x: 0, y: 1 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('maximum');
      }
    });

    it('unit not owned by current player — returns error', () => {
      const state = setupGameInProgress();
      const result = processMove(state, 'p1', 'u4', { x: 0, y: 28 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('own');
      }
    });

    it('not in MOVE phase — returns error', () => {
      const state = { ...setupGameInProgress(), turnPhase: TurnPhase.ATTACK };
      const result = processMove(state, 'p1', 'u1', { x: 0, y: 1 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('MOVE');
      }
    });
  });

  describe('processAbility', () => {
    it('valid ability use — resolves and tracks usage', () => {
      const state = { ...setupGameInProgress(), turnPhase: TurnPhase.ABILITY };
      const result = processAbility(state, 'p1', 'u1', 'u4');
      expect(result.ok).toBe(true);
      if (result.ok) {
        const unit = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
        expect(unit?.hasUsedAbilityThisTurn).toBe(true);
      }
    });

    it('ability already used this turn — returns error', () => {
      const state = { ...setupGameInProgress(), turnPhase: TurnPhase.ABILITY };
      const p1 = state.players[0]!;
      const updatedUnits = p1.units.map((u: UnitInstance) =>
        u.card.id === 'u1' ? { ...u, hasUsedAbilityThisTurn: true } : u
      );
      const updatedState = {
        ...state,
        players: [{ ...p1, units: updatedUnits }, state.players[1]!],
      };

      const result = processAbility(updatedState, 'p1', 'u1', 'u4');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('already used');
      }
    });

    it('not in ABILITY phase — returns error', () => {
      const state = { ...setupGameInProgress(), turnPhase: TurnPhase.MOVE };
      const result = processAbility(state, 'p1', 'u1', 'u4');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('ABILITY');
      }
    });
  });

  describe('processAttack', () => {
    it('valid attack — resolves combat, marks unit as acted', () => {
      const state = setupGameInProgress();
      // Place attacker adjacent to defender
      const p1 = state.players[0]!;
      const p2 = state.players[1]!;
      const updatedP1Units = p1.units.map((u: UnitInstance) =>
        u.card.id === 'u1' ? { ...u, position: { x: 0, y: 28 } as Position } : u
      );
      let board = createBoard();
      // Place all units on the board
      for (const u of updatedP1Units) {
        if (u.position) {
          const r = placeUnit(board, u.card.id, u.position);
          if (r.ok) board = r.value;
        }
      }
      for (const u of p2.units) {
        if (u.position) {
          const r = placeUnit(board, u.card.id, u.position);
          if (r.ok) board = r.value;
        }
      }
      const attackState = {
        ...state,
        turnPhase: TurnPhase.ATTACK,
        players: [{ ...p1, units: updatedP1Units }, p2],
        board,
      };

      const result = processAttack(attackState, 'p1', 'u1', 'u4');
      expect(result.ok).toBe(true);
      if (result.ok) {
        const unit = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
        expect(unit?.hasAttackedThisTurn).toBe(true);
      }
    });

    it('unit already attacked this turn — returns error', () => {
      const state = { ...setupGameInProgress(), turnPhase: TurnPhase.ATTACK };
      const p1 = state.players[0]!;
      const updatedUnits = p1.units.map((u: UnitInstance) =>
        u.card.id === 'u1' ? { ...u, hasAttackedThisTurn: true } : u
      );
      const updatedState = {
        ...state,
        players: [{ ...p1, units: updatedUnits }, state.players[1]!],
      };

      const result = processAttack(updatedState, 'p1', 'u1', 'u4');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('already attacked');
      }
    });

    it('not in ATTACK phase — returns error', () => {
      const state = { ...setupGameInProgress(), turnPhase: TurnPhase.MOVE };
      const result = processAttack(state, 'p1', 'u1', 'u4');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('ATTACK');
      }
    });
  });

  describe('endTurn', () => {
    it('advances to next player', () => {
      const state = { ...setupGameInProgress(), turnPhase: TurnPhase.END };
      const result = endTurn(state);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.currentPlayerIndex).toBe(1);
        expect(result.value.turnPhase).toBe(TurnPhase.MOVE);
      }
    });

    it('last player in rotation — wraps to first player, increments rotation', () => {
      const state = {
        ...setupGameInProgress(),
        turnPhase: TurnPhase.END,
        currentPlayerIndex: 1,
        turnRotation: 0,
      };
      const result = endTurn(state);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.currentPlayerIndex).toBe(0);
        expect(result.value.turnRotation).toBe(1);
        expect(result.value.turnNumber).toBe(2);
      }
    });
  });

  describe('reserve deployment', () => {
    it('unit died during opponent turn — reserve available', () => {
      const reserveUnit = createUnit({ id: 'r1', cost: 3 });
      const state = setupGameInProgress();
      const p1 = {
        ...state.players[0]!,
        team: {
          ...state.players[0]!.team,
          reserveUnits: [reserveUnit],
        },
        reserveLockedUntilNextTurn: false,
      };
      const updatedState = {
        ...state,
        players: [p1, state.players[1]!],
        turnPhase: TurnPhase.MOVE,
        currentPlayerIndex: 0,
      };

      const result = deployReserve(updatedState, 'p1', 'r1', { x: 3, y: 0 });
      expect(result.ok).toBe(true);
    });

    it('unit died during owner turn — reserve locked', () => {
      const reserveUnit = createUnit({ id: 'r1', cost: 3 });
      const state = setupGameInProgress();
      const p1 = {
        ...state.players[0]!,
        team: {
          ...state.players[0]!.team,
          reserveUnits: [reserveUnit],
        },
        reserveLockedUntilNextTurn: true,
      };
      const updatedState = {
        ...state,
        players: [p1, state.players[1]!],
        turnPhase: TurnPhase.MOVE,
        currentPlayerIndex: 0,
      };

      const result = deployReserve(updatedState, 'p1', 'r1', { x: 3, y: 0 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('locked');
      }
    });

    it('no reserves available — returns error', () => {
      const state = setupGameInProgress();
      const result = deployReserve(state, 'p1', 'r1', { x: 3, y: 0 });
      expect(result.ok).toBe(false);
    });
  });

  describe('checkReserveLocks', () => {
    it('new turn starts — clears locks from previous turn', () => {
      const state = setupGameInProgress();
      const p1 = { ...state.players[0]!, reserveLockedUntilNextTurn: true };
      const updatedState = {
        ...state,
        players: [p1, state.players[1]!],
      };

      const result = checkReserveLocks(updatedState, 'p1');
      expect(result.players[0]!.reserveLockedUntilNextTurn).toBe(false);
    });
  });
});

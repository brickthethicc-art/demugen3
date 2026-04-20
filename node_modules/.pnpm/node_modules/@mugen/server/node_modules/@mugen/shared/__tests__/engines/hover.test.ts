import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGameState,
  createPlayer,
  createUnit,
  createUnitInstance,
  createBoard,
  resetIdCounter,
} from '../factories.js';
import { resolveHoveredUnit } from '../../src/engines/board/hover.js';
import { placeUnit } from '../../src/engines/board/index.js';
import { GamePhase, TurnPhase } from '../../src/types/index.js';
import type { GameState, UnitInstance } from '../../src/types/index.js';

function setupStateWithUnits(): GameState {
  const unit1 = createUnit({ id: 'u1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
  const unit2 = createUnit({ id: 'u2', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });

  const p1Units: UnitInstance[] = [
    createUnitInstance({ card: unit1, currentHp: 10, ownerId: 'p1', position: { x: 3, y: 4 } }),
    createUnitInstance({ card: unit2, currentHp: 8, ownerId: 'p1', position: { x: 5, y: 5 } }),
  ];

  const p1 = createPlayer({
    id: 'p1',
    life: 24,
    isReady: true,
    units: p1Units,
    team: { activeUnits: [unit1, unit2], reserveUnits: [], locked: true },
  });

  let board = createBoard();
  for (const u of p1Units) {
    if (u.position) {
      const r = placeUnit(board, u.card.id, u.position);
      if (r.ok) board = r.value;
    }
  }

  return createGameState({
    phase: GamePhase.IN_PROGRESS,
    turnPhase: TurnPhase.MOVE,
    currentPlayerIndex: 0,
    players: [p1],
    board,
  });
}

describe('resolveHoveredUnit', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('occupied cell — returns UnitInstance', () => {
    const state = setupStateWithUnits();
    const result = resolveHoveredUnit(state, { x: 3, y: 4 });
    expect(result).not.toBeNull();
    expect(result!.card.id).toBe('u1');
    expect(result!.currentHp).toBe(10);
  });

  it('different occupied cell — returns correct unit', () => {
    const state = setupStateWithUnits();
    const result = resolveHoveredUnit(state, { x: 5, y: 5 });
    expect(result).not.toBeNull();
    expect(result!.card.id).toBe('u2');
  });

  it('empty cell — returns null', () => {
    const state = setupStateWithUnits();
    const result = resolveHoveredUnit(state, { x: 0, y: 0 });
    expect(result).toBeNull();
  });

  it('out of bounds — returns null', () => {
    const state = setupStateWithUnits();
    const result = resolveHoveredUnit(state, { x: -1, y: 0 });
    expect(result).toBeNull();
  });

  it('out of bounds high — returns null', () => {
    const state = setupStateWithUnits();
    const result = resolveHoveredUnit(state, { x: 30, y: 30 });
    expect(result).toBeNull();
  });

  it('null game state board occupant — returns null', () => {
    const state = setupStateWithUnits();
    // Position that is in bounds but has no unit
    const result = resolveHoveredUnit(state, { x: 15, y: 15 });
    expect(result).toBeNull();
  });
});

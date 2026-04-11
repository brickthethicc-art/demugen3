import { describe, it, expect, beforeEach } from 'vitest';
import { resetIdCounter } from '../factories.js';
import {
  createBoardState,
  placeUnit,
  removeUnit,
  moveUnit,
  getValidMoves,
  getUnitAt,
  getUnitsForPlayer,
} from '../../src/engines/board/index.js';
import { DEFAULT_BOARD_WIDTH, DEFAULT_BOARD_HEIGHT } from '../../src/types/index.js';
import type { Position } from '../../src/types/index.js';

describe('BoardEngine', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('createBoardState', () => {
    it('default size — returns 23x23 empty grid', () => {
      const board = createBoardState();
      expect(board.width).toBe(DEFAULT_BOARD_WIDTH);
      expect(board.height).toBe(DEFAULT_BOARD_HEIGHT);
      expect(board.cells).toHaveLength(DEFAULT_BOARD_HEIGHT);
      expect(board.cells[0]).toHaveLength(DEFAULT_BOARD_WIDTH);
    });

    it('custom size — returns NxM grid', () => {
      const board = createBoardState(10, 12);
      expect(board.width).toBe(10);
      expect(board.height).toBe(12);
      expect(board.cells).toHaveLength(12);
      expect(board.cells[0]).toHaveLength(10);
    });
  });

  describe('placeUnit', () => {
    it('empty cell — places unit, returns updated board', () => {
      const board = createBoardState();
      const pos: Position = { x: 3, y: 4 };
      const result = placeUnit(board, 'unit-1', pos);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.cells[4]![3]!.occupantId).toBe('unit-1');
      }
    });

    it('occupied cell — returns error', () => {
      let board = createBoardState();
      const pos: Position = { x: 3, y: 4 };
      const first = placeUnit(board, 'unit-1', pos);
      expect(first.ok).toBe(true);
      if (first.ok) {
        board = first.value;
      }
      const result = placeUnit(board, 'unit-2', pos);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('occupied');
      }
    });

    it('out of bounds — returns error', () => {
      const board = createBoardState();
      const pos: Position = { x: 23, y: 23 };
      const result = placeUnit(board, 'unit-1', pos);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('bounds');
      }
    });

    it('valid placement at (22,22) — boundary of 23x23 grid', () => {
      const board = createBoardState(23, 23);
      const pos: Position = { x: 22, y: 22 };
      const result = placeUnit(board, 'unit-1', pos);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.cells[22]![22]!.occupantId).toBe('unit-1');
      }
    });

    it('negative coordinates — returns error', () => {
      const board = createBoardState();
      const pos: Position = { x: -1, y: 0 };
      const result = placeUnit(board, 'unit-1', pos);
      expect(result.ok).toBe(false);
    });
  });

  describe('removeUnit', () => {
    it('unit exists — removes and returns updated board', () => {
      let board = createBoardState();
      const pos: Position = { x: 2, y: 2 };
      const placed = placeUnit(board, 'unit-1', pos);
      expect(placed.ok).toBe(true);
      if (placed.ok) board = placed.value;

      const result = removeUnit(board, pos);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.cells[2]![2]!.occupantId).toBeNull();
      }
    });

    it('no unit at position — returns error', () => {
      const board = createBoardState();
      const pos: Position = { x: 2, y: 2 };
      const result = removeUnit(board, pos);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('No unit');
      }
    });
  });

  describe('moveUnit', () => {
    it('valid move within range — updates position', () => {
      let board = createBoardState();
      const from: Position = { x: 2, y: 2 };
      const to: Position = { x: 3, y: 3 };
      const placed = placeUnit(board, 'unit-1', from);
      if (placed.ok) board = placed.value;

      const result = moveUnit(board, from, to, 2);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.cells[2]![2]!.occupantId).toBeNull();
        expect(result.value.cells[3]![3]!.occupantId).toBe('unit-1');
      }
    });

    it('target occupied — returns error', () => {
      let board = createBoardState();
      const from: Position = { x: 2, y: 2 };
      const to: Position = { x: 3, y: 3 };
      let placed = placeUnit(board, 'unit-1', from);
      if (placed.ok) board = placed.value;
      placed = placeUnit(board, 'unit-2', to);
      if (placed.ok) board = placed.value;

      const result = moveUnit(board, from, to, 2);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('occupied');
      }
    });

    it('target out of range — returns error', () => {
      let board = createBoardState();
      const from: Position = { x: 0, y: 0 };
      const to: Position = { x: 5, y: 5 };
      const placed = placeUnit(board, 'unit-1', from);
      if (placed.ok) board = placed.value;

      const result = moveUnit(board, from, to, 2);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('range');
      }
    });

    it('target out of bounds — returns error', () => {
      let board = createBoardState();
      const from: Position = { x: 22, y: 22 };
      const to: Position = { x: 23, y: 23 };
      const placed = placeUnit(board, 'unit-1', from);
      if (placed.ok) board = placed.value;

      const result = moveUnit(board, from, to, 2);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('bounds');
      }
    });

    it('move to boundary edge (21,22) -> (22,22) — valid', () => {
      let board = createBoardState(23, 23);
      const from: Position = { x: 21, y: 22 };
      const to: Position = { x: 22, y: 22 };
      const placed = placeUnit(board, 'unit-1', from);
      if (placed.ok) board = placed.value;

      const result = moveUnit(board, from, to, 1);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.cells[22]![22]!.occupantId).toBe('unit-1');
      }
    });
  });

  describe('getValidMoves', () => {
    it('unit with movement 2 — returns all reachable cells', () => {
      let board = createBoardState();
      const pos: Position = { x: 4, y: 4 };
      const placed = placeUnit(board, 'unit-1', pos);
      if (placed.ok) board = placed.value;

      const moves = getValidMoves(board, pos, 2);
      expect(moves.length).toBeGreaterThan(0);
      moves.forEach((m: Position) => {
        const dist = Math.abs(m.x - pos.x) + Math.abs(m.y - pos.y);
        expect(dist).toBeGreaterThan(0);
        expect(dist).toBeLessThanOrEqual(2);
      });
    });

    it('unit blocked by other units — excludes occupied cells', () => {
      let board = createBoardState();
      const pos: Position = { x: 4, y: 4 };
      const blockerPos: Position = { x: 5, y: 4 };
      let placed = placeUnit(board, 'unit-1', pos);
      if (placed.ok) board = placed.value;
      placed = placeUnit(board, 'unit-2', blockerPos);
      if (placed.ok) board = placed.value;

      const moves = getValidMoves(board, pos, 2);
      const hasBlocker = moves.some(
        (m: Position) => m.x === blockerPos.x && m.y === blockerPos.y
      );
      expect(hasBlocker).toBe(false);
    });

    it('unit at corner — only valid board positions returned', () => {
      let board = createBoardState();
      const pos: Position = { x: 0, y: 0 };
      const placed = placeUnit(board, 'unit-1', pos);
      if (placed.ok) board = placed.value;

      const moves = getValidMoves(board, pos, 2);
      moves.forEach((m: Position) => {
        expect(m.x).toBeGreaterThanOrEqual(0);
        expect(m.y).toBeGreaterThanOrEqual(0);
        expect(m.x).toBeLessThan(DEFAULT_BOARD_WIDTH);
        expect(m.y).toBeLessThan(DEFAULT_BOARD_HEIGHT);
      });
    });
  });

  describe('getUnitAt', () => {
    it('position with unit — returns unit id', () => {
      let board = createBoardState();
      const pos: Position = { x: 3, y: 3 };
      const placed = placeUnit(board, 'unit-1', pos);
      if (placed.ok) board = placed.value;

      expect(getUnitAt(board, pos)).toBe('unit-1');
    });

    it('empty position — returns null', () => {
      const board = createBoardState();
      const pos: Position = { x: 3, y: 3 };
      expect(getUnitAt(board, pos)).toBeNull();
    });
  });

  describe('getUnitsForPlayer', () => {
    it('returns all unit positions for a player', () => {
      let board = createBoardState();
      const positions: Position[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ];
      for (const pos of positions) {
        const placed = placeUnit(board, `player1-unit-${pos.x}`, pos);
        if (placed.ok) board = placed.value;
      }
      const placed = placeUnit(board, 'player2-unit-0', { x: 5, y: 5 });
      if (placed.ok) board = placed.value;

      const units = getUnitsForPlayer(board, 'player1');
      expect(units).toHaveLength(3);
      units.forEach((u: { unitId: string; position: Position }) => {
        expect(u.unitId).toContain('player1');
      });
    });
  });
});

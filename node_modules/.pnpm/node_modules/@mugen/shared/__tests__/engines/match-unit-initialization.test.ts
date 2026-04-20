import { describe, it, expect, beforeEach } from 'vitest';
import { resetIdCounter, createUnit, createPlayer, createGameState } from '../factories.js';
import { assignActiveAndBenchUnits, initializePlayerBoardState } from '../../src/engines/starting-placement/assignment.js';
import { initializeMatchUnits } from '../../src/engines/starting-placement/match-init.js';
import { getSpawnPositions, getReservePositions } from '../../src/engines/starting-placement/index.js';
import { GamePhase, ACTIVE_UNIT_COUNT, RESERVE_UNIT_COUNT } from '../../src/types/index.js';
import type { UnitCard, GameState } from '../../src/types/index.js';

function makeUnits(count: number, costEach = 5): UnitCard[] {
  return Array.from({ length: count }, (_, i) =>
    createUnit({ id: `unit-${i}`, name: `Unit ${i}`, cost: costEach })
  );
}

// ─────────────────────────────────────────────────────────────
// UNIT TESTS — assignActiveAndBenchUnits
// ─────────────────────────────────────────────────────────────
describe('assignActiveAndBenchUnits', () => {
  beforeEach(() => resetIdCounter());

  it('splits 6 units into 3 active + 3 bench', () => {
    const units = makeUnits(6);
    const { active, bench } = assignActiveAndBenchUnits(units);
    expect(active).toHaveLength(ACTIVE_UNIT_COUNT);
    expect(bench).toHaveLength(RESERVE_UNIT_COUNT);
  });

  it('preserves all units — no duplication or loss', () => {
    const units = makeUnits(6);
    const { active, bench } = assignActiveAndBenchUnits(units);
    const all = [...active, ...bench];
    expect(all).toHaveLength(6);
    // Every original unit must appear exactly once
    for (const u of units) {
      expect(all.filter(a => a.id === u.id)).toHaveLength(1);
    }
  });

  it('active and bench sets are disjoint', () => {
    const units = makeUnits(6);
    const { active, bench } = assignActiveAndBenchUnits(units);
    const activeIds = new Set(active.map(u => u.id));
    for (const b of bench) {
      expect(activeIds.has(b.id)).toBe(false);
    }
  });

  it('throws for fewer than 6 units', () => {
    expect(() => assignActiveAndBenchUnits(makeUnits(5))).toThrow();
  });

  it('throws for more than 6 units', () => {
    expect(() => assignActiveAndBenchUnits(makeUnits(7))).toThrow();
  });

  it('throws for 0 units', () => {
    expect(() => assignActiveAndBenchUnits([])).toThrow();
  });

  it('handles units with duplicate ids by preserving reference identity', () => {
    const base = createUnit({ id: 'dup', cost: 5 });
    const units = Array.from({ length: 6 }, () => ({ ...base }));
    // Should still split without error — duplication is caller's concern
    const { active, bench } = assignActiveAndBenchUnits(units);
    expect(active).toHaveLength(3);
    expect(bench).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────
// UNIT TESTS — initializePlayerBoardState
// ─────────────────────────────────────────────────────────────
describe('initializePlayerBoardState', () => {
  beforeEach(() => resetIdCounter());

  it('creates 3 UnitInstances with correct positions', () => {
    const units = makeUnits(3);
    const positions = [{ x: 7, y: 5 }, { x: 7, y: 7 }, { x: 7, y: 9 }];
    const instances = initializePlayerBoardState('p1', units, positions);

    expect(instances).toHaveLength(3);
    instances.forEach((inst, i) => {
      expect(inst.card).toBe(units[i]);
      expect(inst.position).toEqual(positions[i]);
      expect(inst.ownerId).toBe('p1');
      expect(inst.currentHp).toBe(units[i]!.hp);
      expect(inst.hasMovedThisTurn).toBe(false);
      expect(inst.hasAttackedThisTurn).toBe(false);
      expect(inst.hasUsedAbilityThisTurn).toBe(false);
      expect(inst.combatModifiers).toEqual([]);
    });
  });

  it('throws when units count ≠ 3', () => {
    expect(() => initializePlayerBoardState('p1', makeUnits(2), [{ x: 0, y: 0 }, { x: 1, y: 0 }])).toThrow();
  });

  it('throws when positions count ≠ 3', () => {
    expect(() => initializePlayerBoardState('p1', makeUnits(3), [{ x: 0, y: 0 }])).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// INTEGRATION TESTS — initializeMatchUnits (NEW)
// ─────────────────────────────────────────────────────────────
describe('initializeMatchUnits', () => {
  beforeEach(() => resetIdCounter());

  function lockedGameState(): GameState {
    const units = makeUnits(6);
    const p1 = createPlayer({
      id: 'p1',
      team: {
        activeUnits: units.slice(0, 3),
        reserveUnits: units.slice(3),
        locked: true,
      },
      units: [],
    });
    const p2Units = makeUnits(6).map((u, i) => ({ ...u, id: `p2-unit-${i}` }));
    const p2 = createPlayer({
      id: 'p2',
      team: {
        activeUnits: p2Units.slice(0, 3),
        reserveUnits: p2Units.slice(3),
        locked: true,
      },
      units: [],
    });
    return createGameState({
      phase: GamePhase.PRE_GAME,
      players: [p1, p2],
    });
  }

  it('returns ok for a valid locked game state', () => {
    const result = initializeMatchUnits(lockedGameState());
    expect(result.ok).toBe(true);
  });

  it('active units are placed on the grid (position on board)', () => {
    const result = initializeMatchUnits(lockedGameState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const player of result.value.players) {
      // Active unit instances must have positions on the main board (0 <= x < width, 0 <= y < height)
      const activeInstances = player.units.filter(u => 
        u.position !== null && 
        u.position!.x >= 0 && 
        u.position!.x < result.value.board.width &&
        u.position!.y >= 0 && 
        u.position!.y < result.value.board.height
      );
      expect(activeInstances).toHaveLength(ACTIVE_UNIT_COUNT);
    }
  });

  it('benched units are positioned in reserve area (NOT on main grid)', () => {
    const result = initializeMatchUnits(lockedGameState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    result.value.players.forEach((player, idx) => {
      // Reserve unit instances should have positions outside the main grid
      const benchInstances = player.units.filter(u => u.position !== null && 
        (u.position!.x < 0 || u.position!.x >= result.value.board.width));
      expect(benchInstances).toHaveLength(RESERVE_UNIT_COUNT);

      // Verify positions match getReservePositions
      const expectedPositions = getReservePositions(idx, result.value.board.width, result.value.board.height);
      benchInstances.forEach((instance, i) => {
        expect(instance.position).toEqual(expectedPositions[i]);
      });
    });
  });

  it('total unit count per player = 6 (3 active + 3 bench)', () => {
    const result = initializeMatchUnits(lockedGameState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const player of result.value.players) {
      expect(player.units).toHaveLength(6);
    }
  });

  it('team.activeUnits and team.reserveUnits remain correctly set', () => {
    const result = initializeMatchUnits(lockedGameState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const player of result.value.players) {
      expect(player.team.activeUnits).toHaveLength(ACTIVE_UNIT_COUNT);
      expect(player.team.reserveUnits).toHaveLength(RESERVE_UNIT_COUNT);
      expect(player.team.locked).toBe(true);
    }
  });

  it('active unit positions match getSpawnPositions for each player index', () => {
    const gs = lockedGameState();
    const result = initializeMatchUnits(gs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    result.value.players.forEach((player, idx) => {
      const expectedPos = getSpawnPositions(idx, gs.board.width, gs.board.height);
      const activeInstances = player.units.filter(u => 
        u.position !== null && 
        u.position!.x >= 0 && 
        u.position!.x < gs.board.width);
      activeInstances.forEach((inst, i) => {
        expect(inst.position).toEqual(expectedPos[i]);
      });
    });
  });

  it('bench unit positions match getReservePositions for each player index', () => {
    const gs = lockedGameState();
    const result = initializeMatchUnits(gs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    result.value.players.forEach((player, idx) => {
      const expectedPos = getReservePositions(idx, gs.board.width, gs.board.height);
      const benchInstances = player.units.filter(u => 
        u.position !== null && 
        (u.position!.x < 0 || u.position!.x >= gs.board.width));
      benchInstances.forEach((inst, i) => {
        expect(inst.position).toEqual(expectedPos[i]);
      });
    });
  });

  it('board cells are updated with active unit occupants (NOT bench units)', () => {
    const result = initializeMatchUnits(lockedGameState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { board, players } = result.value;
    for (const player of players) {
      // Only active units should be on the board
      const placed = player.units.filter(u => 
        u.position !== null && 
        u.position!.x >= 0 && 
        u.position!.x < board.width);
      for (const inst of placed) {
        const cell = board.cells[inst.position!.y]?.[inst.position!.x];
        expect(cell).toBeDefined();
        expect(cell!.occupantId).toBe(`${inst.ownerId}-${inst.card.id}`);
      }
      // Bench units should NOT be on the board
      const benchUnits = player.units.filter(u => 
        u.position !== null && 
        (u.position!.x < 0 || u.position!.x >= board.width));
      for (const inst of benchUnits) {
        if (inst.position!.x >= 0 && inst.position!.x < board.width && 
            inst.position!.y >= 0 && inst.position!.y < board.height) {
          const cell = board.cells[inst.position!.y]?.[inst.position!.x];
          expect(cell?.occupantId).toBeNull();
        }
      }
    }
  });

  it('no two units share the same grid cell (including reserve area)', () => {
    const result = initializeMatchUnits(lockedGameState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const allPositions = result.value.players.flatMap(p =>
      p.units.filter(u => u.position !== null).map(u => `${u.position!.x},${u.position!.y}`)
    );
    const unique = new Set(allPositions);
    expect(unique.size).toBe(allPositions.length);
  });

  it('transitions game phase to IN_PROGRESS', () => {
    const result = initializeMatchUnits(lockedGameState());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.phase).toBe(GamePhase.IN_PROGRESS);
  });

  // ── Edge cases ──

  it('fails if any player team is NOT locked', () => {
    const gs = lockedGameState();
    gs.players[0]!.team.locked = false;
    const result = initializeMatchUnits(gs);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('locked');
    }
  });

  it('fails if a player has fewer than 3 active units', () => {
    const gs = lockedGameState();
    gs.players[0]!.team.activeUnits = makeUnits(2);
    const result = initializeMatchUnits(gs);
    expect(result.ok).toBe(false);
  });

  it('fails if game phase is not PRE_GAME', () => {
    const gs = lockedGameState();
    (gs as any).phase = GamePhase.LOBBY;
    const result = initializeMatchUnits(gs);
    expect(result.ok).toBe(false);
  });

  it('does not mutate the input game state', () => {
    const gs = lockedGameState();
    const snapshot = JSON.parse(JSON.stringify(gs));
    initializeMatchUnits(gs);
    expect(gs).toEqual(snapshot);
  });
});

// ─────────────────────────────────────────────────────────────
// GRID BEHAVIOR — position correctness per player side
// ─────────────────────────────────────────────────────────────
describe('Grid placement per player side', () => {
  it('player 0 (index 0, Bottom) positions are on bottom rows', () => {
    const positions = getSpawnPositions(0, 30, 30);
    positions.forEach(p => expect(p.y).toBeGreaterThanOrEqual(26)); // 30 - 4
  });

  it('player 1 (index 1, Top) positions are on top rows', () => {
    const positions = getSpawnPositions(1, 30, 30);
    positions.forEach(p => expect(p.y).toBeLessThanOrEqual(3));
  });

  it('player 2 (index 2, Left) positions are on left columns', () => {
    const positions = getSpawnPositions(2, 30, 30);
    positions.forEach(p => expect(p.x).toBeLessThanOrEqual(3));
  });

  it('player 3 (index 3, Right) positions are on right columns', () => {
    const positions = getSpawnPositions(3, 30, 30);
    positions.forEach(p => expect(p.x).toBeGreaterThanOrEqual(26)); // 30 - 4
  });

  it('all starting positions are within board bounds', () => {
    for (let idx = 0; idx < 4; idx++) {
      const positions = getSpawnPositions(idx, 30, 30);
      positions.forEach(p => {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThan(30);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThan(30);
      });
    }
  });

  it('positions for the same player are all unique (no overlap)', () => {
    for (let idx = 0; idx < 4; idx++) {
      const positions = getSpawnPositions(idx, 30, 30);
      const keys = positions.map(p => `${p.x},${p.y}`);
      expect(new Set(keys).size).toBe(3);
    }
  });

  it('positions for different players do not overlap', () => {
    const all: string[] = [];
    for (let idx = 0; idx < 4; idx++) {
      const positions = getSpawnPositions(idx, 30, 30);
      all.push(...positions.map(p => `${p.x},${p.y}`));
    }
    expect(new Set(all).size).toBe(all.length);
  });
});

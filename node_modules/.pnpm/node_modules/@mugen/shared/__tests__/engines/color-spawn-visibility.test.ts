import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetIdCounter,
  createUnit,
  createPlayer,
  createGameState,
} from '../factories.js';
import { GamePhase } from '../../src/types/index.js';
import type { GameState, PlayerState, UnitCard } from '../../src/types/index.js';
import {
  PLAYER_COLOR_MAP,
  assignPlayerColors,
} from '../../src/engines/player-color/index.js';
import {
  getSpawnPositions,
} from '../../src/engines/starting-placement/index.js';
import {
  getVisibleUnits,
} from '../../src/engines/visibility/index.js';
import { initializeMatchUnits } from '../../src/engines/starting-placement/match-init.js';

// ─── Helpers ────────────────────────────────────────────────────────

function makeActiveUnits(): UnitCard[] {
  return [
    createUnit({ name: 'Knight', cost: 5 }),
    createUnit({ name: 'Archer', cost: 4 }),
    createUnit({ name: 'Mage', cost: 6 }),
  ];
}

function makeReserveUnits(): UnitCard[] {
  return [
    createUnit({ name: 'Healer', cost: 3 }),
    createUnit({ name: 'Tank', cost: 7 }),
    createUnit({ name: 'Scout', cost: 2 }),
  ];
}

function makeLockedPlayer(id: string): PlayerState {
  return createPlayer({
    id,
    team: { activeUnits: makeActiveUnits(), reserveUnits: makeReserveUnits(), locked: true },
    units: [],
  });
}

function makePreGameState(playerCount: number): GameState {
  const players: PlayerState[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push(makeLockedPlayer(`player-${i + 1}`));
  }
  return createGameState({
    phase: GamePhase.PRE_GAME,
    players,
  });
}

// ═══════════════════════════════════════════════════════════════════
// 1. PLAYER COLOR SYSTEM
// ═══════════════════════════════════════════════════════════════════

describe('Player Color System', () => {
  beforeEach(() => resetIdCounter());

  describe('PLAYER_COLOR_MAP', () => {
    it('maps player index 0 → red', () => {
      expect(PLAYER_COLOR_MAP[0]).toBe('red');
    });

    it('maps player index 1 → blue', () => {
      expect(PLAYER_COLOR_MAP[1]).toBe('blue');
    });

    it('maps player index 2 → yellow', () => {
      expect(PLAYER_COLOR_MAP[2]).toBe('yellow');
    });

    it('maps player index 3 → green', () => {
      expect(PLAYER_COLOR_MAP[3]).toBe('green');
    });
  });

  describe('assignPlayerColors', () => {
    it('assigns correct color to each player in a 2-player game', () => {
      const state = makePreGameState(2);
      const colored = assignPlayerColors(state);

      expect(colored.players[0]!.color).toBe('red');
      expect(colored.players[1]!.color).toBe('blue');
    });

    it('assigns correct color to each player in a 4-player game', () => {
      const state = makePreGameState(4);
      const colored = assignPlayerColors(state);

      expect(colored.players[0]!.color).toBe('red');
      expect(colored.players[1]!.color).toBe('blue');
      expect(colored.players[2]!.color).toBe('yellow');
      expect(colored.players[3]!.color).toBe('green');
    });

    it('is idempotent — calling twice yields same result', () => {
      const state = makePreGameState(4);
      const first = assignPlayerColors(state);
      const second = assignPlayerColors(first);

      for (let i = 0; i < 4; i++) {
        expect(first.players[i]!.color).toBe(second.players[i]!.color);
      }
    });
  });

  describe('Units inherit player color after match init', () => {
    it('every active unit inherits its player\'s color', () => {
      let state = makePreGameState(4);
      state = assignPlayerColors(state);
      const result = initializeMatchUnits(state);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      for (const player of result.value.players) {
        for (const unit of player.units) {
          expect(unit.color).toBe(player.color);
        }
      }
    });

    it('colors persist in match state after initialization', () => {
      let state = makePreGameState(2);
      state = assignPlayerColors(state);
      const result = initializeMatchUnits(state);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Verify the returned state still has colors
      expect(result.value.players[0]!.color).toBe('red');
      expect(result.value.players[1]!.color).toBe('blue');

      // All units colored
      for (const unit of result.value.players[0]!.units) {
        expect(unit.color).toBe('red');
      }
      for (const unit of result.value.players[1]!.units) {
        expect(unit.color).toBe('blue');
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. SPAWN POSITIONING BY PLAYER SIDE
// ═══════════════════════════════════════════════════════════════════

describe('Spawn Positioning by Player Side', () => {
  const BOARD_W = 23;
  const BOARD_H = 23;

  describe('getSpawnPositions', () => {
    it('Player 1 (index 0, Bottom) — spawns near bottom rows', () => {
      const positions = getSpawnPositions(0, BOARD_W, BOARD_H);
      expect(positions).toHaveLength(3);
      for (const pos of positions) {
        // Bottom side: y should be near height - 3
        expect(pos.y).toBeGreaterThanOrEqual(BOARD_H - 4);
        expect(pos.y).toBeLessThan(BOARD_H);
      }
    });

    it('Player 2 (index 1, Top) — spawns near top rows', () => {
      const positions = getSpawnPositions(1, BOARD_W, BOARD_H);
      expect(positions).toHaveLength(3);
      for (const pos of positions) {
        // Top side: y should be near row 2
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeLessThanOrEqual(3);
      }
    });

    it('Player 3 (index 2, Left) — spawns near left columns', () => {
      const positions = getSpawnPositions(2, BOARD_W, BOARD_H);
      expect(positions).toHaveLength(3);
      for (const pos of positions) {
        // Left side: x should be near col 2
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.x).toBeLessThanOrEqual(3);
      }
    });

    it('Player 4 (index 3, Right) — spawns near right columns', () => {
      const positions = getSpawnPositions(3, BOARD_W, BOARD_H);
      expect(positions).toHaveLength(3);
      for (const pos of positions) {
        // Right side: x should be near width - 3
        expect(pos.x).toBeGreaterThanOrEqual(BOARD_W - 4);
        expect(pos.x).toBeLessThan(BOARD_W);
      }
    });

    it('no overlapping positions across all 4 players', () => {
      const allPositions: { x: number; y: number }[] = [];
      for (let pIdx = 0; pIdx < 4; pIdx++) {
        const positions = getSpawnPositions(pIdx, BOARD_W, BOARD_H);
        allPositions.push(...positions);
      }

      expect(allPositions).toHaveLength(12);

      // No duplicates
      const keys = allPositions.map(p => `${p.x},${p.y}`);
      const unique = new Set(keys);
      expect(unique.size).toBe(12);
    });

    it('all positions are within grid bounds', () => {
      for (let pIdx = 0; pIdx < 4; pIdx++) {
        const positions = getSpawnPositions(pIdx, BOARD_W, BOARD_H);
        for (const pos of positions) {
          expect(pos.x).toBeGreaterThanOrEqual(0);
          expect(pos.x).toBeLessThan(BOARD_W);
          expect(pos.y).toBeGreaterThanOrEqual(0);
          expect(pos.y).toBeLessThan(BOARD_H);
        }
      }
    });

    it('units are evenly spaced (no clustering)', () => {
      for (let pIdx = 0; pIdx < 4; pIdx++) {
        const positions = getSpawnPositions(pIdx, BOARD_W, BOARD_H);
        // Check that positions aren't all on the same cell
        const xs = positions.map(p => p.x);
        const ys = positions.map(p => p.y);
        const xSpread = Math.max(...xs) - Math.min(...xs);
        const ySpread = Math.max(...ys) - Math.min(...ys);
        // At least one axis should have spread ≥ 4
        expect(Math.max(xSpread, ySpread)).toBeGreaterThanOrEqual(4);
      }
    });

    it('deterministic — same inputs always produce same outputs', () => {
      const a = getSpawnPositions(0, BOARD_W, BOARD_H);
      const b = getSpawnPositions(0, BOARD_W, BOARD_H);
      expect(a).toEqual(b);
    });
  });

  describe('Edge Cases', () => {
    it('small grid (8x8) — positions still in bounds', () => {
      for (let pIdx = 0; pIdx < 4; pIdx++) {
        const positions = getSpawnPositions(pIdx, 8, 8);
        expect(positions).toHaveLength(3);
        for (const pos of positions) {
          expect(pos.x).toBeGreaterThanOrEqual(0);
          expect(pos.x).toBeLessThan(8);
          expect(pos.y).toBeGreaterThanOrEqual(0);
          expect(pos.y).toBeLessThan(8);
        }
      }
    });

    it('small grid (8x8) — no overlapping positions', () => {
      const allPositions: { x: number; y: number }[] = [];
      for (let pIdx = 0; pIdx < 4; pIdx++) {
        allPositions.push(...getSpawnPositions(pIdx, 8, 8));
      }
      const keys = allPositions.map(p => `${p.x},${p.y}`);
      const unique = new Set(keys);
      expect(unique.size).toBe(12);
    });

    it('2-player game — only indices 0 and 1 used, no collisions', () => {
      const p0 = getSpawnPositions(0, BOARD_W, BOARD_H);
      const p1 = getSpawnPositions(1, BOARD_W, BOARD_H);
      const allKeys = [...p0, ...p1].map(p => `${p.x},${p.y}`);
      expect(new Set(allKeys).size).toBe(6);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. GLOBAL VISIBILITY SYSTEM
// ═══════════════════════════════════════════════════════════════════

describe('Global Visibility System', () => {
  beforeEach(() => resetIdCounter());

  describe('getVisibleUnits', () => {
    it('returns all active units from all players (2-player)', () => {
      let state = makePreGameState(2);
      state = assignPlayerColors(state);
      const result = initializeMatchUnits(state);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const visible = getVisibleUnits(result.value);
      // 3 active + 3 bench per player, but getVisibleUnits returns only active (on-grid) units
      // Active units have positions within grid bounds
      const activeVisible = visible.filter(
        u => u.position && u.position.x >= 0 && u.position.x < 23 && u.position.y >= 0 && u.position.y < 23
      );
      expect(activeVisible).toHaveLength(6); // 3 per player × 2 players
    });

    it('returns all active units from all players (4-player)', () => {
      let state = makePreGameState(4);
      state = assignPlayerColors(state);
      const result = initializeMatchUnits(state);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const visible = getVisibleUnits(result.value);
      const activeVisible = visible.filter(
        u => u.position && u.position.x >= 0 && u.position.x < 23 && u.position.y >= 0 && u.position.y < 23
      );
      expect(activeVisible).toHaveLength(12); // 3 per player × 4 players
    });

    it('does NOT filter by current player — no ownership filtering', () => {
      let state = makePreGameState(2);
      state = assignPlayerColors(state);
      const result = initializeMatchUnits(state);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const visible = getVisibleUnits(result.value);
      const ownerIds = [...new Set(visible.map(u => u.ownerId))];
      expect(ownerIds).toHaveLength(2);
      expect(ownerIds).toContain('player-1');
      expect(ownerIds).toContain('player-2');
    });

    it('each visible unit has a color assigned', () => {
      let state = makePreGameState(4);
      state = assignPlayerColors(state);
      const result = initializeMatchUnits(state);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const visible = getVisibleUnits(result.value);
      for (const unit of visible) {
        expect(unit.color).toBeDefined();
        expect(['red', 'blue', 'yellow', 'green']).toContain(unit.color);
      }
    });

    it('units are differentiated by color (multiple colors present)', () => {
      let state = makePreGameState(4);
      state = assignPlayerColors(state);
      const result = initializeMatchUnits(state);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const visible = getVisibleUnits(result.value);
      const colors = [...new Set(visible.map(u => u.color))];
      expect(colors).toHaveLength(4);
    });

    it('no duplicate units returned', () => {
      let state = makePreGameState(4);
      state = assignPlayerColors(state);
      const result = initializeMatchUnits(state);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const visible = getVisibleUnits(result.value);
      const ids = visible.map(u => u.card.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('excludes dead units (hp <= 0)', () => {
      let state = makePreGameState(2);
      state = assignPlayerColors(state);
      const result = initializeMatchUnits(state);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Kill one unit
      const gs = result.value;
      gs.players[0]!.units[0]!.currentHp = 0;

      const visible = getVisibleUnits(gs);
      const aliveOnGrid = visible.filter(
        u => u.position && u.position.x >= 0 && u.position.x < 23 && u.position.y >= 0 && u.position.y < 23
      );
      // 6 total - 1 dead = 5 active visible
      expect(aliveOnGrid).toHaveLength(5);
    });
  });

  describe('Edge Cases', () => {
    it('empty game (0 players) — returns empty array', () => {
      const state = createGameState({
        phase: GamePhase.IN_PROGRESS,
        players: [],
      });
      const visible = getVisibleUnits(state);
      expect(visible).toHaveLength(0);
    });

    it('players with no units — returns empty array', () => {
      const state = createGameState({
        phase: GamePhase.IN_PROGRESS,
        players: [
          createPlayer({ id: 'p1', units: [] }),
          createPlayer({ id: 'p2', units: [] }),
        ],
      });
      const visible = getVisibleUnits(state);
      expect(visible).toHaveLength(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. INTEGRATION: Full Match Init Pipeline
// ═══════════════════════════════════════════════════════════════════

describe('Integration — Full Match Initialization Pipeline', () => {
  beforeEach(() => resetIdCounter());

  it('4-player game: colors assigned, positions correct, all visible', () => {
    let state = makePreGameState(4);

    // Step 1: Assign colors
    state = assignPlayerColors(state);
    expect(state.players[0]!.color).toBe('red');
    expect(state.players[3]!.color).toBe('green');

    // Step 2: Initialize match (places units)
    const result = initializeMatchUnits(state);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    state = result.value;

    // Step 3: Check visibility
    const visible = getVisibleUnits(state);
    const activeVisible = visible.filter(
      u => u.position && u.position.x >= 0 && u.position.x < 23 && u.position.y >= 0 && u.position.y < 23
    );
    expect(activeVisible).toHaveLength(12);

    // Step 4: Check colors on units
    const p1Units = activeVisible.filter(u => u.ownerId === 'player-1');
    const p2Units = activeVisible.filter(u => u.ownerId === 'player-2');
    const p3Units = activeVisible.filter(u => u.ownerId === 'player-3');
    const p4Units = activeVisible.filter(u => u.ownerId === 'player-4');

    expect(p1Units).toHaveLength(3);
    expect(p2Units).toHaveLength(3);
    expect(p3Units).toHaveLength(3);
    expect(p4Units).toHaveLength(3);

    for (const u of p1Units) expect(u.color).toBe('red');
    for (const u of p2Units) expect(u.color).toBe('blue');
    for (const u of p3Units) expect(u.color).toBe('yellow');
    for (const u of p4Units) expect(u.color).toBe('green');

    // Step 5: Check spawn sides
    // P1 (Bottom): y near bottom
    for (const u of p1Units) {
      expect(u.position!.y).toBeGreaterThanOrEqual(19);
    }
    // P2 (Top): y near top
    for (const u of p2Units) {
      expect(u.position!.y).toBeLessThanOrEqual(3);
    }
    // P3 (Left): x near left
    for (const u of p3Units) {
      expect(u.position!.x).toBeLessThanOrEqual(3);
    }
    // P4 (Right): x near right
    for (const u of p4Units) {
      expect(u.position!.x).toBeGreaterThanOrEqual(19);
    }
  });

  it('2-player game: only bottom + top used', () => {
    let state = makePreGameState(2);
    state = assignPlayerColors(state);
    const result = initializeMatchUnits(state);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const visible = getVisibleUnits(result.value);
    const activeVisible = visible.filter(
      u => u.position && u.position.x >= 0 && u.position.x < 23 && u.position.y >= 0 && u.position.y < 23
    );
    expect(activeVisible).toHaveLength(6);

    const p1Units = activeVisible.filter(u => u.ownerId === 'player-1');
    const p2Units = activeVisible.filter(u => u.ownerId === 'player-2');

    // P1 bottom
    for (const u of p1Units) {
      expect(u.position!.y).toBeGreaterThanOrEqual(19);
    }
    // P2 top
    for (const u of p2Units) {
      expect(u.position!.y).toBeLessThanOrEqual(3);
    }
  });

  it('visibility works across turns — no state loss', () => {
    let state = makePreGameState(2);
    state = assignPlayerColors(state);
    const result = initializeMatchUnits(state);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    state = result.value;

    // Simulate turn change
    const afterTurn: GameState = {
      ...state,
      currentPlayerIndex: 1,
      turnNumber: 2,
    };

    const visible = getVisibleUnits(afterTurn);
    const activeVisible = visible.filter(
      u => u.position && u.position.x >= 0 && u.position.x < 23 && u.position.y >= 0 && u.position.y < 23
    );
    expect(activeVisible).toHaveLength(6);
    expect([...new Set(visible.map(u => u.ownerId))]).toHaveLength(2);
  });
});

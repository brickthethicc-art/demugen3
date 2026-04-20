/**
 * Regression tests for the unit-spawning bug:
 *   - placeStartingUnits used non-unique board occupant IDs (card.id)
 *   - placeStartingUnits never assigned player colors to units
 *   - placeStartingUnits omitted bench/reserve unit instances
 *   - confirm_starting_units handler mutated shared server state
 *
 * These tests verify correctness of BOTH code paths:
 *   Path A: placeStartingUnits  (action-resolver / LOCK_TEAM)
 *   Path B: initializeMatchUnits (gateway / confirm_starting_units)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetIdCounter,
  createUnit,
  createPlayer,
  createGameState,
} from '../factories.js';
import { GamePhase, ACTIVE_UNIT_COUNT, RESERVE_UNIT_COUNT } from '../../src/types/index.js';
import type { GameState, PlayerState, UnitCard } from '../../src/types/index.js';
import { placeStartingUnits } from '../../src/engines/starting-placement/index.js';
import { initializeMatchUnits } from '../../src/engines/starting-placement/match-init.js';

// ── Helpers ──────────────────────────────────────────────────────

/** Create N units with explicit IDs (allows deliberate duplication across players). */
function makeUnitsWithIds(ids: string[], costEach = 5): UnitCard[] {
  return ids.map(id => createUnit({ id, name: `Unit-${id}`, cost: costEach }));
}

function makeLockedPlayer(id: string, unitIdPrefix: string): PlayerState {
  const active = makeUnitsWithIds([`${unitIdPrefix}-a1`, `${unitIdPrefix}-a2`, `${unitIdPrefix}-a3`]);
  const reserve = makeUnitsWithIds([`${unitIdPrefix}-r1`, `${unitIdPrefix}-r2`, `${unitIdPrefix}-r3`]);
  return createPlayer({
    id,
    team: { activeUnits: active, reserveUnits: reserve, locked: true },
    units: [],
  });
}

/**
 * Build a locked 2-player game where BOTH players share the SAME card IDs.
 * This is the scenario that triggered the original bug.
 */
function sharedIdGameState(): GameState {
  const sharedIds = ['warrior', 'archer', 'mage'];
  const sharedReserve = ['healer', 'tank', 'scout'];
  const p1 = createPlayer({
    id: 'p1',
    team: {
      activeUnits: makeUnitsWithIds(sharedIds),
      reserveUnits: makeUnitsWithIds(sharedReserve),
      locked: true,
    },
    units: [],
  });
  const p2 = createPlayer({
    id: 'p2',
    team: {
      activeUnits: makeUnitsWithIds(sharedIds),
      reserveUnits: makeUnitsWithIds(sharedReserve),
      locked: true,
    },
    units: [],
  });
  return createGameState({ phase: GamePhase.PRE_GAME, players: [p1, p2] });
}

function uniqueIdGameState(): GameState {
  const p1 = makeLockedPlayer('p1', 'p1');
  const p2 = makeLockedPlayer('p2', 'p2');
  return createGameState({ phase: GamePhase.PRE_GAME, players: [p1, p2] });
}

function fourPlayerGameState(): GameState {
  const players = [
    makeLockedPlayer('p1', 'p1'),
    makeLockedPlayer('p2', 'p2'),
    makeLockedPlayer('p3', 'p3'),
    makeLockedPlayer('p4', 'p4'),
  ];
  return createGameState({ phase: GamePhase.PRE_GAME, players });
}

// ═════════════════════════════════════════════════════════════════
// 1. placeStartingUnits — occupant ID uniqueness
// ═════════════════════════════════════════════════════════════════

describe('placeStartingUnits — player-scoped occupant IDs', () => {
  beforeEach(() => resetIdCounter());

  it('board occupant IDs contain the player ID prefix (no cross-player collisions)', () => {
    const gs = sharedIdGameState();
    let state = gs;

    // Place units for both players sequentially
    for (const player of state.players) {
      const result = placeStartingUnits(state, player.id);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.value;
    }

    // Collect all occupant IDs on the board
    const occupantIds: string[] = [];
    for (let y = 0; y < state.board.height; y++) {
      for (let x = 0; x < state.board.width; x++) {
        const occ = state.board.cells[y]![x]!.occupantId;
        if (occ) occupantIds.push(occ);
      }
    }

    // Should have 6 occupied cells (3 per player)
    expect(occupantIds).toHaveLength(6);

    // Each occupant ID must start with a player id
    const p1Occupants = occupantIds.filter(id => id.startsWith('p1-'));
    const p2Occupants = occupantIds.filter(id => id.startsWith('p2-'));
    expect(p1Occupants).toHaveLength(3);
    expect(p2Occupants).toHaveLength(3);
  });

  it('no two board cells share the same occupant ID (even with shared card IDs)', () => {
    const gs = sharedIdGameState();
    let state = gs;

    for (const player of state.players) {
      const result = placeStartingUnits(state, player.id);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.value;
    }

    const occupantIds: string[] = [];
    for (let y = 0; y < state.board.height; y++) {
      for (let x = 0; x < state.board.width; x++) {
        const occ = state.board.cells[y]![x]!.occupantId;
        if (occ) occupantIds.push(occ);
      }
    }

    expect(new Set(occupantIds).size).toBe(occupantIds.length);
  });
});

// ═════════════════════════════════════════════════════════════════
// 2. placeStartingUnits — color assignment
// ═════════════════════════════════════════════════════════════════

describe('placeStartingUnits — color assignment', () => {
  beforeEach(() => resetIdCounter());

  it('units created by placeStartingUnits have a color property', () => {
    const gs = uniqueIdGameState();
    let state = gs;

    for (const player of state.players) {
      const result = placeStartingUnits(state, player.id);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.value;
    }

    for (const player of state.players) {
      for (const unit of player.units) {
        expect(unit.color).toBeDefined();
        expect(['red', 'blue', 'yellow', 'green']).toContain(unit.color);
      }
    }
  });

  it('player 0 units are red, player 1 units are blue', () => {
    const gs = uniqueIdGameState();
    let state = gs;

    for (const player of state.players) {
      const result = placeStartingUnits(state, player.id);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.value;
    }

    for (const unit of state.players[0]!.units) {
      expect(unit.color).toBe('red');
    }
    for (const unit of state.players[1]!.units) {
      expect(unit.color).toBe('blue');
    }
  });

  it('player state itself gets the color property', () => {
    const gs = uniqueIdGameState();
    let state = gs;

    for (const player of state.players) {
      const result = placeStartingUnits(state, player.id);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.value;
    }

    expect(state.players[0]!.color).toBe('red');
    expect(state.players[1]!.color).toBe('blue');
  });
});

// ═════════════════════════════════════════════════════════════════
// 3. placeStartingUnits — bench / reserve unit instances
// ═════════════════════════════════════════════════════════════════

describe('placeStartingUnits — bench unit instances', () => {
  beforeEach(() => resetIdCounter());

  it('each player ends up with 6 unit instances (3 active + 3 bench)', () => {
    const gs = uniqueIdGameState();
    let state = gs;

    for (const player of state.players) {
      const result = placeStartingUnits(state, player.id);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.value;
    }

    for (const player of state.players) {
      expect(player.units).toHaveLength(ACTIVE_UNIT_COUNT + RESERVE_UNIT_COUNT);
    }
  });

  it('active units have on-board positions, bench units have off-board positions', () => {
    const gs = uniqueIdGameState();
    let state = gs;

    for (const player of state.players) {
      const result = placeStartingUnits(state, player.id);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.value;
    }

    for (const player of state.players) {
      const onBoard = player.units.filter(u =>
        u.position !== null &&
        u.position!.x >= 0 && u.position!.x < state.board.width &&
        u.position!.y >= 0 && u.position!.y < state.board.height
      );
      const offBoard = player.units.filter(u =>
        u.position !== null &&
        (u.position!.x < 0 || u.position!.x >= state.board.width)
      );
      expect(onBoard).toHaveLength(ACTIVE_UNIT_COUNT);
      expect(offBoard).toHaveLength(RESERVE_UNIT_COUNT);
    }
  });
});

// ═════════════════════════════════════════════════════════════════
// 4. Cross-player contamination — the exact reported bug
// ═════════════════════════════════════════════════════════════════

describe('No cross-player contamination (1v1 regression)', () => {
  beforeEach(() => resetIdCounter());

  it('1v1: bottom has exactly 3 red units, top has exactly 3 blue units', () => {
    const gs = sharedIdGameState();
    const result = initializeMatchUnits(gs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const state = result.value;
    const { board, players } = state;

    // Gather placed active units per player
    for (const player of players) {
      const active = player.units.filter(u =>
        u.position !== null &&
        u.position!.x >= 0 && u.position!.x < board.width &&
        u.position!.y >= 0 && u.position!.y < board.height
      );
      expect(active).toHaveLength(ACTIVE_UNIT_COUNT);

      // Every active unit must belong to THIS player
      for (const unit of active) {
        expect(unit.ownerId).toBe(player.id);
        expect(unit.color).toBe(player.color);
      }
    }

    // Total active units across all players = 6
    const allActive = players.flatMap(p => p.units.filter(u =>
      u.position !== null &&
      u.position!.x >= 0 && u.position!.x < board.width
    ));
    expect(allActive).toHaveLength(6);
  });

  it('1v1: total unit count = 6 per player (not 4 total)', () => {
    const gs = sharedIdGameState();
    const result = initializeMatchUnits(gs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const totalUnits = result.value.players.reduce((sum, p) => sum + p.units.length, 0);
    expect(totalUnits).toBe(12); // 6 per player × 2 players
  });

  it('board occupant IDs are all player-scoped after initializeMatchUnits', () => {
    const gs = sharedIdGameState();
    const result = initializeMatchUnits(gs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { board, players } = result.value;
    const occupantIds: string[] = [];
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const occ = board.cells[y]![x]!.occupantId;
        if (occ) occupantIds.push(occ);
      }
    }

    expect(occupantIds).toHaveLength(6);
    for (const occ of occupantIds) {
      const ownerMatch = players.some(p => occ.startsWith(`${p.id}-`));
      expect(ownerMatch).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════
// 5. Multi-player edge cases (3 and 4 players)
// ═════════════════════════════════════════════════════════════════

describe('Multi-player spawn correctness', () => {
  beforeEach(() => resetIdCounter());

  it('4-player: each player gets exactly 3 active + 3 bench, all colored', () => {
    const gs = fourPlayerGameState();
    const result = initializeMatchUnits(gs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const expectedColors = ['red', 'blue', 'yellow', 'green'];
    result.value.players.forEach((player, idx) => {
      expect(player.units).toHaveLength(6);
      expect(player.color).toBe(expectedColors[idx]);
      for (const unit of player.units) {
        expect(unit.color).toBe(expectedColors[idx]);
        expect(unit.ownerId).toBe(player.id);
      }
    });
  });

  it('4-player: no two active units share a board cell', () => {
    const gs = fourPlayerGameState();
    const result = initializeMatchUnits(gs);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const posKeys = result.value.players.flatMap(p =>
      p.units
        .filter(u => u.position !== null && u.position!.x >= 0 && u.position!.x < result.value.board.width)
        .map(u => `${u.position!.x},${u.position!.y}`)
    );
    expect(new Set(posKeys).size).toBe(posKeys.length);
  });
});

// ═════════════════════════════════════════════════════════════════
// 6. Immutability — input game state must not be mutated
// ═════════════════════════════════════════════════════════════════

describe('Immutability guarantees', () => {
  beforeEach(() => resetIdCounter());

  it('placeStartingUnits does not mutate the input game state', () => {
    const gs = uniqueIdGameState();
    const snapshot = JSON.parse(JSON.stringify(gs));

    const result = placeStartingUnits(gs, 'p1');
    expect(result.ok).toBe(true);

    // Original state must be unchanged
    expect(gs).toEqual(snapshot);
  });

  it('initializeMatchUnits does not mutate the input game state', () => {
    const gs = uniqueIdGameState();
    const snapshot = JSON.parse(JSON.stringify(gs));

    initializeMatchUnits(gs);

    expect(gs).toEqual(snapshot);
  });
});

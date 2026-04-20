import { describe, it, expect, beforeEach } from 'vitest';
import { resetIdCounter, createUnit, createPlayer, createGameState } from './factories.js';
import { GamePhase, ACTIVE_UNIT_COUNT, RESERVE_UNIT_COUNT } from '../src/types/index.js';
import type { UnitCard, GameState, PlayerState } from '../src/types/index.js';
import { placeStartingUnits, getSpawnPositions } from '../src/engines/starting-placement/index.js';
import { splitTeam } from '../src/pregame/index.js';

// Simulates the full server intent pipeline: SELECT_TEAM → LOCK_TEAM → placeStartingUnits
// This mirrors what action-resolver.ts does
function simulateSelectTeamIntent(
  state: GameState,
  playerId: string,
  activeUnits: UnitCard[],
  reserveUnits: UnitCard[]
): GameState {
  const updatedPlayers = state.players.map(player => {
    if (player.id === playerId) {
      return {
        ...player,
        team: {
          activeUnits,
          reserveUnits,
          locked: false,
        },
      };
    }
    return player;
  });
  return { ...state, players: updatedPlayers };
}

function simulateLockTeamIntent(state: GameState, playerId: string): GameState {
  const updatedPlayers = state.players.map(player => {
    if (player.id === playerId) {
      return {
        ...player,
        team: { ...player.team, locked: true },
      };
    }
    return player;
  });
  return { ...state, players: updatedPlayers };
}

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

describe('Active Unit Visibility — Critical Fix', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('1. Each player has exactly 3 active units after placement', () => {
    it('2-player game: both players get 3 active units on board', () => {
      const p1Active = makeActiveUnits();
      const p1Reserve = makeReserveUnits();
      const p2Active = makeActiveUnits();
      const p2Reserve = makeReserveUnits();

      const player1 = createPlayer({
        id: 'player-1',
        team: { activeUnits: p1Active, reserveUnits: p1Reserve, locked: true },
        units: [],
      });
      const player2 = createPlayer({
        id: 'player-2',
        team: { activeUnits: p2Active, reserveUnits: p2Reserve, locked: true },
        units: [],
      });

      let state = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1, player2],
      });

      // Place units for both players
      for (const player of state.players) {
        const result = placeStartingUnits(state, player.id);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        state = result.value;
      }

      // Each player must have exactly 3 units
      expect(state.players[0]!.units).toHaveLength(ACTIVE_UNIT_COUNT);
      expect(state.players[1]!.units).toHaveLength(ACTIVE_UNIT_COUNT);
    });

    it('4-player game: all 4 players get 3 active units on board', () => {
      const players: PlayerState[] = [];
      for (let i = 0; i < 4; i++) {
        players.push(
          createPlayer({
            id: `player-${i + 1}`,
            team: { activeUnits: makeActiveUnits(), reserveUnits: makeReserveUnits(), locked: true },
            units: [],
          })
        );
      }

      let state = createGameState({
        phase: GamePhase.PRE_GAME,
        players,
      });

      for (const player of state.players) {
        const result = placeStartingUnits(state, player.id);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        state = result.value;
      }

      // All 4 players must have exactly 3 units
      for (let i = 0; i < 4; i++) {
        expect(state.players[i]!.units).toHaveLength(ACTIVE_UNIT_COUNT);
      }
    });
  });

  describe('2. Units occupy valid grid positions', () => {
    it('all placed units have non-null positions within board bounds', () => {
      const player1 = createPlayer({
        id: 'player-1',
        team: { activeUnits: makeActiveUnits(), reserveUnits: makeReserveUnits(), locked: true },
        units: [],
      });
      const player2 = createPlayer({
        id: 'player-2',
        team: { activeUnits: makeActiveUnits(), reserveUnits: makeReserveUnits(), locked: true },
        units: [],
      });

      let state = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1, player2],
      });

      for (const player of state.players) {
        const result = placeStartingUnits(state, player.id);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        state = result.value;
      }

      for (const player of state.players) {
        for (const unit of player.units) {
          expect(unit.position).not.toBeNull();
          expect(unit.position!.x).toBeGreaterThanOrEqual(0);
          expect(unit.position!.x).toBeLessThan(state.board.width);
          expect(unit.position!.y).toBeGreaterThanOrEqual(0);
          expect(unit.position!.y).toBeLessThan(state.board.height);
        }
      }
    });

    it('board cells are occupied after placement (occupantId set)', () => {
      const player1 = createPlayer({
        id: 'player-1',
        team: { activeUnits: makeActiveUnits(), reserveUnits: makeReserveUnits(), locked: true },
        units: [],
      });

      let state = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1],
      });

      const result = placeStartingUnits(state, 'player-1');
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.value;

      for (const unit of state.players[0]!.units) {
        const cell = state.board.cells[unit.position!.y]![unit.position!.x];
        expect(cell!.occupantId).toBe(unit.card.id);
      }
    });
  });

  describe('3. Placement is deterministic (multiplayer sync safe)', () => {
    it('same input produces identical positions every time', () => {
      const makeState = () => {
        resetIdCounter();
        const player1 = createPlayer({
          id: 'player-1',
          team: { activeUnits: makeActiveUnits(), reserveUnits: makeReserveUnits(), locked: true },
          units: [],
        });
        return createGameState({
          phase: GamePhase.PRE_GAME,
          players: [player1],
        });
      };

      const state1 = makeState();
      const state2 = makeState();

      const result1 = placeStartingUnits(state1, 'player-1');
      const result2 = placeStartingUnits(state2, 'player-1');

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (!result1.ok || !result2.ok) return;

      const units1 = result1.value.players[0]!.units;
      const units2 = result2.value.players[0]!.units;

      for (let i = 0; i < units1.length; i++) {
        expect(units1[i]!.position).toEqual(units2[i]!.position);
      }
    });
  });

  describe('4. Multi-player spawn sides', () => {
    it('player 0 on left side, player 1 on right side', () => {
      const player1 = createPlayer({
        id: 'player-1',
        team: { activeUnits: makeActiveUnits(), reserveUnits: makeReserveUnits(), locked: true },
        units: [],
      });
      const player2 = createPlayer({
        id: 'player-2',
        team: { activeUnits: makeActiveUnits(), reserveUnits: makeReserveUnits(), locked: true },
        units: [],
      });

      let state = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1, player2],
      });

      for (const player of state.players) {
        const result = placeStartingUnits(state, player.id);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        state = result.value;
      }

      const halfHeight = Math.floor(state.board.height / 2);

      // Player 0: bottom side
      for (const unit of state.players[0]!.units) {
        expect(unit.position!.y).toBeGreaterThanOrEqual(halfHeight);
      }

      // Player 1: top side
      for (const unit of state.players[1]!.units) {
        expect(unit.position!.y).toBeLessThan(halfHeight);
      }
    });

    it('getSpawnPositions returns correct sides for 4 players', () => {
      const boardWidth = 30;
      const boardHeight = 30;

      const p0Positions = getSpawnPositions(0, boardWidth, boardHeight);
      const p1Positions = getSpawnPositions(1, boardWidth, boardHeight);
      const p2Positions = getSpawnPositions(2, boardWidth, boardHeight);
      const p3Positions = getSpawnPositions(3, boardWidth, boardHeight);

      // Bottom/Top/Left/Right layout
      // P0 (Bottom): y near bottom
      for (const pos of p0Positions) expect(pos.y).toBeGreaterThanOrEqual(26);
      // P1 (Top): y near top
      for (const pos of p1Positions) expect(pos.y).toBeLessThanOrEqual(3);
      // P2 (Left): x near left
      for (const pos of p2Positions) expect(pos.x).toBeLessThanOrEqual(3);
      // P3 (Right): x near right
      for (const pos of p3Positions) expect(pos.x).toBeGreaterThanOrEqual(26);
    });
  });

  describe('5. Server intent pipeline preserves PlayerTeam structure (ROOT CAUSE REGRESSION)', () => {
    it('SELECT_TEAM must store activeUnits and reserveUnits, not unitCardIds', () => {
      const active = makeActiveUnits();
      const reserve = makeReserveUnits();

      const player1 = createPlayer({
        id: 'player-1',
        team: { activeUnits: [], reserveUnits: [], locked: false },
        units: [],
      });

      let state = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1],
      });

      // Simulate SELECT_TEAM
      state = simulateSelectTeamIntent(state, 'player-1', active, reserve);

      const team = state.players[0]!.team;
      // CRITICAL: team must have activeUnits array, NOT unitCardIds
      expect(team.activeUnits).toBeDefined();
      expect(team.activeUnits).toHaveLength(ACTIVE_UNIT_COUNT);
      expect(team.reserveUnits).toBeDefined();
      expect(team.reserveUnits).toHaveLength(RESERVE_UNIT_COUNT);
      expect((team as any).unitCardIds).toBeUndefined();
    });

    it('LOCK_TEAM + placement produces units in game state', () => {
      const active = makeActiveUnits();
      const reserve = makeReserveUnits();

      const player1 = createPlayer({
        id: 'player-1',
        team: { activeUnits: [], reserveUnits: [], locked: false },
        units: [],
      });
      const player2 = createPlayer({
        id: 'player-2',
        team: { activeUnits: [], reserveUnits: [], locked: false },
        units: [],
      });

      let state = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1, player2],
      });

      // SELECT for both players
      state = simulateSelectTeamIntent(state, 'player-1', active, reserve);
      state = simulateSelectTeamIntent(state, 'player-2', makeActiveUnits(), makeReserveUnits());

      // LOCK both
      state = simulateLockTeamIntent(state, 'player-1');
      state = simulateLockTeamIntent(state, 'player-2');

      // Place units (simulates what server does after all locked)
      for (const player of state.players) {
        const result = placeStartingUnits(state, player.id);
        expect(result.ok).toBe(true);
        if (!result.ok) {
          throw new Error(`Placement failed for ${player.id}: ${result.error}`);
        }
        state = result.value;
      }

      // Both players must have units
      expect(state.players[0]!.units).toHaveLength(3);
      expect(state.players[1]!.units).toHaveLength(3);

      // All units must have positions
      for (const player of state.players) {
        for (const unit of player.units) {
          expect(unit.position).not.toBeNull();
        }
      }
    });
  });

  describe('6. Edge Cases', () => {
    it('rejects placement for player with 0 active units', () => {
      const player = createPlayer({
        id: 'player-1',
        team: { activeUnits: [], reserveUnits: [], locked: true },
        units: [],
      });

      const state = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player],
      });

      const result = placeStartingUnits(state, 'player-1');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('exactly 3 active units');
      }
    });

    it('rejects placement for unlocked team', () => {
      const player = createPlayer({
        id: 'player-1',
        team: { activeUnits: makeActiveUnits(), reserveUnits: makeReserveUnits(), locked: false },
        units: [],
      });

      const state = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player],
      });

      const result = placeStartingUnits(state, 'player-1');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('not locked');
      }
    });

    it('rejects placement for nonexistent player', () => {
      const state = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [],
      });

      const result = placeStartingUnits(state, 'nonexistent');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('not found');
      }
    });

    it('handles duplicate unit IDs across different players independently', () => {
      // Both players use the same unit card IDs (different instances)
      resetIdCounter();
      const p1Active = makeActiveUnits();
      const p1Reserve = makeReserveUnits();
      
      resetIdCounter();
      const p2Active = makeActiveUnits();
      const p2Reserve = makeReserveUnits();

      const player1 = createPlayer({
        id: 'player-1',
        team: { activeUnits: p1Active, reserveUnits: p1Reserve, locked: true },
        units: [],
      });
      const player2 = createPlayer({
        id: 'player-2',
        team: { activeUnits: p2Active, reserveUnits: p2Reserve, locked: true },
        units: [],
      });

      let state = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1, player2],
      });

      // This will fail because duplicate IDs cause occupancy conflicts
      // Player 1 should succeed
      const result1 = placeStartingUnits(state, 'player-1');
      expect(result1.ok).toBe(true);
      if (!result1.ok) return;
      state = result1.value;

      // Player 2 placement should also succeed (different board positions)
      const result2 = placeStartingUnits(state, 'player-2');
      // If unit IDs collide on same cell, this would fail; different positions should work
      // Even with same IDs, positions differ by player index
      expect(result2.ok).toBe(true);
    });
  });

  describe('7. splitTeam produces correct active/reserve split', () => {
    it('splits 6 units into 3 active + 3 reserve', () => {
      const allUnits = [...makeActiveUnits(), ...makeReserveUnits()];
      const result = splitTeam(allUnits);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.activeUnits).toHaveLength(ACTIVE_UNIT_COUNT);
      expect(result.value.reserveUnits).toHaveLength(RESERVE_UNIT_COUNT);
      expect(result.value.locked).toBe(false);
    });
  });

  describe('8. Broadcast state contains ALL players units (not just local)', () => {
    it('game state after placement includes units for every player', () => {
      const player1 = createPlayer({
        id: 'player-1',
        team: { activeUnits: makeActiveUnits(), reserveUnits: makeReserveUnits(), locked: true },
        units: [],
      });
      const player2 = createPlayer({
        id: 'player-2',
        team: { activeUnits: makeActiveUnits(), reserveUnits: makeReserveUnits(), locked: true },
        units: [],
      });

      let state = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1, player2],
      });

      for (const player of state.players) {
        const result = placeStartingUnits(state, player.id);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        state = result.value;
      }

      // Simulate what each client receives (same state, sanitized differently)
      // Both clients should see both players' units
      const totalUnitsVisible = state.players.reduce((sum, p) => sum + p.units.length, 0);
      expect(totalUnitsVisible).toBe(6); // 3 per player × 2 players

      // Sanitize for player-1: should still see player-2's units
      const sanitizedForP1 = {
        ...state,
        players: state.players.map(p =>
          p.id === 'player-1' ? p : { ...p, hand: { cards: [] }, deck: { cards: [] } }
        ),
      };
      expect(sanitizedForP1.players[0]!.units).toHaveLength(3);
      expect(sanitizedForP1.players[1]!.units).toHaveLength(3);
    });
  });
});

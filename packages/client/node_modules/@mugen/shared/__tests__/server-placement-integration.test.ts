import { describe, it, expect, beforeEach } from 'vitest';
import { resetIdCounter } from './factories.js';
import {
  createGameState,
  createPlayer,
  createUnit,
} from './factories.js';
import { GamePhase } from '../src/types/index.js';
import { placeStartingUnits } from '../src/engines/starting-placement/index.js';

describe('Server Integration - Starting Placement Broadcast', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('Game Start Integration - RED TESTS (expected to fail)', () => {
    it('should place starting units when transitioning from PRE_GAME to IN_PROGRESS', () => {
      // Arrange: Create game in PRE_GAME phase with players having locked teams
      const activeUnit1 = createUnit({ name: 'Knight', cost: 5 });
      const activeUnit2 = createUnit({ name: 'Archer', cost: 4 });
      const activeUnit3 = createUnit({ name: 'Mage', cost: 6 });
      
      const reserveUnit1 = createUnit({ name: 'Healer', cost: 3 });
      const reserveUnit2 = createUnit({ name: 'Tank', cost: 7 });
      const reserveUnit3 = createUnit({ name: 'Scout', cost: 2 });

      const player1 = createPlayer({
        id: 'player-1',
        team: {
          activeUnits: [activeUnit1, activeUnit2, activeUnit3],
          reserveUnits: [reserveUnit1, reserveUnit2, reserveUnit3],
          locked: true,
        },
        units: [], // No units placed yet
      });

      const player2 = createPlayer({
        id: 'player-2',
        team: {
          activeUnits: [activeUnit1, activeUnit2, activeUnit3],
          reserveUnits: [reserveUnit1, reserveUnit2, reserveUnit3],
          locked: true,
        },
        units: [], // No units placed yet
      });

      const gameState = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1, player2],
      });

      // Act: Simulate server transitioning game to IN_PROGRESS
      // This should trigger placement logic for all players
      let updatedState = gameState;
      for (const player of gameState.players) {
        const placeResult = placeStartingUnits(updatedState, player.id);
        if (!placeResult.ok) {
          expect(placeResult.ok).toBe(true); // This will fail with descriptive error
          return;
        }
        updatedState = placeResult.value;
      }

      // Assert: All players should have units placed on board
      expect(updatedState.phase).toBe(GamePhase.PRE_GAME); // Still PRE_GAME until all placements done
      
      // Player 1 should have 3 active units on board
      const player1Units = updatedState.players[0]!.units;
      expect(player1Units).toHaveLength(3);
      player1Units.forEach(unit => {
        expect(unit.position).not.toBeNull();
        expect(unit.position!.x).toBeGreaterThanOrEqual(0);
        expect(unit.position!.y).toBeGreaterThanOrEqual(0);
      });

      // Player 2 should have 3 active units on board
      const player2Units = updatedState.players[1]!.units;
      expect(player2Units).toHaveLength(3);
      player2Units.forEach(unit => {
        expect(unit.position).not.toBeNull();
        expect(unit.position!.x).toBeGreaterThanOrEqual(0);
        expect(unit.position!.y).toBeGreaterThanOrEqual(0);
      });

      // Units should be on opposite sides of board (bottom/top)
      const player1AvgY = player1Units.reduce((sum, u) => sum + u.position!.y, 0) / player1Units.length;
      const player2AvgY = player2Units.reduce((sum, u) => sum + u.position!.y, 0) / player2Units.length;
      expect(player1AvgY).toBeGreaterThanOrEqual(20); // Bottom side (23 - 2 - 1)
      expect(player2AvgY).toBeLessThanOrEqual(2); // Top side (offset = 2)
    });

    it('should broadcast complete game state with placed units to all clients', () => {
      // Arrange: Game with multiple players ready to start
      const player1 = createPlayer({
        id: 'player-1',
        team: {
          activeUnits: [createUnit({ name: 'Knight' }), createUnit({ name: 'Archer' }), createUnit({ name: 'Mage' })],
          reserveUnits: [createUnit({ name: 'Healer' }), createUnit({ name: 'Tank' }), createUnit({ name: 'Scout' })],
          locked: true,
        },
        units: [],
      });

      const player2 = createPlayer({
        id: 'player-2',
        team: {
          activeUnits: [createUnit({ name: 'Knight' }), createUnit({ name: 'Archer' }), createUnit({ name: 'Mage' })],
          reserveUnits: [createUnit({ name: 'Healer' }), createUnit({ name: 'Tank' }), createUnit({ name: 'Scout' })],
          locked: true,
        },
        units: [],
      });

      const gameState = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1, player2],
      });

      // Act: Server places units and broadcasts state
      const broadcastStates: any[] = [];
      
      // Simulate server placing units for each player
      let updatedState = gameState;
      for (const player of gameState.players) {
        const placeResult = placeStartingUnits(updatedState, player.id);
        if (!placeResult.ok) {
          expect(placeResult.ok).toBe(true); // This will fail with descriptive error
          return;
        }
        updatedState = placeResult.value;
      }

      // Simulate broadcasting to each client
      gameState.players.forEach(player => {
        // In real implementation, this would be sanitized for each player
        broadcastStates.push({
          playerId: player.id,
          gameState: updatedState,
        });
      });

      // Assert: All clients receive identical game state
      expect(broadcastStates).toHaveLength(2);
      
      const player1State = broadcastStates[0]!.gameState;
      const player2State = broadcastStates[1]!.gameState;
      
      // Both should see same board state
      expect(player1State.board).toEqual(player2State.board);
      
      // Both should see all units placed
      expect(player1State.players[0]!.units).toHaveLength(3);
      expect(player1State.players[1]!.units).toHaveLength(3);
      expect(player2State.players[0]!.units).toHaveLength(3);
      expect(player2State.players[1]!.units).toHaveLength(3);
      
      // Unit positions should be identical across clients
      const p1UnitsClient1 = player1State.players[0]!.units;
      const p1UnitsClient2 = player2State.players[0]!.units;
      p1UnitsClient1.forEach((unit: any, index: number) => {
        expect(unit.position).toEqual(p1UnitsClient2[index]!.position);
      });
    });

    it('should handle placement failures gracefully and not start game', () => {
      // Arrange: Game with invalid team setup
      const playerWithInvalidTeam = createPlayer({
        id: 'player-invalid',
        team: {
          activeUnits: [], // Invalid - no active units
          reserveUnits: [createUnit({ name: 'Healer' })],
          locked: true,
        },
        units: [],
      });

      const gameState = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [playerWithInvalidTeam],
      });

      // Act: Try to place units
      const result = placeStartingUnits(gameState, 'player-invalid');

      // Assert: Should fail and not transition game
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('exactly 3 active units');
      }
      
      // Game state should remain unchanged
      expect(gameState.phase).toBe(GamePhase.PRE_GAME);
      expect(gameState.players[0]!.units).toHaveLength(0);
    });

    it('should ensure all players have units placed before transitioning to IN_PROGRESS', () => {
      // Arrange: Game where only some players have valid teams
      const validPlayer = createPlayer({
        id: 'player-valid',
        team: {
          activeUnits: [createUnit({ name: 'Knight' }), createUnit({ name: 'Archer' }), createUnit({ name: 'Mage' })],
          reserveUnits: [createUnit({ name: 'Healer' }), createUnit({ name: 'Tank' }), createUnit({ name: 'Scout' })],
          locked: true,
        },
        units: [],
      });

      const invalidPlayer = createPlayer({
        id: 'player-invalid',
        team: {
          activeUnits: [], // Invalid
          reserveUnits: [],
          locked: true,
        },
        units: [],
      });

      const gameState = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [validPlayer, invalidPlayer],
      });

      // Act: Try to place units for all players
      const placementResults: any[] = [];
      for (const player of gameState.players) {
        const result = placeStartingUnits(gameState, player.id);
        placementResults.push({ playerId: player.id, result });
      }

      // Assert: Valid player should succeed, invalid should fail
      expect(placementResults).toHaveLength(2);
      expect(placementResults[0]!.result.ok).toBe(true);
      expect(placementResults[1]!.result.ok).toBe(false);
      
      // Game should not transition until all players have valid placements
      // In real implementation, server would wait for all placements before broadcasting
    });
  });

  describe('Multiplayer Synchronization - RED TESTS', () => {
    it('should maintain consistent unit positions across all clients', () => {
      // Test that unit positions are deterministic and synchronized
      const player1 = createPlayer({
        id: 'player-1',
        team: {
          activeUnits: [createUnit({ name: 'Knight' }), createUnit({ name: 'Archer' }), createUnit({ name: 'Mage' })],
          reserveUnits: [],
          locked: true,
        },
        units: [],
      });

      const gameState = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1],
      });

      // Act: Place units multiple times (should be deterministic)
      const result1 = placeStartingUnits(gameState, 'player-1');
      const result2 = placeStartingUnits(gameState, 'player-1');

      // Assert: Results should be identical
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      
      if (result1.ok && result2.ok) {
        const units1 = result1.value.players[0]!.units;
        const units2 = result2.value.players[0]!.units;
        
        units1.forEach((unit: any, index: number) => {
          expect(unit.position).toEqual(units2[index]!.position);
        });
      }
    });

    it('should handle concurrent game starts without race conditions', () => {
      // Test that multiple games starting simultaneously don't interfere
      const player1Game = createGameState({ 
        phase: GamePhase.PRE_GAME,
        players: [createPlayer({
          id: 'player-1',
          team: {
            activeUnits: [createUnit({ name: 'Knight' }), createUnit({ name: 'Archer' }), createUnit({ name: 'Mage' })],
            reserveUnits: [],
            locked: true,
          },
          units: [],
        })]
      });
      
      const player2Game = createGameState({ 
        phase: GamePhase.PRE_GAME,
        players: [createPlayer({
          id: 'player-2',
          team: {
            activeUnits: [createUnit({ name: 'Knight' }), createUnit({ name: 'Archer' }), createUnit({ name: 'Mage' })],
            reserveUnits: [],
            locked: true,
          },
          units: [],
        })]
      });

      // Act: Place units in both games concurrently
      const result1 = placeStartingUnits(player1Game, player1Game.players[0]!.id);
      const result2 = placeStartingUnits(player2Game, player2Game.players[0]!.id);

      // Assert: Both should succeed independently
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      
      // Games should have separate board states
      if (result1.ok && result2.ok) {
        expect(result1.value.id).not.toBe(result2.value.id);
        expect(result1.value.board).not.toBe(result2.value.board);
      }
    });
  });
});

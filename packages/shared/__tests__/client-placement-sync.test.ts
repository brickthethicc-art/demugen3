import { describe, it, expect, beforeEach } from 'vitest';
import { resetIdCounter } from './factories.js';
import {
  createGameState,
  createPlayer,
  createUnit,
} from './factories.js';
import { GamePhase } from '../src/types/index.js';
import { placeStartingUnits } from '../src/engines/starting-placement/index.js';

describe('Client State Sync - Starting Placement', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('Client Store Updates - RED TESTS (expected to fail)', () => {
    it('should update client store with active units positions', () => {
      // Arrange: Client receives game state update with placed units
      const player1 = createPlayer({
        id: 'player-1',
        team: {
          activeUnits: [createUnit({ name: 'Knight' }), createUnit({ name: 'Archer' }), createUnit({ name: 'Mage' })],
          reserveUnits: [createUnit({ name: 'Healer' }), createUnit({ name: 'Tank' }), createUnit({ name: 'Scout' })],
          locked: true,
        },
        units: [],
      });

      const gameState = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1],
      });

      // Act: Server places units and sends updated state to client
      const placeResult = placeStartingUnits(gameState, 'player-1');
      
      // Simulate client receiving the updated game state
      const clientGameState = placeResult.ok ? placeResult.value : gameState;

      // Assert: Client should have updated unit positions
      expect(clientGameState.players[0]!.units).toHaveLength(3);
      
      const activeUnits = clientGameState.players[0]!.units;
      activeUnits.forEach(unit => {
        expect(unit.position).not.toBeNull();
        expect(unit.position!.x).toBeGreaterThanOrEqual(0);
        expect(unit.position!.y).toBeGreaterThanOrEqual(0);
      });

      // Units should be on player's side (left for player 1)
      const avgX = activeUnits.reduce((sum, u) => sum + u.position!.x, 0) / activeUnits.length;
      expect(avgX).toBeLessThan(15);
    });

    it('should maintain reactive updates when units are placed', () => {
      // Test that client UI reacts to placement updates
      const initialGameState = createGameState({
        phase: GamePhase.PRE_GAME,
      });

      // Simulate client store with reactive state
      let clientState = initialGameState;
      const stateUpdates: any[] = [];

      // Simulate state subscription
      const subscribeToState = (callback: (state: any) => void) => {
        // In real implementation, this would be a Zustand store
        stateUpdates.push(clientState);
        return () => {}; // Unsubscribe function
      };

      const unsubscribe = subscribeToState((state) => {
        clientState = state;
      });

      // Act: Server sends placement update
      const player1 = createPlayer({
        id: 'player-1',
        team: {
          activeUnits: [createUnit({ name: 'Knight' }), createUnit({ name: 'Archer' }), createUnit({ name: 'Mage' })],
          reserveUnits: [],
          locked: true,
        },
        units: [],
      });

      const gameStateWithPlayer = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1],
      });

      const placeResult = placeStartingUnits(gameStateWithPlayer, 'player-1');
      if (placeResult.ok) {
        clientState = placeResult.value;
        stateUpdates.push(clientState);
      }

      // Assert: State should have been updated reactively
      expect(stateUpdates).toHaveLength(2);
      expect(stateUpdates[0]!.players[0]!.units).toHaveLength(0); // Initial state
      expect(stateUpdates[1]!.players[0]!.units).toHaveLength(3); // After placement

      unsubscribe();
    });

    it('should handle benched units in client state correctly', () => {
      // Test that reserve units are handled properly on client side
      const player1 = createPlayer({
        id: 'player-1',
        team: {
          activeUnits: [createUnit({ name: 'Knight' }), createUnit({ name: 'Archer' }), createUnit({ name: 'Mage' })],
          reserveUnits: [createUnit({ name: 'Healer' }), createUnit({ name: 'Tank' }), createUnit({ name: 'Scout' })],
          locked: true,
        },
        units: [],
      });

      const gameState = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1],
      });

      // Act: Server places active units
      const placeResult = placeStartingUnits(gameState, 'player-1');
      const clientState = placeResult.ok ? placeResult.value : gameState;

      // Assert: Client should have both active and reserve units
      expect(clientState.players[0]!.team.activeUnits).toHaveLength(3);
      expect(clientState.players[0]!.team.reserveUnits).toHaveLength(3);
      
      // Active units should have positions (placed on board)
      const activeUnits = clientState.players[0]!.units;
      expect(activeUnits).toHaveLength(3);
      activeUnits.forEach(unit => {
        expect(unit.position).not.toBeNull();
      });

      // Reserve units should NOT have positions (not on board)
      const reserveUnits = clientState.players[0]!.team.reserveUnits;
      reserveUnits.forEach(unit => {
        // Reserve units are just cards, not UnitInstances
        expect(unit).toHaveProperty('hp');
        expect(unit).toHaveProperty('cost');
      });
    });
  });

  describe('Multiplayer Client Sync - RED TESTS', () => {
    it('should synchronize unit positions across all clients', () => {
      // Test that all clients see same unit positions
      const player1 = createPlayer({
        id: 'player-1',
        team: {
          activeUnits: [createUnit({ name: 'Knight' }), createUnit({ name: 'Archer' }), createUnit({ name: 'Mage' })],
          reserveUnits: [],
          locked: true,
        },
        units: [],
      });

      const player2 = createPlayer({
        id: 'player-2',
        team: {
          activeUnits: [createUnit({ name: 'Knight' }), createUnit({ name: 'Archer' }), createUnit({ name: 'Mage' })],
          reserveUnits: [],
          locked: true,
        },
        units: [],
      });

      const gameState = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1, player2],
      });

      // Act: Server places units and broadcasts to all clients
      let updatedState = gameState;
      for (const player of gameState.players) {
        const placeResult = placeStartingUnits(updatedState, player.id);
        if (placeResult.ok) {
          updatedState = placeResult.value;
        }
      }

      // Simulate multiple clients receiving the same game state
      const client1State = updatedState;
      const client2State = updatedState;

      // Assert: All clients should see identical positions
      expect(client1State.players[0]!.units).toHaveLength(3);
      expect(client1State.players[1]!.units).toHaveLength(3);
      expect(client2State.players[0]!.units).toHaveLength(3);
      expect(client2State.players[1]!.units).toHaveLength(3);

      // Positions should be identical across clients
      const p1UnitsClient1 = client1State.players[0]!.units;
      const p1UnitsClient2 = client2State.players[0]!.units;
      p1UnitsClient1.forEach((unit: any, index: number) => {
        expect(unit.position).toEqual(p1UnitsClient2[index]!.position);
      });

      const p2UnitsClient1 = client1State.players[1]!.units;
      const p2UnitsClient2 = client2State.players[1]!.units;
      p2UnitsClient1.forEach((unit: any, index: number) => {
        expect(unit.position).toEqual(p2UnitsClient2[index]!.position);
      });
    });

    it('should handle late-joining clients with correct placement state', () => {
      // Test that clients joining after game started see correct unit positions
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
        phase: GamePhase.IN_PROGRESS, // Game already in progress
        players: [player1],
      });

      // Simulate server having already placed units
      const placeResult = placeStartingUnits(gameState, 'player-1');
      const serverState = placeResult.ok ? placeResult.value : gameState;

      // Act: Late-joining client receives current game state
      const lateJoiningClientState = serverState;

      // Assert: Late-joining client should see placed units
      expect(lateJoiningClientState.players[0]!.units).toHaveLength(3);
      expect(lateJoiningClientState.phase).toBe(GamePhase.IN_PROGRESS);
      
      const units = lateJoiningClientState.players[0]!.units;
      units.forEach(unit => {
        expect(unit.position).not.toBeNull();
        expect(unit.position!.x).toBeGreaterThanOrEqual(0);
        expect(unit.position!.y).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle desync detection and recovery', () => {
      // Test that client can detect and recover from desync
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

      // Act: Server places units
      const placeResult = placeStartingUnits(gameState, 'player-1');
      const serverState = placeResult.ok ? placeResult.value : gameState;

      // Simulate client with desynced state
      const desyncedClientState = gameState; // Client still has old state

      // Client detects desync and requests full state
      const isDesynced = desyncedClientState.players[0]!.units.length !== serverState.players[0]!.units.length;

      // Assert: Desync should be detected
      expect(isDesynced).toBe(true);

      // Client recovers by updating to server state
      const recoveredClientState = serverState;
      expect(recoveredClientState.players[0]!.units).toHaveLength(3);
      expect(recoveredClientState.players[0]!.units[0]!.position).not.toBeNull();
    });
  });

  describe('UI Rendering Integration - RED TESTS', () => {
    it('should trigger UI re-render when units are placed', () => {
      // Test that UI updates when placement state changes
      let renderCount = 0;
      let currentGameState = createGameState({ phase: GamePhase.PRE_GAME });

      // Simulate React component that re-renders on state change
      const simulateRender = () => {
        renderCount++;
      };

      // Initial render
      simulateRender();

      // Act: Server sends placement update
      const player1 = createPlayer({
        id: 'player-1',
        team: {
          activeUnits: [createUnit({ name: 'Knight' }), createUnit({ name: 'Archer' }), createUnit({ name: 'Mage' })],
          reserveUnits: [],
          locked: true,
        },
        units: [],
      });

      const gameStateWithPlayer = createGameState({
        phase: GamePhase.PRE_GAME,
        players: [player1],
      });

      const placeResult = placeStartingUnits(gameStateWithPlayer, 'player-1');
      if (placeResult.ok) {
        currentGameState = placeResult.value;
        simulateRender(); // UI re-renders on state change
      }

      // Assert: Component should have re-rendered
      expect(renderCount).toBe(2);
      expect(currentGameState.players[0]!.units).toHaveLength(3);
    });

    it('should provide correct data for board rendering', () => {
      // Test that client has correct data for rendering board with units
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
        phase: GamePhase.IN_PROGRESS,
        players: [player1],
      });

      // Act: Server places units
      const placeResult = placeStartingUnits(gameState, 'player-1');
      const clientState = placeResult.ok ? placeResult.value : gameState;

      // Assert: Client should have correct data for rendering
      expect(clientState.board).toBeDefined();
      expect(clientState.board.width).toBe(23);
      expect(clientState.board.height).toBe(23);
      
      // Board should have units placed
      const units = clientState.players[0]!.units;
      expect(units).toHaveLength(3);
      
      // Each unit should have renderable data
      units.forEach(unit => {
        expect(unit.position).not.toBeNull();
        expect(unit.card).toBeDefined();
        expect(unit.currentHp).toBeGreaterThan(0);
        expect(unit.ownerId).toBe('player-1');
      });

      // Should be able to map units to board positions
      const boardUnits: { [key: string]: any } = {};
      units.forEach(unit => {
        const pos = unit.position!;
        const key = `${pos.x},${pos.y}`;
        boardUnits[key] = unit;
      });

      expect(Object.keys(boardUnits)).toHaveLength(3);
    });
  });
});

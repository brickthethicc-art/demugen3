import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '../src/store/game-store.js';
import { CardType, AbilityType } from '@mugen/shared';
// Helper function to create a mock UnitCard
const createMockUnitCard = (id, name, cost, hp, atk) => ({
    id,
    name,
    cardType: CardType.UNIT,
    hp,
    maxHp: hp,
    atk,
    movement: 2,
    range: 1,
    ability: {
        id: `${id}-ability`,
        name: `${name} Ability`,
        description: 'Test ability',
        cost: 1,
        abilityType: AbilityType.DAMAGE,
    },
    cost,
});
// Mock the game state for testing
const createMockGameState = (playerId, units, benchUnits) => ({
    id: 'test-game',
    phase: 'IN_PROGRESS',
    turnPhase: 'MOVE',
    currentPlayerIndex: 0,
    turnNumber: 1,
    turnRotation: 0,
    movesUsedThisTurn: 0,
    winnerId: null,
    board: { width: 30, height: 30, cells: [] },
    players: [{
            id: playerId,
            name: 'Test Player',
            life: 24,
            maxLife: 24,
            team: {
                activeUnits: benchUnits.slice(0, 3),
                reserveUnits: benchUnits,
                locked: true,
            },
            units,
            hand: { cards: [] },
            deck: { cards: [] },
            isEliminated: false,
            isReady: true,
            isConnected: true,
            reserveLockedUntilNextTurn: false,
        }],
});
describe('Client Store - Placement Integration', () => {
    beforeEach(() => {
        // Reset store before each test
        const { reset } = useGameStore.getState();
        reset();
    });
    it('should update activeUnits and benchUnits when gameState changes', () => {
        // Arrange: Set up initial store state
        const { result } = renderHook(() => useGameStore());
        const playerId = 'test-player';
        act(() => {
            result.current.setPlayerId(playerId);
        });
        // Create mock units and bench units
        const mockUnits = [
            {
                card: createMockUnitCard('unit-1', 'Knight', 5, 10, 3),
                currentHp: 10,
                position: { x: 5, y: 10 },
                ownerId: playerId,
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            },
            {
                card: createMockUnitCard('unit-2', 'Archer', 4, 8, 4),
                currentHp: 8,
                position: { x: 5, y: 12 },
                ownerId: playerId,
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            },
            {
                card: createMockUnitCard('unit-3', 'Mage', 6, 6, 5),
                currentHp: 6,
                position: { x: 5, y: 14 },
                ownerId: playerId,
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            },
        ];
        const mockBenchUnits = [
            createMockUnitCard('bench-1', 'Healer', 3, 7, 2),
            createMockUnitCard('bench-2', 'Tank', 7, 15, 2),
            createMockUnitCard('bench-3', 'Scout', 2, 5, 3),
        ];
        const mockGameState = createMockGameState(playerId, mockUnits, mockBenchUnits);
        // Act: Update game state
        act(() => {
            result.current.setGameState(mockGameState);
        });
        // Assert: Store should have updated active and bench units
        expect(result.current.activeUnits).toHaveLength(3);
        expect(result.current.benchUnits).toHaveLength(3);
        // Check active units have correct positions
        expect(result.current.activeUnits[0].position).toEqual({ x: 5, y: 10 });
        expect(result.current.activeUnits[1].position).toEqual({ x: 5, y: 12 });
        expect(result.current.activeUnits[2].position).toEqual({ x: 5, y: 14 });
        // Check bench units are correct cards
        expect(result.current.benchUnits[0].name).toBe('Healer');
        expect(result.current.benchUnits[1].name).toBe('Tank');
        expect(result.current.benchUnits[2].name).toBe('Scout');
    });
    it('should clear activeUnits and benchUnits when gameState is null', () => {
        // Arrange: Set up store with game state
        const { result } = renderHook(() => useGameStore());
        const playerId = 'test-player';
        act(() => {
            result.current.setPlayerId(playerId);
        });
        const mockGameState = createMockGameState(playerId, [], []);
        act(() => {
            result.current.setGameState(mockGameState);
        });
        expect(result.current.activeUnits).toHaveLength(0);
        expect(result.current.benchUnits).toHaveLength(0);
        // Act: Clear game state
        act(() => {
            result.current.setGameState(null);
        });
        // Assert: Units should be cleared
        expect(result.current.activeUnits).toHaveLength(0);
        expect(result.current.benchUnits).toHaveLength(0);
    });
    it('should handle gameState updates for different players correctly', () => {
        // Arrange: Set up store with player 1
        const { result } = renderHook(() => useGameStore());
        const player1Id = 'player-1';
        const player2Id = 'player-2';
        act(() => {
            result.current.setPlayerId(player1Id);
        });
        // Create game state with two players
        const player1Units = [
            {
                card: createMockUnitCard('unit-1', 'Knight', 5, 10, 3),
                currentHp: 10,
                position: { x: 5, y: 10 },
                ownerId: player1Id,
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            },
        ];
        const player2Units = [
            {
                card: createMockUnitCard('unit-2', 'Archer', 4, 8, 4),
                currentHp: 8,
                position: { x: 25, y: 10 },
                ownerId: player2Id,
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            },
        ];
        const gameStateWithTwoPlayers = {
            id: 'test-game',
            phase: 'IN_PROGRESS',
            turnPhase: 'MOVE',
            currentPlayerIndex: 0,
            turnNumber: 1,
            turnRotation: 0,
            movesUsedThisTurn: 0,
            winnerId: null,
            board: { width: 30, height: 30, cells: [] },
            players: [
                {
                    id: player1Id,
                    name: 'Player 1',
                    life: 24,
                    maxLife: 24,
                    team: { activeUnits: [], reserveUnits: [], locked: true },
                    units: player1Units,
                    hand: { cards: [] },
                    deck: { cards: [] },
                    isEliminated: false,
                    isReady: true,
                    isConnected: true,
                    reserveLockedUntilNextTurn: false,
                },
                {
                    id: player2Id,
                    name: 'Player 2',
                    life: 24,
                    maxLife: 24,
                    team: { activeUnits: [], reserveUnits: [], locked: true },
                    units: player2Units,
                    hand: { cards: [] },
                    deck: { cards: [] },
                    isEliminated: false,
                    isReady: true,
                    isConnected: true,
                    reserveLockedUntilNextTurn: false,
                },
            ],
        };
        // Act: Set game state
        act(() => {
            result.current.setGameState(gameStateWithTwoPlayers);
        });
        // Assert: activeUnits contains ALL players' units (for full board rendering)
        expect(result.current.activeUnits).toHaveLength(2);
        expect(result.current.activeUnits[0].card.name).toBe('Knight');
        expect(result.current.activeUnits[0].position).toEqual({ x: 5, y: 10 });
        expect(result.current.activeUnits[1].card.name).toBe('Archer');
        expect(result.current.activeUnits[1].position).toEqual({ x: 25, y: 10 });
        // Act: Switch to player 2
        act(() => {
            result.current.setPlayerId(player2Id);
            result.current.setGameState(gameStateWithTwoPlayers);
        });
        // Assert: activeUnits still contains ALL players' units regardless of local player
        expect(result.current.activeUnits).toHaveLength(2);
        // benchUnits should now reflect player 2's reserves
        expect(result.current.benchUnits).toHaveLength(0); // player 2 has no reserves in this test
    });
    it('should provide reactive updates when units are placed', () => {
        // Test that components re-render when placement state changes
        const { result } = renderHook(() => useGameStore());
        const playerId = 'test-player';
        act(() => {
            result.current.setPlayerId(playerId);
        });
        // Initial state - no units
        expect(result.current.activeUnits).toHaveLength(0);
        // Create and set game state with units
        const mockUnits = [
            {
                card: createMockUnitCard('unit-1', 'Knight', 5, 10, 3),
                currentHp: 10,
                position: { x: 5, y: 10 },
                ownerId: playerId,
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            },
        ];
        const mockGameState = createMockGameState(playerId, mockUnits, []);
        // Act: Update game state (should trigger re-render)
        act(() => {
            result.current.setGameState(mockGameState);
        });
        // Assert: Should have updated units
        expect(result.current.activeUnits).toHaveLength(1);
        expect(result.current.activeUnits[0].card.name).toBe('Knight');
    });
});
//# sourceMappingURL=store-placement-integration.test.js.map
/**
 * Test to verify the game store fix works correctly
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getVisibleUnits } from '@mugen/shared/src/engines/visibility/index.js';
import { resetIdCounter, createUnit, createPlayer, createGameState, } from '@mugen/shared/__tests__/factories.js';
import { GamePhase } from '@mugen/shared/src/types/index.js';
// Mock the game store logic
function mockGameStoreLogic(gameState, playerId) {
    // OLD BUGGY LOGIC (what was happening before)
    const oldBuggyLogic = gameState.players.flatMap((p) => p.units);
    // NEW FIXED LOGIC (what should happen now)
    const newCorrectLogic = getVisibleUnits(gameState);
    const currentPlayer = gameState.players.find((p) => p.id === playerId);
    const bench = currentPlayer ? currentPlayer.team.reserveUnits : [];
    return {
        oldActiveUnits: oldBuggyLogic,
        newActiveUnits: newCorrectLogic,
        benchUnits: bench,
    };
}
describe('Game Store Fix Verification', () => {
    beforeEach(() => resetIdCounter());
    it('should return only 6 active units instead of 12 (including bench)', () => {
        // Create test scenario
        const player1Units = [
            createUnit({ id: 'u01', name: 'Scout Wisp' }),
            createUnit({ id: 'u05', name: 'Shadow Imp' }),
            createUnit({ id: 'u09', name: 'Stone Sentinel' }),
        ];
        const player2Units = [
            createUnit({ id: 'u01', name: 'Scout Wisp' }),
            createUnit({ id: 'u05', name: 'Shadow Imp' }),
            createUnit({ id: 'u09', name: 'Stone Sentinel' }),
        ];
        const gameState = createGameState({
            phase: GamePhase.IN_PROGRESS,
            players: [
                createPlayer({
                    id: 'LcOkGUyZLZQvt8BgAAAF',
                    team: {
                        activeUnits: player1Units,
                        reserveUnits: player1Units, // Same units as reserve
                        locked: true,
                    },
                    units: [], // Will be populated
                    color: 'red',
                }),
                createPlayer({
                    id: 'r67R0u9QIwNx2XaHAAAH',
                    team: {
                        activeUnits: player2Units,
                        reserveUnits: player2Units, // Same units as reserve
                        locked: true,
                    },
                    units: [], // Will be populated
                    color: 'blue',
                }),
            ],
        });
        // Simulate spawn - add both active and bench units
        gameState.players[0].units = [
            // Active units (on board)
            ...player1Units.map((card, i) => ({
                card,
                currentHp: card.hp,
                position: { x: 7 + i * 4, y: 20 }, // On board
                ownerId: 'LcOkGUyZLZQvt8BgAAAF',
                color: 'red',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            })),
            // Bench units (off board)
            ...player1Units.map((card, i) => ({
                card,
                currentHp: card.hp,
                position: { x: -1, y: i }, // Off board
                ownerId: 'LcOkGUyZLZQvt8BgAAAF',
                color: 'red',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            })),
        ];
        gameState.players[1].units = [
            // Active units (on board)
            ...player2Units.map((card, i) => ({
                card,
                currentHp: card.hp,
                position: { x: 7 + i * 4, y: 2 }, // On board
                ownerId: 'r67R0u9QIwNx2XaHAAAH',
                color: 'blue',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            })),
            // Bench units (off board)
            ...player2Units.map((card, i) => ({
                card,
                currentHp: card.hp,
                position: { x: -1, y: i }, // Off board
                ownerId: 'r67R0u9QIwNx2XaHAAAH',
                color: 'blue',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            })),
        ];
        // Test the fix
        const result = mockGameStoreLogic(gameState, 'LcOkGUyZLZQvt8BgAAAF');
        console.log('=== BEFORE FIX (Buggy) ===');
        console.log('Active units returned:', result.oldActiveUnits.length);
        console.log('Bench units returned:', result.benchUnits.length);
        console.log('=== AFTER FIX (Correct) ===');
        console.log('Active units returned:', result.newActiveUnits.length);
        console.log('Bench units returned:', result.benchUnits.length);
        // Assertions
        expect(result.oldActiveUnits).toHaveLength(12); // 6 active + 6 bench (BUG)
        expect(result.newActiveUnits).toHaveLength(6); // 6 active only (FIXED)
        expect(result.benchUnits).toHaveLength(3); // 3 bench for local player
    });
    it('should filter out bench units with negative positions', () => {
        const gameState = createGameState({
            phase: GamePhase.IN_PROGRESS,
            players: [
                createPlayer({
                    id: 'player1',
                    team: {
                        activeUnits: [createUnit({ id: 'u1' })],
                        reserveUnits: [createUnit({ id: 'u2' })],
                        locked: true,
                    },
                    units: [
                        {
                            card: createUnit({ id: 'u1' }),
                            currentHp: 5,
                            position: { x: 5, y: 5 }, // On board
                            ownerId: 'player1',
                            color: 'red',
                            hasMovedThisTurn: false,
                            hasUsedAbilityThisTurn: false,
                            hasAttackedThisTurn: false,
                            combatModifiers: [],
                        },
                        {
                            card: createUnit({ id: 'u2' }),
                            currentHp: 5,
                            position: { x: -1, y: 0 }, // Off board (bench)
                            ownerId: 'player1',
                            color: 'red',
                            hasMovedThisTurn: false,
                            hasUsedAbilityThisTurn: false,
                            hasAttackedThisTurn: false,
                            combatModifiers: [],
                        },
                    ],
                    color: 'red',
                }),
            ],
        });
        const visibleUnits = getVisibleUnits(gameState);
        expect(visibleUnits).toHaveLength(1); // Only the on-board unit
        expect(visibleUnits[0].card.id).toBe('u1');
        expect(visibleUnits[0].position).toEqual({ x: 5, y: 5 });
    });
});
//# sourceMappingURL=game-store-fix.test.js.map
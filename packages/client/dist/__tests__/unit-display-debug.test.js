/**
 * Debug test to verify frontend unit display functionality
 * This test simulates the exact scenario from the user's logs
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getVisibleUnits } from '@mugen/shared/src/engines/visibility/index.js';
import { resetIdCounter, createUnit, createPlayer, createGameState, } from '@mugen/shared/__tests__/factories.js';
import { GamePhase } from '@mugen/shared/src/types/index.js';
describe('Frontend Unit Display Debug', () => {
    beforeEach(() => resetIdCounter());
    it('should correctly show 6 units (3 per player) with proper colors and positions', () => {
        // Create the exact scenario from user logs
        const player1Units = [
            createUnit({ id: 'u01', name: 'Scout Wisp' }),
            createUnit({ id: 'u05', name: 'Shadow Imp' }),
            createUnit({ id: 'u09', name: 'Stone Sentinel' }),
        ];
        const player2Units = [
            createUnit({ id: 'u01', name: 'Scout Wisp' }), // Same IDs as player 1
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
                        reserveUnits: [],
                        locked: true,
                    },
                    units: [], // Will be populated by spawn logic
                    color: 'red',
                }),
                createPlayer({
                    id: 'r67R0u9QIwNx2XaHAAAH',
                    team: {
                        activeUnits: player2Units,
                        reserveUnits: [],
                        locked: true,
                    },
                    units: [], // Will be populated by spawn logic
                    color: 'blue',
                }),
            ],
        });
        // Simulate the spawn process - create unit instances with positions
        // Player 1 (red) - bottom side
        gameState.players[0].units = [
            {
                card: player1Units[0],
                currentHp: 2,
                position: { x: 7, y: 20 }, // Bottom side
                ownerId: 'LcOkGUyZLZQvt8BgAAAF',
                color: 'red',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            },
            {
                card: player1Units[1],
                currentHp: 3,
                position: { x: 11, y: 20 }, // Bottom side
                ownerId: 'LcOkGUyZLZQvt8BgAAAF',
                color: 'red',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            },
            {
                card: player1Units[2],
                currentHp: 8,
                position: { x: 15, y: 20 }, // Bottom side
                ownerId: 'LcOkGUyZLZQvt8BgAAAF',
                color: 'red',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            },
        ];
        // Player 2 (blue) - top side
        gameState.players[1].units = [
            {
                card: player2Units[0],
                currentHp: 2,
                position: { x: 7, y: 2 }, // Top side
                ownerId: 'r67R0u9QIwNx2XaHAAAH',
                color: 'blue',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            },
            {
                card: player2Units[1],
                currentHp: 3,
                position: { x: 11, y: 2 }, // Top side
                ownerId: 'r67R0u9QIwNx2XaHAAAH',
                color: 'blue',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            },
            {
                card: player2Units[2],
                currentHp: 8,
                position: { x: 15, y: 2 }, // Top side
                ownerId: 'r67R0u9QIwNx2XaHAAAH',
                color: 'blue',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            },
        ];
        // Test the getVisibleUnits function
        const visibleUnits = getVisibleUnits(gameState);
        console.log('=== DEBUG: getVisibleUnits result ===');
        console.log('Total visible units:', visibleUnits.length);
        visibleUnits.forEach((unit, i) => {
            console.log(`Unit ${i}: ${unit.card.id} (${unit.card.name}) - Owner: ${unit.ownerId}, Color: ${unit.color}, Pos: (${unit.position.x}, ${unit.position.y})`);
        });
        // Assertions
        expect(visibleUnits).toHaveLength(6); // 3 per player
        // Check player 1 (red) units
        const player1Visible = visibleUnits.filter(u => u.ownerId === 'LcOkGUyZLZQvt8BgAAAF');
        expect(player1Visible).toHaveLength(3);
        expect(player1Visible.every(u => u.color === 'red')).toBe(true);
        expect(player1Visible.every(u => u.position.y >= 19)).toBe(true); // Bottom side
        // Check player 2 (blue) units
        const player2Visible = visibleUnits.filter(u => u.ownerId === 'r67R0u9QIwNx2XaHAAAH');
        expect(player2Visible).toHaveLength(3);
        expect(player2Visible.every(u => u.color === 'blue')).toBe(true);
        expect(player2Visible.every(u => u.position.y <= 3)).toBe(true); // Top side
    });
    it('should test the current game store logic vs getVisibleUnits', () => {
        // Same setup as above
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
                        reserveUnits: [],
                        locked: true,
                    },
                    units: [],
                    color: 'red',
                }),
                createPlayer({
                    id: 'r67R0u9QIwNx2XaHAAAH',
                    team: {
                        activeUnits: player2Units,
                        reserveUnits: [],
                        locked: true,
                    },
                    units: [],
                    color: 'blue',
                }),
            ],
        });
        // Add bench units (should NOT be visible)
        gameState.players[0].units = [
            ...player1Units.map((card, i) => ({
                card,
                currentHp: card.hp,
                position: { x: 7 + i * 4, y: 20 }, // Active units on board
                ownerId: 'LcOkGUyZLZQvt8BgAAAF',
                color: 'red',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            })),
            ...player1Units.map((card, i) => ({
                card,
                currentHp: card.hp,
                position: { x: -1, y: i }, // Bench units off-board
                ownerId: 'LcOkGUyZLZQvt8BgAAAF',
                color: 'red',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            })),
        ];
        gameState.players[1].units = [
            ...player2Units.map((card, i) => ({
                card,
                currentHp: card.hp,
                position: { x: 7 + i * 4, y: 2 }, // Active units on board
                ownerId: 'r67R0u9QIwNx2XaHAAAH',
                color: 'blue',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            })),
            ...player2Units.map((card, i) => ({
                card,
                currentHp: card.hp,
                position: { x: -1, y: i }, // Bench units off-board
                ownerId: 'r67R0u9QIwNx2XaHAAAH',
                color: 'blue',
                hasMovedThisTurn: false,
                hasUsedAbilityThisTurn: false,
                hasAttackedThisTurn: false,
                combatModifiers: [],
            })),
        ];
        // Test current game store logic (line 89 in game-store.ts)
        const currentStoreLogic = gameState.players.flatMap(p => p.units);
        console.log('=== DEBUG: Current store logic ===');
        console.log('Total units (including bench):', currentStoreLogic.length);
        currentStoreLogic.forEach((unit, i) => {
            console.log(`Unit ${i}: ${unit.card.id} - Owner: ${unit.ownerId}, Pos: (${unit.position?.x ?? 'null'}, ${unit.position?.y ?? 'null'})`);
        });
        // Test correct getVisibleUnits logic
        const correctLogic = getVisibleUnits(gameState);
        console.log('=== DEBUG: Correct getVisibleUnits logic ===');
        console.log('Total visible units (active only):', correctLogic.length);
        correctLogic.forEach((unit, i) => {
            console.log(`Unit ${i}: ${unit.card.id} - Owner: ${unit.ownerId}, Pos: (${unit.position.x}, ${unit.position.y})`);
        });
        // The bug: current logic returns 12 units (6 active + 6 bench)
        expect(currentStoreLogic).toHaveLength(12);
        // Correct logic should return only 6 active units
        expect(correctLogic).toHaveLength(6);
    });
});
//# sourceMappingURL=unit-display-debug.test.js.map
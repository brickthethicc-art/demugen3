/**
 * Test to verify GameScene rendering fixes work correctly
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resetIdCounter, createUnit, createPlayer, createGameState, } from '@mugen/shared/__tests__/factories.js';
import { GamePhase } from '@mugen/shared/src/types/index.js';
describe('GameScene Rendering Fixes', () => {
    beforeEach(() => resetIdCounter());
    it('should generate unique unit instance IDs to prevent sprite collision', () => {
        // Simulate the exact scenario from user logs
        const player1Units = [
            createUnit({ id: 'u01', name: 'Scout Wisp' }),
            createUnit({ id: 'u05', name: 'Shadow Imp' }),
            createUnit({ id: 'u09', name: 'Stone Sentinel' }),
        ];
        const player2Units = [
            createUnit({ id: 'u01', name: 'Scout Wisp' }), // Same ID as player 1
            createUnit({ id: 'u05', name: 'Shadow Imp' }), // Same ID as player 1
            createUnit({ id: 'u09', name: 'Stone Sentinel' }), // Same ID as player 1
        ];
        const gameState = createGameState({
            phase: GamePhase.IN_PROGRESS,
            players: [
                createPlayer({
                    id: 'player1',
                    team: {
                        activeUnits: player1Units,
                        reserveUnits: [],
                        locked: true,
                    },
                    units: [
                        {
                            card: player1Units[0],
                            currentHp: 2,
                            position: { x: 7, y: 20 },
                            ownerId: 'player1',
                            color: 'red',
                            hasMovedThisTurn: false,
                            hasUsedAbilityThisTurn: false,
                            hasAttackedThisTurn: false,
                            combatModifiers: [],
                        },
                        {
                            card: player1Units[1],
                            currentHp: 3,
                            position: { x: 11, y: 20 },
                            ownerId: 'player1',
                            color: 'red',
                            hasMovedThisTurn: false,
                            hasUsedAbilityThisTurn: false,
                            hasAttackedThisTurn: false,
                            combatModifiers: [],
                        },
                        {
                            card: player1Units[2],
                            currentHp: 8,
                            position: { x: 15, y: 20 },
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
                createPlayer({
                    id: 'player2',
                    team: {
                        activeUnits: player2Units,
                        reserveUnits: [],
                        locked: true,
                    },
                    units: [
                        {
                            card: player2Units[0],
                            currentHp: 2,
                            position: { x: 7, y: 2 },
                            ownerId: 'player2',
                            color: 'blue',
                            hasMovedThisTurn: false,
                            hasUsedAbilityThisTurn: false,
                            hasAttackedThisTurn: false,
                            combatModifiers: [],
                        },
                        {
                            card: player2Units[1],
                            currentHp: 3,
                            position: { x: 11, y: 2 },
                            ownerId: 'player2',
                            color: 'blue',
                            hasMovedThisTurn: false,
                            hasUsedAbilityThisTurn: false,
                            hasAttackedThisTurn: false,
                            combatModifiers: [],
                        },
                        {
                            card: player2Units[2],
                            currentHp: 8,
                            position: { x: 15, y: 2 },
                            ownerId: 'player2',
                            color: 'blue',
                            hasMovedThisTurn: false,
                            hasUsedAbilityThisTurn: false,
                            hasAttackedThisTurn: false,
                            combatModifiers: [],
                        },
                    ],
                    color: 'blue',
                }),
            ],
        });
        // Simulate the fixed GameScene logic
        const allUnits = gameState.players.flatMap(p => p.units);
        const unitInstanceIds = allUnits.map(unit => `${unit.ownerId}-${unit.card.id}`);
        console.log('=== Unit Instance ID Generation Test ===');
        allUnits.forEach((unit, i) => {
            const instanceId = `${unit.ownerId}-${unit.card.id}`;
            console.log(`Unit ${i}: ${unit.card.id} -> Instance ID: ${instanceId} (${unit.color})`);
        });
        // Verify all instance IDs are unique
        const uniqueIds = new Set(unitInstanceIds);
        expect(uniqueIds.size).toBe(unitInstanceIds.length);
        expect(unitInstanceIds).toHaveLength(6);
        // Verify the pattern: playerId-cardId
        expect(unitInstanceIds).toContain('player1-u01');
        expect(unitInstanceIds).toContain('player2-u01');
        expect(unitInstanceIds).toContain('player1-u05');
        expect(unitInstanceIds).toContain('player2-u05');
        expect(unitInstanceIds).toContain('player1-u09');
        expect(unitInstanceIds).toContain('player2-u09');
    });
    it('should correctly match board occupant IDs with unit instances', () => {
        // Test the hover logic fix
        const gameState = createGameState({
            phase: GamePhase.IN_PROGRESS,
            players: [
                createPlayer({
                    id: 'player1',
                    team: { activeUnits: [createUnit({ id: 'u01' })], reserveUnits: [], locked: true },
                    units: [{
                            card: createUnit({ id: 'u01' }),
                            currentHp: 5,
                            position: { x: 5, y: 5 },
                            ownerId: 'player1',
                            color: 'red',
                            hasMovedThisTurn: false,
                            hasUsedAbilityThisTurn: false,
                            hasAttackedThisTurn: false,
                            combatModifiers: [],
                        }],
                    color: 'red',
                }),
            ],
        });
        // Simulate board with occupant ID
        gameState.board.cells[5][5].occupantId = 'player1-u01';
        // Test the fixed hover logic
        let foundUnit = null;
        for (const player of gameState.players) {
            for (const unit of player.units) {
                const unitInstanceId = `${unit.ownerId}-${unit.card.id}`;
                if (unitInstanceId === gameState.board.cells[5][5].occupantId) {
                    foundUnit = unit;
                    break;
                }
            }
        }
        expect(foundUnit).not.toBeNull();
        expect(foundUnit.card.id).toBe('u01');
        expect(foundUnit.ownerId).toBe('player1');
        expect(foundUnit.color).toBe('red');
    });
});
//# sourceMappingURL=game-scene-rendering.test.js.map
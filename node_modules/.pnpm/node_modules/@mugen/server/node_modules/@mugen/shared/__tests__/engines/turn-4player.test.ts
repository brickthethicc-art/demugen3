import { describe, it, expect } from 'vitest';
import {
  createPlayer,
  createUnit,
  createUnitInstance,
  createBoard,
  createGameState,
} from '../factories.js';
import { createGame } from '../../src/engines/game/index.js';
import { processAttack } from '../../src/engines/turn/index.js';
import { TurnPhase, GamePhase } from '../../src/types/index.js';
import { placeUnit } from '../../src/engines/board/index.js';

describe('TurnEngine - 4 Player Support', () => {
  it('4 players with shared card ID - defenderOwnerId targets correct player only', () => {
    // All 4 players have a unit with the same card ID
    const sharedCard = createUnit({ id: 'shared-u', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    
    const p1Unit = createUnitInstance({ card: sharedCard, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 28 } });
    const p2Unit = createUnitInstance({ card: sharedCard, currentHp: 10, ownerId: 'p2', position: { x: 0, y: 29 } });
    const p3Unit = createUnitInstance({ card: sharedCard, currentHp: 10, ownerId: 'p3', position: { x: 1, y: 29 } });
    const p4Unit = createUnitInstance({ card: sharedCard, currentHp: 10, ownerId: 'p4', position: { x: 1, y: 28 } });

    const p1 = createPlayer({ id: 'p1', life: 24, isReady: true, units: [p1Unit], team: { activeUnits: [sharedCard], reserveUnits: [], locked: true } });
    const p2 = createPlayer({ id: 'p2', life: 24, isReady: true, units: [p2Unit], team: { activeUnits: [sharedCard], reserveUnits: [], locked: true } });
    const p3 = createPlayer({ id: 'p3', life: 24, isReady: true, units: [p3Unit], team: { activeUnits: [sharedCard], reserveUnits: [], locked: true } });
    const p4 = createPlayer({ id: 'p4', life: 24, isReady: true, units: [p4Unit], team: { activeUnits: [sharedCard], reserveUnits: [], locked: true } });

    let board = createBoard();
    let r = placeUnit(board, 'p1-shared-u', { x: 0, y: 28 });
    if (r.ok) board = r.value;
    r = placeUnit(board, 'p2-shared-u', { x: 0, y: 29 });
    if (r.ok) board = r.value;
    r = placeUnit(board, 'p3-shared-u', { x: 1, y: 29 });
    if (r.ok) board = r.value;
    r = placeUnit(board, 'p4-shared-u', { x: 1, y: 28 });
    if (r.ok) board = r.value;

    const baseState = createGame([p1, p2, p3, p4]);
    if (!baseState.ok) {
      console.error('createGame error:', baseState.error);
      expect.fail(`Failed to create base game state: ${baseState.error}`);
      return;
    }

    const state = {
      ...baseState.value,
      turnPhase: TurnPhase.ATTACK,
      board,
      currentPlayerIndex: 0,
    };

    // p1 attacks p4's unit specifically using defenderOwnerId
    const result = processAttack(state, 'p1', 'shared-u', 'shared-u', 'p4');
    if (!result.ok) {
      console.error('processAttack error:', result.error);
    }
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Attacker (p1) takes counter damage
      const resultP1 = result.value.players[0]!.units.find((u) => u.card.id === 'shared-u');
      expect(resultP1!.currentHp).toBe(7);
      expect(resultP1!.hasAttackedThisTurn).toBe(true);

      // p2 and p3's units should be UNTOUCHED
      const resultP2 = result.value.players[1]!.units.find((u) => u.card.id === 'shared-u');
      expect(resultP2!.currentHp).toBe(10);
      expect(resultP2!.hasAttackedThisTurn).toBe(false);

      const resultP3 = result.value.players[2]!.units.find((u) => u.card.id === 'shared-u');
      expect(resultP3!.currentHp).toBe(10);
      expect(resultP3!.hasAttackedThisTurn).toBe(false);

      // p4's unit should have taken damage
      const resultP4 = result.value.players[3]!.units.find((u) => u.card.id === 'shared-u');
      expect(resultP4!.currentHp).toBe(7);
      expect(resultP4!.hasAttackedThisTurn).toBe(false);
    }
  });
});

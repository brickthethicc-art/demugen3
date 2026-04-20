import { describe, it, expect } from 'vitest';
import {
  createPlayer,
  createUnit,
  createUnitInstance,
} from '../factories.js';
import { shouldTriggerStandbyPhase } from '../../src/engines/standby/index.js';

describe('Standby Phase Debug', () => {
  it('debug hand size detection', () => {
    const unit1 = createUnit({ id: 'u1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
    const unit2 = createUnit({ id: 'u2', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
    const unit3 = createUnit({ id: 'u3', atk: 4, hp: 6, maxHp: 6, movement: 1, range: 1, cost: 5 });
    
    const activeUnit1 = createUnitInstance({ card: unit1, currentHp: 10, ownerId: 'p1', position: { x: 0, y: 0 } });
    const activeUnit2 = createUnitInstance({ card: unit2, currentHp: 8, ownerId: 'p1', position: { x: 1, y: 0 } });
    const activeUnit3 = createUnitInstance({ card: unit3, currentHp: 6, ownerId: 'p1', position: { x: 2, y: 0 } });
    
    const p1 = createPlayer({
      id: 'p1',
      life: 24,
      isReady: true,
      units: [activeUnit1, activeUnit2, activeUnit3], // 3 active units
      team: {
        activeUnits: [unit1, unit2, unit3],
        reserveUnits: [], // No bench units
        locked: true,
      },
      hand: { cards: [unit1, unit2, unit3, unit1, unit2, unit3] }, // 6 cards (exceeds limit)
      discardPile: { cards: [] },
    });

    console.log('Hand size:', p1.hand.cards.length);
    console.log('Active units:', p1.units.filter(u => u.position !== null).length);
    console.log('Bench units:', p1.team.reserveUnits.length);

    const status = shouldTriggerStandbyPhase(p1);
    console.log('Status:', status);

    expect(status.needsHandDiscard).toBe(true);
    expect(status.isActive).toBe(true);
  });
});

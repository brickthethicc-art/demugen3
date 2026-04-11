import { describe, it, expect } from 'vitest';
import { getUnitDisplayStats } from '../../src/logic/hover-logic.js';
import type { UnitInstance, UnitCard, AbilityDefinition } from '@mugen/shared';
import { CardType, AbilityType } from '@mugen/shared';

function makeAbility(overrides?: Partial<AbilityDefinition>): AbilityDefinition {
  return {
    id: 'ability-1',
    name: 'Fireball',
    description: 'Deals 3 damage',
    cost: 2,
    abilityType: AbilityType.DAMAGE,
    ...overrides,
  };
}

function makeUnit(overrides?: Partial<UnitCard>): UnitCard {
  return {
    id: 'unit-1',
    name: 'Fire Warrior',
    cardType: CardType.UNIT,
    hp: 10,
    maxHp: 10,
    atk: 4,
    movement: 2,
    range: 1,
    ability: makeAbility(),
    cost: 5,
    ...overrides,
  };
}

function makeInstance(overrides?: Partial<UnitInstance>): UnitInstance {
  const card = overrides?.card ?? makeUnit();
  return {
    card,
    currentHp: card.hp,
    position: { x: 3, y: 4 },
    ownerId: 'p1',
    hasMovedThisTurn: false,
    hasUsedAbilityThisTurn: false,
    hasAttackedThisTurn: false,
    combatModifiers: [],
    ...overrides,
  };
}

describe('getUnitDisplayStats', () => {
  it('extracts all fields from a UnitInstance', () => {
    const unit = makeInstance();
    const stats = getUnitDisplayStats(unit);

    expect(stats.name).toBe('Fire Warrior');
    expect(stats.hp).toBe(10);
    expect(stats.maxHp).toBe(10);
    expect(stats.atk).toBe(4);
    expect(stats.movement).toBe(2);
    expect(stats.range).toBe(1);
    expect(stats.cost).toBe(5);
    expect(stats.abilityName).toBe('Fireball');
    expect(stats.abilityDescription).toBe('Deals 3 damage');
    expect(stats.abilityCost).toBe(2);
    expect(stats.abilityType).toBe(AbilityType.DAMAGE);
  });

  it('reflects current HP (damaged unit)', () => {
    const unit = makeInstance({ currentHp: 3 });
    const stats = getUnitDisplayStats(unit);
    expect(stats.hp).toBe(3);
    expect(stats.maxHp).toBe(10);
  });

  it('handles unit with zero cost ability', () => {
    const unit = makeInstance({
      card: makeUnit({ ability: makeAbility({ cost: 0 }) }),
    });
    const stats = getUnitDisplayStats(unit);
    expect(stats.abilityCost).toBe(0);
  });

  it('handles different ability types', () => {
    const unit = makeInstance({
      card: makeUnit({
        ability: makeAbility({ abilityType: AbilityType.HEAL, name: 'Mend', description: 'Restores 3 HP' }),
      }),
    });
    const stats = getUnitDisplayStats(unit);
    expect(stats.abilityType).toBe(AbilityType.HEAL);
    expect(stats.abilityName).toBe('Mend');
    expect(stats.abilityDescription).toBe('Restores 3 HP');
  });

  it('returns deterministic output for same input', () => {
    const unit = makeInstance();
    const a = getUnitDisplayStats(unit);
    const b = getUnitDisplayStats(unit);
    expect(a).toEqual(b);
  });
});

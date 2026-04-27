import { describe, it, expect, beforeEach } from 'vitest';
import { createUnitInstance, createUnit, createAbility, resetIdCounter } from '../factories.js';
import {
  useAbility,
  resetAbilityUsage,
  hasUsedAbility,
  getAbilityTargets,
} from '../../src/engines/ability/index.js';
import { AbilityType } from '../../src/types/index.js';
import type { UnitInstance } from '../../src/types/index.js';

describe('AbilityEngine', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('useAbility', () => {
    it('valid ability, first use this turn — resolves effect', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 0 }),
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({ currentHp: 10, position: { x: 6, y: 5 }, ownerId: 'p2' });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.unit.hasUsedAbilityThisTurn).toBe(true);
      }
    });

    it('ability already used this turn — returns error', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 0 }),
        }),
        hasUsedAbilityThisTurn: true,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({ currentHp: 10, position: { x: 6, y: 5 }, ownerId: 'p2' });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('already used');
      }
    });

    it('ability is always cost-free — lifeCost is 0', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 3 }),
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({ currentHp: 10, position: { x: 6, y: 5 }, ownerId: 'p2' });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.lifeCost).toBe(0);
      }
    });

    it('damage ability — applies damage to target', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 0 }),
          atk: 4,
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({ currentHp: 10, position: { x: 6, y: 5 }, ownerId: 'p2' });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.currentHp).toBeLessThan(10);
      }
    });

    it('heal ability — restores HP to target (capped at max)', () => {
      const card = createUnit({
        hp: 10,
        maxHp: 10,
        ability: createAbility({ abilityType: AbilityType.HEAL, cost: 0 }),
      });
      const unit = createUnitInstance({
        card,
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const targetCard = createUnit({ hp: 10, maxHp: 10 });
      const target = createUnitInstance({
        card: targetCard,
        currentHp: 5,
        position: { x: 6, y: 5 },
        ownerId: 'p1',
      });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.currentHp).toBeGreaterThan(5);
        expect(result.value.target.currentHp).toBeLessThanOrEqual(10);
      }
    });

    it('modifier ability — sets combat modifier on target', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.MODIFIER, cost: 0 }),
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({ combatModifiers: [], position: { x: 6, y: 5 }, ownerId: 'p2' });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.combatModifiers.length).toBeGreaterThan(0);
      }
    });

    it('unit without position — returns error', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 0 }),
        }),
        hasUsedAbilityThisTurn: false,
        position: null,
      });
      const target = createUnitInstance({ currentHp: 10, position: { x: 5, y: 5 } });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('must be on the board');
      }
    });

    it('target without position — returns error', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 0 }),
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
      });
      const target = createUnitInstance({ currentHp: 10, position: null });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('must be on the board');
      }
    });

    it('target already defeated — returns error', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 0 }),
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
      });
      const target = createUnitInstance({ currentHp: 0, position: { x: 6, y: 5 } });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('already defeated');
      }
    });

    it('target out of range — returns error', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 0 }),
          range: 1,
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
      });
      const target = createUnitInstance({
        card: createUnit(),
        currentHp: 10,
        position: { x: 10, y: 10 },
        ownerId: 'p2',
      });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('out of range');
      }
    });

    it('DAMAGE ability targeting friendly unit — returns error', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 0 }),
          range: 2,
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({
        card: createUnit(),
        currentHp: 10,
        position: { x: 6, y: 5 },
        ownerId: 'p1',
      });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Cannot target friendly units');
      }
    });

    it('HEAL ability targeting enemy unit — returns error', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.HEAL, cost: 0 }),
          range: 2,
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({
        card: createUnit(),
        currentHp: 5,
        position: { x: 6, y: 5 },
        ownerId: 'p2',
      });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Cannot target enemy units');
      }
    });

    it('BUFF ability targeting enemy unit — returns error', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.BUFF, cost: 0, description: 'Buff ally ATK by 2' }),
          range: 2,
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({
        card: createUnit(),
        currentHp: 10,
        position: { x: 6, y: 5 },
        ownerId: 'p2',
      });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Cannot target enemy units');
      }
    });

    it('MODIFIER ability targeting friendly unit — returns error', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.MODIFIER, cost: 0 }),
          range: 2,
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({
        card: createUnit(),
        currentHp: 10,
        position: { x: 6, y: 5 },
        ownerId: 'p1',
      });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Cannot target friendly units');
      }
    });

    it('valid DAMAGE ability on enemy in range — succeeds', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 0 }),
          range: 2,
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({
        card: createUnit(),
        currentHp: 10,
        position: { x: 6, y: 5 },
        ownerId: 'p2',
      });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.target?.currentHp).toBeLessThan(10);
      }
    });

    it('valid HEAL ability on ally in range — succeeds', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.HEAL, cost: 0 }),
          range: 2,
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({
        card: createUnit({ hp: 10, maxHp: 10 }),
        currentHp: 5,
        position: { x: 6, y: 5 },
        ownerId: 'p1',
      });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.target?.currentHp).toBeGreaterThan(5);
      }
    });

    it('self-target BUFF ability — succeeds without target', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.BUFF, cost: 0, description: 'Gain +1 ATK' }),
          range: 1,
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });

      const result = useAbility(unit, null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.unit.combatModifiers.length).toBeGreaterThan(0);
      }
    });

    it('adjacent ability — requires distance = 1, ignores unit range stat', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 0, description: 'Deal 1 damage to adjacent enemy' }),
          range: 5, // High range stat
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({
        card: createUnit(),
        currentHp: 10,
        position: { x: 7, y: 5 }, // Distance 2, should fail even though range is 5
        ownerId: 'p2',
      });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('must be adjacent');
      }
    });

    it('adjacent ability — succeeds with distance = 1', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 0, description: 'Deal 1 damage to adjacent enemy' }),
          range: 5,
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const target = createUnitInstance({
        card: createUnit(),
        currentHp: 10,
        position: { x: 6, y: 5 }, // Distance 1, should succeed
        ownerId: 'p2',
      });

      const result = useAbility(unit, target);
      expect(result.ok).toBe(true);
    });

    it('self-target HEAL ability — succeeds without target', () => {
      const unit = createUnitInstance({
        card: createUnit({
          hp: 10,
          maxHp: 10,
          ability: createAbility({ abilityType: AbilityType.HEAL, cost: 0, description: 'Heal 3 HP to self' }),
          range: 1,
        }),
        hasUsedAbilityThisTurn: false,
        position: { x: 5, y: 5 },
        ownerId: 'p1',
        currentHp: 5,
      });

      const result = useAbility(unit, null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.unit.currentHp).toBeGreaterThan(5);
      }
    });
  });

  describe('resetAbilityUsage', () => {
    it('new turn — all abilities reset to unused', () => {
      const units: UnitInstance[] = [
        createUnitInstance({ hasUsedAbilityThisTurn: true }),
        createUnitInstance({ hasUsedAbilityThisTurn: true }),
        createUnitInstance({ hasUsedAbilityThisTurn: false }),
      ];

      const reset = resetAbilityUsage(units);
      reset.forEach((u: UnitInstance) => {
        expect(u.hasUsedAbilityThisTurn).toBe(false);
      });
    });
  });

  describe('hasUsedAbility', () => {
    it('used this turn — returns true', () => {
      const unit = createUnitInstance({ hasUsedAbilityThisTurn: true });
      expect(hasUsedAbility(unit)).toBe(true);
    });

    it('not used — returns false', () => {
      const unit = createUnitInstance({ hasUsedAbilityThisTurn: false });
      expect(hasUsedAbility(unit)).toBe(false);
    });
  });

  describe('getAbilityTargets', () => {
    it('DAMAGE ability — returns only enemy units in range', () => {
      const caster = createUnitInstance({
        card: createUnit({ id: 'c1', ability: createAbility({ abilityType: AbilityType.DAMAGE }), range: 2 }),
        ownerId: 'p1',
        position: { x: 5, y: 5 },
        hasUsedAbilityThisTurn: false,
      });
      const ally = createUnitInstance({
        card: createUnit({ id: 'a1' }),
        ownerId: 'p1',
        position: { x: 6, y: 5 },
      });
      const enemyInRange = createUnitInstance({
        card: createUnit({ id: 'e1' }),
        ownerId: 'p2',
        position: { x: 5, y: 7 },
      });
      const enemyOutOfRange = createUnitInstance({
        card: createUnit({ id: 'e2' }),
        ownerId: 'p2',
        position: { x: 5, y: 20 },
      });

      const targets = getAbilityTargets(caster, [caster, ally, enemyInRange, enemyOutOfRange], 'p1');
      expect(targets).toHaveLength(1);
      expect(targets[0]!.unitId).toBe('e1');
    });

    it('HEAL ability — returns only friendly units in range', () => {
      const caster = createUnitInstance({
        card: createUnit({ id: 'c1', ability: createAbility({ abilityType: AbilityType.HEAL }), range: 2 }),
        ownerId: 'p1',
        position: { x: 5, y: 5 },
        hasUsedAbilityThisTurn: false,
      });
      const allyInRange = createUnitInstance({
        card: createUnit({ id: 'a1' }),
        ownerId: 'p1',
        position: { x: 6, y: 5 },
      });
      const enemy = createUnitInstance({
        card: createUnit({ id: 'e1' }),
        ownerId: 'p2',
        position: { x: 5, y: 6 },
      });

      const targets = getAbilityTargets(caster, [caster, allyInRange, enemy], 'p1');
      // Should include self and ally, not enemy
      const targetIds = targets.map(t => t.unitId);
      expect(targetIds).toContain('c1');
      expect(targetIds).toContain('a1');
      expect(targetIds).not.toContain('e1');
    });

    it('BUFF ability — returns friendly units including self', () => {
      const caster = createUnitInstance({
        card: createUnit({ id: 'c1', ability: createAbility({ abilityType: AbilityType.BUFF }), range: 1 }),
        ownerId: 'p1',
        position: { x: 5, y: 5 },
        hasUsedAbilityThisTurn: false,
      });

      const targets = getAbilityTargets(caster, [caster], 'p1');
      expect(targets).toHaveLength(1);
      expect(targets[0]!.unitId).toBe('c1');
    });

    it('ability already used — returns empty', () => {
      const caster = createUnitInstance({
        card: createUnit({ id: 'c1', ability: createAbility({ abilityType: AbilityType.DAMAGE }), range: 2 }),
        ownerId: 'p1',
        position: { x: 5, y: 5 },
        hasUsedAbilityThisTurn: true,
      });
      const enemy = createUnitInstance({
        card: createUnit({ id: 'e1' }),
        ownerId: 'p2',
        position: { x: 5, y: 6 },
      });

      const targets = getAbilityTargets(caster, [caster, enemy], 'p1');
      expect(targets).toHaveLength(0);
    });

    it('unit with no position — returns empty', () => {
      const caster = createUnitInstance({
        card: createUnit({ id: 'c1', ability: createAbility({ abilityType: AbilityType.DAMAGE }), range: 2 }),
        ownerId: 'p1',
        position: null,
        hasUsedAbilityThisTurn: false,
      });

      const targets = getAbilityTargets(caster, [caster], 'p1');
      expect(targets).toHaveLength(0);
    });

    it('MODIFIER ability — returns only enemy units in range', () => {
      const caster = createUnitInstance({
        card: createUnit({ id: 'c1', ability: createAbility({ abilityType: AbilityType.MODIFIER }), range: 1 }),
        ownerId: 'p1',
        position: { x: 5, y: 5 },
        hasUsedAbilityThisTurn: false,
      });
      const enemy = createUnitInstance({
        card: createUnit({ id: 'e1' }),
        ownerId: 'p2',
        position: { x: 6, y: 5 },
      });
      const ally = createUnitInstance({
        card: createUnit({ id: 'a1' }),
        ownerId: 'p1',
        position: { x: 4, y: 5 },
      });

      const targets = getAbilityTargets(caster, [caster, enemy, ally], 'p1');
      expect(targets).toHaveLength(1);
      expect(targets[0]!.unitId).toBe('e1');
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { createUnitInstance, createUnit, createAbility, resetIdCounter } from '../factories.js';
import {
  useAbility,
  resetAbilityUsage,
  hasUsedAbility,
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
      });
      const target = createUnitInstance({ currentHp: 10 });

      const result = useAbility(unit, target, 20);
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
      });
      const target = createUnitInstance({ currentHp: 10 });

      const result = useAbility(unit, target, 20);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('already used');
      }
    });

    it('ability with cost, sufficient life — deducts cost, resolves', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 3 }),
        }),
        hasUsedAbilityThisTurn: false,
      });
      const target = createUnitInstance({ currentHp: 10 });

      const result = useAbility(unit, target, 20);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.lifeCost).toBe(3);
      }
    });

    it('ability with cost, insufficient life — returns error', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.DAMAGE, cost: 5 }),
        }),
        hasUsedAbilityThisTurn: false,
      });
      const target = createUnitInstance({ currentHp: 10 });

      const result = useAbility(unit, target, 3);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Insufficient');
      }
    });

    it('ability with no cost — resolves without life deduction', () => {
      const unit = createUnitInstance({
        card: createUnit({
          ability: createAbility({ abilityType: AbilityType.HEAL, cost: 0 }),
        }),
        hasUsedAbilityThisTurn: false,
      });
      const target = createUnitInstance({ currentHp: 3 });

      const result = useAbility(unit, target, 20);
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
      });
      const target = createUnitInstance({ currentHp: 10 });

      const result = useAbility(unit, target, 20);
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
      });
      const targetCard = createUnit({ hp: 10, maxHp: 10 });
      const target = createUnitInstance({
        card: targetCard,
        currentHp: 5,
      });

      const result = useAbility(unit, target, 20);
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
      });
      const target = createUnitInstance({ combatModifiers: [] });

      const result = useAbility(unit, target, 20);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.combatModifiers.length).toBeGreaterThan(0);
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
});

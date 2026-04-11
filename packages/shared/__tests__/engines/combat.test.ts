import { describe, it, expect, beforeEach } from 'vitest';
import { createUnitInstance, resetIdCounter } from '../factories.js';
import {
  resolveCombat,
  calculateOverflow,
} from '../../src/engines/combat/index.js';
import { CombatModifierType } from '../../src/types/index.js';
import type { CombatModifier } from '../../src/types/index.js';

describe('CombatEngine', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('resolveCombat', () => {
    it('both survive — both take damage, both alive', () => {
      const attacker = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 10, maxHp: 10, atk: 3 },
        currentHp: 10,
      });
      const defender = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 8, maxHp: 8, atk: 2 },
        currentHp: 8,
      });

      const result = resolveCombat(attacker, defender);
      expect(result.attacker.currentHp).toBe(8);  // 10 - 2
      expect(result.defender.currentHp).toBe(5);   // 8 - 3
      expect(result.attackerDied).toBe(false);
      expect(result.defenderDied).toBe(false);
      expect(result.attackerOverflow).toBe(0);
      expect(result.defenderOverflow).toBe(0);
    });

    it('defender dies — attacker takes counterattack, defender HP = 0', () => {
      const attacker = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 10, maxHp: 10, atk: 8 },
        currentHp: 10,
      });
      const defender = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 5, maxHp: 5, atk: 3 },
        currentHp: 5,
      });

      const result = resolveCombat(attacker, defender);
      expect(result.attacker.currentHp).toBe(7);  // 10 - 3
      expect(result.defender.currentHp).toBe(0);
      expect(result.defenderDied).toBe(true);
      expect(result.defenderOverflow).toBe(3);     // 8 - 5
    });

    it('attacker dies from counterattack — attacker HP = 0', () => {
      const attacker = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 3, maxHp: 3, atk: 2 },
        currentHp: 3,
      });
      const defender = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 10, maxHp: 10, atk: 5 },
        currentHp: 10,
      });

      const result = resolveCombat(attacker, defender);
      expect(result.attacker.currentHp).toBe(0);
      expect(result.defender.currentHp).toBe(8);  // 10 - 2
      expect(result.attackerDied).toBe(true);
      expect(result.attackerOverflow).toBe(2);    // 5 - 3
    });

    it('double KO — both units HP = 0', () => {
      const attacker = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 5, maxHp: 5, atk: 5 },
        currentHp: 5,
      });
      const defender = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 5, maxHp: 5, atk: 5 },
        currentHp: 5,
      });

      const result = resolveCombat(attacker, defender);
      expect(result.attacker.currentHp).toBe(0);
      expect(result.defender.currentHp).toBe(0);
      expect(result.attackerDied).toBe(true);
      expect(result.defenderDied).toBe(true);
    });

    it('double KO with overflow — both players take overflow', () => {
      const attacker = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 3, maxHp: 3, atk: 7 },
        currentHp: 3,
      });
      const defender = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 4, maxHp: 4, atk: 6 },
        currentHp: 4,
      });

      const result = resolveCombat(attacker, defender);
      expect(result.attackerOverflow).toBe(3);    // 6 - 3
      expect(result.defenderOverflow).toBe(3);    // 7 - 4
    });

    it('zero ATK attacker — defender takes 0 damage, attacker takes full counter', () => {
      const attacker = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 5, maxHp: 5, atk: 0 },
        currentHp: 5,
      });
      const defender = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 5, maxHp: 5, atk: 3 },
        currentHp: 5,
      });

      const result = resolveCombat(attacker, defender);
      expect(result.attacker.currentHp).toBe(2);  // 5 - 3
      expect(result.defender.currentHp).toBe(5);   // 5 - 0
    });

    it('zero ATK defender — attacker takes 0 counter, defender takes full damage', () => {
      const attacker = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 5, maxHp: 5, atk: 4 },
        currentHp: 5,
      });
      const defender = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 5, maxHp: 5, atk: 0 },
        currentHp: 5,
      });

      const result = resolveCombat(attacker, defender);
      expect(result.attacker.currentHp).toBe(5);  // 5 - 0
      expect(result.defender.currentHp).toBe(1);   // 5 - 4
    });

    it('exactly lethal (HP = ATK) — unit dies, no overflow', () => {
      const attacker = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 10, maxHp: 10, atk: 5 },
        currentHp: 10,
      });
      const defender = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 5, maxHp: 5, atk: 2 },
        currentHp: 5,
      });

      const result = resolveCombat(attacker, defender);
      expect(result.defender.currentHp).toBe(0);
      expect(result.defenderDied).toBe(true);
      expect(result.defenderOverflow).toBe(0);
    });

    it('with NO_COUNTERATTACK modifier on attacker — defender does not deal damage', () => {
      const noCounter: CombatModifier = {
        type: CombatModifierType.NO_COUNTERATTACK,
        duration: 1,
      };
      const attacker = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 5, maxHp: 5, atk: 4 },
        currentHp: 5,
        combatModifiers: [noCounter],
      });
      const defender = createUnitInstance({
        card: { ...createUnitInstance().card, hp: 8, maxHp: 8, atk: 6 },
        currentHp: 8,
      });

      const result = resolveCombat(attacker, defender);
      expect(result.attacker.currentHp).toBe(5);  // no counter damage
      expect(result.defender.currentHp).toBe(4);   // 8 - 4
    });
  });

  describe('calculateOverflow', () => {
    it('overkill damage — returns positive overflow', () => {
      expect(calculateOverflow(3, 7)).toBe(4);
    });

    it('exact kill — returns 0', () => {
      expect(calculateOverflow(5, 5)).toBe(0);
    });

    it('no kill — returns 0', () => {
      expect(calculateOverflow(10, 3)).toBe(0);
    });
  });
});

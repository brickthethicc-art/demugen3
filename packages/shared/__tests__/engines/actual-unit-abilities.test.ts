import { describe, it, expect, beforeEach } from 'vitest';
import { createUnitInstance, resetIdCounter } from '../factories.js';
import { useAbility } from '../../src/engines/ability/index.js';
import { TEST_UNITS } from '../test-cards.js';
import { AbilityType } from '../../src/types/index.js';

describe('Actual Unit Abilities - Target Verification', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  // Helper to create a unit instance from a card
  function createFromCard(card: any, overrides?: any) {
    return createUnitInstance({
      card,
      currentHp: card.hp,
      ...overrides,
    });
  }

  describe('SELF Abilities - Should only affect the unit using it', () => {
    it('u04 Iron Pup - Guard Stance (Gain +1 ATK)', () => {
      const ironPup = createFromCard(TEST_UNITS[3], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const ally = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p1' });
      
      // Should work without target
      const result = useAbility(ironPup, null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.unit.combatModifiers.length).toBeGreaterThan(0);
        // Ally should not be affected
        expect(ally.combatModifiers.length).toBe(0);
      }
    });

    it('u09 Stone Sentinel - Fortify (Gain +2 ATK)', () => {
      const stoneSentinel = createFromCard(TEST_UNITS[8], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      
      const result = useAbility(stoneSentinel, null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.unit.combatModifiers.length).toBeGreaterThan(0);
      }
    });

    it('u14 Coral Guardian - Tidal Shield (Gain +1 ATK)', () => {
      const coralGuardian = createFromCard(TEST_UNITS[13], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      
      const result = useAbility(coralGuardian, null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.unit.combatModifiers.length).toBeGreaterThan(0);
      }
    });

    it('u20 Bone Colossus - Bone Armor (Gain +3 ATK)', () => {
      const boneColossus = createFromCard(TEST_UNITS[19], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      
      const result = useAbility(boneColossus, null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.unit.combatModifiers.length).toBeGreaterThan(0);
      }
    });

    it('u24 Berserker Wolf - Frenzy (Gain +2 ATK, take 1 self damage)', () => {
      const berserkerWolf = createFromCard(TEST_UNITS[23], { position: { x: 5, y: 5 }, ownerId: 'p1', currentHp: 7 });
      
      const result = useAbility(berserkerWolf, null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should gain ATK buff
        expect(result.value.unit.combatModifiers.length).toBeGreaterThan(0);
        // Should take self damage
        expect(result.value.unit.currentHp).toBe(6); // 7 - 1
      }
    });

    it('u26 Phoenix Sage - Rebirth Flame (Heal 3 HP to self)', () => {
      const phoenixSage = createFromCard(TEST_UNITS[25], { position: { x: 5, y: 5 }, ownerId: 'p1', currentHp: 5 });
      
      const result = useAbility(phoenixSage, null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.unit.currentHp).toBe(8); // 5 + 3
      }
    });

    it('u33 Chrono Wizard - Time Warp (Gain +3 ATK)', () => {
      const chronoWizard = createFromCard(TEST_UNITS[32], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      
      const result = useAbility(chronoWizard, null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.unit.combatModifiers.length).toBeGreaterThan(0);
      }
    });

    it('u37 Eternal Guardian - Immortal Shield (Gain +4 ATK)', () => {
      const eternalGuardian = createFromCard(TEST_UNITS[36], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      
      const result = useAbility(eternalGuardian, null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.unit.combatModifiers.length).toBeGreaterThan(0);
      }
    });

    it('u40 Battle Drummer - War Cry (Gain +2 ATK)', () => {
      const battleDrummer = createFromCard(TEST_UNITS[39], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      
      const result = useAbility(battleDrummer, null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.unit.combatModifiers.length).toBeGreaterThan(0);
      }
    });

    it('u42 Mirror Knight - Reflect (Gain +3 ATK)', () => {
      const mirrorKnight = createFromCard(TEST_UNITS[41], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      
      const result = useAbility(mirrorKnight, null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.unit.combatModifiers.length).toBeGreaterThan(0);
      }
    });
  });

  describe('ADJACENT Abilities - Should only affect units at distance = 1', () => {
    it('u01 Scout Wisp - Flicker (Deal 1 damage to adjacent enemy)', () => {
      const scoutWisp = createFromCard(TEST_UNITS[0], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const adjacentEnemy = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p2', currentHp: 3 });
      const distantEnemy = createUnitInstance({ position: { x: 7, y: 5 }, ownerId: 'p2', currentHp: 3 });
      
      // Should work with adjacent enemy
      const result1 = useAbility(scoutWisp, adjacentEnemy);
      expect(result1.ok).toBe(true);
      if (result1.ok && result1.value.target) {
        expect(result1.value.target.currentHp).toBe(2); // 3 - 1
      }
      
      // Should fail with distant enemy (even though range is 1, adjacent requires distance = 1)
      const scoutWisp2 = createFromCard(TEST_UNITS[0], { position: { x: 5, y: 5 }, ownerId: 'p1', hasUsedAbilityThisTurn: false });
      const result2 = useAbility(scoutWisp2, distantEnemy);
      expect(result2.ok).toBe(false);
    });

    it('u05 Shadow Imp - Backstab (Deal 2 damage to adjacent enemy)', () => {
      const shadowImp = createFromCard(TEST_UNITS[4], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const adjacentEnemy = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p2', currentHp: 4 });
      
      const result = useAbility(shadowImp, adjacentEnemy);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.currentHp).toBe(2); // 4 - 2
      }
    });

    it('u07 Flame Knight - Blaze Slash (Deal 3 damage to adjacent enemy)', () => {
      const flameKnight = createFromCard(TEST_UNITS[6], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const adjacentEnemy = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p2', currentHp: 6 });
      
      const result = useAbility(flameKnight, adjacentEnemy);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.currentHp).toBe(3); // 6 - 3
      }
    });
  });

  describe('SINGLE TARGET Abilities - Should only affect the chosen target', () => {
    it('u02 Ember Sprite - Spark (Deal 1 damage to target in range)', () => {
      const emberSprite = createFromCard(TEST_UNITS[1], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const target = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p2', currentHp: 3 });
      const otherEnemy = createUnitInstance({ position: { x: 7, y: 5 }, ownerId: 'p2', currentHp: 3 });
      
      const result = useAbility(emberSprite, target);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.currentHp).toBe(2); // 3 - 1
        // Other enemy should not be affected
        expect(otherEnemy.currentHp).toBe(3);
      }
    });

    it('u03 Vine Creeper - Entangle (Reduce target movement by 1)', () => {
      const vineCreeper = createFromCard(TEST_UNITS[2], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const target = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p2' });
      
      const result = useAbility(vineCreeper, target);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.combatModifiers.length).toBeGreaterThan(0);
      }
    });

    it('u06 Crystal Moth - Shimmer (Heal 1 HP to ally in range)', () => {
      const crystalMoth = createFromCard(TEST_UNITS[5], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const ally = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p1', currentHp: 2 });
      const otherAlly = createUnitInstance({ position: { x: 7, y: 5 }, ownerId: 'p1', currentHp: 2 });
      
      const result = useAbility(crystalMoth, ally);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.currentHp).toBe(3); // 2 + 1
        // Other ally should not be affected
        expect(otherAlly.currentHp).toBe(2);
      }
    });

    it('u11 Moss Shaman - Rejuvenate (Heal 3 HP to target ally)', () => {
      const mossShaman = createFromCard(TEST_UNITS[10], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const ally = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p1', currentHp: 3 });
      
      const result = useAbility(mossShaman, ally);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.currentHp).toBe(5); // 3 + 3, capped at maxHp (5)
      }
    });

    it('u17 Forest Warden - Nature\'s Gift (Heal 3 HP to target ally)', () => {
      const forestWarden = createFromCard(TEST_UNITS[16], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const ally = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p1', currentHp: 2 });
      
      const result = useAbility(forestWarden, ally);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.currentHp).toBe(5); // 2 + 3, capped at maxHp (5)
      }
    });

    it('u23 War Cleric - Divine Heal (Heal 3 HP to target ally)', () => {
      const warCleric = createFromCard(TEST_UNITS[22], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const ally = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p1', currentHp: 2 });
      
      const result = useAbility(warCleric, ally);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.currentHp).toBe(5); // 2 + 3, capped at maxHp (5)
      }
    });

    it('u27 Void Stalker - Dimensional Rift (Deal 3 damage, ignore counter)', () => {
      const voidStalker = createFromCard(TEST_UNITS[26], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const enemy = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p2', currentHp: 6 });
      
      const result = useAbility(voidStalker, enemy);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.currentHp).toBe(3); // 6 - 3
        expect(result.value.target.combatModifiers.length).toBeGreaterThan(0);
      }
    });

    it('u12 Sand Viper - Venom Bite (Reduce target ATK by 1)', () => {
      const sandViper = createFromCard(TEST_UNITS[11], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const enemy = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p2' });
      
      const result = useAbility(sandViper, enemy);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.combatModifiers.length).toBeGreaterThan(0);
      }
    });

    it('u22 Plague Doctor - Pestilence (Reduce target ATK by 2)', () => {
      const plagueDoctor = createFromCard(TEST_UNITS[21], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const enemy = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p2' });
      
      const result = useAbility(plagueDoctor, enemy);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.combatModifiers.length).toBeGreaterThan(0);
      }
    });

    it('u39 Medic Fairy - Quick Heal (Heal 2 HP to target ally)', () => {
      const medicFairy = createFromCard(TEST_UNITS[38], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const ally = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p1', currentHp: 1 });
      
      const result = useAbility(medicFairy, ally);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.target) {
        expect(result.value.target.currentHp).toBe(3); // 1 + 2
      }
    });
  });

  describe('Target Type Validation', () => {
    it('DAMAGE ability cannot target friendly units', () => {
      const damageUnit = createFromCard(TEST_UNITS[1], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const friendlyTarget = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p1' });
      
      const result = useAbility(damageUnit, friendlyTarget);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Cannot target friendly units');
      }
    });

    it('HEAL ability cannot target enemy units', () => {
      const healUnit = createFromCard(TEST_UNITS[5], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const enemyTarget = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p2' });
      
      const result = useAbility(healUnit, enemyTarget);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Cannot target enemy units');
      }
    });

    it('BUFF ability cannot target enemy units', () => {
      // Use a non-self-target BUFF ability for this test
      // Create a custom BUFF ability that targets allies (not self)
      const baseCard = TEST_UNITS[3]!;
      const buffUnit = createUnitInstance({
        card: {
          id: baseCard.id,
          name: baseCard.name,
          cardType: baseCard.cardType,
          hp: baseCard.hp,
          maxHp: baseCard.maxHp,
          atk: baseCard.atk,
          movement: baseCard.movement,
          range: baseCard.range,
          cost: baseCard.cost,
          ability: {
            id: baseCard.ability.id,
            name: baseCard.ability.name,
            description: 'Buff ally ATK by 2',
            cost: baseCard.ability.cost,
            abilityType: AbilityType.BUFF,
          },
        },
        position: { x: 5, y: 5 },
        ownerId: 'p1',
      });
      const enemyTarget = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p2' });
      
      const result = useAbility(buffUnit, enemyTarget);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Cannot target enemy units');
      }
    });

    it('MODIFIER ability cannot target friendly units', () => {
      const modifierUnit = createFromCard(TEST_UNITS[2], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const friendlyTarget = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p1' });
      
      const result = useAbility(modifierUnit, friendlyTarget);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Cannot target friendly units');
      }
    });
  });

  describe('Board Rule Checks', () => {
    it('Cannot use ability without position', () => {
      const unit = createFromCard(TEST_UNITS[0], { position: null, ownerId: 'p1' });
      const target = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p2' });
      
      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('must be on the board');
      }
    });

    it('Cannot target unit without position', () => {
      const unit = createFromCard(TEST_UNITS[0], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const target = createUnitInstance({ position: null, ownerId: 'p2' });
      
      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('must be on the board');
      }
    });

    it('Cannot target defeated unit', () => {
      const unit = createFromCard(TEST_UNITS[0], { position: { x: 5, y: 5 }, ownerId: 'p1' });
      const target = createUnitInstance({ position: { x: 6, y: 5 }, ownerId: 'p2', currentHp: 0 });
      
      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('already defeated');
      }
    });

    it('Cannot target out of range', () => {
      const unit = createFromCard(TEST_UNITS[1], { position: { x: 5, y: 5 }, ownerId: 'p1' }); // range 1
      const target = createUnitInstance({ position: { x: 10, y: 10 }, ownerId: 'p2' });
      
      const result = useAbility(unit, target);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('out of range');
      }
    });
  });
});

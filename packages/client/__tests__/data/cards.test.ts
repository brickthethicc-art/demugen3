import { describe, it, expect } from 'vitest';
import { ALL_CARDS, ALL_UNITS, ALL_SORCERIES } from '../../src/data/cards.js';
import { CardType } from '@mugen/shared';

describe('Card Database', () => {
  it('has at least 40 unit cards', () => {
    expect(ALL_UNITS.length).toBeGreaterThanOrEqual(40);
  });

  it('has at least 20 sorcery cards', () => {
    expect(ALL_SORCERIES.length).toBeGreaterThanOrEqual(20);
  });

  it('ALL_CARDS is the combination of units and sorceries', () => {
    expect(ALL_CARDS.length).toBe(ALL_UNITS.length + ALL_SORCERIES.length);
  });

  it('all cards have unique IDs', () => {
    const ids = ALL_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all unit cards have cardType UNIT', () => {
    ALL_UNITS.forEach((u) => {
      expect(u.cardType).toBe(CardType.UNIT);
    });
  });

  it('all sorcery cards have cardType SORCERY', () => {
    ALL_SORCERIES.forEach((s) => {
      expect(s.cardType).toBe(CardType.SORCERY);
    });
  });

  it('all unit cards have valid stats (positive hp, atk, cost, movement, range)', () => {
    ALL_UNITS.forEach((u) => {
      expect(u.hp).toBeGreaterThan(0);
      expect(u.atk).toBeGreaterThan(0);
      expect(u.cost).toBeGreaterThan(0);
      expect(u.movement).toBeGreaterThan(0);
      expect(u.range).toBeGreaterThan(0);
      expect(u.maxHp).toBe(u.hp);
    });
  });

  it('all sorcery cards have positive cost', () => {
    ALL_SORCERIES.forEach((s) => {
      expect(s.cost).toBeGreaterThan(0);
    });
  });

  it('all unit cards have an ability with valid fields', () => {
    ALL_UNITS.forEach((u) => {
      expect(u.ability.id).toBeTruthy();
      expect(u.ability.name).toBeTruthy();
      expect(u.ability.description).toBeTruthy();
      expect(u.ability.cost).toBeGreaterThanOrEqual(0);
      expect(u.ability.abilityType).toBeTruthy();
    });
  });

  it('defines Zeus as a legendary custom-art unit with three abilities', () => {
    const zeus = ALL_UNITS.find((u) => u.id === 'u43');

    expect(zeus).toBeDefined();
    expect(zeus?.name).toBe('Zeus');
    expect(zeus?.cost).toBe(10);
    expect(zeus?.hp).toBe(18);
    expect(zeus?.atk).toBe(7);
    expect(zeus?.movement).toBe(4);
    expect(zeus?.range).toBe(5);
    expect(zeus?.framework?.cardFrameStyle).toBe('legendary');
    expect(zeus?.framework?.customImage).toBe('/assets/zeus.png');
    expect(zeus?.abilities).toHaveLength(3);
    expect(zeus?.ability).toBe(zeus?.abilities?.[0]);
  });

  it('all sorcery cards have an effect description', () => {
    ALL_SORCERIES.forEach((s) => {
      expect(s.effect).toBeTruthy();
    });
  });

  it('unit costs range from 1 to 10', () => {
    const costs = ALL_UNITS.map((u) => u.cost);
    expect(Math.min(...costs)).toBe(1);
    expect(Math.max(...costs)).toBeLessThanOrEqual(10);
  });

  it('sorcery costs range from 1 to 6', () => {
    const costs = ALL_SORCERIES.map((s) => s.cost);
    expect(Math.min(...costs)).toBe(1);
    expect(Math.max(...costs)).toBeLessThanOrEqual(6);
  });
});

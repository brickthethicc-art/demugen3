import { describe, it, expect, beforeEach } from 'vitest';
import { createPlayer, resetIdCounter } from '../factories.js';
import {
  deductLife,
  canAfford,
  applyDamageToLife,
  isPlayerDead,
} from '../../src/engines/resource/index.js';

describe('ResourceEngine', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('deductLife', () => {
    it('sufficient life — returns new life total', () => {
      const player = createPlayer({ life: 20 });
      const result = deductLife(player, 5);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.life).toBe(15);
      }
    });

    it('exact life remaining — returns 0 life', () => {
      const player = createPlayer({ life: 5 });
      const result = deductLife(player, 5);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.life).toBe(0);
      }
    });

    it('insufficient life — returns error', () => {
      const player = createPlayer({ life: 3 });
      const result = deductLife(player, 5);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Insufficient');
      }
    });

    it('cost = 0 — returns unchanged life', () => {
      const player = createPlayer({ life: 20 });
      const result = deductLife(player, 0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.life).toBe(20);
      }
    });

    it('negative cost — returns error', () => {
      const player = createPlayer({ life: 20 });
      const result = deductLife(player, -3);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('negative');
      }
    });
  });

  describe('canAfford', () => {
    it('life > cost — returns true', () => {
      const player = createPlayer({ life: 10 });
      expect(canAfford(player, 5)).toBe(true);
    });

    it('life = cost — returns true', () => {
      const player = createPlayer({ life: 5 });
      expect(canAfford(player, 5)).toBe(true);
    });

    it('life < cost — returns false', () => {
      const player = createPlayer({ life: 3 });
      expect(canAfford(player, 5)).toBe(false);
    });
  });

  describe('applyDamageToLife', () => {
    it('damage with life remaining — deducts correctly', () => {
      const player = createPlayer({ life: 20 });
      const result = applyDamageToLife(player, 7);
      expect(result.life).toBe(13);
      expect(result.isEliminated).toBe(false);
    });

    it('damage kills player — life = 0, player eliminated', () => {
      const player = createPlayer({ life: 5 });
      const result = applyDamageToLife(player, 10);
      expect(result.life).toBe(0);
      expect(result.isEliminated).toBe(true);
    });

    it('damage exactly equals life — life = 0, player eliminated', () => {
      const player = createPlayer({ life: 5 });
      const result = applyDamageToLife(player, 5);
      expect(result.life).toBe(0);
      expect(result.isEliminated).toBe(true);
    });

    it('zero damage — no change', () => {
      const player = createPlayer({ life: 20 });
      const result = applyDamageToLife(player, 0);
      expect(result.life).toBe(20);
      expect(result.isEliminated).toBe(false);
    });
  });

  describe('isPlayerDead', () => {
    it('life = 0 — returns true', () => {
      const player = createPlayer({ life: 0 });
      expect(isPlayerDead(player)).toBe(true);
    });

    it('life > 0 — returns false', () => {
      const player = createPlayer({ life: 1 });
      expect(isPlayerDead(player)).toBe(false);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { createUnit, resetIdCounter } from '../factories.js';
import {
  validateTeam,
  lockTeam,
  splitTeam,
} from '../../src/pregame/index.js';
import { MAX_TEAM_SIZE, MAX_TEAM_COST, ACTIVE_UNIT_COUNT, RESERVE_UNIT_COUNT } from '../../src/types/index.js';
import type { PlayerTeam } from '../../src/types/index.js';

describe('PreGameManager', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('validateTeam', () => {
    it('exactly 6 units, cost ≤ 40 — returns valid', () => {
      const units = Array.from({ length: 6 }, () => createUnit({ cost: 5 }));
      const result = validateTeam(units);
      expect(result.ok).toBe(true);
    });

    it('fewer than 6 units — returns error', () => {
      const units = Array.from({ length: 5 }, () => createUnit({ cost: 5 }));
      const result = validateTeam(units);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain(`${MAX_TEAM_SIZE}`);
      }
    });

    it('more than 6 units — returns error', () => {
      const units = Array.from({ length: 7 }, () => createUnit({ cost: 5 }));
      const result = validateTeam(units);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain(`${MAX_TEAM_SIZE}`);
      }
    });

    it('total cost = 40 — returns valid (edge case)', () => {
      const units = Array.from({ length: 6 }, () => createUnit({ cost: 6 }));
      units[5] = createUnit({ cost: 10 });
      const result = validateTeam(units);
      expect(result.ok).toBe(true);
    });

    it('total cost = 41 — returns error (edge case)', () => {
      const units = Array.from({ length: 6 }, () => createUnit({ cost: 7 }));
      // 6 * 7 = 42 > 40
      const result = validateTeam(units);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain(`${MAX_TEAM_COST}`);
      }
    });

    it('total cost = 0 — returns valid', () => {
      const units = Array.from({ length: 6 }, () => createUnit({ cost: 0 }));
      const result = validateTeam(units);
      expect(result.ok).toBe(true);
    });
  });

  describe('lockTeam', () => {
    it('valid team — locks and returns locked state', () => {
      const units = Array.from({ length: 6 }, () => createUnit({ cost: 5 }));
      const team: PlayerTeam = {
        activeUnits: units.slice(0, 3),
        reserveUnits: units.slice(3),
        locked: false,
      };
      const result = lockTeam(team);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.locked).toBe(true);
      }
    });

    it('already locked — returns error', () => {
      const units = Array.from({ length: 6 }, () => createUnit({ cost: 5 }));
      const team: PlayerTeam = {
        activeUnits: units.slice(0, 3),
        reserveUnits: units.slice(3),
        locked: true,
      };
      const result = lockTeam(team);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('already locked');
      }
    });

    it('invalid team (wrong count) — returns validation error', () => {
      const units = Array.from({ length: 2 }, () => createUnit({ cost: 5 }));
      const team: PlayerTeam = {
        activeUnits: units,
        reserveUnits: [],
        locked: false,
      };
      const result = lockTeam(team);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain(`${MAX_TEAM_SIZE}`);
      }
    });

    it('invalid team (cost too high) — returns validation error', () => {
      const units = Array.from({ length: 6 }, () => createUnit({ cost: 8 }));
      const team: PlayerTeam = {
        activeUnits: units.slice(0, 3),
        reserveUnits: units.slice(3),
        locked: false,
      };
      const result = lockTeam(team);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain(`${MAX_TEAM_COST}`);
      }
    });
  });

  describe('splitTeam', () => {
    it('6 units — returns 3 active + 3 reserve', () => {
      const units = Array.from({ length: 6 }, (_, i) =>
        createUnit({ id: `unit-${i}`, cost: 5 })
      );
      const result = splitTeam(units);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.activeUnits).toHaveLength(ACTIVE_UNIT_COUNT);
        expect(result.value.reserveUnits).toHaveLength(RESERVE_UNIT_COUNT);
        expect(result.value.locked).toBe(false);
      }
    });

    it('wrong count — returns error', () => {
      const units = Array.from({ length: 4 }, () => createUnit({ cost: 5 }));
      const result = splitTeam(units);
      expect(result.ok).toBe(false);
    });
  });
});

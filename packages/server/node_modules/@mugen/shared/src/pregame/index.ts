import type { UnitCard, PlayerTeam } from '../types/index.js';
import {
  MAX_TEAM_SIZE,
  MAX_TEAM_COST,
  ACTIVE_UNIT_COUNT,
  RESERVE_UNIT_COUNT,
} from '../types/index.js';
import type { Result } from '../types/actions.js';

export function validateTeam(units: UnitCard[]): Result<true> {
  if (units.length !== MAX_TEAM_SIZE) {
    return {
      ok: false,
      error: `Team must contain exactly ${MAX_TEAM_SIZE} units, got ${units.length}`,
    };
  }

  const totalCost = units.reduce((sum, u) => sum + u.cost, 0);
  if (totalCost > MAX_TEAM_COST) {
    return {
      ok: false,
      error: `Total team cost must be ≤ ${MAX_TEAM_COST}, got ${totalCost}`,
    };
  }

  return { ok: true, value: true };
}

export function lockTeam(team: PlayerTeam): Result<PlayerTeam> {
  if (team.locked) {
    return { ok: false, error: 'Team is already locked' };
  }

  const allUnits = [...team.activeUnits, ...team.reserveUnits];
  const validation = validateTeam(allUnits);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  return {
    ok: true,
    value: {
      ...team,
      locked: true,
    },
  };
}

export function splitTeam(units: UnitCard[]): Result<PlayerTeam> {
  if (units.length !== MAX_TEAM_SIZE) {
    return {
      ok: false,
      error: `Cannot split: expected ${MAX_TEAM_SIZE} units, got ${units.length}`,
    };
  }

  return {
    ok: true,
    value: {
      activeUnits: units.slice(0, ACTIVE_UNIT_COUNT),
      reserveUnits: units.slice(ACTIVE_UNIT_COUNT, ACTIVE_UNIT_COUNT + RESERVE_UNIT_COUNT),
      locked: false,
    },
  };
}

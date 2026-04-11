import type { UnitInstance } from '../../types/index.js';
import { AbilityType, CombatModifierType } from '../../types/index.js';
import type { Result } from '../../types/actions.js';

export interface AbilityResult {
  unit: UnitInstance;
  target: UnitInstance | null;
  lifeCost: number;
}

const ABILITY_DAMAGE_AMOUNT = 3;
const ABILITY_HEAL_AMOUNT = 3;

export function useAbility(
  unit: UnitInstance,
  target: UnitInstance | null,
  playerLife: number
): Result<AbilityResult> {
  if (unit.hasUsedAbilityThisTurn) {
    return { ok: false, error: 'Ability already used this turn' };
  }

  const ability = unit.card.ability;
  if (ability.cost > playerLife) {
    return {
      ok: false,
      error: `Insufficient life for ability cost: have ${playerLife}, need ${ability.cost}`,
    };
  }

  const updatedUnit: UnitInstance = {
    ...unit,
    hasUsedAbilityThisTurn: true,
  };

  let updatedTarget = target;

  switch (ability.abilityType) {
    case AbilityType.DAMAGE: {
      if (target) {
        const newHp = Math.max(0, target.currentHp - ABILITY_DAMAGE_AMOUNT);
        updatedTarget = { ...target, currentHp: newHp };
      }
      break;
    }
    case AbilityType.HEAL: {
      if (target) {
        const maxHp = target.card.maxHp;
        const newHp = Math.min(maxHp, target.currentHp + ABILITY_HEAL_AMOUNT);
        updatedTarget = { ...target, currentHp: newHp };
      }
      break;
    }
    case AbilityType.BUFF: {
      if (target) {
        updatedTarget = {
          ...target,
          combatModifiers: [
            ...target.combatModifiers,
            { type: CombatModifierType.ATK_BUFF, duration: 1 },
          ],
        };
      }
      break;
    }
    case AbilityType.MODIFIER: {
      if (target) {
        updatedTarget = {
          ...target,
          combatModifiers: [
            ...target.combatModifiers,
            { type: CombatModifierType.NO_COUNTERATTACK, duration: 1 },
          ],
        };
      }
      break;
    }
  }

  return {
    ok: true,
    value: {
      unit: updatedUnit,
      target: updatedTarget,
      lifeCost: ability.cost,
    },
  };
}

export function resetAbilityUsage(units: UnitInstance[]): UnitInstance[] {
  return units.map((u) => ({ ...u, hasUsedAbilityThisTurn: false }));
}

export function hasUsedAbility(unit: UnitInstance): boolean {
  return unit.hasUsedAbilityThisTurn;
}

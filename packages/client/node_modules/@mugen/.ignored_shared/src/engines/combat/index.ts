import type { UnitInstance } from '../../types/index.js';
import { CombatModifierType } from '../../types/index.js';

export interface CombatResult {
  attacker: UnitInstance;
  defender: UnitInstance;
  attackerDied: boolean;
  defenderDied: boolean;
  attackerOverflow: number;
  defenderOverflow: number;
}

export function calculateOverflow(unitHp: number, incomingDamage: number): number {
  if (incomingDamage > unitHp) {
    return incomingDamage - unitHp;
  }
  return 0;
}

export function resolveCombat(
  attacker: UnitInstance,
  defender: UnitInstance
): CombatResult {
  const attackerAtk = attacker.card.atk;
  const defenderAtk = defender.card.atk;

  const hasNoCounterattack = attacker.combatModifiers.some(
    (m) => m.type === CombatModifierType.NO_COUNTERATTACK
  );

  const damageToDefender = attackerAtk;
  const damageToAttacker = hasNoCounterattack ? 0 : defenderAtk;

  const newAttackerHp = Math.max(0, attacker.currentHp - damageToAttacker);
  const newDefenderHp = Math.max(0, defender.currentHp - damageToDefender);

  const attackerOverflow = calculateOverflow(attacker.currentHp, damageToAttacker);
  const defenderOverflow = calculateOverflow(defender.currentHp, damageToDefender);

  return {
    attacker: {
      ...attacker,
      currentHp: newAttackerHp,
      combatModifiers: attacker.combatModifiers
        .map((m) => ({ ...m, duration: m.duration - 1 }))
        .filter((m) => m.duration > 0),
    },
    defender: {
      ...defender,
      currentHp: newDefenderHp,
    },
    attackerDied: newAttackerHp <= 0,
    defenderDied: newDefenderHp <= 0,
    attackerOverflow,
    defenderOverflow,
  };
}

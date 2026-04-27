import type { UnitInstance, Position } from '../../types/index.js';
import { CombatModifierType } from '../../types/index.js';
import { chebyshevDistance } from '../../utils/position.js';

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

export interface AttackTarget {
  unitId: string;
  ownerId: string;
  position: Position;
}

export function getAttackTargets(
  attacker: UnitInstance,
  allUnits: UnitInstance[],
  attackerOwnerId: string
): AttackTarget[] {
  if (attacker.hasAttackedThisTurn) return [];
  if (!attacker.position) return [];

  const range = attacker.card.range;
  const targets: AttackTarget[] = [];

  for (const candidate of allUnits) {
    if (candidate.ownerId === attackerOwnerId) continue;
    if (!candidate.position) continue;
    if (candidate.currentHp <= 0) continue;

    const dist = chebyshevDistance(attacker.position, candidate.position);
    if (dist > range) continue;

    targets.push({
      unitId: candidate.card.id,
      ownerId: candidate.ownerId,
      position: candidate.position,
    });
  }

  return targets;
}

export function resolveCombat(
  attacker: UnitInstance,
  defender: UnitInstance
): CombatResult {
  const atkBuff = attacker.combatModifiers
    .filter((m) => m.type === CombatModifierType.ATK_BUFF)
    .reduce((sum, m) => sum + (m.value || 0), 0);

  const atkDebuff = attacker.combatModifiers
    .filter((m) => m.type === CombatModifierType.ATK_DEBUFF)
    .reduce((sum, m) => sum + (m.value || 0), 0);

  const attackerAtk = attacker.card.atk + atkBuff - atkDebuff;
  const defenderAtk = defender.card.atk;

  const hasNoCounterattack = attacker.combatModifiers.some(
    (m) => m.type === CombatModifierType.NO_COUNTERATTACK
  );

  const damageToDefender = Math.max(0, attackerAtk);
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

import type { UnitInstance, Position } from '../../types/index.js';
import { AbilityType, CombatModifierType } from '../../types/index.js';
import type { Result } from '../../types/actions.js';
import { chebyshevDistance } from '../../utils/position.js';
import { hasLineOfSight } from '../visibility/index.js';

export interface AbilityResult {
  unit: UnitInstance;
  target: UnitInstance | null;
  lifeCost: number;
}

function extractDamageAmount(description: string): number {
  const match = description.match(/deal (\d+) damage/i);
  return match && match[1] ? parseInt(match[1], 10) : 3;
}

function extractHealAmount(description: string): number {
  const match = description.match(/heal\s+(\d+)\s+hp/i);
  return match && match[1] ? parseInt(match[1], 10) : 3;
}

function extractBuffAmount(description: string): number {
  const match = description.match(/\+(\d+) atk/i);
  return match && match[1] ? parseInt(match[1], 10) : 1;
}

export function isSelfTargetAbility(abilityType: AbilityType, description: string): boolean {
  if (abilityType === AbilityType.BUFF) {
    const desc = description.toLowerCase();
    // Self-buff: includes "gain" and does NOT target others
    // Explicitly targets self: "gain +X ATK", "gain +X ATK and +Y movement"
    // NOT self-buff: "buff adjacent ally", "buff ally", etc.
    return desc.includes('gain') && !desc.includes('ally') && !desc.includes('adjacent');
  }
  if (abilityType === AbilityType.HEAL) {
    const desc = description.toLowerCase();
    // Self-heal: explicitly says "to self"
    return desc.includes('to self');
  }
  return false;
}

export function isAdjacentTargetAbility(description: string): boolean {
  const desc = description.toLowerCase();
  return desc.includes('adjacent');
}

function extractSelfDamage(description: string): number {
  const match = description.match(/take\s+(\d+)\s+self\s+damage/i);
  return match && match[1] ? parseInt(match[1], 10) : 0;
}

function extractAtkDebuffAmount(description: string): number {
  const match = description.match(/reduce target atk by (\d+)/i);
  return match && match[1] ? parseInt(match[1], 10) : 0;
}

function extractMovementDebuffAmount(description: string): number {
  const match = description.match(/reduce target movement by (\d+)/i);
  return match && match[1] ? parseInt(match[1], 10) : 0;
}

function isDamageAndModifierAbility(description: string): boolean {
  const desc = description.toLowerCase();
  return desc.includes('deal') && desc.includes('damage') && desc.includes('ignore');
}

export function useAbility(
  unit: UnitInstance,
  target: UnitInstance | null,
  walls: Position[] = []
): Result<AbilityResult> {
  // STEP 1: Ability is triggered
  if (unit.hasUsedAbilityThisTurn) {
    return { ok: false, error: 'Ability already used this turn' };
  }

  // STEP 5: CHECK BOARD RULES - Check if unit has a position
  if (!unit.position) {
    return { ok: false, error: 'Unit must be on the board to use ability' };
  }

  const ability = unit.card.ability;
  const isSelfTarget = isSelfTargetAbility(ability.abilityType, ability.description);
  const isAdjacent = isAdjacentTargetAbility(ability.description);
  const selfDamage = extractSelfDamage(ability.description);

  // STEP 2: Find possible targets and STEP 3: Validate target(s)
  if (isSelfTarget) {
    // Self-target abilities should not have a target parameter
    if (target !== null) {
      return { ok: false, error: 'This ability targets self, do not provide a target' };
    }
    // For self-target abilities, the target is the unit itself
    target = unit;
  } else {
    // Validate target exists for non-self abilities
    if (!target) {
      return { ok: false, error: 'This ability requires a target' };
    }
    // Validate target is on board
    if (!target.position) {
      return { ok: false, error: 'Target must be on the board' };
    }
    // Validate target is alive
    if (target.currentHp <= 0) {
      return { ok: false, error: 'Target is already defeated' };
    }
    // Validate target is in range
    const dist = chebyshevDistance(unit.position, target.position);
    // Adjacent abilities require distance = 1, regardless of unit's range stat
    const maxRange = isAdjacent ? 1 : unit.card.range;
    if (dist > maxRange) {
      return { ok: false, error: isAdjacent ? 'Target must be adjacent' : 'Target is out of range' };
    }
    if (!hasLineOfSight(unit.position, target.position, walls)) {
      return { ok: false, error: 'Target is blocked by a wall' };
    }
    // Validate target type (enemy vs ally) based on ability type
    const isFriendly = target.ownerId === unit.ownerId;
    switch (ability.abilityType) {
      case AbilityType.DAMAGE:
      case AbilityType.MODIFIER:
        if (isFriendly) {
          return { ok: false, error: 'Cannot target friendly units with this ability' };
        }
        break;
      case AbilityType.HEAL:
        if (!isFriendly) {
          return { ok: false, error: 'Cannot target enemy units with this ability' };
        }
        break;
      case AbilityType.BUFF:
        // BUFF abilities can target allies (including self if not self-target)
        // But NOT enemies
        if (!isFriendly) {
          return { ok: false, error: 'Cannot target enemy units with this ability' };
        }
        break;
    }
  }

  // STEP 4: Apply effect ONLY to valid target(s)
  let updatedUnit: UnitInstance = {
    ...unit,
    hasUsedAbilityThisTurn: true,
  };

  // Apply ability effect to target
  // For self-target abilities, target === unit, so we update both
  // For non-self abilities, we only update the target
  let updatedTarget = target;

  switch (ability.abilityType) {
    case AbilityType.DAMAGE: {
      if (target) {
        const damageAmount = extractDamageAmount(ability.description);
        const newHp = Math.max(0, target.currentHp - damageAmount);
        updatedTarget = { ...target, currentHp: newHp };
      }
      break;
    }
    case AbilityType.HEAL: {
      if (target) {
        const healAmount = extractHealAmount(ability.description);
        const maxHp = target.card.maxHp;
        const newHp = Math.min(maxHp, target.currentHp + healAmount);
        const healedUnit = { ...target, currentHp: newHp };
        // For self-target abilities, apply to unit; otherwise apply to target
        if (isSelfTarget) {
          updatedUnit = healedUnit;
          updatedTarget = healedUnit;
        } else {
          updatedTarget = healedUnit;
        }
      }
      break;
    }
    case AbilityType.BUFF: {
      if (target) {
        const buffAmount = extractBuffAmount(ability.description);
        const buffedUnit = {
          ...target,
          combatModifiers: [
            ...target.combatModifiers,
            { type: CombatModifierType.ATK_BUFF, duration: 1, value: buffAmount },
          ],
        };
        // For self-target abilities, apply to unit; otherwise apply to target
        if (isSelfTarget) {
          // Apply self-damage after buff for self-target abilities
          if (selfDamage > 0) {
            buffedUnit.currentHp = Math.max(0, buffedUnit.currentHp - selfDamage);
          }
          updatedUnit = buffedUnit;
          updatedTarget = buffedUnit;
        } else {
          updatedTarget = buffedUnit;
        }
      }
      break;
    }
    case AbilityType.MODIFIER: {
      if (target) {
        const isDamageCombo = isDamageAndModifierAbility(ability.description);
        
        // Handle damage + modifier combo abilities (e.g., u27 Void Stalker)
        if (isDamageCombo) {
          const damageAmount = extractDamageAmount(ability.description);
          const newHp = Math.max(0, target.currentHp - damageAmount);
          updatedTarget = { 
            ...target, 
            currentHp: newHp,
            combatModifiers: [
              ...target.combatModifiers,
              { type: CombatModifierType.NO_COUNTERATTACK, duration: 1 },
            ],
          };
        } else {
          // Handle pure modifier abilities
          const atkDebuff = extractAtkDebuffAmount(ability.description);
          const movementDebuff = extractMovementDebuffAmount(ability.description);
          
          const newModifiers = [...target.combatModifiers];
          
          if (atkDebuff > 0) {
            newModifiers.push({ type: CombatModifierType.ATK_DEBUFF, duration: 1, value: atkDebuff });
          }
          
          if (movementDebuff > 0) {
            newModifiers.push({ type: CombatModifierType.MOVEMENT_DEBUFF, duration: 1, value: movementDebuff });
          }
          
          // If no specific debuff found, default to NO_COUNTERATTACK for compatibility
          if (atkDebuff === 0 && movementDebuff === 0) {
            newModifiers.push({ type: CombatModifierType.NO_COUNTERATTACK, duration: 1 });
          }
          
          updatedTarget = {
            ...target,
            combatModifiers: newModifiers,
          };
        }
        
        // For self-target abilities, also update unit (for consistency)
        if (isSelfTarget) {
          updatedUnit = updatedTarget;
        }
      }
      break;
    }
  }

  // STEP 6: Update game state (health, status, etc.)
  return {
    ok: true,
    value: {
      unit: updatedUnit,
      target: updatedTarget,
      lifeCost: 0,
    },
  };
}

export function resetAbilityUsage(units: UnitInstance[]): UnitInstance[] {
  return units.map((u) => ({ ...u, hasUsedAbilityThisTurn: false }));
}

export function hasUsedAbility(unit: UnitInstance): boolean {
  return unit.hasUsedAbilityThisTurn;
}

export interface AbilityTarget {
  unitId: string;
  ownerId: string;
  position: Position;
}

export function getAbilityTargets(
  unit: UnitInstance,
  allUnits: UnitInstance[],
  ownerId: string,
  walls: Position[] = []
): AbilityTarget[] {
  if (!unit.position) return [];
  if (unit.hasUsedAbilityThisTurn) return [];

  const abilityType = unit.card.ability.abilityType;
  const abilityDescription = unit.card.ability.description;
  const isSelfTarget = isSelfTargetAbility(abilityType, abilityDescription);
  const isAdjacent = isAdjacentTargetAbility(abilityDescription);

  if (isSelfTarget) {
    return [];
  }

  // Adjacent abilities require distance = 1, regardless of unit's range stat
  const maxRange = isAdjacent ? 1 : unit.card.range;

  const targets: AbilityTarget[] = [];

  for (const candidate of allUnits) {
    if (!candidate.position) continue;
    if (candidate.currentHp <= 0) continue;

    const dist = chebyshevDistance(unit.position, candidate.position);
    if (dist > maxRange) continue;
    if (!hasLineOfSight(unit.position, candidate.position, walls)) continue;

    const isFriendly = candidate.ownerId === ownerId;

    switch (abilityType) {
      case AbilityType.DAMAGE:
      case AbilityType.MODIFIER:
        if (!isFriendly) {
          targets.push({ unitId: candidate.card.id, ownerId: candidate.ownerId, position: candidate.position });
        }
        break;
      case AbilityType.HEAL:
      case AbilityType.BUFF:
        if (isFriendly) {
          targets.push({ unitId: candidate.card.id, ownerId: candidate.ownerId, position: candidate.position });
        }
        break;
    }
  }

  return targets;
}

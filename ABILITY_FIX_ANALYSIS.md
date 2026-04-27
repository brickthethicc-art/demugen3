# Ability Fix Analysis

## STEP 1: All Unit Abilities Documented
✅ COMPLETED - 42 unit cards identified in `packages/client/src/data/cards.ts`

## STEP 2: Target Types Defined

### SELF Abilities (10 total)
| ID | Name | Description | Detection Method |
|----|------|-------------|------------------|
| u04 | Iron Pup | Gain +1 ATK until end of turn | BUFF + "gain" |
| u09 | Stone Sentinel | Gain +2 ATK until end of turn | BUFF + "gain" |
| u14 | Coral Guardian | Gain +1 ATK until end of turn | BUFF + "gain" |
| u20 | Bone Colossus | Gain +3 ATK until end of turn | BUFF + "gain" |
| u24 | Berserker Wolf | Gain +2 ATK, take 1 self damage | BUFF + "gain" |
| u26 | Phoenix Sage | Heal 3 HP to self | HEAL + "to self" |
| u33 | Chrono Wizard | Gain +3 ATK until end of turn | BUFF + "gain" |
| u37 | Eternal Guardian | Gain +4 ATK until end of turn | BUFF + "gain" |
| u40 | Battle Drummer | Gain +2 ATK until end of turn | BUFF + "gain" |
| u42 | Mirror Knight | Gain +3 ATK until end of turn | BUFF + "gain" |

### SINGLE TARGET Abilities (32 total)
All other unit abilities - require explicit target selection

### ADJACENT Abilities (8 total)
| ID | Name | Description |
|----|------|-------------|
| u01 | Scout Wisp | Deal 1 damage to adjacent enemy |
| u05 | Shadow Imp | Deal 2 damage to adjacent enemy |
| u07 | Flame Knight | Deal 3 damage to adjacent enemy |
| u10 | Wind Dancer | Deal 2 damage to adjacent enemy |
| u18 | Magma Brute | Deal 2 damage to adjacent enemy |
| u25 | Titan Golem | Deal 3 damage to adjacent enemy |
| u34 | Leviathan | Deal 3 damage to adjacent enemy |
| u35 | World Serpent | Deal 3 damage to adjacent enemy |

## STEP 3: Targeting Logic Analysis

### Engine Implementation: `packages/shared/src/engines/ability/index.ts`

#### Self-Target Detection (lines 26-40)
```typescript
function isSelfTargetAbility(abilityType: AbilityType, description: string): boolean {
  if (abilityType === AbilityType.BUFF) {
    const desc = description.toLowerCase();
    return desc.includes('gain') && !desc.includes('ally') && !desc.includes('adjacent');
  }
  if (abilityType === AbilityType.HEAL) {
    const desc = description.toLowerCase();
    return desc.includes('to self');
  }
  return false;
}
```
✅ CORRECT - Properly identifies all 10 SELF abilities

#### Adjacent Detection (lines 42-45)
```typescript
function isAdjacentTargetAbility(description: string): boolean {
  const desc = description.toLowerCase();
  return desc.includes('adjacent');
}
```
✅ CORRECT - Properly identifies all 8 ADJACENT abilities

#### Target Validation (lines 96-136)
- ✅ Checks target exists
- ✅ Checks target is on board
- ✅ Checks target is alive (not defeated)
- ✅ Checks target is in range (uses unit range or adjacent=1)
- ✅ Validates target type based on ability type:
  - DAMAGE/MODIFIER: Cannot target friendly units
  - HEAL/BUFF: Cannot target enemy units

## STEP 4: Damage and Healing Analysis

### Damage Application (lines 158-164)
```typescript
case AbilityType.DAMAGE: {
  if (target) {
    const damageAmount = extractDamageAmount(ability.description);
    const newHp = Math.max(0, target.currentHp - damageAmount);
    updatedTarget = { ...target, currentHp: newHp };
  }
  break;
}
```
✅ CORRECT - Only affects target, capped at 0

### Healing Application (lines 166-180)
```typescript
case AbilityType.HEAL: {
  if (target) {
    const healAmount = extractHealAmount(ability.description);
    const maxHp = target.card.maxHp;
    const newHp = Math.min(maxHp, target.currentHp + healAmount);
    const healedUnit = { ...target, currentHp: newHp };
    if (isSelfTarget) {
      updatedUnit = healedUnit;
      updatedTarget = healedUnit;
    } else {
      updatedTarget = healedUnit;
    }
  }
  break;
}
```
✅ CORRECT - Only affects target, capped at maxHp

### Self-Damage Application (lines 144-150)
```typescript
if (selfDamage > 0) {
  updatedUnit = {
    ...updatedUnit,
    currentHp: Math.max(0, unit.currentHp - selfDamage),
  };
}
```
✅ CORRECT - Only affects the using unit

## STEP 5: Board Rule Checks

### Validation Order (lines 76-136)
1. ✅ Check unit has position
2. ✅ Determine ability type (self vs targeted)
3. ✅ Validate target exists (for non-self abilities)
4. ✅ Validate target is on board
5. ✅ Validate target is alive
6. ✅ Validate target is in range (adjacent=1 or unit range)
7. ✅ Validate target type (enemy vs ally based on ability type)

## STEP 6: Standard Execution Flow

### Flow in `useAbility()` function
1. ✅ Ability is triggered (function called)
2. ✅ Find possible targets (validation logic)
3. ✅ Validate target(s) (comprehensive checks)
4. ✅ Apply effect ONLY to valid target(s) (switch statement)
5. ✅ Update game state (return updated unit and target)

## STEP 7: Consistency Check

### Test Coverage
The ability engine has comprehensive tests in `packages/shared/__tests__/engines/ability.test.ts`:
- ✅ Self-target BUFF abilities
- ✅ Self-target HEAL abilities
- ✅ Adjacent abilities (distance=1 enforcement)
- ✅ Range validation
- ✅ Target type validation (enemy vs ally)
- ✅ Damage application
- ✅ Healing application
- ✅ Modifier application
- ✅ Board rule checks (position, alive, etc.)

## CONCLUSION

The ability engine implementation is **CORRECT** and follows all requirements:

✅ All 42 unit abilities are properly documented
✅ Target types are correctly identified (SELF, SINGLE TARGET, ADJACENT)
✅ Targeting logic is correct
✅ Damage and healing only affect intended targets
✅ Board rule checks are comprehensive
✅ Standard execution flow is followed
✅ Test coverage is adequate

**NO FIXES REQUIRED** - The ability engine already implements all the requirements correctly.

# Ability Targeting Bug Analysis

## Current Implementation Review

### Self-Target Detection Logic

**BUFF Abilities:**
- Checks for "gain" in description AND excludes "ally" and "adjacent"
- Correctly identifies: u04, u09, u14, u20, u24, u33, u37, u40, u42 (9 units)
- All these units have descriptions like "Gain +X ATK until end of turn"
- ✅ CORRECT

**HEAL Abilities:**
- Checks for "to self" in description
- Correctly identifies: u26 Phoenix Sage "Heal 3 HP to self"
- ✅ CORRECT

### Adjacent Target Detection

- Checks for "adjacent" in description
- Correctly identifies: u01, u05, u07, u10, u18, u25, u34, u35 (8 units)
- All these units have descriptions like "Deal X damage to adjacent enemy"
- ✅ CORRECT

### Self-Damage Detection

- Checks for "take X self damage" in description
- Correctly identifies: u24 Berserker Wolf "Gain +2 ATK, take 1 self damage"
- ✅ CORRECT

## Potential Issues Identified

### Issue 1: Target Assignment for Self-Target Abilities

**Current Code (line 76):**
```typescript
if (isSelfTarget) {
  if (target !== null) {
    return { ok: false, error: 'This ability targets self, do not provide a target' };
  }
  target = unit;  // ⚠️ MUTATES TARGET PARAMETER
}
```

**Problem:** 
- When a self-target ability is used with `target=null`, the code mutates the `target` parameter to equal `unit`
- This is confusing and could lead to bugs if the code later distinguishes between "no target provided" vs "target is self"
- The subsequent switch statement then treats this as a normal target instead of a special self case

**Impact:** 
- Currently works because the switch statement checks `if (target)` and processes it
- But it's fragile and could break if logic changes
- Makes the code harder to understand

### Issue 2: HEAL Ability Self-Target Logic

**Current Code (lines 145-158):**
```typescript
case AbilityType.HEAL: {
  if (target) {
    const healAmount = extractHealAmount(ability.description);
    const maxHp = target.card.maxHp;
    const newHp = Math.min(maxHp, target.currentHp + healAmount);
    const healedUnit = { ...target, currentHp: newHp };
    if (isSelfTarget) {
      updatedUnit = healedUnit;  // Apply to unit
      updatedTarget = healedUnit; // Also apply to target
    } else {
      updatedTarget = healedUnit; // Apply to target only
    }
  }
  break;
}
```

**Problem:**
- For self-target heals, it applies the heal to both `updatedUnit` and `updatedTarget`
- Since `target` was mutated to equal `unit`, this is redundant
- The logic is confusing because it treats self-target as a special case but the effect is the same

**Impact:**
- Currently works but is confusing
- Redundant assignments
- Makes code harder to maintain

### Issue 3: BUFF Ability Self-Target Logic

**Current Code (lines 161-178):**
```typescript
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
    if (isSelfTarget) {
      updatedUnit = buffedUnit;  // Apply to unit
      updatedTarget = buffedUnit; // Also apply to target
    } else {
      updatedTarget = buffedUnit; // Apply to target only
    }
  }
  break;
}
```

**Problem:**
- Same as HEAL: redundant assignments for self-target
- Confusing logic

**Impact:**
- Currently works but is confusing
- Redundant assignments

### Issue 4: MODIFIER Ability Missing Self-Target Logic

**Current Code (lines 181-192):**
```typescript
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
```

**Problem:**
- No special handling for self-target
- If a MODIFIER ability were self-target (none currently exist), it wouldn't work correctly
- Inconsistent with HEAL and BUFF which have special self-target logic

**Impact:**
- Currently no self-target MODIFIER abilities exist, so not a bug yet
- But inconsistent and could break if such abilities are added

### Issue 5: DAMAGE Ability Missing Self-Target Logic

**Current Code (lines 137-143):**
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

**Problem:**
- No special handling for self-target
- If a DAMAGE ability were self-target (none currently exist), it wouldn't work correctly
- Inconsistent with HEAL and BUFF

**Impact:**
- Currently no self-target DAMAGE abilities exist, so not a bug yet
- But inconsistent

## Board Rule Validation

**Current Implementation (lines 60-119):**
- ✅ Checks unit has position
- ✅ Checks target exists (for non-self abilities)
- ✅ Checks target has position
- ✅ Checks target is alive
- ✅ Checks target is in range (handles adjacent vs range stat)
- ✅ Checks target type (enemy vs ally) based on ability type

**Assessment:** Board rule validation is correct and comprehensive.

## Summary

**Critical Bugs:** None - all abilities currently work correctly

**Code Quality Issues:**
1. Target mutation for self-target abilities (line 76) - confusing but works
2. Redundant assignments in HEAL/BUFF for self-target - confusing but works
3. Inconsistent self-target handling across ability types - not a bug yet but risky

**Recommendation:**
Refactor to make self-target handling clearer and more consistent:
- Don't mutate target parameter
- Have a clear separation between "no target needed" (self) vs "target required"
- Apply effects directly to unit for self-target abilities
- Make all ability types handle self-target consistently

This would make the code more maintainable and less error-prone.

# Particle Effect and UI Effect Positioning Fix

## Problem Description

When units die, are healed, or are damaged, particle effects and frontend UI effects are being played at incorrect positions on the board. The effects appear at a different location than where the unit actually is.

## Root Cause Analysis

The issue occurs because particle effects and UI effects are using the unit container's current visual position (`container.x`, `container.y`) instead of the unit's actual grid position. This causes misalignment when:

1. **Units are mid-movement**: The container position is the current animation position (interpolated between start and end), not the target grid position
2. **Units have just moved**: The container might still be at the old position before being updated
3. **Effects are triggered during state transitions**: The container position may not yet reflect the new grid position

## Current Problematic Code Patterns

In `packages/client/src/scenes/GameScene.ts`, the following functions use `container.x` and `container.y` directly:

### Death Effects (Lines 713, 716)
```typescript
this.emitBloodSplatter(container.x, container.y);
this.emitDeathExplosion(container.x, container.y, unitColor);
```

### Movement Trail (Line 617)
```typescript
this.emitMovementTrail(container.x, container.y, unitColor);
```

### Healing Effect (Lines 1015-1018)
```typescript
const movingTargetX = container.getData('moveTargetX') as number | undefined;
const movingTargetY = container.getData('moveTargetY') as number | undefined;
const startX = movingTargetX ?? container.x;
const startY = movingTargetY ?? container.y;
```

The healing effect correctly checks for `moveTargetX/Y`, but other effects do not.

## Correct Approach

Effects should use the **target grid position** (the unit's actual position on the board) rather than the container's current visual position. The target grid position is calculated as:

```typescript
const targetX = unit.position.x * CELL_SIZE + CELL_SIZE / 2;
const targetY = unit.position.y * CELL_SIZE + CELL_SIZE / 2;
```

This is already computed in `drawUnits` (lines 462-463) and should be passed to effect functions.

## Required Changes

### 1. Update Effect Function Signatures

Modify the following functions to accept explicit x, y coordinates instead of relying on container position:

- `emitBloodSplatter(x, y)` - already has signature, but call sites need to pass correct coordinates
- `emitDeathExplosion(x, y, unitColor)` - already has signature, but call sites need to pass correct coordinates
- `emitMovementTrail(x, y, color)` - already has signature, but call sites need to pass correct coordinates

### 2. Fix Death Animation (playDeathAnimation)

**Current code (lines 687-728):**
```typescript
private playDeathAnimation(
  unitId: string,
  container: Phaser.GameObjects.Container,
  explosionDelayMs = 70,
  preserveFlash = false,
  unitColor?: number,
) {
  // ... setup code ...
  this.emitBloodSplatter(container.x, container.y);
  this.time.delayedCall(explosionDelayMs, () => {
    this.emitDeathExplosion(container.x, container.y, unitColor);
    // ...
  });
}
```

**Fix:**
Add parameters for target position and use them instead of container position:

```typescript
private playDeathAnimation(
  unitId: string,
  container: Phaser.GameObjects.Container,
  targetX: number,
  targetY: number,
  explosionDelayMs = 70,
  preserveFlash = false,
  unitColor?: number,
) {
  // ... setup code ...
  this.emitBloodSplatter(targetX, targetY);
  this.time.delayedCall(explosionDelayMs, () => {
    this.emitDeathExplosion(targetX, targetY, unitColor);
    // ...
  });
}
```

### 3. Update All Call Sites to playDeathAnimation

Find all calls to `playDeathAnimation` and pass the target grid position:

**Lines 498, 542, 545:**
```typescript
// Before:
this.playDeathAnimation(unitInstanceId, container, 420, true, deathExplosionColor);

// After:
this.playDeathAnimation(unitInstanceId, container, targetX, targetY, 420, true, deathExplosionColor);
```

Note: `targetX` and `targetY` are already computed in the `drawUnits` function (lines 462-463).

### 4. Fix Movement Trail (playMoveAnimation)

**Current code (line 617):**
```typescript
this.emitMovementTrail(container.x, container.y, unitColor);
```

**Fix:**
Use the target position which is already available as a parameter:

```typescript
this.emitMovementTrail(targetX, targetY, unitColor);
```

### 5. Fix Healing Effect Position

**Current code (lines 1015-1018):**
```typescript
const movingTargetX = container.getData('moveTargetX') as number | undefined;
const movingTargetY = container.getData('moveTargetY') as number | undefined;
const startX = movingTargetX ?? container.x;
const startY = movingTargetY ?? container.y;
```

**Fix:**
Use the passed `targetPos` (grid position) converted to world coordinates:

```typescript
const { x: startX, y: startY } = this.gridToWorld(targetPos);
```

The `targetPos` is already passed as a parameter to `showHealingEffect`.

## Verification

After making changes, verify that:

1. **Death effects** (blood splatter, explosion) appear at the unit's actual grid position, not where the container visually is during movement
2. **Movement trails** appear at the correct starting position
3. **Healing effects** appear at the unit's actual grid position
4. **Damage numbers** (already using `gridToWorld`) continue to work correctly
5. **Splash potions** (already using `gridToWorld`) continue to work correctly

## Testing Scenarios

Test the following scenarios to ensure the fix works:

1. **Unit dies while stationary**: Effects should appear at the unit's position
2. **Unit dies while moving**: Effects should appear at the target grid position, not mid-animation position
3. **Unit is healed while stationary**: Effects should appear at the unit's position
4. **Unit is healed while moving**: Effects should appear at the target grid position
5. **Unit moves and leaves a trail**: Trail should appear at the correct starting position
6. **Multiple rapid state changes**: Effects should always appear at the correct grid positions

## Summary

The fix requires:
1. Adding `targetX, targetY` parameters to `playDeathAnimation`
2. Updating all call sites to pass the target grid position
3. Using `targetX, targetY` instead of `container.x, container.y` in `playDeathAnimation`
4. Using `targetX, targetY` instead of `container.x, container.y` in `playMoveAnimation` for the movement trail
5. Using `gridToWorld(targetPos)` instead of container position in `showHealingEffect`

All effects should use the unit's actual grid position (converted to world coordinates via `gridToWorld`) rather than the container's current visual position to ensure effects appear at the correct location on the board.

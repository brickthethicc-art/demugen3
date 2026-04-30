# Ability Particle Effect Change

## Problem Summary
Currently, when abilities damage or heal units, the visual feedback uses a yellow lightning bolt effect (`emitAbilityLightningBolt`). This doesn't clearly distinguish between damaging and healing abilities, and the effect doesn't match the desired "splash potion" aesthetic from Minecraft.

## Desired Behavior
Ability effects should use particle effects that resemble splash potions being thrown onto the target unit:
- **Damaging abilities**: Red particle splash effect
- **Healing abilities**: Green particle splash effect
- The effect should have a trajectory/arc animation (like a potion being thrown) before splashing on the target
- The splash should occur at the target unit's position before the damage/healing is applied

## Current State
- Ability damage feedback uses `emitAbilityLightningBolt` (yellow lightning bolt at target position)
- Healing uses `emitHealingParticles` (green upward-floating particles)
- Both effects are instant at the target position without a throw trajectory
- Located in `packages/client/src/scenes/GameScene.ts`:
  - Line 850: `emitAbilityLightningBolt` function
  - Line 768: `emitHealingParticles` function
  - Line 1254: `playPendingAbilityDamageFeedback` calls lightning bolt
  - Line 985: Healing calls `emitHealingParticles`

## Key Files to Investigate

### 1. GameScene.ts - Particle Effects
**File**: `packages/client/src/scenes/GameScene.ts`
- Lines 737-766: `ensureParticleTexture` and `emitParticleBurst` (existing particle system)
- Lines 768-784: `emitHealingParticles` (current healing effect)
- Lines 850-901: `emitAbilityLightningBolt` (current damage effect)
- Lines 1254-1287: `playPendingAbilityDamageFeedback` (where damage effects are triggered)
- Lines 970-998: Healing effect triggering in `showHealingEffect`

### 2. Ability Damage Detection
**File**: `packages/client/src/scenes/GameScene.ts`
- Lines 1211-1252: `capturePendingAbilityDamageFeedback` (detects ability usage and damage)
- Lines 72-77: `PendingAbilityDamageFeedback` type definition
- Lines 79-82: `PendingAbilityDeathFeedback` type definition

## Implementation Approach

### Option 1: Create Splash Potion Effect Functions
Create new functions for splash potion effects with projectile trajectory:

```typescript
private emitSplashPotion(
  fromPos: Position,
  toPos: Position,
  color: number, // red for damage, green for healing
  onComplete?: () => void
) {
  const { x: startX, y: startY } = this.gridToWorld(fromPos);
  const { x: endX, y: endY } = this.gridToWorld(toPos);
  
  // Create projectile sprite (potion bottle)
  const potion = this.add.circle(startX, startY, 4, color, 1);
  potion.setDepth(300);
  
  // Arc trajectory tween
  this.tweens.add({
    targets: potion,
    x: endX,
    y: endY,
    duration: 300,
    ease: 'Quad.easeIn',
    onUpdate: (tween) => {
      const progress = tween.progress;
      // Add arc height (parabola)
      potion.y = startY + (endY - startY) * progress - Math.sin(progress * Math.PI) * 40;
    },
    onComplete: () => {
      potion.destroy();
      this.emitSplashParticles(endX, endY, color);
      if (onComplete) onComplete();
    }
  });
}

private emitSplashParticles(x: number, y: number, color: number) {
  // Splash particle burst at impact point
  const emitter = this.add.particles(x, y, this.particleTextureKey, {
    speed: { min: 60, max: 180 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: { min: 350, max: 500 },
    tint: color,
    quantity: 20,
    emitting: false,
  });
  
  emitter.explode(20, x, y);
  this.time.delayedCall(550, () => emitter.destroy());
  
  // Add ripple effect
  const ripple = this.add.circle(x, y, 1, color, 0.6);
  ripple.setDepth(299);
  this.tweens.add({
    targets: ripple,
    scale: 3,
    alpha: 0,
    duration: 400,
    ease: 'Cubic.Out',
    onComplete: () => ripple.destroy()
  });
}
```

### Option 2: Modify Existing Lightning Bolt Function
Replace `emitAbilityLightningBolt` with splash potion logic based on damage type.

## Required Changes

### 1. Add Splash Potion Functions to GameScene
Add the new `emitSplashPotion` and `emitSplashParticles` functions after the existing particle functions (around line 785).

### 2. Update Ability Damage Feedback
Modify `playPendingAbilityDamageFeedback` (lines 1254-1287) to:
- Determine if the ability is damaging or healing based on damage value
- For damage (positive damage value): Call `emitSplashPotion` with red color (0xef4444)
- For healing (negative damage value): Call `emitSplashPotion` with green color (0x22c55e)
- Use the attacker position as `fromPos` and target position as `toPos`

### 3. Update Healing Effect
Modify healing effect in `showHealingEffect` (around line 985) to use the splash potion effect instead of the current `emitHealingParticles`.

### 4. Remove or Deprecate Old Functions
- Keep `emitAbilityLightningBolt` if used elsewhere, or remove if only used for abilities
- Keep `emitHealingParticles` if used elsewhere, or remove if only used for ability healing

## Implementation Details

### Color Constants
Add these constants near the existing color definitions (around line 34):
```typescript
const DAMAGE_POTION_COLOR = 0xef4444; // Red
const HEAL_POTION_COLOR = 0x22c55e; // Green
```

### Damage vs Healing Detection
In `playPendingAbilityDamageFeedback`:
```typescript
feedback.forEach((entry) => {
  const isDamage = entry.damage > 0;
  const isHealing = entry.damage < 0;
  const potionColor = isDamage ? DAMAGE_POTION_COLOR : HEAL_POTION_COLOR;
  
  // Need to determine attacker position - may need to add to PendingAbilityDamageFeedback
  const attackerPos = entry.attackerPos || entry.targetPos; // fallback
  
  this.emitSplashPotion(
    attackerPos,
    entry.targetPos,
    potionColor,
    () => {
      // Callback after splash - apply flash/other effects
      if (isDamage && !entry.targetDied) {
        this.flashUnit(entry.targetInstanceId, entry.damage);
      }
    }
  );
  
  if (entry.targetDied) {
    // Handle death case
    this.pendingAbilityDeathFeedback.set(entry.targetInstanceId, {
      damage: entry.damage,
      targetPos: entry.targetPos
    });
  }
});
```

### Update Type Definition
Add `attackerPos` to `PendingAbilityDamageFeedback` type:
```typescript
type PendingAbilityDamageFeedback = {
  targetInstanceId: string;
  targetPos: Position;
  attackerPos?: Position; // Add this for throw trajectory
  damage: number;
  targetDied: boolean;
};
```

## Testing Strategy

1. **Basic Damage Test**:
   - Use a damaging ability on a unit
   - Verify red splash potion arc animation from caster to target
   - Verify red particle splash at target position
   - Verify damage is applied after splash

2. **Basic Healing Test**:
   - Use a healing ability on a unit
   - Verify green splash potion arc animation from caster to target
   - Verify green particle splash at target position
   - Verify healing is applied after splash

3. **Lethal Damage Test**:
   - Use a damaging ability that kills the target
   - Verify red splash potion effect plays
   - Verify death animation occurs after splash

4. **Multiple Targets Test**:
   - Use an AOE ability that hits multiple targets
   - Verify splash potions play for each target
   - Verify timing is synchronized or sequential as appropriate

5. **Edge Cases**:
   - Test when attacker and target are at same position
   - Test when attacker position is unknown (fallback behavior)
   - Test rapid ability usage

## Verification Steps
1. Start a game with units that have damaging abilities
2. Use a damaging ability on an enemy unit
3. **Expected**: Red potion arcs from caster to target, then red splash particles burst at target
4. Use a healing ability on a friendly unit
5. **Expected**: Green potion arcs from caster to target, then green splash particles burst at target
6. Use a lethal damaging ability
7. **Expected**: Red splash plays, then unit death animation occurs
8. Verify the old yellow lightning bolt no longer appears for ability effects

## Additional Considerations

### Performance
- Particle emitters should be cleaned up promptly (existing code does this with `time.delayedCall`)
- Limit particle count to prevent performance issues with AOE abilities

### Visual Clarity
- Ensure the potion arc is visible against the game board
- Consider adding a subtle glow or trail to the potion projectile
- The splash should be clearly distinguishable from unit death effects

### Fallback Behavior
- If attacker position is unavailable, spawn the potion above the target and drop it vertically
- This ensures the effect still plays even without full trajectory data

## Related Files
- `packages/client/src/scenes/GameScene.ts` (primary implementation)
- `packages/shared/src/engines/ability/index.ts` (ability definitions for reference)

## Context
This change replaces the current yellow lightning bolt ability feedback with a more intuitive splash potion effect that clearly distinguishes between damage (red) and healing (green). The Minecraft-style throw trajectory adds visual flair and makes ability usage more satisfying to watch.

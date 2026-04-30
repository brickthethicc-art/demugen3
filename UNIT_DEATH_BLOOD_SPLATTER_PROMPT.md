# Unit Death Blood Splatter Effect

## Problem Summary
Currently, when units die, they play a flash animation followed by an explosion effect at their death cell. This lacks visual impact and doesn't convey the visceral nature of unit death. The death effect should be more dramatic with a blood splatter effect that occurs in the unit's cell when they die.

## Desired Behavior
When a unit dies, the death effect should include:
1. **Flash animation** (existing behavior, keep this)
2. **Blood splatter effect** in the unit's cell - particles spreading outward from the death position
3. The splatter should look like blood/dark red liquid spreading on the ground
4. The effect should play before or simultaneously with the explosion
5. The splatter should persist briefly or fade out gradually

## Current State
- Death effects are handled in `packages/client/src/scenes/GameScene.ts`
- Current death sequence: flash → explosion at death cell
- Located in GameScene.ts around the death handling logic
- No blood splatter or liquid spread effect exists

## Key Files to Investigate

### 1. GameScene.ts - Death Effects
**File**: `packages/client/src/scenes/GameScene.ts`
- Search for death-related functions: `handleUnitDeath`, `playDeathEffect`, `removeUnit`, etc.
- Look for explosion effects: `emitExplosion`, `explode`, particle emitters
- Check where flash is called on unit death
- Find the death cell position calculation

### 2. Particle System
**File**: `packages/client/src/scenes/GameScene.ts`
- Lines 737-766: `ensureParticleTexture` and `emitParticleBurst` (existing particle system)
- Check what particle textures are available
- See if there's a suitable texture for blood splatter or if one needs to be created

## Implementation Approach

### Option 1: Create Blood Splatter Particle Function
Create a new function that emits blood splatter particles at the death position:

```typescript
private emitBloodSplatter(x: number, y: number) {
  // Main splatter burst - dark red particles spreading outward
  const splatterEmitter = this.add.particles(x, y, this.particleTextureKey, {
    speed: { min: 80, max: 200 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.6, end: 0.1 },
    alpha: { start: 0.9, end: 0 },
    lifespan: { min: 600, max: 1000 },
    tint: 0x8b0000, // Dark red blood color
    quantity: 30,
    emitting: false,
    blendMode: Phaser.BlendModes.NORMAL,
  });
  
  splatterEmitter.explode(30, x, y);
  this.time.delayedCall(1200, () => splatterEmitter.destroy());
  
  // Secondary droplets - smaller, faster particles
  const dropletsEmitter = this.add.particles(x, y, this.particleTextureKey, {
    speed: { min: 150, max: 300 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.3, end: 0.05 },
    alpha: { start: 0.8, end: 0 },
    lifespan: { min: 400, max: 700 },
    tint: 0xa52a2a, // Slightly lighter red
    quantity: 15,
    emitting: false,
  });
  
  dropletsEmitter.explode(15, x, y);
  this.time.delayedCall(800, () => dropletsEmitter.destroy());
  
  // Ground stain effect - persistent circle that fades slowly
  const stain = this.add.circle(x, y, 1, 0x660000, 0.7);
  stain.setDepth(50); // Below units but above board
  
  this.tweens.add({
    targets: stain,
    scale: 2.5,
    alpha: 0,
    duration: 2000,
    ease: 'Quad.easeOut',
    onComplete: () => stain.destroy()
  });
}
```

### Option 2: Integrate into Existing Death Effect
Modify the existing death effect function to include blood splatter as part of the sequence.

## Required Changes

### 1. Add Blood Splatter Function to GameScene
Add the `emitBloodSplatter` function near the existing particle effect functions (around line 785, after `emitParticleBurst`).

### 2. Update Death Effect Sequence
Find the death handling code and integrate the blood splatter:
```typescript
// Current sequence (likely):
// 1. Flash unit
// 2. Explosion at death cell
// 3. Remove unit

// New sequence:
// 1. Flash unit
// 2. Blood splatter at death cell
// 3. Explosion at death cell (can be simultaneous or after splatter)
// 4. Remove unit
```

### 3. Timing Considerations
- Blood splatter should start immediately after or during the flash
- Explosion can follow the splatter or play simultaneously
- Ensure the splatter is visible before the unit is removed

## Implementation Details

### Color Constants
Add blood color constants near existing color definitions (around line 34):
```typescript
const BLOOD_MAIN_COLOR = 0x8b0000; // Dark red
const BLOOD_DROPLET_COLOR = 0xa52a2a; // Lighter red
const BLOOD_STAIN_COLOR = 0x660000; // Very dark red for ground stain
```

### Death Effect Integration
In the death handling function (locate where `handleUnitDeath` or similar is called):
```typescript
private handleUnitDeath(unit: Unit, deathPos: Position) {
  const { x, y } = this.gridToWorld(deathPos);
  
  // Flash the unit (existing)
  this.flashUnit(unit.instanceId, 0, 420);
  
  // Blood splatter effect (new)
  this.emitBloodSplatter(x, y);
  
  // Explosion effect (existing, may need timing adjustment)
  this.time.delayedCall(100, () => {
    this.emitExplosion(x, y);
  });
  
  // Remove unit (existing)
  this.time.delayedCall(420, () => {
    this.removeUnit(unit.instanceId);
  });
}
```

### Texture Considerations
- If using the existing particle texture, ensure it looks like liquid droplets
- Consider creating a custom blood particle texture if the default doesn't look right
- The texture should be circular/irregular to look like blood drops

## Testing Strategy

1. **Basic Death Test**:
   - Kill a unit through combat
   - Verify flash animation plays
   - Verify blood splatter particles burst from death position
   - Verify explosion effect plays
   - Verify unit is removed after effects complete

2. **Multiple Deaths Test**:
   - Kill multiple units in quick succession
   - Verify blood splatter effects play for each death
   - Verify effects don't interfere with each other

3. **Ability Death Test**:
   - Kill a unit with an ability
   - Verify blood splatter plays alongside ability effects
   - Verify timing doesn't conflict with ability feedback

4. **Position Accuracy Test**:
   - Kill units at different board positions
   - Verify blood splatter appears at the correct cell
   - Verify the effect is properly aligned with the grid

5. **Performance Test**:
   - Kill many units simultaneously
   - Verify performance remains acceptable
   - Verify particle emitters are cleaned up properly

## Verification Steps
1. Start a game with units
2. Attack and kill an enemy unit
3. **Expected**: Unit flashes, blood splatter particles burst outward from death cell in dark red, explosion plays, unit disappears
4. Kill another unit at a different position
5. **Expected**: Blood splatter appears at the new death position
6. Kill a unit with an ability
7. **Expected**: Blood splatter plays in addition to ability effects
8. Verify the blood splatter looks like liquid spreading/droplets, not just generic particles

## Additional Considerations

### Visual Impact
- The blood splatter should feel visceral but not overly graphic
- Dark red colors work better than bright red for a blood effect
- Varying particle sizes and speeds create a more natural splatter
- The ground stain effect adds persistence and makes the death feel more impactful

### Timing
- Blood splatter should be quick (600-1000ms total)
- Ground stain can fade more slowly (2000ms) for lingering impact
- Ensure effects don't delay gameplay too much

### Performance
- Limit particle count to prevent lag with multiple deaths
- Clean up emitters promptly after effects complete
- Consider pooling particle emitters if many deaths occur frequently

### Aesthetic Consistency
- Ensure the blood splatter matches the game's art style
- Test against different board backgrounds to ensure visibility
- Consider if the effect should vary by unit type (e.g., mechanical units might not bleed)

## Related Files
- `packages/client/src/scenes/GameScene.ts` (primary implementation)
- Any particle texture assets in `packages/client/public/` or `packages/client/src/assets/`

## Context
This change adds visual impact to unit death with a blood splatter effect. The splatter uses dark red particles spreading outward from the death cell, with a persistent ground stain that fades slowly. This makes combat feel more impactful and satisfying while maintaining the existing flash and explosion effects. The effect is implemented using Phaser's particle system for performance and visual quality.

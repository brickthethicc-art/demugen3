# Soul Orb Discard Pile Animation

## Problem Summary
Currently, when a unit dies, it plays a death animation (flash + blood splatter + explosion) and the unit is removed from the board. However, there's no visual connection between the unit's death and it becoming a card in the discard pile. This breaks the narrative flow of the unit's "soul" transitioning to the discard pile. A soul orb animation would create a clear visual link between unit death and the card entering the discard pile face-up.

## Desired Behavior
When a unit dies and goes to the discard pile:
1. **White soul orb appears** immediately after the death animation completes (after explosion)
2. **Brief hover** - the orb hovers in place at the death cell for a short duration (200-300ms)
3. **Fly to discard pile** - the orb smoothly animates from the death cell to the discard pile UI element
4. **White flash at discard pile** - when the orb reaches the discard pile, a white flash covers the discard pile element's space
5. **Fade into card** - the flash fades into the unit's card appearing face-up in the discard pile
6. This creates the illusion of the unit's soul transforming into a card and entering the discard pile

## Current State
- Death effects are handled in `packages/client/src/scenes/GameScene.ts`
- Current death sequence: flash → blood splatter → explosion → remove unit
- Discard pile is in `packages/client/src/components/DiscardPile.tsx` with stacked card display
- No visual connection between unit death and discard pile entry
- Cards appear in discard pile via game state updates, but without animation from the board

## Key Files to Investigate

### 1. GameScene.ts - Death Effects
**File**: `packages/client/src/scenes/GameScene.ts`
- Locate `playDeathAnimation` function and death handling logic
- Find where unit removal happens after death effects complete
- Check existing particle/animation systems for orb creation
- Identify the death cell world coordinates for orb spawn point

### 2. DiscardPile.tsx - Target Element
**File**: `packages/client/src/components/DiscardPile.tsx`
- Check for existing `data-discard-pile="desktop"` attribute (from memory)
- Determine the DOM element position for animation targeting
- Verify how new cards are added to the pile visually

### 3. Game Store - Discard Pile State
**File**: `packages/client/src/store/game-store.js` or similar
- Check how discard pile state is updated when units die
- Verify that unit cards are added to discard pile on death
- May need to track pending soul orb animations

### 4. Unit/Card Type Definitions
**File**: `packages/shared/src/types/`
- Verify unit data structure includes card information
- Ensure unit can be converted to card representation for discard pile

## Implementation Approach

### Option 1: DOM-based Animation with Web Animations API
Create a soul orb DOM element that animates from board position to discard pile:

```typescript
// In GameScene.ts after death animation completes:
private playSoulOrbAnimation(unit: Unit, deathPos: Position) {
  // Get world coordinates of death cell
  const { x: startX, y: startY } = this.gridToWorld(deathPos);
  
  // Get discard pile element position
  const discardPileEl = document.querySelector('[data-discard-pile="desktop"]');
  const pileRect = discardPileEl.getBoundingClientRect();
  const canvasRect = this.cameras.main.canvas.getBoundingClientRect();
  
  const endX = pileRect.left + pileRect.width / 2 - canvasRect.left;
  const endY = pileRect.top + pileRect.height / 2 - canvasRect.top;
  
  // Create soul orb element
  const orb = document.createElement('div');
  orb.style.cssText = `
    position: absolute;
    left: ${startX}px;
    top: ${startY}px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: radial-gradient(circle, #ffffff 0%, #e0e0ff 50%, rgba(255,255,255,0.3) 100%);
    box-shadow: 0 0 20px 5px rgba(255,255,255,0.8), 0 0 40px 10px rgba(200,200,255,0.4);
    pointer-events: none;
    z-index: 10000;
  `;
  document.body.appendChild(orb);
  
  // Hover phase
  const hoverAnimation = orb.animate([
    { transform: 'translateY(0) scale(1)', opacity: 1 },
    { transform: 'translateY(-10px) scale(1.1)', opacity: 1 },
    { transform: 'translateY(0) scale(1)', opacity: 1 }
  ], {
    duration: 300,
    easing: 'ease-in-out'
  });
  
  // Fly to discard pile after hover
  hoverAnimation.onfinish = () => {
    const flyDuration = 600;
    const flyAnimation = orb.animate([
      { left: `${startX}px`, top: `${startY}px`, opacity: 1, scale: 1 },
      { left: `${endX}px`, top: `${endY}px`, opacity: 1, scale: 0.8 }
    ], {
      duration: flyDuration,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
    
    flyAnimation.onfinish = () => {
      // White flash at discard pile
      this.triggerDiscardPileFlash(discardPileEl, unit);
      orb.remove();
    };
  };
}

private triggerDiscardPileFlash(discardPileEl: HTMLElement, unit: Unit) {
  // Create flash overlay
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: absolute;
    left: ${discardPileEl.getBoundingClientRect().left}px;
    top: ${discardPileEl.getBoundingClientRect().top}px;
    width: ${discardPileEl.offsetWidth}px;
    height: ${discardPileEl.offsetHeight}px;
    background: white;
    border-radius: 8px;
    pointer-events: none;
    z-index: 10001;
  `;
  document.body.appendChild(flash);
  
  // Flash animation
  flash.animate([
    { opacity: 1 },
    { opacity: 0 }
  ], {
    duration: 400,
    easing: 'ease-out'
  }).onfinish = () => flash.remove();
  
  // Card should appear in discard pile via existing game state update
  // The flash timing should align with the card appearing
}
```

### Option 2: Phaser-based Animation
Create the soul orb using Phaser graphics and animate within the game scene:

```typescript
private playSoulOrbAnimation(unit: Unit, deathPos: Position) {
  const { x: startX, y: startY } = this.gridToWorld(deathPos);
  
  // Get discard pile position (may need to convert DOM to Phaser coords)
  const discardPilePos = this.getDiscardPilePhaserPosition();
  
  // Create soul orb graphics
  const orb = this.add.graphics();
  orb.fillStyle(0xffffff, 1);
  orb.fillCircle(startX, startY, 15);
  
  // Add glow effect
  const glow = this.add.graphics();
  glow.fillStyle(0xffffff, 0.3);
  glow.fillCircle(startX, startY, 25);
  
  // Hover animation
  this.tweens.add({
    targets: [orb, glow],
    y: startY - 10,
    scale: 1.1,
    duration: 150,
    yoyo: true,
    repeat: 1,
    onComplete: () => {
      // Fly to discard pile
      this.tweens.add({
        targets: [orb, glow],
        x: discardPilePos.x,
        y: discardPilePos.y,
        scale: 0.8,
        duration: 600,
        easing: 'Cubic.easeOut',
        onComplete: () => {
          orb.destroy();
          glow.destroy();
          this.triggerDiscardPileFlash();
        }
      });
    }
  });
}
```

## Required Changes

### 1. Add Soul Orb Animation Function to GameScene
Add a new function `playSoulOrbAnimation` in `packages/client/src/scenes/GameScene.ts` near the death effect functions (around line 785+).

### 2. Integrate into Death Sequence
Modify the death handling to call the soul orb animation after the death explosion completes:

```typescript
// Current death sequence (from memory):
// 1. Flash unit
// 2. Blood splatter
// 3. Explosion
// 4. Remove unit

// New sequence:
// 1. Flash unit
// 2. Blood splatter
// 3. Explosion
// 4. Play soul orb animation (NEW)
// 5. Remove unit
```

The soul orb should trigger after the explosion (currently at ~100-200ms delay after flash), and the unit removal should wait for the soul orb animation to complete (total ~900-1100ms after death).

### 3. Add Discard Pile Flash Effect
Add a function to trigger the white flash at the discard pile when the soul orb arrives. This can be DOM-based or Phaser-based depending on the approach chosen.

### 4. Ensure Discard Pile State Updates
Verify that the game state properly adds the unit's card to the discard pile when the unit dies. The soul orb animation should align with this state update so the card appears as the flash fades.

### 5. Add Discard Pile Data Attribute (if not present)
Ensure the discard pile component has `data-discard-pile="desktop"` attribute for easy DOM targeting by the animation.

## Implementation Details

### Soul Orb Visual Design
- **Color**: White with blue-ish tint (radial gradient from pure white to light blue)
- **Size**: 25-35px diameter
- **Glow**: Multi-layered box-shadow or glow effect for ethereal appearance
- **Shape**: Perfect circle
- **Opacity**: Starts at 1.0, may fade slightly during flight

### Animation Timing
- **Hover phase**: 200-300ms total (up-down or pulse)
- **Flight phase**: 500-700ms to reach discard pile
- **Flash phase**: 300-400ms white flash at discard pile
- **Total duration**: ~1000-1400ms from death spawn to card appearance

### Flight Path
- Should use a curved or eased path (not straight line)
- Consider adding a slight arc or bezier curve for more natural movement
- Speed should accelerate then decelerate (ease-in-out)

### Discard Pile Flash
- White overlay covering the entire discard pile element
- Should fade out smoothly (ease-out)
- Timing should align with the card appearing in the pile
- May need to coordinate with the discard pile's card addition animation

### Position Calculation
- Death cell: Use existing `gridToWorld` conversion
- Discard pile: Get DOM element position and convert to canvas coordinates if using Phaser
- Consider camera position and scaling if using Phaser coordinates

### Cleanup
- Remove soul orb DOM element after animation completes
- Destroy Phaser graphics objects if using Phaser approach
- Ensure no memory leaks from animation objects

### Multiplayer Considerations
- Soul orb animation should play on all clients
- May need to trigger via game state event or sync via existing death handling
- Ensure timing is consistent across clients

## Testing Strategy

### 1. Single Unit Death Test
- Kill a unit through combat
- **Expected**: Death animation plays (flash → splatter → explosion)
- **Expected**: White soul orb appears at death cell after explosion
- **Expected**: Orb hovers briefly (200-300ms)
- **Expected**: Orb flies smoothly to discard pile
- **Expected**: White flash covers discard pile when orb arrives
- **Expected**: Unit's card appears face-up in discard pile as flash fades

### 2. Multiple Deaths Test
- Kill multiple units in quick succession
- **Expected**: Each death triggers its own soul orb animation
- **Expected**: Animations don't interfere with each other
- **Expected**: Multiple orbs can be in flight simultaneously

### 3. Different Board Positions Test
- Kill units at various board positions (corners, center, edges)
- **Expected**: Soul orb spawns at correct death cell each time
- **Expected**: Flight path adjusts correctly to discard pile position
- **Expected**: Animation timing is consistent regardless of distance

### 4. Ability Death Test
- Kill a unit via ability
- **Expected**: Soul orb plays after ability effects and death animation
- **Expected**: Timing doesn't conflict with ability feedback

### 5. Discard Pile State Test
- Verify unit card actually appears in discard pile after soul orb animation
- **Expected**: Card is added to discard pile state
- **Expected**: Card displays face-up in the pile
- **Expected**: Card count updates

### 6. Performance Test
- Kill many units rapidly
- **Expected**: Animations remain smooth
- **Expected**: No memory leaks from DOM elements or Phaser objects
- **Expected**: Frame rate stays acceptable

## Verification Steps

### Visual Verification
1. Start a game with units on the board
2. Attack and kill an enemy unit
3. **Expected**: Unit plays death animation (flash, blood splatter, explosion)
4. **Expected**: After explosion, white soul orb appears at death cell
5. **Expected**: Orb hovers/pulses briefly in place
6. **Expected**: Orb smoothly flies to the discard pile UI element
7. **Expected**: When orb reaches discard pile, white flash covers the pile
8. **Expected**: Flash fades and unit's card appears face-up in discard pile
9. Kill another unit
10. **Expected**: Same sequence plays for second unit

### Functional Verification
1. Verify the unit is actually removed from the board after soul orb animation
2. Verify the unit's card is added to the discard pile
3. Verify the card shows the correct unit information/art
4. Verify the discard pile count updates
5. Verify the animation plays in multiplayer games for all clients

### Timing Verification
1. Measure hover phase duration (should be 200-300ms)
2. Measure flight duration (should be 500-700ms)
3. Measure flash duration (should be 300-400ms)
4. Verify total animation doesn't excessively delay gameplay
5. Verify unit removal happens after animation completes

## Additional Considerations

### Visual Consistency
- Soul orb should match the game's ethereal/magical aesthetic
- White/blue color scheme fits the "soul" concept
- Glow effect should be subtle but visible
- Animation should feel smooth and magical, not mechanical

### Performance
- DOM-based animations may be more performant for cross-scene flight
- Ensure cleanup of all animation objects
- Consider limiting concurrent soul orbs if performance issues arise
- Test on lower-end devices if possible

### Mobile Considerations
- On mobile, the discard pile position may differ
- May need to adjust orb size for smaller screens
- Touch interactions shouldn't interfere with animation
- Flight path may need adjustment for different screen layouts

### Game Flow
- Animation shouldn't block player actions excessively
- Consider if animation can be skipped or sped up
- Ensure it doesn't conflict with other death-related effects
- Verify it works during all game phases

### Edge Cases
- What if discard pile is off-screen or hidden?
- What if player is spectating and discard pile isn't visible?
- What if unit dies during a phase where discard pile isn't relevant?
- Handle cases where discard pile DOM element isn't found

### Future Enhancements
- Could vary soul orb color based on unit type/faction
- Could add particle trail during flight
- Could add sound effect for soul orb spawn/arrival
- Could make the orb pulsate or glow more dynamically

## Related Files
- `packages/client/src/scenes/GameScene.ts` (primary implementation - soul orb animation)
- `packages/client/src/components/DiscardPile.tsx` (target element, may need data attribute)
- `packages/client/src/store/game-store.js` (discard pile state management)
- `packages/shared/src/types/` (unit/card type definitions)
- Reference: `UNIT_DEATH_BLOOD_SPLATTER_PROMPT.md` (existing death animation sequence)
- Reference: `DISCARD_PILE_VISUAL_UPDATE_PROMPT.md` (discard pile stacked display)

## Context
This change adds a soul orb animation that visually connects unit death to the discard pile. When a unit dies, after the existing death animation (flash, blood splatter, explosion), a white soul orb appears at the death cell, hovers briefly, then flies to the discard pile. Upon arrival, a white flash covers the discard pile and fades into the unit's card appearing face-up. This creates a narrative flow where the unit's "soul" transforms into a card and enters the discard pile, enhancing the visual storytelling and making the death-to-discard transition more satisfying and understandable.

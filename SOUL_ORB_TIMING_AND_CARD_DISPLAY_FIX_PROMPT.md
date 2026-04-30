# Soul Orb Animation Timing and Discard Pile Card Display Fix

## Problem Summary
The soul orb death-to-discard animation has two issues:

1. **Cause of death animation is cut short** - The 'cause of death' animation (flash, blood splatter, explosion) is too quickly interrupted by the soul orb animation. Both sequences need to be slowed down for better visibility.

2. **Card doesn't display after soul orb arrival** - When the soul orb reaches the discard pile and the flash animation plays, the unit's card does not appear face-up in the discard pile. The card should visibly appear as the flash fades.

## Desired Behavior

### 1. Slower Animations
- **Cause of death animation**: Double the duration of flash, blood splatter, and explosion phases
- **Soul orb animation**: Double the duration of hover and flight phases
- **Discard pile flash**: Double the duration of the flash effect
- Goal: Give users more time to see each stage of the death-to-discard sequence

### 2. Card Display After Flash
- When the soul orb reaches the discard pile and the flash animation completes, the unit's card should be visible face-up in the discard pile
- The flash should fade into the card appearance
- The card should display the correct unit information/art
- This creates the illusion of the soul transforming into a card

## Current State

### Timing Values in GameScene.ts
- **Death flash**: Currently 70-420ms (based on attacker survival)
- **Blood splatter**: ~900ms cleanup
- **Explosion delay**: 70ms after flash
- **Unit fade**: 220ms
- **Soul orb hover**: 250ms
- **Soul orb flight**: 600ms
- **Discard pile flash**: 340ms

### Discard Pile Display
- DiscardPile.tsx uses authoritative `gameState.players[].discardPile.cards` data
- Cards are rendered face-up in stacked display
- Game state updates add cards to discard pile on unit death
- No explicit animation when new cards appear in pile

## Key Files to Investigate

### 1. GameScene.ts - Death Animation Timing
**File**: `packages/client/src/scenes/GameScene.ts`
- `playDeathAnimation` function (around line 700)
- `emitBloodSplatter` function (around line 796)
- `emitDeathExplosion` function (around line 845)
- `playSoulOrbAnimation` function (around line 785)
- `triggerDiscardPileFlash` function (around line 863)
- All timing constants need to be doubled

### 2. DiscardPile.tsx - Card Display
**File**: `packages/client/src/components/DiscardPile.tsx`
- Check how cards are rendered from game state
- Verify that new cards trigger re-render
- May need to add animation when new card is added
- Ensure card appears with correct timing after flash

### 3. Game Store - Discard Pile State
**File**: `packages/client/src/store/game-store.js` or similar
- Verify that unit card is added to discard pile on death
- Check timing of state update vs soul orb animation
- May need to delay state update to align with flash completion

## Implementation Approach

### Step 1: Double All Animation Timings

Update timing constants in `GameScene.ts`:

```typescript
// Death flash durations
const ATTACKER_SURVIVE_FLASH_DURATION = 420 * 2; // 840ms
const ATTACKER_DIES_FLASH_DURATION = 420 * 2; // 840ms (was 420, double it)
const DEFENDER_FLASH_DURATION = 420 * 2; // 840ms

// Explosion delay
const EXPLOSION_DELAY_MS = 70 * 2; // 140ms

// Unit fade
const UNIT_FADE_DURATION = 220 * 2; // 440ms

// Soul orb hover
const SOUL_ORB_HOVER_DURATION = 250 * 2; // 500ms

// Soul orb flight
const SOUL_ORB_FLIGHT_DURATION = 600 * 2; // 1200ms

// Discard pile flash
const DISCARD_FLASH_DURATION = 340 * 2; // 680ms

// Blood splatter cleanup
const BLOOD_SPLATTER_CLEANUP = 900 * 2; // 1800ms
```

Apply these updated durations to:
- `playDeathAnimation` flash and explosion delay
- `emitBloodSplatter` particle cleanup delays
- `emitDeathExplosion` particle cleanup delays
- `playSoulOrbAnimation` hover and flight durations
- `triggerDiscardPileFlash` flash duration

### Step 2: Ensure Card Displays After Flash

There are two approaches:

#### Option A: Delay Game State Update
Delay the discard pile state update until after the soul orb flash completes:

```typescript
// In playDeathAnimation or wherever state is updated:
this.playSoulOrbAnimation(targetX, targetY, () => {
  // Trigger discard pile state update here
  // This ensures card appears in game state after flash
  updateDiscardPileState(unit);
});
```

#### Option B: Add Card Appearance Animation in DiscardPile.tsx
Add an animation when a new card is added to the discard pile:

```typescript
// In DiscardPile.tsx
useEffect(() => {
  if (discardPile.cards.length > previousCardCount) {
    // Animate new card appearance
    const newCardElement = cardRefs.current[discardPile.cards.length - 1];
    if (newCardElement) {
      newCardElement.animate([
        { opacity: 0, transform: 'scale(0.8)' },
        { opacity: 1, transform: 'scale(1)' }
      ], {
        duration: 400,
        easing: 'ease-out'
      });
    }
  }
}, [discardPile.cards.length]);
```

#### Option C: Coordinate Timing Between GameScene and DiscardPile
Use a shared timing signal or delay to ensure card appears exactly when flash completes:

```typescript
// In GameScene.ts triggerDiscardPileFlash:
private triggerDiscardPileFlash(discardPileElement: HTMLElement, unitId?: string) {
  // ... flash animation ...

  flashAnimation.onfinish = () => {
    this.removeOverlayElement(flash);
    // Emit event or call store to trigger card display
    if (unitId) {
      useGameStore.getState().triggerDiscardCardDisplay(unitId);
    }
  };
}

// In DiscardPile.tsx or game store:
// Listen for trigger and animate card appearance
```

### Recommended Approach
Use **Option A** (Delay Game State Update) combined with **Option B** (Add Card Appearance Animation):
1. Delay the server-side discard pile update until after soul orb completes
2. Add a client-side animation when the card appears in the discard pile
3. This ensures the card appears at the right time with a smooth transition

## Required Changes

### 1. Update All Timing Constants in GameScene.ts
- Double all animation durations
- Update particle cleanup delays
- Update explosion delay
- Update unit fade duration
- Update soul orb hover and flight durations
- Update discard flash duration

### 2. Coordinate Discard Pile State Update
- Ensure the unit card is added to discard pile state after soul orb flash completes
- This may require:
  - Modifying server-side death handling to delay discard pile update
  - OR adding client-side delay before processing the state update
  - OR adding a flag in game state to indicate "pending discard card"

### 3. Add Card Appearance Animation in DiscardPile.tsx
- Detect when a new card is added to the discard pile
- Animate the card appearing (fade in + scale up)
- Timing should align with the flash completion

### 4. Verify Timing Alignment
- Ensure total death sequence (flash → splatter → explosion → orb → flash → card) flows smoothly
- No gaps or overlaps in animations
- Card appears exactly as flash fades

## Implementation Details

### Timing Changes Summary
| Animation Phase | Current Duration | New Duration (2x) |
|----------------|-----------------|-------------------|
| Death flash (attacker dies) | 420ms | 840ms |
| Death flash (attacker survives) | 210ms | 420ms |
| Death flash (defender) | 420ms | 840ms |
| Explosion delay | 70ms | 140ms |
| Unit fade | 220ms | 440ms |
| Blood splatter cleanup | 900ms | 1800ms |
| Death explosion cleanup | 600ms | 1200ms |
| Soul orb hover | 250ms | 500ms |
| Soul orb flight | 600ms | 1200ms |
| Discard pile flash | 340ms | 680ms |

### Card Display Timing
- Card should begin appearing ~100ms before flash completes (fade in start)
- Card should be fully visible when flash reaches 0 opacity
- Total card appearance animation: ~400-500ms

### Visual Consistency
- Slower animations should still feel smooth, not sluggish
- Use easing functions that feel natural at slower speeds
- Ensure particle effects (blood, explosion) have longer lifespans to match

### Multiplayer Considerations
- If state update is delayed server-side, all clients will see card appear at same time
- If delay is client-side only, timing may differ between clients
- Prefer server-side delay for consistency

## Testing Strategy

### 1. Timing Verification
- Kill a unit and measure each animation phase duration
- **Expected**: All phases are exactly 2x longer than before
- **Expected**: No phase overlaps or gaps
- **Expected**: Total death sequence is smooth and readable

### 2. Card Display Verification
- Kill a unit and watch discard pile
- **Expected**: Soul orb flies to discard pile
- **Expected**: White flash covers discard pile
- **Expected**: As flash fades, unit card appears face-up
- **Expected**: Card shows correct unit information/art
- **Expected**: Card animation is smooth (fade in + scale)

### 3. Multiple Deaths Test
- Kill multiple units in quick succession
- **Expected**: Each death plays full slowed-down sequence
- **Expected**: Cards appear in discard pile in correct order
- **Expected**: No timing conflicts between animations

### 4. Different Death Types Test
- Kill via combat
- Kill via ability
- Kill via sorcery
- **Expected**: All death types use the same slowed timing
- **Expected**: Card displays correctly for all death types

## Verification Steps

### Visual Verification
1. Start a game with units on the board
2. Attack and kill an enemy unit
3. **Expected**: Unit flashes for ~840ms (slower)
4. **Expected**: Blood splatter particles last longer (~1800ms cleanup)
5. **Expected**: Explosion occurs after ~140ms delay (slower)
6. **Expected**: Soul orb hovers for ~500ms (slower)
7. **Expected**: Soul orb flies for ~1200ms (slower)
8. **Expected**: Discard pile flash lasts ~680ms (slower)
9. **Expected**: Unit card appears face-up as flash fades
10. **Expected**: Card displays with smooth fade-in animation

### Functional Verification
1. Verify the unit is removed from the board after all animations complete
2. Verify the unit's card is added to the discard pile
3. Verify the card shows the correct unit information
4. Verify the discard pile count updates
5. Verify animations don't block gameplay excessively

### Timing Verification
1. Measure each animation phase with a stopwatch or dev tools
2. **Expected**: All durations are approximately 2x the original values
3. **Expected**: Card appears within 100-200ms of flash starting to fade
4. **Expected**: Total death sequence is ~3-4 seconds (vs ~1.5-2 seconds before)

## Additional Considerations

### Performance
- Longer animations mean more concurrent effects possible
- Ensure particle emitters are cleaned up properly
- Monitor memory usage with many deaths in quick succession

### Game Flow
- Total death sequence is now ~3-4 seconds
- Ensure this doesn't make gameplay feel too slow
- Consider if players can act during death animations
- May need to allow skipping animations in future

### Mobile Considerations
- Longer animations may be more noticeable on mobile
- Ensure performance is acceptable on mobile devices
- Touch interactions shouldn't interfere with animations

### Edge Cases
- What if player leaves during death animation?
- What if game ends during death animation?
- What if discard pile is off-screen?
- Ensure cleanup happens even if animation is interrupted

## Related Files
- `packages/client/src/scenes/GameScene.ts` (primary - timing changes)
- `packages/client/src/components/DiscardPile.tsx` (card display animation)
- `packages/client/src/store/game-store.js` (state update timing)
- `packages/shared/src/engines/discard-pile/index.ts` (server-side discard logic)
- Reference: `SOUL_ORB_DISCARD_ANIMATION_PROMPT.md` (original implementation)
- Reference: `UNIT_DEATH_BLOOD_SPLATTER_PROMPT.md` (death animation details)

## Context
This change addresses two issues with the soul orb death-to-discard animation:
1. Animations are too fast - double all timing values for better visibility
2. Card doesn't display after flash - coordinate state update and add card appearance animation

The goal is to make the death-to-discard transition more readable and ensure the card visibly appears when the soul orb completes its journey to the discard pile.

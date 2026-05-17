# Opponent Card Draw Animation Visibility

## Overview
Currently, when cards are drawn by the turn player, only their POV displays cards being drawn from the deck and being put into the hand. This needs to be extended so that when OTHER players draw cards from their main deck, the animation is visible to ALL players in the game, showing cards moving from the main deck to the 1st slot in the hand and so on throughout the game.

## Current Behavior
- Only the drawing player sees their own card draw animation
- When player 2, 3, or 4 draws cards, other players do not see any animation
- No visual feedback when opponents draw cards

## Desired Behavior
- When ANY player (including opponents) draws cards from their main deck, ALL players should see the animation
- Animation should show cards moving from the appropriate edge's deck pile to that player's hand zone
- Cards should animate to the correct hand slot (1st slot, 2nd slot, etc.) based on hand state
- This should work consistently throughout the game for all draw events

## Requirements

### 1. Multiplayer Draw Visibility
- When player 2 (top edge) draws cards, players 1, 3, and 4 should see the animation
- When player 3 (left edge) draws cards, players 1, 2, and 4 should see the animation
- When player 4 (right edge) draws cards, players 1, 2, and 3 should see the animation
- Animation must originate from the correct edge's deck pile
- Animation must travel to the correct edge's hand zone
- Each card should animate to its specific hand slot position

### 2. Hand Slot Targeting
- Animation must target the correct hand slot index based on current hand state
- First drawn card goes to slot 0 (or 1 depending on indexing)
- Subsequent cards go to subsequent slots
- Must account for cards already in hand when calculating target position
- Animation should reflect the actual hand layout order

### 3. Animation Consistency
- Same animation style for all players (deck → hand flight with flip)
- Same timing and easing for all draw events
- Consistent visual feedback regardless of which player is drawing
- No difference in animation quality between self and opponent draws

### 4. Card Face Visibility
- For opponent draws: cards should show card back (face-down) during animation
- For self draws: cards can show card front (face-up) if that's the current behavior
- Maintain hidden card enforcement - opponents should not see card faces of other players' cards
- Animation should respect the existing hidden card system

## Technical Context

### Relevant Files
- `packages/client/src/components/GameHUD.tsx` - Main HUD component with edge zones and hand rendering
- `packages/client/src/components/GameScreen.tsx` - Game screen wrapper
- `packages/client/src/store/game-store.js` or similar - Game state management
- Animation code likely in or near these components

### Current Animation Implementation
- Based on memory: draw-overlay card animation was flattened from 3D rotateY to 2D opacity face swap
- Card back styling uses `packages/client/src/utils/card-back-style.ts` with asset `/back-of-card.png`
- Edge orientation: index 0 bottom, index 1 top, index 2 left, index 3 right
- Hidden card enforcement exists in server (`packages/server/src/resolver/sanitize.ts`)

### Architecture Constraints
- **Frontend-only changes only** - no gameplay logic, backend, or networking modifications
- Keep desktop UI and mobile UI separate (if mobile mode exists)
- Maintain existing card back visual consistency
- Respect existing hidden card enforcement system

## Implementation Approach

### Step 1: Locate Current Animation Trigger
Search for where card draw animations are currently triggered:
- Look in GameHUD.tsx for draw animation code
- Search for keywords: draw, animate, card, hand, deck
- Identify how the current self-only animation works
- Find where player index/edge information is available

### Step 2: Extend Animation to All Players
- Modify animation trigger to fire for ALL draw events, not just local player
- Ensure animation component receives the drawing player's index
- Route animation to start from correct edge deck based on player index
- Route animation to end at correct edge hand zone based on player index

### Step 3: Calculate Correct Hand Slot Position
- Determine target hand slot based on:
  - Drawing player's hand state before the draw
  - Number of cards already in hand
  - Hand slot index for the new card
- Map hand slot index to actual pixel position for animation target
- Account for edge-specific hand layouts (bottom horizontal, left/right vertical)

### Step 4: Handle Card Face Visibility
- For opponent draws: ensure card shows back (face-down) throughout animation
- For self draws: maintain current face-up behavior if desired
- Use existing hidden card ID detection: `isHiddenCardId()` from shared types
- Apply card back styling for non-self player draws

### Step 5: Test from All Perspectives
Verify animation works when:
- Player 1 (bottom) draws - all should see
- Player 2 (top) draws - all should see
- Player 3 (left) draws - all should see
- Player 4 (right) draws - all should see
- Multiple cards drawn in sequence
- Cards drawn when hand already has cards

## Success Criteria
1. All players see card draw animations when ANY player draws from main deck
2. Animation originates from correct edge deck pile for the drawing player
3. Animation travels to correct edge hand zone for the drawing player
4. Card animates to the correct hand slot position based on hand state
5. Opponent draws show card back (face-down), not card front
6. Self draws maintain current behavior (face-up if that's current)
7. Animation is consistent across all players and edges
8. No backend/gameplay logic changes
9. Existing hidden card enforcement maintained

## Testing Strategy

### Test 1: Opponent Draw Visibility
- Start a 4-player game
- Have player 2 draw a card
- **Expected**: Players 1, 3, and 4 see animation from top deck to top hand
- **Expected**: Animation shows card back (face-down)
- Repeat for player 3 and player 4

### Test 2: Hand Slot Accuracy
- Player 2 has 0 cards in hand, draws 1 card
- **Expected**: Card animates to slot 0/first position
- Player 2 now has 1 card, draws another
- **Expected**: Second card animates to slot 1/second position
- Verify slot positions match actual hand layout

### Test 3: Multi-Card Draws
- Player 3 draws 2 cards at once
- **Expected**: Both cards animate sequentially
- **Expected**: First card to slot 0, second to slot 1
- **Expected**: All players see both animations

### Test 4: Self Draw Consistency
- Player 1 (local) draws cards
- **Expected**: Animation still works as before
- **Expected**: No regression in existing self-draw behavior

### Test 5: Edge-Specific Layouts
- Test draws from each edge (bottom, top, left, right)
- **Expected**: Animation path correct for each edge orientation
- **Expected**: Hand slot positions correct for vertical (left/right) vs horizontal (bottom/top) layouts

## Additional Considerations

### Performance
- Multiple concurrent animations (when multiple players draw)
- Ensure animations don't cause performance issues
- Clean up animation elements promptly

### Visual Clarity
- Make it obvious which player is drawing (originating edge)
- Ensure animation is visible even with multiple players drawing
- Consider subtle differences or indicators if needed

### Hidden Card Enforcement
- Must not reveal opponent card faces
- Use existing `HIDDEN_CARD_ID_PREFIX` and `isHiddenCardId()` helpers
- Maintain server-side sanitization

### Edge Cases
- What if hand is full?
- What if deck is empty?
- What if draw is canceled?
- Handle cases where DOM elements aren't found

## Related Files
- `packages/client/src/components/GameHUD.tsx` - Main HUD with edge zones
- `packages/client/src/components/GameScreen.tsx` - Game screen wrapper
- `packages/shared/src/types/card.ts` - Hidden card helpers
- `packages/server/src/resolver/sanitize.ts` - Hidden card enforcement
- Reference: `CARD_DRAW_ANIMATION_IMPROVEMENT_PROMPT.md` - Similar multiplayer visibility requirements
- Reference: `CARD_DRAW_ANIMATION_AND_DECK_SKIN_PROMPT.md` - Animation implementation details

## Context
This change extends the existing card draw animation system to be truly multiplayer-visible. Currently, only the drawing player sees their own card draw animation. This prompt ensures that when ANY player draws cards, ALL players in the game see the animation showing cards moving from the deck to the appropriate hand slot. This provides better game state awareness and makes the game feel more alive and interactive for all participants.

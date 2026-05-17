# Card Draw Animation Improvement Prompt

## Overview
Improve the card draw animation in the demugen3 game client to make it more clear, distinct, and visible from all players' perspectives. The animation should be fluid with a slower, more deliberate card flip.

## Requirements

### 1. Multiplayer Visibility
- **Current Issue**: Only the local player (player 1/bottom) sees card draw animations for themselves
- **Required Fix**: All players should see card draw animations when ANY player draws cards from the main deck
- When player 2 (top), player 3 (left), or player 4 (right) draws a card, all other players should see the animation
- The animation should originate from the appropriate edge's deck pile and animate to that player's hand zone
- Example: When player 2 (top edge) draws, players 1, 3, and 4 should see a card animate from the top deck pile to the top hand zone

### 2. Animation Fluidity and Emphasis
- **Current Issue**: Card flip is too fast and lacks emphasis on the drawing/flipping action
- **Required Fix**: Slower, more fluid flip animation that clearly shows:
  - Card emerging from the deck pile
  - Card traveling to the hand zone
  - Card flipping from face-down (card back) to face-up (card front)
  - Card settling into the hand slot
- The flip should be deliberate and visually prominent, especially for the turn player's perspective
- Consider adding easing functions (e.g., ease-in-out) for more natural motion

### 3. Clarity and Distinctness
- The animation should be visually distinct from other game animations
- Use clear visual cues:
  - Card back visible during deck-to-hand travel
  - Smooth transition to card front upon reaching hand
  - Subtle scale or glow effect to emphasize the draw action
- Ensure the animation is visible regardless of the viewer's perspective (bottom/top/left/right)

## Technical Context

### Relevant Files
- `packages/client/src/components/GameHUD.tsx` - Main HUD component with edge zones
- `packages/client/src/components/GameScreen.tsx` - Game screen wrapper
- Animation code likely in or near these components

### Current Animation Implementation
- Based on memory: draw-overlay card animation was previously flattened from 3D rotateY/preserve-3d to 2D opacity face swap
- Card back styling uses `packages/client/src/utils/card-back-style.ts` with asset `/back-of-card.png`
- Edge orientation follows: index 0 bottom, index 1 top, index 2 left, index 3 right

### Architecture Constraints
- **Frontend-only changes only** - no gameplay logic, backend, or networking modifications
- Keep desktop UI and mobile UI separate (if mobile mode exists)
- Maintain existing card back visual consistency

## Implementation Approach

### Step 1: Locate Current Animation Code
Search for card draw animation implementation, likely in:
- GameHUD.tsx or related animation components
- Look for draw, flip, animate keywords in the client codebase

### Step 2: Extend Animation for All Players
- Modify the animation trigger to broadcast draw events to all clients (if not already done)
- Ensure the animation component receives the drawing player's index/edge information
- Route the animation to start from the correct edge's deck pile based on player index

### Step 3: Improve Animation Timing and Fluidity
- Increase animation duration for slower, more visible flips
- Add or improve easing functions for natural motion
- Consider breaking animation into phases:
  1. Card emerges from deck (slide out)
  2. Card travels to hand (translate)
  3. Card flips (rotate or opacity swap)
  4. Card settles (scale/fade into position)

### Step 4: Enhance Visual Clarity
- Add subtle scale effect during flip to emphasize the action
- Consider adding a brief glow or highlight when card reaches hand
- Ensure card back is clearly visible during travel phase
- Make face-up transition smooth and deliberate

### Step 5: Test from All Perspectives
- Verify animation visibility when:
  - Player 1 (bottom) draws
  - Player 2 (top) draws
  - Player 3 (left) draws
  - Player 4 (right) draws
- Ensure animation origin and destination are correct for each edge
- Check that all viewers see the animation regardless of which player drew

## Success Criteria
1. All players see card draw animations when any player draws from main deck
2. Animation originates from correct edge deck pile and travels to correct hand zone
3. Card flip is slower, more fluid, and visually prominent
4. Animation is clear and distinct from other game actions
5. No backend/gameplay logic changes
6. Existing card back visuals maintained

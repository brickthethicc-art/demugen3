# HUD Perspective Depth and Card Facing Fixes

## Goal
- Increase Player 2 (top edge) card group depth to better match board foreshortening
- Fix Player 3 and 4 (left/right) bench card titles to face inward toward the board center, not outward

## Current Problems
- Player 2 top-edge cards (hand, reserve, deck, grave) appear too shallow compared to grid depth
- Player 3 and 4 side-edge card titles/labels point outward instead of inward; cards should face an "invisible player" at the board center

## Required Changes

### 1. Increase Player 2 Top-Edge Depth
- Current `HUD_TOP_EDGE_DEPTH_ANGLE_DEG` uses `BOARD_PERSPECTIVE_DEPTH_ANGLE_DEG` (~11.31°)
- This angle is too shallow; top groups need steeper rotation to match visual board depth
- Investigate increasing the angle multiplier or using a steeper constant
- Ensure top-edge width scale remains aligned with board (`BOARD_PERSPECTIVE_TOP_WIDTH_SCALE = 0.85`)

**Target constants in `GameHUD.tsx`:**
- Line 32: `HUD_TOP_EDGE_DEPTH_ANGLE_DEG` — increase depth angle

### 2. Fix Player 3/4 Side-Edge Card Facing
- Current `getCardFacingStyle` rotates side cards:
  - Left edge: `rotate(-90deg)`
  - Right edge: `rotate(90deg)`
- These rotations point card titles outward, away from board
- Cards should instead face inward toward grid center (like facing an opponent across the table)
- For left edge: rotate so top of card points toward center (clockwise)
- For right edge: rotate so top of card points toward center (counter-clockwise)

**Target function in `GameHUD.tsx`:**
- Lines 178-192: `getCardFacingStyle` — adjust left/right rotations to face inward

## Implementation Steps

1. Adjust top-edge depth angle:
   - Test increasing `HUD_TOP_EDGE_DEPTH_ANGLE_DEG` (e.g., multiply by 1.3–1.5 or use a fixed steeper angle like 18–20°)
   - Verify hand/reserve/deck/grave all apply the same transform
   - Ensure bottom edge remains unchanged

2. Flip side-edge card facing:
   - Update `getCardFacingStyle` for `left` and `right` edges
   - Left edge: change from `rotate(-90deg)` to `rotate(90deg)` (or similar inward-facing rotation)
   - Right edge: change from `rotate(90deg)` to `rotate(-90deg)` (or similar inward-facing rotation)
   - Confirm card titles now point toward board center

3. Test with 2/3/4-player matches:
   - Player 2: verify significantly steeper depth
   - Player 3/4: verify bench/hand cards face inward
   - Player 1: verify no changes

## Acceptance Criteria
- Player 2 top groups appear with much steeper depth, closer to board foreshortening
- Player 3/4 side cards face inward toward grid center (titles point to board, not away)
- All zone groups (hand/reserve/deck/grave) on each edge use consistent transforms/facing
- Player 1 bottom edge unchanged
- No regressions in interactions/animations
- Typecheck passes for client after edits

## File to Edit
`packages/client/src/components/GameHUD.tsx`

## Specific Lines to Focus On
- Line 32: `HUD_TOP_EDGE_DEPTH_ANGLE_DEG` constant
- Lines 178-192: `getCardFacingStyle` function (especially left/right cases)

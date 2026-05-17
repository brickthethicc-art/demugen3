# Grid Top Row Clipping Investigation

## Problem
After implementing a `20px` upward shift to both the HUD seat groups and the game grid, the topmost row of the grid is now visually cut in half horizontally. The upper portion of the top row cells is invisible, while the rest of the grid renders normally. The attached image confirms this clipping issue.

## Context
Recent changes applied:
- `packages/client/src/components/GameHUD.tsx`: Added `COMBINED_UI_GROUP_SHIFT_UP_PX = 20` and wrapped all `PlayerSeatGroups` in a container with `transform: translateY(-20px)`
- `packages/client/src/scenes/GameScene.ts`: Added matching `COMBINED_UI_GROUP_SHIFT_UP_PX = 20` and applied it in `recalculateBoardOrigin()` as `boardOriginY = ... - GRID_VERTICAL_SHIFT_PX - COMBINED_UI_GROUP_SHIFT_UP_PX`

The grid is rendered via Phaser in `GameScene` and positioned relative to the viewport. The HUD seat groups are rendered in React and positioned via CSS transforms.

## Visual Evidence
The image shows:
- Grid cells with light grey fill and dark borders
- L-shaped dark grey obstacles on the grid
- Units represented by letters in colored squares
- **Top row of grid cells is cut horizontally — only the bottom half of the top row cells is visible**
- Bottom rows of grid render fully intact
- HUD elements above and below the grid appear normally positioned

## Investigation Scope

### 1. Clipping Container Check
Investigate whether the Phaser canvas or its parent container has:
- Fixed height constraints
- `overflow: hidden` CSS property
- A parent container with `overflow: hidden` that clips the shifted grid
- Check `packages/client/src/components/GameBoard.tsx` for container styles on the Phaser canvas wrapper

### 2. Z-Index/Layering Check
Determine if any UI element is positioned above the grid with a higher z-index:
- Check for overlays, toasts, or modal backdrops that might obscure the top grid area
- Verify the z-index hierarchy between `GameHUD` (z-[9000]), `GameBoard`, and any overlays
- Look for absolute/ fixed positioned elements that might overlap the top grid region

### 3. Origin Calculation Verification
Re-examine the board origin calculation in `GameScene.ts`:
- `recalculateBoardOrigin()` now subtracts `COMBINED_UI_GROUP_SHIFT_UP_PX` from `boardOriginY`
- Verify this calculation correctly accounts for the viewport boundaries
- Check if `targetGridCenterY` calculation still valid after the shift
- Ensure `GRID_VERTICAL_SHIFT_PX` and `COMBINED_UI_GROUP_SHIFT_UP_PX` don't double-apply the same offset

### 4. Phaser Rendering Bounds
Investigate Phaser-specific rendering constraints:
- Check if the Phaser canvas has explicit width/height bounds that clip content
- Verify if `Phaser.Scale.NONE` mode in `GameBoard.tsx` affects rendering boundaries
- Determine if Phaser's camera or world bounds need adjustment after the shift
- Check if `cellGraphics` drawing is being clipped by the canvas boundaries

### 5. HUD and Grid Shift Interaction
Analyze the interaction between the two shifts:
- HUD shift: CSS `transform: translateY(-20px)` on React container
- Grid shift: Phaser `boardOriginY` adjustment subtracting 20px
- Verify these shifts are not conflicting or compounding incorrectly
- Check if the grid shift should be applied differently (e.g., to camera position instead of origin)

### 6. Viewport Boundary Check
Verify the grid stays within visible viewport bounds:
- After `boardOriginY` is reduced by 20px, does the top of the grid go above viewport top edge?
- Check if `viewportCenterY` calculation accounts for the shift
- Determine if any safety margin/padding should be added to prevent clipping

## Required Investigation Steps

1. Read `packages/client/src/components/GameBoard.tsx` to inspect the Phaser canvas container and any CSS properties that might cause clipping
2. Read `packages/client/src/components/GameScreen.tsx` to check the overall layout structure and any overflow/height constraints on the game board section
3. Read `packages/client/src/scenes/GameScene.ts` focusing on:
   - `recalculateBoardOrigin()` implementation
   - Any camera bounds or world bounds settings
   - How `boardOriginY` is used in grid rendering
4. Search for any z-index values in the client codebase that might place elements above the grid
5. Check if there are any CSS classes applied to the game board container that include `overflow: hidden` or similar clipping properties

## Acceptance Criteria
- Identify the exact cause of the top row clipping
- Provide a code-level explanation of why the shift causes this issue
- Propose a solution that:
  - Maintains the intended 20px upward shift for both HUD and grid
  - Ensures the entire grid is visible with no clipping
  - Does not introduce new visual misalignments
  - Preserves existing card interactions and hit-testing

## Files to Investigate
- `packages/client/src/components/GameBoard.tsx` (Phaser canvas container)
- `packages/client/src/components/GameScreen.tsx` (overall layout)
- `packages/client/src/components/GameHUD.tsx` (HUD positioning and z-index)
- `packages/client/src/scenes/GameScene.ts` (grid origin calculation and rendering)

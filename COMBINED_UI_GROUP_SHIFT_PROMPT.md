# Combined UI Group Shift Up 20px

## Goal
- Group the top card group (hand, bench, main deck, graveyard), the grid, and the bottom card group as one entire combined entity
- Shift the entire combined group up by 20 more pixels using layout-level offsets (not Phaser world-origin offsets)
- Make this a strictly frontend UI change with no gameplay or backend logic modifications
- Preserve full grid visibility (no top-row clipping) while shifting upward
- Keep grid and card groups synchronized by applying equivalent UI-layer movement to both

## Context
- Top card groups are positioned in `packages/client/src/components/GameHUD.tsx` using:
  - `TOP_GROUP_SHIFT_DOWN_PX` (currently 38) for top card group vertical positioning
  - Top edge includes: hand, reserve (bench), deck, graveyard zones
- The grid is rendered in `packages/client/src/scenes/GameScene.ts` using:
  - `CELL_SIZE` constant for cell dimensions
  - Board positioning controlled by Phaser scene coordinate system
- Bottom card groups are positioned in `GameHUD.tsx` using:
  - `BOARD_EDGE_OFFSET_PX` (currently 41) for bottom card group vertical positioning
  - Bottom edge includes: hand, reserve (bench), deck, graveyard zones
- Currently, these three sections (top groups, grid, bottom groups) are positioned independently

## Required Changes

### 1. Create Combined Group Container
- Wrap the top card groups, grid, and bottom card groups into a single cohesive container/transform
- This combined group should be treated as one entire entity for positioning purposes
- Ensure all three sections move together as a unit

### 2. Shift Combined Group Up 20 Pixels
- Apply a uniform upward shift of 20 pixels to the entire combined group
- This shift should move everything (top groups, grid, bottom groups) upward together
- The relative positioning between the three sections should remain unchanged
- Only the absolute position of the entire combined group changes

### 3. Maintain Existing Layout
- Preserve the current spacing between top groups, grid, and bottom groups
- Do not change the internal positioning of individual zones within each section
- Ensure all card interactions, animations, and hit-testing continue to work correctly

## Implementation Location

### Primary File: `packages/client/src/components/GameHUD.tsx`
- Focus: Container structure that wraps top groups, grid container, and bottom groups
- Apply the 20px upward shift at the container level
- Ensure the container encompasses all three sections (top, grid, bottom)

### Secondary File: `packages/client/src/components/GameScreen.tsx`
- Focus: Game board container vertical placement (`BOARD_SECTION_SHIFT_DOWN_PX`)
- Move the Phaser canvas up by adjusting React layout offset (e.g., reducing this constant by 20)
- Keep grid movement at DOM/layout level so Phaser rendering bounds are unchanged

### Do Not Use For Shifting: `packages/client/src/scenes/GameScene.ts`
- Do not apply additional upward shift by subtracting from `boardOriginY` in `recalculateBoardOrigin()`
- Avoid adding combined shift constants to Phaser board origin math (this caused top-row clipping)

## Technical Notes
- Apply frontend-only changes only
- The 20px upward shift should be applied as a single transform/offset to the combined container
- Use UI-layer offsets only:
  - Card groups: `GameHUD.tsx` combined container transform (e.g., `translateY(-20px)` increments)
  - Grid/canvas: `GameScreen.tsx` board section offset (e.g., reduce `BOARD_SECTION_SHIFT_DOWN_PX` by 20)
- Do not move the grid by changing Phaser `boardOriginY`
- Ensure the shift is applied consistently across all player counts (2, 3, 4 players)
- Test that the shift does not cause any overflow or clipping issues
- Verify that card interactions (drag/drop, click) still work correctly after the shift
- Ensure the shift does not affect mobile mode (keep mobile UI unchanged)
- Maintain responsive behavior if the viewport changes

## Acceptance Criteria
- Top card groups, grid, and bottom card groups are positioned as one combined entity
- The entire combined group is shifted up by exactly 20 additional pixels
- Relative spacing between top groups, grid, and bottom groups remains unchanged
- All card interactions, animations, and hit-testing work correctly
- No gameplay or backend logic changes
- Mobile UI remains unchanged
- Typecheck passes for client after edits
- No overflow or clipping issues occur
- The top row of the grid remains fully visible (no horizontal clipping)

## Files to Edit
- `packages/client/src/components/GameHUD.tsx` (primary)
- `packages/client/src/components/GameScreen.tsx` (secondary for grid/canvas shift)

## Specific Areas to Focus On
- Container structure in GameHUD.tsx that wraps the game board area
- `COMBINED_UI_GROUP_SHIFT_UP_PX` in `GameHUD.tsx` and `BOARD_SECTION_SHIFT_DOWN_PX` in `GameScreen.tsx`
- Ensure the 20px shift is applied at the highest level that encompasses all three sections
- Keep `GameScene.ts` origin math unchanged for this type of UI shift

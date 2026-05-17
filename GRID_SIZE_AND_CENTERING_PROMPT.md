# Grid Size and Centering Prompt

## Description
Make the game grid 10% smaller and center it vertically between the topmost card group and the bottommost card group using pixel-based positioning. Ensure that hidden components and elements do not affect the grid being moved upwards.

## Context
- The grid is currently rendered in `packages/client/src/scenes/GameScene.ts` using `CELL_SIZE` constant
- The grid positioning is controlled by Phaser scene coordinate system
- Card groups are positioned in `packages/client/src/components/GameHUD.tsx` using:
  - `TOP_GROUP_SHIFT_DOWN_PX` (currently 38) for top card group
  - `BOARD_EDGE_OFFSET_PX` (currently 41) for bottom card group
- The board size is defined by `BOARD_SIZE_PX` (currently 598)

## Required Changes
- Reduce the grid size by 10%:
  - Scale down `CELL_SIZE` constant in `GameScene.ts` by 10%
  - Adjust any dependent calculations that use `CELL_SIZE`
- Center the grid vertically between topmost and bottommost card groups:
  - Calculate the vertical center point between the top card group position and bottom card group position
  - Position the grid at this center point using pixel-based offsets
  - Ensure the centering accounts for the new smaller grid size
- Ensure hidden components do not affect grid positioning:
  - Verify that any overlays, loading screens, or hidden UI elements do not push the grid upward
  - Check for any CSS transforms or positioning that might affect the grid container
  - Ensure the grid container has proper z-index and positioning to be independent of hidden elements

## Implementation Location
- File: `packages/client/src/scenes/GameScene.ts`
  - Focus: `CELL_SIZE` constant and any grid positioning logic
  - Adjust grid rendering to use the new smaller cell size
  - Modify grid container positioning to center between card groups
- File: `packages/client/src/components/GameHUD.tsx` (if needed)
  - Focus: May need to adjust grid container positioning if it's controlled here
  - Ensure grid centering coordinates are calculated based on card group positions

## Technical Notes
- Apply frontend-only changes
- The grid centering should be calculated in pixels, not percentages
- The center point formula should be: `(top_card_group_bottom_edge + bottom_card_group_top_edge) / 2`
- Top card group position is determined by: `50% - topReserveOffset + TOP_GROUP_SHIFT_DOWN_PX`
- Bottom card group position is determined by: `50% + bottomReserveOffset`
- Ensure the grid is centered relative to the viewport, not just the board container
- Test that hidden elements (loading overlays, modals, etc.) do not affect grid positioning
- Maintain grid hit-testing functionality after size reduction
- Ensure unit sprites and highlights scale appropriately with the smaller grid

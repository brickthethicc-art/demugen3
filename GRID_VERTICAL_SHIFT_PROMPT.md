# Grid Vertical Shift and Z-Index Adjustment

## Description
Shift the game grid and all its components up by 50 pixels. Ensure the grid renders above all other elements and components so that it remains facing the user entirely with proper z-index layering.

## Context
- The grid is currently rendered in `packages/client/src/scenes/GameScene.ts` using Phaser scene coordinate system
- Grid positioning is controlled by the scene's coordinate system and any offset constants
- Card groups and HUD elements are positioned in `packages/client/src/components/GameHUD.tsx`
- The grid container may have z-index/depth settings that affect rendering order
- Phaser uses depth values to control rendering order (higher depth = renders on top)

## Required Changes
- Shift the grid and all its components up by 50 pixels:
  - Adjust the grid container's Y position by subtracting 50 pixels from its current position
  - Ensure all grid components (cells, highlights, unit sprites, effects) move together with the grid
  - Maintain relative positioning of all grid elements (cells, units, highlights should stay aligned)
- Ensure the grid renders above all other elements:
  - Set the grid container's depth/z-index to a value higher than all HUD elements, card groups, and overlays
  - Verify that the grid is always rendered on top of hand/reserve/deck/grave zones
  - Ensure the grid remains fully visible and facing the user without obstruction
  - Check that no UI overlays or loading screens cover the grid

## Implementation Location
- File: `packages/client/src/scenes/GameScene.ts`
  - Focus: Grid container positioning (Y coordinate offset)
  - Adjust grid container depth/z-index to ensure it renders above all other elements
  - Verify all grid components inherit the proper depth values
- File: `packages/client/src/components/GameHUD.tsx` (if needed)
  - Focus: May need to adjust HUD element z-index/depth to be below the grid
  - Ensure card groups and UI elements do not overlap the shifted grid

## Technical Notes
- Apply frontend-only changes
- The grid shift should be a simple Y-axis offset of -50 pixels (upward)
- Phaser depth system: higher depth values render on top
- Consider using `setDepth()` on the grid container to ensure it's above all other game elements
- The grid depth should be higher than:
  - HUD card groups (hand, reserve, deck, grave)
  - UI overlays
  - Loading screens
  - Any other game scene elements
- Test that the grid remains fully interactive after the shift (hit-testing, unit selection, etc.)
- Verify that the grid does not overlap or interfere with HUD elements in an undesirable way
- Ensure the grid "faces the user entirely" means it should be fully visible without any elements covering it

## Acceptance Criteria
- Grid is shifted up by exactly 50 pixels from its current position
- All grid components (cells, units, highlights, effects) move together as a unit
- Grid renders above all other elements (HUD, card groups, overlays)
- Grid remains fully visible and facing the user without obstruction
- Grid interactions (hit-testing, unit selection) still work correctly after the shift
- No regressions in gameplay or visual presentation
- Typecheck passes for client after edits

## File to Edit
`packages/client/src/scenes/GameScene.ts`

## Areas to Focus On
- Grid container creation and positioning (look for `this.add.container()` or similar)
- Grid Y coordinate/offset constants
- Grid depth/z-index settings (look for `setDepth()` calls)
- Any grid rendering initialization code

# Frontend UI Grid and Card Size Adjustment

## Overview
Adjust the game grid perspective and container styling to reclaim space for player zones (hand, bench/reserve, main deck, graveyard), then shift those zones inward to use the reclaimed space.

## Changes Required

### 1. Grid Perspective (Make ~20% Steeper)
- **Current state**: Grid is rendered with a certain perspective angle
- **Required**: Increase the grid perspective by approximately 20% to make it appear steeper
- **Location**: This is controlled in the Phaser GameScene rendering logic, specifically the projection/perspective transformation parameters
- **Implementation hint**: Look for perspective scale factors or projection constants (e.g., `BOARD_PERSPECTIVE_TOP_WIDTH_SCALE`, `BOARD_PERSPECTIVE_VERTICAL_SCALE`, or similar projection helpers) and adjust them to achieve a steeper visual angle

### 2. Grid Container Border Removal
- **Current state**: There is a visible container/box surrounding the grid with visible element lines/borders
- **Required**: Remove or hide the visible borders/lines of the grid container so they do not appear to the user
- **Impact**: This container currently takes up significant space that should be available for player UI zones
- **Implementation hint**: 
  - Locate the DOM element or Phaser container that wraps the grid
  - Set border properties to transparent/none (e.g., `border: none`, `border: 0`, or `border-color: transparent`)
  - Ensure any padding/margin from this container is minimized or removed to reclaim space

### 3. Shift Player Zones Inward
- **Current state**: Player zones (hand, bench/reserve, main deck, graveyard) are positioned further from the board due to the grid container taking up space
- **Required**: After fixing the grid container, shift all player zones inward toward the board to take advantage of the reclaimed space
- **Zones affected**:
  - Hand cards
  - Bench/Reserve area
  - Main deck pile
  - Graveyard/Discard pile
- **Implementation hint**:
  - Update the positioning constants in `GameHUD.tsx` (e.g., `BOARD_EDGE_OFFSET_PX`, `SIDE_COLUMN_GAP_PX`, or zone-specific offsets in `getZoneGroupStyle`)
  - Reduce the distance between the board edge and the zone containers
  - Ensure all four edges (top, bottom, left, right) are adjusted consistently

## Constraints
- **Frontend/UI only**: Do not modify gameplay rules, turn logic, networking, or backend behavior
- **Preserve functionality**: Maintain all existing interactions (hover, select, click, card animations, targeting)
- **Keep visual style**: Maintain the dark sci-fi theme and glowing accents
- **Responsive**: Ensure the UI remains usable at common desktop resolutions
- **Typecheck**: Run `pnpm --filter @mugen/client typecheck` after changes

## Acceptance Criteria
- Grid appears approximately 20% steeper than before
- No visible borders/lines around the grid container
- Player zones (hand, reserve, deck, graveyard) are positioned closer to the board, using the reclaimed space
- All four edges (top, bottom, left, right) show consistent spacing improvements
- No regressions in card interactions, animations, or board functionality
- Typecheck passes with no new errors

## Files Likely to Need Changes
- `packages/client/src/scenes/GameScene.ts` - Grid perspective/projection parameters
- `packages/client/src/components/GameHUD.tsx` - Zone positioning constants and `getZoneGroupStyle` function
- `packages/client/src/components/GameScreen.tsx` - Potential container styling adjustments

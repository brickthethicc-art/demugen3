# Grid and Player Zone Size Adjustment

## Overview
Shrink the game grid by 20%, increase player zone card sizes by 50%, and shift Player 1 (bottom edge) zones inward to fill reclaimed space from the removed invisible Phaser container boundary.

## Changes Required

### 1. Grid Size Reduction (~20% Smaller)
- **Current state**: Grid renders at 736x736 pixels (BOARD_SIZE_PX)
- **Required**: Reduce grid rendering size by approximately 20%
- **Implementation hint**:
  - Reduce `BOARD_SIZE_PX` in `GameHUD.tsx` (currently 736)
  - Update Phaser canvas dimensions in `GameBoard.tsx` (currently `width: 23 * 32`, `height: 23 * 32`)
  - Ensure projection helpers in `GameScene.ts` remain consistent with new dimensions
  - Maintain aspect ratio and cell proportions

### 2. Player Zone Card Size Increase (~50% Larger)
- **Current state**: Edge cards are `EDGE_CARD_WIDTH_PX = 48` and `EDGE_CARD_HEIGHT_PX = 66`
- **Required**: Increase card dimensions by approximately 50%
- **Zones affected**:
  - Hand cards (horizontal and vertical orientations)
  - Bench/Reserve cards
  - Main deck pile
  - Graveyard/Discard pile
- **Implementation hint**:
  - Update `EDGE_CARD_WIDTH_PX` and `EDGE_CARD_HEIGHT_PX` in `GameHUD.tsx`
  - Recalculate derived constants:
    - `RESERVE_ROW_SPAN_PX`
    - `HAND_COLUMN_SPAN_PX`
    - `RESERVE_COLUMN_SPAN_PX`
  - Verify animations (draw flight, hand-to-bench, hand-to-discard) still look correct with larger cards

### 3. Player 1 (Bottom Edge) Zone Shift Inward
- **Current state**: Player 1 zones (bottom edge) are positioned with `BOARD_EDGE_OFFSET_PX` spacing
- **Required**: Shift Player 1 zones inward so the bench's uppermost card edge is closer to the bottom edge of the grid
- **Context**: An invisible Phaser/element previously blocked this space; it has been removed. Ensure Player 1 zones now fill into that reclaimed space.
- **Implementation hint**:
  - In `GameHUD.tsx` `getZoneGroupStyle`, reduce bottom edge offsets:
    - `bottomReserveOffset`
    - `bottomHandOffset`
    - `bottomRightOffset` (deck/grave horizontal offsets for bottom player)
  - Consider reducing `BOARD_EDGE_OFFSET_PX` further if needed specifically for bottom edge
  - Ensure label and hint positions for bottom edge are also adjusted accordingly
  - Verify no overlap with the grid or other UI elements

## Constraints
- **Frontend/UI only**: Do not modify gameplay rules, turn logic, networking, or backend behavior
- **Preserve functionality**: Maintain all existing interactions (hover, select, click, card animations, targeting)
- **Keep visual style**: Maintain the dark sci-fi theme and glowing accents
- **Responsive**: Ensure the UI remains usable at common desktop resolutions
- **Typecheck**: Run `pnpm --filter @mugen/client typecheck` after changes
- **No mobile changes**: Keep mobile UI (`MobileGameScreen`) completely untouched

## Acceptance Criteria
- Grid appears approximately 20% smaller than before (both dimensions)
- Player zone cards (hand, reserve, deck, graveyard) are approximately 50% larger than before
- Player 1 (bottom edge) zones are shifted inward, with bench uppermost card edge closer to grid bottom edge
- Reclaimed space from removed invisible boundary is now filled by Player 1 zones
- No regressions in card interactions, animations, or board functionality
- All four edges maintain consistent visual spacing where appropriate
- Typecheck passes with no new errors in modified files

## Files Likely to Need Changes
- `packages/client/src/components/GameHUD.tsx`
  - `BOARD_SIZE_PX`
  - `EDGE_CARD_WIDTH_PX`, `EDGE_CARD_HEIGHT_PX`
  - `RESERVE_ROW_SPAN_PX`, `HAND_COLUMN_SPAN_PX`, `RESERVE_COLUMN_SPAN_PX`
  - `getZoneGroupStyle` function (bottom edge offsets specifically)
- `packages/client/src/components/GameBoard.tsx`
  - Phaser canvas dimensions (`width: 23 * 32`, `height: 23 * 32`)
  - Container width/height inline styles (currently `736px`)
- `packages/client/src/scenes/GameScene.ts`
  - Verify projection constants remain appropriate with new grid size
  - No changes likely needed, but verify `CELL_SIZE` and projection helpers still work

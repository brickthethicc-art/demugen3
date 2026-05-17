# Unified Perspective and Card Orientation

## Overview
Transform the game to have a consistent visual perspective where all players see the game from Player 1's point of view, with all edge card groups oriented to match the board's perspective angle and all cards vertically oriented pointing toward the grid center (like a real tabletop TCG).

## Changes Required

### 1. Match Edge Card Groups to Board Perspective Angle
- **Current state**: Edge card groups (hand, reserve, deck, grave) for Players 2, 3, 4 are rendered flat/horizontal relative to the screen edges
- **Required**: Rotate edge card groups so they align with the board's perspective angle
- **Zones affected**:
  - Player 2 (top edge): Rotate card group to match top board edge perspective
  - Player 3 (left edge): Rotate card group to match left board edge perspective
  - Player 4 (right edge): Rotate card group to match right board edge perspective
- **Implementation hint**:
  - Apply CSS transforms (`rotate()`, `skew()`, or `perspective` + `rotateX/Y`) to the container of each edge's card groups
  - Use the existing perspective constants from `GameScene.ts`:
    - `BOARD_PERSPECTIVE_TOP_WIDTH_SCALE = 0.85`
    - `BOARD_PERSPECTIVE_VERTICAL_SCALE = 0.8`
  - Calculate rotation angles based on the board's isometric/perspective projection
  - Ensure the rotation origin is appropriate so cards pivot correctly toward/away from the grid
  - Apply transforms at the edge group level (e.g., in `PlayerSeatGroups` or via `getZoneGroupStyle`)

### 2. Vertical Card Orientation Pointing Toward Grid
- **Current state**: Cards in edge groups are oriented based on edge direction (horizontal for top/bottom, vertical for left/right)
- **Required**: All cards should be vertical and oriented so the card front faces toward the grid center
- **Visual reference**: Imagine Player 1's current card orientation (vertical, readable, facing inward) applied to all players
- **Zones affected**:
  - All edge card groups for all players:
    - Hand cards
    - Reserve/Bench cards
    - Main deck pile
    - Graveyard/Discard pile
- **Implementation hint**:
  - For top edge (Player 2): Cards should be vertical with top pointing away from grid (or toward grid, whichever matches TCG convention)
  - For left edge (Player 3): Cards should be vertical, rotated 90 degrees to face toward grid
  - For right edge (Player 4): Cards should be vertical, rotated -90 degrees to face toward grid
  - Use CSS transforms on individual card elements or card containers
  - Ensure card text/graphics remain readable after rotation (may need to counter-rotate text content)
  - Maintain hover/select/click hit areas correctly after transforms

### 3. Consistent Player 1 POV for All Players
- **Current state**: Each player sees the game from their own seat orientation (their own edge is "bottom")
- **Required**: All players see the game from Player 1's perspective regardless of their actual player index
- **What this means**:
  - Player 2, 3, 4 should see the same screen layout as Player 1
  - Their own cards appear at the bottom edge (like Player 1's cards currently do)
  - Opponents' cards appear at top/left/right edges as seen from Player 1's POV
  - The board orientation is fixed (not rotated per player)
- **Implementation hint**:
  - In `GameHUD.tsx`, the seat-to-edge mapping (`EDGE_BY_PLAYER_INDEX`) currently maps:
    - Player 0 → bottom
    - Player 1 → top
    - Player 2 → left
    - Player 3 → right
  - Change the logic so that:
    - The **local player** is always assigned to the `bottom` edge
    - Opponents are assigned to `top`, `left`, `right` based on their relative positions
    - This may require:
      - Modifying `getSeatEdge(playerIndex)` to accept the local player index and compute relative edges
      - Or remapping `EDGE_BY_PLAYER_INDEX` dynamically based on who is the local player
  - Ensure the board itself (`GameBoard`) does not rotate per player (already the case)
  - Verify that targeting, hover states, and interactions still work correctly with this remapping

## Constraints
- **Frontend/UI only**: Do not modify gameplay rules, turn logic, networking, or backend behavior
- **Preserve functionality**: Maintain all existing interactions (hover, select, click, card animations, targeting)
- **Keep visual style**: Maintain the dark sci-fi theme and glowing accents
- **No mobile changes**: Keep mobile UI (`MobileGameScreen`) completely untouched
- **Typecheck**: Run `pnpm --filter @mugen/client typecheck` after changes

## Acceptance Criteria
- Edge card groups for Players 2, 3, 4 appear rotated to match the board's perspective angle
- All cards in all edge groups are vertically oriented and point toward the grid center
- Card text/graphics remain readable after orientation changes
- All players see the game from the same visual perspective (Player 1's POV)
- Local player's cards always appear at the bottom edge regardless of their actual player index
- No regressions in card interactions, animations, or board functionality
- Typecheck passes with no new errors in modified files

## Files Likely to Need Changes
- `packages/client/src/components/GameHUD.tsx`
  - `getSeatEdge()` function: Modify to compute edges relative to local player
  - `EDGE_BY_PLAYER_INDEX`: May need dynamic remapping logic
  - `getZoneGroupStyle()`: Add perspective rotation transforms for top/left/right edges
  - `HandZone`, `ReserveZone`, `CompactPile`: Add card orientation transforms (vertical, rotated to face grid)
- `packages/client/src/components/GameBoard.tsx`
  - No changes expected (board orientation remains fixed)
- `packages/client/src/scenes/GameScene.ts`
  - No changes expected (projection constants are already defined and can be referenced)

## Technical Notes
- The board uses isometric-style projection with:
  - `BOARD_PERSPECTIVE_TOP_WIDTH_SCALE = 0.85`
  - `BOARD_PERSPECTIVE_VERTICAL_SCALE = 0.8`
- Consider using CSS `transform-style: preserve-3d` and `perspective` for realistic 3D card group rotation
- Test with 2, 3, and 4 player games to ensure edge remapping works correctly
- Verify that card animations (draw flight, hand-to-bench, hand-to-discard) still look correct with new orientations

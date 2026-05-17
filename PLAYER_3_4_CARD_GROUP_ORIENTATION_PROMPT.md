# Player 3 & 4 Card Group Orientation Alignment

## Description
Ensure that player 3 and 4's card groups (left and right edges) reflect the same orientation and spacing as player 1 and 2's card groups (bottom and top edges). All card groups should be identical in structure and spacing, only rotated to match their respective edge positions around the grid.

## Context
- Player 1 corresponds to the bottom edge (seat index 0)
- Player 2 corresponds to the top edge (seat index 1)
- Player 3 corresponds to the left edge (seat index 2)
- Player 4 corresponds to the right edge (seat index 3)
- Card groups include: hand, reserve, deck, and graveyard zones
- Players 1 and 2 currently have properly oriented and spaced card groups
- Players 3 and 4 need their card groups to match this same structure, just rotated for their edge positions

## Required Change
Copy the card group orientation and spacing logic from players 1 and 2 (bottom and top edges) and apply it to players 3 and 4 (left and right edges), with appropriate rotation to match the edge direction.

**Specific requirements:**
- Player 3 (left edge): Card groups should be identical to player 1/2 structure, rotated 90 degrees to align with the left edge, facing inward toward the grid center
- Player 4 (right edge): Card groups should be identical to player 1/2 structure, rotated -90 degrees to align with the right edge, facing inward toward the grid center
- All spacing between cards and zones should match the spacing used for players 1 and 2
- The visual appearance of card groups should be consistent across all four edges (only orientation differs)

## Investigation Scope

Before implementing changes, the model must:

### 1. Current Implementation Analysis
- Read `packages/client/src/components/GameHUD.tsx` to understand the current card group structure
- Identify how player 1 (bottom edge) and player 2 (top edge) card groups are currently styled
- Identify how player 3 (left edge) and player 4 (right edge) card groups are currently styled
- Compare the spacing, offsets, transforms, and structure between all four edges
- Document any differences in:
  - CSS transforms (rotation, scale, skew)
  - Spacing constants (gaps between cards, gaps between zones)
  - Zone group positioning logic
  - Card orientation (facing direction)

### 2. Perspective Constants Review
- Read `packages/client/src/scenes/GameScene.ts` to identify perspective constants:
  - `BOARD_PERSPECTIVE_TOP_WIDTH_SCALE`
  - `BOARD_PERSPECTIVE_VERTICAL_SCALE`
  - Any other board projection constants
- Understand how these constants are used in GameHUD for edge transforms
- Verify which edges currently use these constants and which do not

### 3. Edge-Specific Logic Mapping
- Identify all functions in GameHUD that handle edge-specific logic:
  - `getZoneGroupStyle()` or similar zone positioning functions
  - Edge group container transforms
  - Card orientation transforms within zones
- Map out the current logic for each edge (bottom, top, left, right)
- Identify which edges share logic and which have unique implementations

### 4. Card Group Structure Verification
- Verify that card groups contain the same zones across all edges:
  - Hand zone
  - Reserve/Bench zone
  - Main deck pile
  - Graveyard/Discard pile
- Confirm that the internal structure of each zone is identical across edges
- Identify any edge-specific variations in zone rendering

## Required Investigation Steps

1. Read `packages/client/src/components/GameHUD.tsx` completely to understand the current edge card group implementation
2. Search for `getZoneGroupStyle` or similar zone positioning functions to understand spacing logic
3. Search for edge-specific transform logic (look for "top", "bottom", "left", "right" in the file)
4. Read `packages/client/src/scenes/GameScene.ts` to identify perspective constants used for board projection
5. Compare the transform/spacing values used for bottom/top edges vs left/right edges
6. Document the exact differences in a summary before implementing changes

## Implementation Location
- File: `packages/client/src/components/GameHUD.tsx`
- Focus: Desktop HUD opponent edge transforms (specifically left edge / player 3 and right edge / player 4)
- Functions to modify:
  - `getZoneGroupStyle()`: Ensure left and right edges use the same spacing/offset logic as top and bottom edges, with appropriate rotation
  - Edge group transforms: Apply rotation transforms that match the edge direction while preserving the same internal card group structure
- Keep mobile UI (`MobileGameScreen`) unchanged

## Technical Notes
- Apply frontend-only changes to the left and right edge card group transforms
- The transforms should be a direct copy of the top/bottom edge logic with rotation applied
- Use the existing perspective constants from `GameScene.ts` where applicable:
  - `BOARD_PERSPECTIVE_TOP_WIDTH_SCALE = 0.85`
  - `BOARD_PERSPECTIVE_VERTICAL_SCALE = 0.8`
- Ensure card groups face inward toward the grid center for all edges
- Maintain consistent spacing (gaps between cards, gaps between zones) across all edges
- Test with 2, 3, and 4 player games to verify the changes work correctly

## Constraints
- **Frontend/UI only**: Do not modify gameplay rules, turn logic, networking, or backend behavior
- **Preserve functionality**: Maintain all existing interactions (hover, select, click, card animations, targeting)
- **Keep visual style**: Maintain the dark sci-fi theme and glowing accents
- **No mobile changes**: Keep mobile UI (`MobileGameScreen`) completely untouched
- **Typecheck**: Run `pnpm --filter @mugen/client typecheck` after changes

## Acceptance Criteria
- Player 3 (left edge) card groups have identical spacing and structure to player 1/2, rotated to align with left edge
- Player 4 (right edge) card groups have identical spacing and structure to player 1/2, rotated to align with right edge
- All card groups across all four edges face inward toward the grid center
- Spacing between cards and zones is consistent across all edges
- No regressions in card interactions, animations, or board functionality
- Typecheck passes with no new errors in modified files

## Files Likely to Need Changes
- `packages/client/src/components/GameHUD.tsx`
  - `getZoneGroupStyle()`: Ensure left and right edges use same spacing logic as top/bottom, with rotation
  - Edge group transforms: Apply appropriate rotation transforms for left/right edges
  - Verify hand/reserve/deck/grave zone rendering is consistent across all edges

# Grid Perspective Alignment for HUD Card Groups

## Goal
Align Player 2/3/4 HUD card groups (hand, reserve, deck, grave) to match the grid's actual perspective and depth model. Currently these groups appear too flat/shallow compared to the board's foreshortening.

## Current Problems
- Player 2 (top edge) card groups are not steep enough to match grid depth
- Player 3 and 4 (left/right) card groups do not mimic the grid's trapezoid perspective
- All opponent card groups should feel like they exist on the same tabletop plane as the board

## Grid Perspective Analysis (Why the Grid is Positioned This Way)

The grid in `GameScene.ts` uses a **linear perspective model** that creates depth through two key transformations:

### 1. Width Scaling (Trapezoid Effect)
- `BOARD_PERSPECTIVE_TOP_WIDTH_SCALE = 0.85`
- Top rows are 85% of bottom row width
- `getRowPerspectiveScale(gridY)` linearly interpolates:
  - At gridY = 0 (top): scale = 0.85
  - At gridY = boardHeight (bottom): scale = 1.0
- This creates a trapezoid where the top is narrower, simulating depth

### 2. Vertical Compression
- `BOARD_PERSPECTIVE_VERTICAL_SCALE = 0.8`
- Y coordinates are compressed to 80% of their actual height
- This simulates the board being tilted away from the viewer

### 3. Projection Formula
```typescript
// From GameScene.ts projectBoardPoint()
rowScale = Linear(0.85, 1.0, gridY / boardHeight)  // 0.85 at top, 1.0 at bottom
x = rowOffsetX + gridX * CELL_SIZE * rowScale      // X scales with row
y = gridY * CELL_SIZE * 0.8                       // Y compressed to 80%
```

**Key Insight**: The grid achieves depth by:
- Compressing top rows horizontally (0.85 scale)
- Compressing everything vertically (0.8 scale)
- Linearly interpolating horizontal scale from top to bottom

## Applying This Reasoning to HUD

To match the grid's perspective, the HUD must use the same fundamental ratios:

### For Player 2 (Top Edge)
- Should use `scaleX(0.85)` to match grid's top width compression
- Should use `rotateX` with angle derived from vertical compression (0.8 → ~36.87°)
- Current HUD uses `HUD_TOP_EDGE_WIDTH_SCALE = 0.74` which is **too compressed**
- Should align with grid's 0.85, not an arbitrary 0.74
- Depth angle should be calculated from the same vertical compression ratio

### For Player 3/4 (Side Edges)
- Should mimic the trapezoid effect using perspective transforms
- Need to compress horizontally to simulate depth receding toward center
- Should use the same 0.8 vertical compression principle
- Current side transforms may not be steep enough

### The Core Principle
**The grid's perspective is defined by two constants: 0.85 (top width) and 0.8 (vertical height). The HUD should use these same constants, not arbitrary multipliers.**

## Required Investigation

1. **Calculate the correct rotateX angle for top edge**:
   - From `BOARD_PERSPECTIVE_VERTICAL_SCALE = 0.8`
   - Angle = atan(1 - 0.8) * (180 / π) ≈ 11.31°
   - Current `HUD_TOP_EDGE_DEPTH_ANGLE_DEG` multiplies this by 1.8
   - Determine if this multiplier is correct or if we should use the base angle

2. **Verify top edge width scale**:
   - Grid uses 0.85 at top
   - HUD currently uses 0.74 (derived from 0.85 - 0.05)
   - Test if using 0.85 directly provides better alignment

3. **Calculate side edge transforms to match trapezoid**:
   - Side edges need to compress horizontally as they recede
   - Should use perspective-origin at the edge nearest the board
   - May need different perspective distance (HUD_SIDE_PERSPECTIVE_PX)

4. **Ensure deck/grave match hand/reserve**:
   - All zone groups on the same edge should use identical transforms
   - No per-zone overrides

## Implementation Steps

1. Update `GameHUD.tsx` constants to align with grid:
   ```typescript
   // Use grid's actual constants, not arbitrary multipliers
   const HUD_TOP_EDGE_WIDTH_SCALE = BOARD_PERSPECTIVE_TOP_WIDTH_SCALE; // 0.85
   const HUD_TOP_EDGE_DEPTH_ANGLE_DEG = BOARD_PERSPECTIVE_DEPTH_ANGLE_DEG; // ~11.31°
   ```

2. Adjust side edge transforms to match trapezoid:
   - Increase depth angle to match grid's vertical compression
   - Ensure perspective-origin is at the board edge (not center)
   - Test different perspective distances

3. Verify all zone groups use transforms:
   - hand, reserve, deck, grave should all apply perspective
   - No zone-specific overrides

4. Test with 2/3/4-player matches:
   - Check that Player 2 appears significantly steeper
   - Check that Player 3/4 appear to recede toward board center
   - Ensure bottom (Player 1) remains unchanged

## Acceptance Criteria

- Player 2 top groups appear at similar steepness to grid top rows
- Player 3/4 side groups appear to recede with trapezoid effect matching grid
- All opponent groups use transforms derived from grid constants (0.85, 0.8)
- No arbitrary multipliers unless mathematically justified
- Player 1 bottom edge unchanged
- No regressions in interactions/animations
- Typecheck passes for client after edits

## File to Edit
`packages/client/src/components/GameHUD.tsx`

## Constants to Focus On
- Lines 29-35: HUD perspective constants
- Lines 134-148: `getZonePerspectiveTransform` function
- Lines 150-164: `getZonePerspectiveOrigin` function

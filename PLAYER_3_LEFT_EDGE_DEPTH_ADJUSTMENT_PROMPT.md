# Player 3 Left Edge Depth Adjustment

## Description
Adjust the depth perspective of player 3's card group (left edge) so that the left side of the card group rectangle appears lower in the z-plane.

## Context
- Player 3 corresponds to the left edge in the 4-player HUD layout (seat index 2)
- The card group (hand/reserve/deck/grave) should be treated as a rectangular container
- The left edge of this rectangle aligns with the left edge of the first card slot in player 3's hand

## Required Change
The left edge of player 3's card group rectangle needs to be lowered more in terms of depth - meaning it should extend further downward on the z-plane to create a stronger perspective effect.

This adjustment should make the left side of the card group appear closer to the viewer or lower in the 3D space, enhancing the depth perception of the left edge card groups.

## Implementation Location
- File: `packages/client/src/components/GameHUD.tsx`
- Focus: Desktop HUD opponent edge transforms (specifically left edge / player 3)
- Keep mobile UI (`MobileGameScreen`) unchanged

## Technical Notes
- Apply frontend-only changes to the left edge card group transforms
- Ensure the depth adjustment creates the desired z-plane lowering effect on the left side of the rectangle
- Maintain consistency with existing board perspective constants where applicable

# Flat 2D Overhaul Prompt

## Description
Remove all 3D depth perspective effects from the game HUD and board rendering. The current depth effect is negatively impacting user experience. Convert the entire screen to appear 2D/flat while maintaining correct card positioning and orientation for all players.

## Context
- All cards are currently positioned and oriented correctly
- The depth/perspective effect is degrading user experience
- Players 1-4 card groups currently fit within the screen bounds
- Need to preserve this fit while flattening the visual design

## Required Changes
- Make the board appear flat (remove 3D perspective)
- Remove depth effects from all edge card groups (hand/reserve/deck/grave)
- Ensure the entire screen appears 2D instead of 3D
- Maintain current layout positions so all player card groups remain within screen bounds

## Implementation Location
- File: `packages/client/src/components/GameHUD.tsx`
  - Focus: Desktop HUD perspective transforms for all edges (bottom/top/left/right)
  - Remove or disable perspective transforms in `getZonePerspectiveTransform()`
- File: `packages/client/src/scenes/GameScene.ts` (if applicable)
  - Focus: Board projection and perspective rendering
  - Remove board perspective foreshortening constants and transforms
- Keep mobile UI (`MobileGameScreen`) unchanged unless it shares the same perspective logic

## Technical Notes
- Apply frontend-only changes
- Remove or nullify perspective transforms while preserving layout positioning
- Ensure card facing orientations remain correct (cards should still face inward toward grid center)
- Maintain board-to-screen positioning so all player zones stay visible
- If removing board perspective constants, ensure grid hit-testing and coordinate mapping still function correctly
- Consider whether to:
  - Set perspective transforms to null/identity
  - Remove perspective-origin and transform-style properties
  - Adjust board projection helpers to return unprojected coordinates

# Hover Panel Card Size Increase Prompt

## Task Description
Increase the size of the card rendering in the hover panel to make it more prominent and visible. Currently, when units or cards are hovered by the user, they appear in a panel on the left side of the screen with the card picture and details. The card rendering is currently too small and should be made slightly larger within the panel.

**IMPORTANT CONSTRAINT**: This is a frontend-only UI change. Do not modify any game logic, state management, server code, or shared types. Only change presentational/styling aspects in the client-side React component.

## Current State
- File: `packages/client/src/components/HoverPanel.tsx`
- The hover panel is a fixed positioned element on the left side of the screen
- Card rendering uses `width={160} height={220}` for both sorcery cards (line 33) and unit cards (line 88)
- Panel width is `w-80` (320px) with padding `p-6`

## Required Changes
1. **Increase card size**: Change the card dimensions from `width={160} height={220}` to a larger size. Recommended: `width={200} height={280}` (approximately 25% larger). This will make the card more prominent while still fitting within the panel.

2. **Adjust panel width if necessary**: The current panel width of `w-80` (320px) with `p-6` padding leaves ~288px of content width. A 200px wide card should fit comfortably, but verify the layout doesn't break. Consider increasing panel width to `w-96` (384px) if needed for better spacing.

3. **Shift panel position downward**: The hover panel currently conflicts with the gamelogs element. Shift the entire hover panel 25 pixels lower by modifying the vertical positioning in the `PANEL_CLASS` constant. Change `top-1/2 -translate-y-1/2` to `top-1/2 -translate-y-1/2 mt-[25px]` or use a margin-top approach to add 25px of top margin. This will prevent overlap with the gamelogs element.

4. **Maintain all existing functionality**: 
   - Keep the same card component (`CardFront`)
   - Preserve all the detail sections (HP, ATK, ability, etc.)
   - Maintain the conditional rendering for sorcery vs unit cards
   - Keep the `isHovered` prop on CardFront
   - Preserve all styling and layout structure

5. **Test the changes**: Ensure the larger card renders correctly without:
   - Overflowing the panel bounds
   - Breaking the responsive layout
   - Causing horizontal scrolling
   - Obscuring other UI elements

## Implementation Notes
- Modify the card dimensions in the two `CardFront` component calls (lines 33 and 88)
- Update the `PANEL_CLASS` constant on line 6 to add the 25px downward shift (e.g., add `mt-[25px]`)
- If panel width adjustment is needed, update the `PANEL_CLASS` constant on line 6
- The change is purely presentational - no logic or state changes required
- This is a frontend-only change - no server or shared code modifications needed

## Verification
After implementing the changes, verify:
1. The card appears larger in the hover panel
2. The panel layout remains intact and properly aligned
3. All card details (name, stats, ability, etc.) are still visible and properly formatted
4. The change works for both unit cards and sorcery cards
5. The hover panel is shifted 25 pixels lower and no longer conflicts with the gamelogs element
6. No console errors or layout issues occur

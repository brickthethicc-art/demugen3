# Hand Discard Slot Vanishing Fix

## Issue
When a player discards a card from their hand, if they choose the farthest card to the right (slot 4), both slot 4 and the farthest left slot (slot 1) vanish. Only the selected card should move, and all other cards should remain visible.

## Root Cause Analysis Needed
- Investigate why slot 1 (leftmost) vanishes when slot 4 (rightmost) is discarded
- Check if there's an off-by-one error or incorrect array indexing in the discard logic
- Verify if the issue affects other slot positions (slot 2, slot 3) or only slot 4
- Determine if this is a visual rendering issue or a state management issue

## Step-by-Step Investigation

### Step 1: Locate discard slot rendering logic
- Open `packages/client/src/components/GameHUD.tsx`
- Find the `HandZone` component and its discard handling logic
- Locate where card slots are rendered and how they handle visibility during/after discard
- Check for any conditional rendering that might hide slots incorrectly

### Step 2: Examine discard queue and animation logic
- Find `runDiscardQueue` or similar discard animation functions
- Check how slots are marked as "empty" or "suppressed" during discard animation
- Look for any logic that affects multiple slots when a single card is discarded
- Verify slot index calculations (0-based vs 1-based indexing)

### Step 3: Check slot state management
- Look for state variables that track which slots should be visible/hidden
- Check if there's a bug in how slot visibility is updated after discard
- Verify that only the discarded card's slot is marked for removal
- Ensure other slots retain their visibility state correctly

### Step 4: Test different discard positions
- Verify if the bug only occurs when discarding from slot 4
- Test discarding from slot 1, 2, and 3 to see if similar issues occur
- Check if the issue is specific to rightmost slot or a general indexing problem

### Step 5: Fix the visibility logic
- Identify the specific line of code causing slot 1 to vanish
- Ensure only the discarded card's slot index is affected
- Verify that slot visibility updates use the correct target index
- Add safeguards to prevent unintended slot hiding

## Constraints
- **Frontend/UI only**: Do not modify gameplay rules, turn logic, networking, or backend behavior
- **Preserve functionality**: Maintain all existing interactions (hover, select, click, card animations)
- **No mobile changes**: Keep mobile UI (`MobileGameScreen`) completely untouched
- **Typecheck**: Run `pnpm --filter @mugen/client typecheck` after changes

## Acceptance Criteria
- Discarding from slot 4 (rightmost) only hides slot 4, not slot 1
- Discarding from any slot only hides that specific slot
- All non-discarded cards remain visible in their correct positions
- No visual artifacts or missing slots after discard animation completes
- Discard animation still plays correctly for all slot positions
- Typecheck passes with no new errors

## Files Likely to Need Changes
- `packages/client/src/components/GameHUD.tsx`
  - `HandZone` component slot rendering logic
  - Discard animation queue handlers
  - Slot visibility state management
  - Any slot index calculations during discard

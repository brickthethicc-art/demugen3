# Frontend UI Enforcement Prompt (4 Steps)

You are a senior frontend engineer working in an existing React + TypeScript game UI. Apply **frontend-only** changes.

## Step 1 — Grave Top Card Face-Up Rendering
Ensure every grave/discard pile visually shows the **most recently entered card** on top, rendered **face-up (card front)**, not card back.
- Preserve pile counts and ordering.
- Keep existing hidden-card/server sanitization contracts unchanged.
- Do not alter backend/game rules.

## Step 2 — Strict Discard-Then-Compaction-Then-Draw Sequence
For hand-limit discard/refill flow, enforce this exact sequence:
1. Discarded hand card flies to grave.
2. Remaining hand cards shift right to fill open spaces.
3. Wait until compaction is fully complete and cards occupy the **3 rightmost hand slots**.
4. Only then begin the new card draw animation.

## Step 3 — Visual Integrity + Safety Rules
- No duplicate card should remain visible in the discard source slot during discard flight.
- Keep source slot visually suppressed until discard flight completes.
- Gate deferred draw until compaction completion for that acting player.
- Use robust cleanup (`try/finally`): always clear suppression flags, always remove overlays, and gracefully handle missing DOM anchors without stuck animation state.

## Step 4 — Validation + Output
Add/adjust targeted frontend tests to verify:
- Grave top card is face-up.
- Sequence order is discard -> compaction -> draw.
- First/middle/last discard positions behave correctly.
- No source-slot duplicates during discard.
- Side-seat (left/right) slot mapping and motion direction are correct.

Return:
1. Files changed
2. Brief behavior summary
3. Test command(s) run + results

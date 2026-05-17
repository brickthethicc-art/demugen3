# Discard and Graveyard Visual Fixes

## Issue 1: Graveyard/Discard Pile Cards Not Face-Up (Step-by-Step)

### Goal
Make all discard pile cards render face-up for all players and all observers.

### Step 1: Verify server sanitization behavior
- Open `packages/server/src/resolver/sanitize.ts`.
- Confirm non-self sanitization still hides `hand`, `deck`, and `mainDeck`.
- Ensure `discardPile` is not converted to hidden placeholder cards.
- If `discardPile` is hidden, remove that transformation so discard remains face-up data.

### Step 2: Verify discard pile component rendering
- Open `packages/client/src/components/DiscardPile.tsx`.
- Check render path for top discard card and pile stack cards.
- Ensure discard cards use card-front rendering and not card-back rendering.
- Ensure no fallback path forces card-back for normal discard entries.

### Step 3: Verify discard pile viewer modal rendering
- Open `packages/client/src/components/DiscardPileViewer.tsx`.
- Find hidden-card checks (for example via `isHiddenCardId`).
- Ensure normal discard entries render face-up.
- Only render card-back if a card is truly hidden by explicit hidden-card ID rules.

### Step 4: Keep hidden-card rules intact elsewhere
- Open `packages/shared/src/types/card.ts`.
- Confirm hidden helpers (`HIDDEN_CARD_ID_PREFIX`, `isHiddenCardId`) remain unchanged.
- Do not weaken hidden enforcement for `hand`/`deck`/`mainDeck`.

### Step 5: Validate behavior in multiplayer
- Test local player discard pile: cards appear face-up.
- Test opponent discard pile visibility: cards appear face-up.
- Verify no card backs appear in discard pile unless card is explicitly hidden by ID.

---

## Issue 2: Hand-Limit Discard + Refill Draw Animation (Step-by-Step)

### Goal
Fix forced hand-limit discard animation so there is no duplicate card in the source slot, and enforce this sequence:
1) discarded card flies to grave, 2) remaining cards shift right, 3) slot 0 opens, 4) deferred draw fills slot 0.

### Step 1: Locate forced discard + deferred draw flow
- Open `packages/client/src/components/GameHUD.tsx`.
- Locate forced discard detection and queue triggers (`runDiscardQueue`, `runDrawQueue`).
- Identify where pending turn-start draw is resolved after discard.

### Step 2: Suppress source slot at discard start
- At the moment discard animation begins, suppress static render of the discarded source slot.
- Ensure only the flying overlay card represents that card during flight.
- Prevent source slot from rendering the same card until discard flight finishes.

### Step 3: Animate discard flight to grave
- Spawn overlay from source slot rect.
- Animate to owning player's discard pile anchor.
- Remove overlay on completion.

### Step 4: Animate hand compaction before draw
- After discard lands, animate remaining hand cards one slot to the right.
- Use slot-rect-to-slot-rect transitions so motion is explicit.
- Wait for all compaction animations to finish.
- End state: first slot (slot 0) is open.

### Step 5: Start deferred draw only after compaction
- Gate forced refill draw until compaction is fully complete for that player.
- Animate deck -> slot 0.
- Keep slot 0 visually empty until draw overlay settles.

### Step 6: Enforce POV and visibility rules
- Local player draw reveal behavior remains unchanged.
- Opponent draws remain face-down where hidden-card rules apply.
- All clients must see the same acting-player animation on correct edge zones.

### Step 7: Add robust cleanup
- Use `try/finally` cleanup around each phase.
- Always release suppression flags and remove overlays even on early exit.
- Guard missing DOM anchors gracefully without leaving stuck animation state.

### Step 8: Validate with targeted tests
- Local forced discard at max hand: verify exact sequence order.
- Repeat with discard from first/middle/last hand slot.
- Verify no duplicate card remains in source slot during discard.
- Verify observers see correct animation on other players.
- Verify side players (left/right edges) use correct slot mapping and motion direction.

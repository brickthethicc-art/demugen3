# Bench Summon UI Removal - Toast and Hand Glow

## Problem Summary
Currently, when a player needs to move a unit from their hand to the bench, a modal overlay pops up showing all cards that can be summoned to the bench. This modal interrupts gameplay flow and is not desired. Instead, the player should receive a subtle toast notification, and eligible cards in their hand should visually indicate they can be selected with a glowing green pulsing outline. The selection should trigger a visible animation of the card moving from the hand to the bench.

## Desired Behavior
When it's time for a player to move a unit from hand to bench:
1. **Remove the modal overlay** - no more full-screen or centered modal
2. **Show a small toast notification** - brief message indicating the player needs to select a unit from hand to place on bench
3. **Eligible hand cards glow green** - cards that can be summoned (unit cards affordable with current LP) should have a green pulsing outline
4. **Visible card movement animation** - when a card is selected, animate it moving from the hand position to the designated bench slot
5. **Card remains on bench** - the card stays on the bench until officially summoned to the field during standby phase

## Current State
- Modal implementation in `packages/client/src/components/SummonToBenchModal.tsx`
- Shows a notification toast first (1300ms), then displays a modal overlay with all hand cards
- Modal displays cards in a grid with click handlers to summon to bench
- Bench display in `packages/client/src/components/BenchUnits.tsx` shows units already on bench
- No animation exists for card movement from hand to bench
- Hand cards do not have visual indication when summoning to bench is required

## Key Files to Investigate

### 1. SummonToBenchModal.tsx
**File**: `packages/client/src/components/SummonToBenchModal.tsx`
- Lines 10-186: Current modal implementation
- Lines 35-61: Notification → modal lifecycle logic
- Lines 71-80: `handleSummon` callback that sends `sendSummonToBench`
- Lines 99-182: Modal overlay JSX that needs to be removed/replaced
- Lines 84-97: Toast notification that should be kept (possibly with duration adjustment)

### 2. Hand Component
**File**: Need to locate the hand rendering component
- Search for files that render hand cards (likely in `packages/client/src/components/`)
- Look for where hand cards are displayed and add glow effect
- May be in GameScreen.tsx, GameHUD.tsx, or a dedicated Hand component

### 3. BenchUnits.tsx
**File**: `packages/client/src/components/BenchUnits.tsx`
- Lines 1-122: Current bench display
- May need to coordinate with hand-to-bench animation
- Bench slots are already displayed with 3-slot layout

### 4. Game Store
**File**: `packages/client/src/store/game-store.js` or similar
- Look for `summonModalOpen` state
- May need to add new state for hand glow indication
- Check `sendSummonToBench` action implementation

## Implementation Approach

### Option 1: Remove Modal, Add Hand Glow, Add Animation
1. Remove the modal overlay from SummonToBenchModal.tsx, keep only the toast
2. Add state to track when hand cards should glow (e.g., `handGlowActive`)
3. Modify hand card rendering to apply green pulsing outline when glow is active
4. Add click handler to hand cards when glow is active to trigger summon
5. Implement card movement animation from hand position to bench slot using CSS animations or Framer Motion

### Option 2: Reuse Toast, Extend Hand Component
1. Keep SummonToBenchModal.tsx but remove modal JSX, keep toast only
2. Pass glow state to hand component through game store
3. Handle card selection directly in hand component
4. Coordinate animation between hand and bench positions

## Required Changes

### 1. Modify SummonToBenchModal.tsx
Remove the modal overlay JSX (lines 99-182), keep only the toast notification:
```typescript
// Remove showModal state and modal JSX
// Keep notifVisible and toast display
// Possibly adjust toast duration or add dismiss option
```

### 2. Add Hand Glow State to Game Store
Add a new state flag to indicate when hand cards should glow:
```typescript
// In game store:
handGlowActive: boolean
setHandGlowActive: (active: boolean) => void
```

### 3. Update Hand Card Rendering
Modify the hand component to apply green pulsing glow when `handGlowActive` is true:
```typescript
// On each hand card:
className={`... ${handGlowActive && isSummonable ? 'ring-2 ring-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]' : ''}`}
```

### 4. Add Card Selection Handler to Hand
Add click handler to hand cards when glow is active:
```typescript
onClick={() => {
  if (handGlowActive && isSummonable) {
    handleCardSelect(card);
  }
}}
```

### 5. Implement Card Movement Animation
Add animation for card moving from hand to bench:
- Option A: Use CSS transitions with position calculation
- Option B: Use Framer Motion for smooth animation
- Option C: Use Phaser tween if hand is rendered in canvas

Example CSS animation approach:
```typescript
// On card select:
const cardElement = document.getElementById(`card-${cardId}`);
const benchSlotElement = document.getElementById(`bench-slot-${slotIndex}`);

// Get positions
const cardRect = cardElement.getBoundingClientRect();
const benchRect = benchSlotElement.getBoundingClientRect();

// Create flying card clone
const flyingCard = cardElement.cloneNode(true);
flyingCard.style.position = 'fixed';
flyingCard.style.left = cardRect.left + 'px';
flyingCard.style.top = cardRect.top + 'px';
flyingCard.style.zIndex = '9999';
document.body.appendChild(flyingCard);

// Animate to bench position
flyingCard.animate([
  { transform: 'translate(0, 0) scale(1)', opacity: 1 },
  { transform: `translate(${benchRect.left - cardRect.left}px, ${benchRect.top - cardRect.top}px) scale(0.8)`, opacity: 0.8 }
], {
  duration: 600,
  easing: 'ease-in-out',
  fill: 'forwards'
}).onfinish = () => {
  flyingCard.remove();
  // Actually summon to bench
  sendSummonToBench(cardId);
};
```

### 6. Update SummonToBenchModal Logic
Modify the component to set hand glow state instead of showing modal:
```typescript
useEffect(() => {
  if (summonModalOpen && isMyTurn && openSlots > 0) {
    // Show toast
    setNotifVisible(true);
    // Activate hand glow
    setHandGlowActive(true);
    
    // Hide toast after duration
    notifTimerRef.current = setTimeout(() => {
      setNotifExiting(true);
      setTimeout(() => {
        setNotifVisible(false);
        setNotifExiting(false);
      }, 400);
    }, NOTIFICATION_DURATION_MS);
  } else {
    setNotifVisible(false);
    setHandGlowActive(false);
  }
  
  return () => {
    if (notifTimerRef.current) {
      clearTimeout(notifTimerRef.current);
      notifTimerRef.current = null;
    }
  };
}, [summonModalOpen, isMyTurn, openSlots, setHandGlowActive]);
```

## Implementation Details

### Hand Glow Styling
Use Tailwind CSS classes for green pulsing glow:
- `ring-2 ring-green-500` - green outline
- `animate-pulse` - pulsing animation
- `shadow-[0_0_15px_rgba(34,197,94,0.6)]` - green glow shadow

### Summonable Card Filtering
Reuse existing logic from SummonToBenchModal.tsx (lines 31-33):
```typescript
const summonableCards = handCards.filter(
  (c): c is UnitCard => c.cardType === CardType.UNIT && c.cost <= playerLife
);
```

Only apply glow to cards that are summonable (unit cards affordable with current LP).

### Toast Message
Keep existing toast message but possibly adjust:
```typescript
"You must summon a unit from your hand to the bench"
```
Consider making it shorter or more actionable:
```typescript
"Select a unit from your hand to place on bench"
```

### Animation Timing
- Card movement animation: 600ms duration
- Toast display: 1300ms (existing) or adjust to 2000ms for more visibility
- Glow should remain active until selection is made or conditions change

### State Cleanup
Ensure hand glow is deactivated when:
- Card is selected
- No open bench slots remain
- Turn changes
- Modal is closed externally

## Testing Strategy

1. **Toast Display Test**:
   - Trigger summon to bench condition
   - Verify toast appears without modal
   - Verify toast dismisses after duration

2. **Hand Glow Test**:
   - When toast appears, verify eligible hand cards have green pulsing glow
   - Verify non-eligible cards (too expensive, non-unit) do not glow
   - Verify glow disappears after selection

3. **Card Selection Test**:
   - Click a glowing hand card
   - Verify card movement animation plays from hand to bench
   - Verify card appears in bench after animation
   - Verify hand card is removed from hand

4. **Multiple Selections Test**:
   - Select multiple cards to bench
   - Verify each selection plays animation
   - Verify bench fills correctly
   - Verify glow stops when bench is full

5. **State Change Test**:
   - Change turn while glow is active
   - Verify glow deactivates
   - Verify toast dismisses

6. **Edge Cases**:
   - No summonable cards in hand
   - Insufficient LP for all cards
   - Bench already full
   - Game state changes during selection

## Verification Steps
1. Start a game and reach a phase where summoning to bench is required
2. **Expected**: Toast notification appears, modal does NOT appear
3. **Expected**: Eligible unit cards in hand have green pulsing outline
4. Click a glowing hand card
5. **Expected**: Card animates from hand position to bench slot
6. **Expected**: Card appears in bench after animation completes
7. **Expected**: Hand card is removed from hand
8. **Expected**: Glow deactivates on remaining cards (or stays active if more slots available)
9. Verify the card remains on bench until standby phase deployment

## Additional Considerations

### Visual Clarity
- Ensure the green glow is clearly visible against the hand background
- The pulsing animation should be noticeable but not distracting
- Toast should be positioned where it doesn't obscure hand cards

### Performance
- Card movement animation should be smooth (60fps)
- Avoid layout thrashing during animation
- Clean up any DOM elements created for animation

### Accessibility
- Consider adding keyboard navigation for card selection
- Ensure glow effect doesn't interfere with screen readers
- Toast should be dismissible or have appropriate ARIA attributes

### Mobile Considerations
- On mobile, ensure touch targets for glowing cards are adequate
- Animation should work on touch devices
- Toast positioning may need adjustment for smaller screens

### Game Flow
- Ensure the new flow doesn't break existing game state transitions
- Verify that summoning to bench still costs LP correctly
- Ensure bench deployment during standby phase still works as expected

## Related Files
- `packages/client/src/components/SummonToBenchModal.tsx` (primary - remove modal, keep toast)
- `packages/client/src/components/BenchUnits.tsx` (bench display, may need animation coordination)
- Hand component (need to locate - likely in GameScreen.tsx or separate Hand.tsx)
- `packages/client/src/store/game-store.js` (add hand glow state)
- `packages/client/src/hooks/useGameActions.js` (sendSummonToBench action)

## Context
This change removes the intrusive modal overlay for bench summoning and replaces it with a more subtle toast notification combined with visual cues (green pulsing glow) on eligible hand cards. When a card is selected, a visible animation shows the card moving from hand to bench, making the action feel more tactile and integrated with the game flow. The card then remains on the bench until officially deployed during the standby phase.

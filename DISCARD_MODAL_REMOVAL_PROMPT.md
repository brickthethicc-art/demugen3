# Discard Modal Removal - Toast and Hand Glow

## Problem Summary
Currently, when a player needs to discard a card from their hand due to exceeding the hand size limit of 4, a modal overlay pops up showing all cards in the hand. This modal interrupts gameplay flow and is not desired. Instead, the player should receive a subtle toast notification, and all cards in their hand should visually indicate they can be selected with a red pulsing outline. The selection should trigger a visible animation of the card moving from the hand to the discard pile face-up.

## Desired Behavior
When it's time for a player to discard a card from their hand (hand size exceeds 4):
1. **Remove the modal overlay** - no more full-screen or centered modal
2. **Show a small toast notification** - brief message indicating the player needs to select a card from hand to discard
3. **All hand cards glow red** - every card in hand should have a red pulsing outline (all cards are eligible for discard)
4. **Visible card movement animation** - when a card is selected, animate it moving from the hand position to the discard pile
5. **Card lands face-up in discard pile** - the discarded card should be visible face-up in the discard pile area

## Current State
- Modal implementation in `packages/client/src/components/DiscardModal.tsx` (or similar file name)
- Shows a notification toast first, then displays a modal overlay with all hand cards
- Modal displays cards in a grid with click handlers to discard
- Discard pile display in `packages/client/src/components/DiscardPile.tsx` (or similar)
- No animation exists for card movement from hand to discard pile
- Hand cards do not have visual indication when discarding is required

## Key Files to Investigate

### 1. Discard Modal Component
**File**: `packages/client/src/components/DiscardModal.tsx` (or similar, may be named differently)
- Search for discard-related modal components
- Lines showing modal overlay JSX that needs to be removed/replaced
- Toast notification that should be kept (possibly with duration adjustment)
- Discard handler callback that sends discard action to server

### 2. Hand Component
**File**: Need to locate the hand rendering component
- Search for files that render hand cards (likely in `packages/client/src/components/`)
- Look for where hand cards are displayed and add glow effect
- May be in GameScreen.tsx, GameHUD.tsx, or a dedicated Hand component
- Reference the bench summon implementation for similar hand glow pattern

### 3. Discard Pile Component
**File**: `packages/client/src/components/DiscardPile.tsx` (or similar)
- Current discard pile display
- May need to coordinate with hand-to-discard animation
- Discard pile should show cards face-up after discard

### 4. Game Store
**File**: `packages/client/src/store/game-store.js` or similar
- Look for discard modal state (e.g., `discardModalOpen`)
- May need to add new state for hand glow indication
- Check discard action implementation (e.g., `sendDiscardCard`)

## Implementation Approach

### Option 1: Remove Modal, Add Hand Glow, Add Animation
1. Remove the modal overlay from discard modal component, keep only the toast
2. Add state to track when hand cards should glow (e.g., `discardGlowActive`)
3. Modify hand card rendering to apply red pulsing outline when glow is active
4. Add click handler to hand cards when glow is active to trigger discard
5. Implement card movement animation from hand position to discard pile using CSS animations or Framer Motion

### Option 2: Reuse Toast, Extend Hand Component
1. Keep discard modal component but remove modal JSX, keep toast only
2. Pass glow state to hand component through game store
3. Handle card selection directly in hand component
4. Coordinate animation between hand and discard pile positions

## Required Changes

### 1. Modify Discard Modal Component
Remove the modal overlay JSX, keep only the toast notification:
```typescript
// Remove showModal state and modal JSX
// Keep notifVisible and toast display
// Possibly adjust toast duration or add dismiss option
// Update toast message to indicate discard requirement
```

### 2. Add Discard Glow State to Game Store
Add a new state flag to indicate when hand cards should glow for discard:
```typescript
// In game store:
discardGlowActive: boolean
setDiscardGlowActive: (active: boolean) => void
```

### 3. Update Hand Card Rendering
Modify the hand component to apply red pulsing glow when `discardGlowActive` is true:
```typescript
// On each hand card:
className={`... ${discardGlowActive ? 'ring-2 ring-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]' : ''}`}
```

Unlike bench summon (which only glows eligible cards), ALL cards should glow red for discard since any card can be discarded.

### 4. Add Card Selection Handler to Hand
Add click handler to hand cards when glow is active:
```typescript
onClick={() => {
  if (discardGlowActive) {
    handleCardSelect(card);
  }
}}
```

### 5. Implement Card Movement Animation
Add animation for card moving from hand to discard pile:
- Option A: Use CSS transitions with position calculation
- Option B: Use Framer Motion for smooth animation
- Option C: Use Phaser tween if hand is rendered in canvas

Example CSS animation approach:
```typescript
// On card select:
const cardElement = document.getElementById(`card-${cardId}`);
const discardPileElement = document.getElementById('discard-pile');

// Get positions
const cardRect = cardElement.getBoundingClientRect();
const discardRect = discardPileElement.getBoundingClientRect();

// Create flying card clone
const flyingCard = cardElement.cloneNode(true);
flyingCard.style.position = 'fixed';
flyingCard.style.left = cardRect.left + 'px';
flyingCard.style.top = cardRect.top + 'px';
flyingCard.style.zIndex = '9999';
document.body.appendChild(flyingCard);

// Animate to discard pile position
flyingCard.animate([
  { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
  { transform: `translate(${discardRect.left - cardRect.left}px, ${discardRect.top - cardRect.top}px) rotate(360deg)`, opacity: 0.8 }
], {
  duration: 600,
  easing: 'ease-in-out',
  fill: 'forwards'
}).onfinish = () => {
  flyingCard.remove();
  // Actually discard the card
  sendDiscardCard(cardId);
};
```

### 6. Update Discard Modal Logic
Modify the component to set hand glow state instead of showing modal:
```typescript
useEffect(() => {
  if (discardModalOpen && isMyTurn && handSize > 4) {
    // Show toast
    setNotifVisible(true);
    // Activate hand glow
    setDiscardGlowActive(true);
    
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
    setDiscardGlowActive(false);
  }
  
  return () => {
    if (notifTimerRef.current) {
      clearTimeout(notifTimerRef.current);
      notifTimerRef.current = null;
    }
  };
}, [discardModalOpen, isMyTurn, handSize, setDiscardGlowActive]);
```

## Implementation Details

### Hand Glow Styling
Use Tailwind CSS classes for red pulsing glow:
- `ring-2 ring-red-500` - red outline
- `animate-pulse` - pulsing animation
- `shadow-[0_0_15px_rgba(239,68,68,0.6)]` - red glow shadow

### Eligible Card Filtering
Unlike bench summon (which filters by unit type and LP cost), ALL cards in hand are eligible for discard. No filtering needed.

### Toast Message
Update toast message to indicate discard requirement:
```typescript
"Select a card from your hand to discard"
```
or
```typescript
"Hand size exceeds 4 - discard a card"
```

### Animation Timing
- Card movement animation: 600ms duration
- Toast display: 1300ms (existing) or adjust to 2000ms for more visibility
- Consider adding a rotation effect during animation for visual interest
- Glow should remain active until selection is made or conditions change

### Face-Up Discard
Ensure the discard pile displays discarded cards face-up:
- Discard pile component should render the card face (not card back)
- Card should be added to discard pile state after animation completes
- Consider showing only the most recent discard or a stack of recent discards

### State Cleanup
Ensure hand glow is deactivated when:
- Card is selected and discarded
- Hand size is no longer exceeding 4
- Turn changes
- Modal is closed externally

## Testing Strategy

1. **Toast Display Test**:
   - Trigger discard condition (hand size > 4)
   - Verify toast appears without modal
   - Verify toast dismisses after duration

2. **Hand Glow Test**:
   - When toast appears, verify ALL hand cards have red pulsing glow
   - Verify glow disappears after selection
   - Verify glow deactivates when hand size is <= 4

3. **Card Selection Test**:
   - Click a glowing hand card
   - Verify card movement animation plays from hand to discard pile
   - Verify card appears in discard pile face-up after animation
   - Verify hand card is removed from hand
   - Verify hand size decreases by 1

4. **Multiple Discards Test**:
   - If hand still exceeds 4 after one discard, verify glow remains active
   - Select another card to discard
   - Verify animation plays again
   - Verify hand size decreases appropriately

5. **State Change Test**:
   - Change turn while glow is active
   - Verify glow deactivates
   - Verify toast dismisses

6. **Edge Cases**:
   - Hand exactly at size 4 (should not trigger discard)
   - Hand at size 5 (should trigger discard)
   - Empty hand (should not be possible to exceed limit)
   - Game state changes during selection

## Verification Steps
1. Start a game and cause hand size to exceed 4 (draw cards or play effects)
2. **Expected**: Toast notification appears, modal does NOT appear
3. **Expected**: All cards in hand have red pulsing outline
4. Click a glowing hand card
5. **Expected**: Card animates from hand position to discard pile with rotation
6. **Expected**: Card appears in discard pile face-up after animation completes
7. **Expected**: Hand card is removed from hand
8. **Expected**: Hand size decreases by 1
9. **Expected**: Glow deactivates if hand size is now <= 4, or remains active if still > 4
10. Verify the discarded card is visible in the discard pile area

## Additional Considerations

### Visual Clarity
- Ensure the red glow is clearly visible against the hand background
- The pulsing animation should be noticeable but not distracting
- Toast should be positioned where it doesn't obscure hand cards
- Discard pile should be clearly visible to see where cards fly to

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
- Discard pile visibility on mobile screens

### Game Flow
- Ensure the new flow doesn't break existing game state transitions
- Verify that discarding doesn't cost LP or other resources
- Ensure hand size limit enforcement still works correctly
- Verify that discard pile state is properly synced in multiplayer

### Visual Distinction from Bench Summon
- Use red glow for discard (vs green for bench summon) to clearly distinguish the two actions
- Consider different animation patterns (rotation for discard, straight movement for bench)
- Toast messages should be distinct between the two actions

## Related Files
- Discard modal component (need to locate - likely in `packages/client/src/components/`)
- `packages/client/src/components/DiscardPile.tsx` (discard pile display, may need animation coordination)
- Hand component (need to locate - likely in GameScreen.tsx or separate Hand.tsx)
- `packages/client/src/store/game-store.js` (add discard glow state)
- `packages/client/src/hooks/useGameActions.js` (sendDiscardCard action)
- Reference: `packages/client/src/components/SummonToBenchModal.tsx` (similar pattern to follow)

## Context
This change removes the intrusive modal overlay for card discarding and replaces it with a more subtle toast notification combined with visual cues (red pulsing glow) on all hand cards. When a card is selected, a visible animation shows the card moving from hand to the discard pile face-up, making the action feel more tactile and integrated with the game flow. All cards are eligible for discard when hand size exceeds 4, so the entire hand should glow red to indicate selection is required.

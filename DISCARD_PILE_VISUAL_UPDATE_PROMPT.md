# Discard Pile Visual Update - Stacked Card Display

## Problem Summary
Currently, the discard pile only displays a count of how many cards are in the pile. This lacks the tactile feel of a real TCG discard pile where cards are physically stacked. The discard pile should function like a real-world discard pile: the most recent card is displayed face-up on top, and as more cards are added, the pile should visually grow to give the illusion of a stacking deck.

## Desired Behavior
When cards are added to the discard pile:
1. **Most recent card displayed face-up** - the top card of the pile should be fully visible showing its card face
2. **Stacking visual effect** - as cards are added, they should appear to stack on top of each other
3. **Pile height illusion** - as more cards accumulate, the pile should visually appear "taller" with subtle depth cues
4. **Smooth animation** - when a card is discarded, it should animate into the pile and settle on top
5. **Maintain card count** - keep the existing card count display as supplementary information

## Current State
- Discard pile component likely in `packages/client/src/components/DiscardPile.tsx` (or similar)
- Currently displays only a card count (e.g., "Discard: 5")
- No visual representation of individual cards
- No stacking or depth effects
- Cards fly to discard pile during discard animation (from DISCARD_MODAL_REMOVAL_PROMPT.md work) but pile doesn't show them

## Key Files to Investigate

### 1. Discard Pile Component
**File**: `packages/client/src/components/DiscardPile.tsx` (or similar)
- Current implementation showing only card count
- Location in the UI (likely in GameHUD or GameScreen)
- How discard pile state is tracked

### 2. Game Store
**File**: `packages/client/src/store/game-store.js` or similar
- Discard pile state management
- Array of discarded cards (or just count)
- Need to track individual cards in discard pile

### 3. Card Type Definitions
**File**: `packages/shared/src/types/` or similar
- Card data structure
- Need card face image/artwork URL
- Card type/unit/spell information for display

### 4. Shared Game State
**File**: `packages/shared/src/` - game state updates
- When cards are added to discard pile
- Sync discard pile state across multiplayer

## Implementation Approach

### Option 1: Store Full Card History
1. Modify game store to track array of discarded cards (not just count)
2. DiscardPile component renders the most recent N cards in a stack
3. Use CSS transforms to create stacking offset and depth
4. Add subtle shadows and layering to enhance 3D effect

### Option 2: Store Only Recent Cards (Performance Optimized)
1. Store only the most recent 5-10 cards in game store
2. Render these in a stack
3. Older cards contribute to "pile height" but aren't individually rendered
4. Card count display shows total count

### Option 3: Visual Illusion Only
1. Keep just card count in state
2. Render a static "stack" of card backs
3. Show only the actual top card face if available
4. Use CSS to simulate pile height based on count

## Required Changes

### 1. Update Discard Pile State
Modify game store to track discarded cards:
```typescript
// In game store:
discardPile: {
  cards: Card[],  // Array of discarded cards (most recent last)
  count: number   // Total count (can derive from cards.length)
}
```

Or for performance:
```typescript
discardPile: {
  recentCards: Card[],  // Most recent 5-10 cards
  totalCount: number    // Total cards in pile
}
```

### 2. Update Discard Action
When a card is discarded, add it to the discard pile state:
```typescript
// In sendDiscardCard or similar action:
sendDiscardCard(cardId) {
  // ... existing discard logic ...
  // Add card to discard pile
  setDiscardPile({
    cards: [...discardPile.cards, discardedCard],
    count: discardPile.count + 1
  });
}
```

### 3. Render Stacked Cards in DiscardPile Component
Update DiscardPile component to render stacked cards:
```typescript
// In DiscardPile.tsx:
<div className="discard-pile-container">
  {discardPile.cards.slice(-5).map((card, index) => (
    <div
      key={card.id}
      className="discard-card"
      style={{
        transform: `translateY(${-index * 2}px) translateZ(${-index * 1}px)`,
        zIndex: index,
        opacity: index === discardPile.cards.length - 1 ? 1 : 0.9 - (index * 0.05)
      }}
    >
      <CardFace card={card} />
    </div>
  ))}
  <div className="discard-count">{discardPile.count}</div>
</div>
```

### 4. Add Stacking CSS Styling
Add CSS for 3D stacking effect:
```css
.discard-pile-container {
  position: relative;
  width: 120px;
  height: 170px;
  perspective: 1000px;
}

.discard-card {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, opacity 0.3s ease;
  transform-style: preserve-3d;
}

/* Subtle rotation for natural stack look */
.discard-card:nth-child(odd) {
  transform: rotate(-1deg);
}

.discard-card:nth-child(even) {
  transform: rotate(1deg);
}

/* Top card is fully opaque and prominent */
.discard-card:last-child {
  opacity: 1;
  box-shadow: 
    0 8px 12px rgba(0, 0, 0, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.3);
}
```

### 5. Add Pile Height Illusion
Add visual cues based on total card count:
```typescript
// Adjust container height or add "thickness" based on count
const pileHeight = Math.min(discardPile.count * 2, 20); // Max 20px height

<div
  className="discard-pile-base"
  style={{
    height: `${pileHeight}px`,
    transform: `translateZ(${-pileHeight}px)`
  }}
>
  {/* Stacked cards */}
</div>
```

### 6. Animate New Cards into Pile
When a card is added, animate it flying onto the stack:
```typescript
// Use framer-motion or CSS animation
<motion.div
  className="discard-card"
  initial={{ 
    scale: 0.8, 
    opacity: 0,
    y: -50,
    rotate: -10
  }}
  animate={{ 
    scale: 1, 
    opacity: 1,
    y: 0,
    rotate: 0
  }}
  transition={{ 
    duration: 0.4,
    ease: "easeOut"
  }}
>
  <CardFace card={card} />
</motion.div>
```

## Implementation Details

### Card Rendering
- Use existing CardFace or Card component for displaying card art
- Ensure card images are loaded and cached properly
- Handle different card types (units, spells) consistently

### Stacking Strategy
- Show the most recent 3-5 cards in the stack
- Older cards fade into the background or aren't rendered
- Each card has slight offset (2-4px) and rotation (±1-2°) for natural look
- Top card is fully opaque and has strongest shadow

### Depth Cues
- Use CSS perspective and transform-style: preserve-3d
- Add shadows that increase with stack depth
- Slight z-index layering for proper occlusion
- Opacity gradient for cards deeper in the stack

### Pile Height
- Base pile height grows with card count (capped at reasonable max)
- Add side/thickness rendering to show 3D volume
- Consider a "stack base" element that grows downward

### Animation Timing
- New card animation: 400ms duration
- Should sync with the hand-to-discard fly animation from DISCARD_MODAL_REMOVAL_PROMPT.md
- Stagger animations if multiple cards are added at once

### Card Count Display
- Keep the count as a badge or overlay
- Position it in corner of the pile (bottom-right or top-right)
- Style it to be readable but not intrusive

### Performance Considerations
- Limit rendered cards to 5-10 most recent
- Use virtual scrolling if showing many cards (unlikely needed)
- Cache card images
- Avoid re-rendering entire pile on every discard

### Responsive Design
- Stack should scale with screen size
- On mobile, may show fewer cards in stack
- Ensure touch targets work if cards are interactive (e.g., for viewing history)

## Testing Strategy

### 1. Single Card Discard Test
- Discard one card
- **Expected**: Card appears in discard pile face-up
- **Expected**: Card count updates
- **Expected**: Animation plays smoothly

### 2. Multiple Card Stack Test
- Discard 5 cards sequentially
- **Expected**: Each card stacks on previous
- **Expected**: Most recent card is on top
- **Expected**: Stack has visible depth
- **Expected**: Older cards are visible beneath

### 3. Large Pile Test
- Discard 20+ cards
- **Expected**: Pile appears "taller"
- **Expected**: Performance remains smooth
- **Expected**: Only recent cards are individually rendered
- **Expected**: Card count is accurate

### 4. Card Type Variety Test
- Discard different card types (units, spells)
- **Expected**: All card types render correctly
- **Expected**: Card art/images display properly
- **Expected**: Consistent sizing across card types

### 5. Animation Sync Test
- Trigger discard via hand card click
- **Expected**: Card flies from hand to pile
- **Expected**: Landing animation plays when card reaches pile
- **Expected**: Animations are smooth and coordinated

### 6. Multiplayer Sync Test
- In multiplayer game, discard cards
- **Expected**: All players see same discard pile state
- **Expected**: Card order is consistent across clients
- **Expected**: Animations play on all clients

### 7. Edge Cases
- Empty discard pile (should show placeholder or 0 count)
- Single card in pile (should render normally)
- Very large pile (50+ cards) - verify performance
- Rapid discards - verify animations don't conflict

## Verification Steps

### Visual Verification
1. Start a game and discard a card
2. **Expected**: Discard pile shows the card face-up
3. **Expected**: Card count badge displays "1"
4. Discard a second card
5. **Expected**: New card appears on top of previous
6. **Expected**: Previous card is visible beneath with slight offset
7. **Expected**: Card count updates to "2"
8. Discard 3 more cards (total 5)
9. **Expected**: Stack shows 5 cards with visible depth
10. **Expected**: Top card is most prominent
11. **Expected**: Stack has 3D appearance with shadows

### Functional Verification
1. Check that card count matches actual discarded cards
2. Verify card order (most recent on top)
3. Verify different card types display correctly
4. Verify animations play on each discard
5. Verify pile clears/reset on new game

### Performance Verification
1. Discard 50 cards rapidly
2. **Expected**: UI remains responsive
3. **Expected**: Animations complete without lag
4. **Expected**: Memory usage stays reasonable

## Additional Considerations

### Visual Consistency
- Match the existing game UI style
- Use consistent card rendering with hand/board cards
- Ensure shadows and lighting match game aesthetic
- Consider the game's color scheme and theme

### Card Information
- Decide if clicking a card in the pile shows more info
- Consider hover effects to lift cards slightly
- May want to show card history on click/hover

### Accessibility
- Ensure card count is readable (contrast, size)
- Consider keyboard navigation if cards are interactive
- Add ARIA labels for the discard pile

### Mobile Considerations
- Stack may need to be smaller on mobile
- Fewer cards visible in stack on small screens
- Ensure animations work on touch devices
- Consider landscape vs portrait orientations

### Game Flow
- Ensure discard pile doesn't obstruct other UI elements
- Verify it doesn't conflict with other overlays
- Check visibility during different game phases
- Ensure it works with existing discard modal/toast flow

### Future Enhancements
- Consider adding a "view discard history" modal
- Could allow players to review all discarded cards
- Might add shuffle animation for certain game effects
- Could add ability to retrieve cards from discard (if game rules allow)

## Related Files
- `packages/client/src/components/DiscardPile.tsx` (main component to update)
- `packages/client/src/store/game-store.js` (add discard pile card tracking)
- `packages/client/src/components/GameHUD.tsx` (where DiscardPile is likely rendered)
- `packages/client/src/components/Card.tsx` or `CardFace.tsx` (card rendering component)
- `packages/shared/src/types/` (card type definitions)
- Reference: `DISCARD_MODAL_REMOVAL_PROMPT.md` (existing discard animation coordination)

## Context
This change transforms the discard pile from a simple counter into a visually rich stacked card display, mimicking the physical experience of a real TCG discard pile. The most recent card is displayed face-up on top, with previous cards visible beneath creating a 3D stacking effect. As more cards accumulate, the pile gains visual depth and height through CSS transforms, shadows, and layering. This enhancement makes the discard action feel more tactile and provides better visual feedback about game state, while maintaining the card count display for quick reference.

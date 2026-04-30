# Stat Card Persistence Feature

## Problem Summary
Currently, when a user hovers over a card or any hoverable item (units, abilities, etc.), a stat card appears on the left-hand side of the screen. However, this stat card disappears immediately when the user stops hovering over the item. This requires constant hovering to view information, which is poor UX.

## Desired Behavior
The stat card should:
1. Display the most recently hovered card/item
2. Remain displaying that recently hovered item until the next item/card is hovered over
3. Only update when a new item is hovered, not when the mouse leaves the current item

## Current State
- Stat cards appear on the left side of the screen when hovering over items
- Stat cards disappear when mouse leaves the hover target
- This applies to cards, units, abilities, and other hoverable UI elements

## Key Files to Investigate

### 1. Stat Card Display Component
**Likely locations**:
- `packages/client/src/components/` - Look for stat card, tooltip, or hover-related components
- `packages/client/src/scenes/GameScene.ts` - May contain hover logic for units
- Search for: "stat", "card", "hover", "tooltip", "info"

### 2. Hover Event Handlers
**Likely locations**:
- Card components in `packages/client/src/components/`
- Unit rendering in GameScene or related components
- Search for: `onMouseEnter`, `onMouseLeave`, `onHover`, `hover state`

### 3. State Management
**Likely locations**:
- React state for currently hovered item
- May use useState, useStore, or similar state management
- Search for: "hovered", "selected", "current"

## Implementation Approach

### Option 1: Add Persistent Hover State
1. Add a state variable to track the "last hovered item"
2. On `onMouseEnter`: Update both the current hovered item AND the persistent last-hovered item
3. On `onMouseLeave`: Only clear the current hovered item, NOT the persistent last-hovered item
4. Display the stat card based on the persistent last-hovered item instead of the current hover state

### Option 2: Separate Hover and Selection States
1. Maintain two separate states:
   - `isHovering`: boolean for whether mouse is currently over an item
   - `lastHoveredItem`: the item data from the most recent hover
2. Stat card displays `lastHoveredItem` if it exists
3. Update `lastHoveredItem` only on new hover events, not on mouse leave

### Option 3: Debounced Clear
1. Add a delay before clearing the stat card on mouse leave
2. If a new hover occurs within the delay window, cancel the clear and update to new item
3. This provides a smoother transition but may not match the exact requirement

## Required Changes

### 1. Identify All Hoverable Elements
Search the codebase for all components/elements that trigger stat card display:
- Cards in hand/deck
- Units on the board
- Abilities
- Any other UI elements with hover tooltips

### 2. Update Hover State Logic
For each hoverable element, modify the event handlers:
```typescript
// Current pattern (likely):
const [hoveredItem, setHoveredItem] = useState(null);

const handleMouseEnter = (item) => {
  setHoveredItem(item);
};

const handleMouseLeave = () => {
  setHoveredItem(null);
};

// New pattern:
const [hoveredItem, setHoveredItem] = useState(null);
const [lastHoveredItem, setLastHoveredItem] = useState(null);

const handleMouseEnter = (item) => {
  setHoveredItem(item);
  setLastHoveredItem(item); // Update persistent state
};

const handleMouseLeave = () => {
  setHoveredItem(null);
  // DO NOT clear lastHoveredItem
};
```

### 3. Update Stat Card Display
Change the stat card component to read from `lastHoveredItem` instead of `hoveredItem`:
```typescript
// Before:
{hoveredItem && <StatCard item={hoveredItem} />}

// After:
{lastHoveredItem && <StatCard item={lastHoveredItem} />}
```

### 4. Consider Edge Cases
- What happens when the game state changes (e.g., unit dies, card played)?
- Should the stat card clear on game state changes?
- Should there be a manual way to clear the stat card (e.g., clicking elsewhere)?

## Testing Strategy

1. **Basic Hover Test**:
   - Hover over a card/unit
   - Move mouse away
   - Verify stat card remains visible

2. **Hover Transition Test**:
   - Hover over item A
   - Move mouse away
   - Hover over item B
   - Verify stat card updates from A to B

3. **Multiple Elements Test**:
   - Test with different types of hoverable elements (cards, units, abilities)
   - Verify consistent behavior across all types

4. **Game State Change Test**:
   - Hover over a unit
   - Move mouse away
   - Have the unit die or be moved
   - Verify stat card handles this gracefully (may need to clear on state change)

5. **Performance Test**:
   - Ensure the persistent state doesn't cause unnecessary re-renders
   - Verify smooth hover transitions

## Verification Steps
1. Start a game
2. Hover over a card in hand
3. Move mouse away from the card
4. **Expected**: Stat card remains visible showing the card's stats
5. Hover over a different card
6. **Expected**: Stat card updates to show the new card's stats
7. Move mouse away again
8. **Expected**: Stat card continues showing the second card's stats
9. Repeat with units on the board and abilities

## Additional Considerations

### Visual Feedback
- Consider adding a visual indicator that the stat card is showing a "pinned" item vs. actively hovered item
- Could add a subtle border or different opacity to distinguish states

### Clear Mechanism
- Consider adding a way to manually clear the stat card (e.g., clicking the stat card itself, pressing ESC, or clicking empty space)
- This gives users control if they want to clear it without hovering something else

### Accessibility
- Ensure keyboard navigation still works properly
- Consider if this change affects screen reader behavior

## Related Files
- `packages/client/src/components/` - Search for stat card/hover components
- `packages/client/src/scenes/GameScene.ts` - Unit hover logic
- Any card-related components in the client package

## Context
This is a UX improvement to make information viewing more convenient. Users often want to reference card/unit stats while making decisions, and constant hovering is frustrating. This change aligns with common game UI patterns where information panels persist until explicitly changed.

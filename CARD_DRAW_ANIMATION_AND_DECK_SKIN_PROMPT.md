# Card Draw Animation and Deck Portal Skin

## Problem Summary
Currently, when cards are drawn they are instantly added to the hand without any visual animation. This makes card draws feel abrupt and lacks the tactile satisfaction of physically drawing a card. Additionally, the main deck lacks visual identity - it doesn't show card backs or deck count, missing an opportunity to enhance the game's aesthetic and provide clear information about remaining cards.

## Desired Behavior
When a card is drawn from the main deck:
1. **Card emerges from deck** - a card appears at the deck position, face-down showing the portal card back design
2. **Horizontal flight to hand** - the card smoothly animates horizontally from deck to hand position
3. **Flip animation mid-flight** - as the card travels, it performs a 3D flip effect (like a coin flip) transitioning from face-down to face-up
4. **Lands in hand** - the card arrives at its hand position face-up and integrates into the hand layout
5. **Deck visual updates** - the main deck displays the portal card back design with a number in the center showing remaining card count
6. **Deck shrinks visually** - as cards are drawn, the deck visual should appear to shrink in thickness/height to reflect decreasing count

## Current State
- Card draws are handled via game state updates
- Cards appear instantly in hand without animation
- Main deck likely has minimal or no visual representation
- No card back design exists (portal skin needed)
- No deck count indicator exists
- Hand rendering is in `packages/client/src/components/` (likely GameHUD.tsx or similar)
- No existing card draw animation system

## Key Files to Investigate

### 1. Hand/Card Rendering Component
**File**: `packages/client/src/components/GameHUD.tsx` or similar
- Locate where hand cards are rendered
- Find where cards are added to hand on draw
- Check existing hand card layout and positioning
- Identify where card draw events are handled

### 2. Game Store - Draw State
**File**: `packages/client/src/store/game-store.js` or similar
- Check how card draws are processed
- Look for hand state updates
- Verify deck count tracking
- May need to add pending draw animation state

### 3. Deck Display Component
**File**: Need to locate or create deck display component
- Search for existing deck rendering in components
- May need to create new Deck component if none exists
- Should integrate with game HUD layout

### 4. Card Type Definitions
**File**: `packages/shared/src/types/`
- Verify card data structure
- Check if card back design is already defined
- May need to add portal design assets or CSS

### 5. GameScene.ts (if using Phaser animations)
**File**: `packages/client/src/scenes/GameScene.ts`
- Check if card animations should use Phaser or DOM
- Review existing animation systems (soul orb, etc.)
- May need to add card draw animation functions

## Implementation Approach

### Option 1: DOM-based Animation with Web Animations API
Create card elements that animate from deck position to hand using CSS transforms:

```typescript
// On card draw event:
private playCardDrawAnimation(card: Card, targetHandIndex: number) {
  // Get deck element position
  const deckEl = document.querySelector('[data-deck="main"]');
  const deckRect = deckEl.getBoundingClientRect();
  
  // Get target hand position
  const handCardEl = document.querySelector(`[data-hand-card="${targetHandIndex}"]`);
  const handRect = handCardEl.getBoundingClientRect();
  
  // Create flying card clone (face-down initially)
  const flyingCard = document.createElement('div');
  flyingCard.className = 'card card-back-portal';
  flyingCard.style.cssText = `
    position: fixed;
    left: ${deckRect.left}px;
    top: ${deckRect.top}px;
    width: ${deckRect.width}px;
    height: ${deckRect.height}px;
    z-index: 10000;
    transform-style: preserve-3d;
  `;
  document.body.appendChild(flyingCard);
  
  // Animate flight with flip
  const flightDuration = 500;
  const animation = flyingCard.animate([
    { 
      left: `${deckRect.left}px`, 
      top: `${deckRect.top}px`, 
      transform: 'rotateY(0deg) scale(1)',
      opacity: 1 
    },
    { 
      left: `${handRect.left}px`, 
      top: `${handRect.top}px`, 
      transform: 'rotateY(180deg) scale(1)',
      opacity: 1,
      offset: 0.5  // Mid-point flip
    },
    { 
      left: `${handRect.left}px`, 
      top: `${handRect.top}px`, 
      transform: 'rotateY(360deg) scale(1)',
      opacity: 1 
    }
  ], {
    duration: flightDuration,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  });
  
  animation.onfinish = () => {
    flyingCard.remove();
    // Card appears in hand via existing state update
    // Flip to face-up at end
  };
}
```

### Option 2: CSS Transitions with React State
Use React state to trigger CSS animations:

```typescript
// In hand component:
const [drawingCards, setDrawingCards] = useState<Card[]>([]);

useEffect(() => {
  if (newDrawnCards.length > previousDrawnCards.length) {
    const newCard = newDrawnCards[newDrawnCards.length - 1];
    setDrawingCards([...drawingCards, { ...newCard, isDrawing: true }]);
    
    setTimeout(() => {
      setDrawingCards(prev => prev.map(c => 
        c.id === newCard.id ? { ...c, isDrawing: false } : c
      ));
    }, 500);
  }
}, [newDrawnCards]);

// Render with animation classes:
<div className={`hand-card ${card.isDrawing ? 'card-draw-animation' : ''}`}>
```

## Required Changes

### 1. Create Portal Card Back Design
Add a portal-themed card back design for all cards:

**CSS Approach:**
```css
.card-back-portal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border: 3px solid #4a90e2;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.card-back-portal::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  border: 2px solid #4a90e2;
  border-radius: 50%;
  background: radial-gradient(circle, #4a90e2 0%, transparent 70%);
  opacity: 0.3;
}

.card-back-portal::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40%;
  height: 40%;
  border: 2px solid #7dd3fc;
  border-radius: 50%;
  background: radial-gradient(circle, #7dd3fc 0%, transparent 70%);
  opacity: 0.5;
}
```

**Or SVG/Asset Approach:**
- Create portal SVG asset with concentric circles, mystical symbols
- Use as background-image for card backs
- Ensure it matches game's dark/ethereal aesthetic

### 2. Create or Update Deck Display Component
Create a deck component that shows:
- Portal card back design
- Card count in center
- Visual thickness based on count
- Shrinking animation as cards are drawn

```typescript
// DeckDisplay.tsx
const DeckDisplay = ({ deckCount }: { deckCount: number }) => {
  const thickness = Math.min(deckCount * 2, 20); // Max 20px thickness
  
  return (
    <div 
      data-deck="main"
      className="deck-container"
      style={{
        position: 'relative',
        width: '80px',
        height: '120px',
      }}
    >
      {/* Stack layers for thickness effect */}
      {Array.from({ length: Math.min(deckCount, 5) }).map((_, i) => (
        <div
          key={i}
          className="card-back-portal"
          style={{
            position: 'absolute',
            top: `${i * 2}px`,
            left: `${i * 2}px`,
            width: '80px',
            height: '120px',
            zIndex: i,
          }}
        />
      ))}
      
      {/* Card count overlay */}
      <div className="deck-count">
        {deckCount}
      </div>
    </div>
  );
};
```

### 3. Add Card Draw Animation Function
Add animation function in appropriate location (GameScene.ts or hand component):

```typescript
private playCardDrawAnimation(card: Card, handIndex: number) {
  // Implementation from Option 1 or 2 above
  // Should handle:
  // - Spawn at deck position (face-down)
  // - Fly to hand position
  // - Flip animation mid-flight
  // - Arrive face-up
  // - Cleanup animation elements
}
```

### 4. Integrate Animation with Draw Events
Hook into card draw events to trigger animation:

```typescript
// In game store or hand component:
useEffect(() => {
  if (handCards.length > previousHandCards.length) {
    const newCardIndex = handCards.length - 1;
    const newCard = handCards[newCardIndex];
    playCardDrawAnimation(newCard, newCardIndex);
  }
}, [handCards]);
```

### 5. Add Data Attributes for Animation Targeting
Ensure deck and hand cards have data attributes:

```typescript
// Deck element:
<div data-deck="main" className="deck-container">

// Hand cards:
<div data-hand-card={index} className="hand-card">
```

### 6. Update Deck Count Display
Ensure deck count updates and triggers visual changes:

```typescript
// In deck component:
const deckCount = gameState.players[myPlayerId].deck.length;

// Add transition for smooth shrinking
style={{
  transition: 'all 0.3s ease',
  // ... thickness based on count
}}
```

## Implementation Details

### Portal Card Back Design
- **Theme**: Mystical portal, dark blues/purples, concentric circles
- **Style**: Similar to Yu-Gi-Oh card backs but with game's aesthetic
- **Elements**: 
  - Outer border (metallic or glowing)
  - Main portal circle (gradient)
  - Inner circle (brighter, glowing)
  - Optional: mystical symbols or runes
- **Colors**: Dark blues (#1a1a2e, #16213e), accent blues (#4a90e2, #7dd3fc)
- **Size**: Match card dimensions (standard playing card ratio)

### Card Draw Animation Timing
- **Flight duration**: 400-600ms
- **Flip timing**: Start flip at 30% of flight, complete by 70%
- **Easing**: cubic-bezier for natural acceleration/deceleration
- **Delay**: Small delay (50-100ms) between multiple card draws if drawing multiple at once

### Animation Path
- **Start**: Deck position (face-down)
- **End**: Target hand position (face-up)
- **Curve**: Slight arc or bezier curve for natural movement
- **Rotation**: 3D flip (rotateY) from 0deg to 360deg
- **Scale**: Slight scale down (0.9) during flight, scale to 1.0 at end

### Deck Visual Thickness
- **Base thickness**: 2px per card (capped at ~20px max)
- **Visual layers**: Stack 3-5 div layers for 3D effect
- **Shrinking**: CSS transition on height/offset as count decreases
- **Minimum**: Even at 1 card, show some thickness for visibility

### Deck Count Display
- **Position**: Center of deck, overlay on portal design
- **Style**: Large, bold number, white with text-shadow
- **Font**: Game-appropriate font (same as other UI)
- **Background**: Semi-transparent dark circle for readability
- **Update**: Animate number change (fade out/in or count-up effect)

### Multi-Card Draws
When drawing multiple cards (e.g., draw 2):
- **Stagger animations**: 100-150ms delay between each
- **Sequential flight**: Each card animates independently
- **Target positions**: Each card goes to its correct hand index

### Cleanup
- Remove flying card DOM elements after animation
- Clear animation state
- Ensure no memory leaks from animation objects

## Testing Strategy

### 1. Single Card Draw Test
- Draw one card
- **Expected**: Card emerges from deck face-down with portal design
- **Expected**: Card flies horizontally to hand position
- **Expected**: Card performs 3D flip during flight
- **Expected**: Card arrives face-up at hand position
- **Expected**: Card integrates into hand layout
- **Expected**: Deck count decreases by 1
- **Expected**: Deck visual thickness decreases

### 2. Multi-Card Draw Test
- Draw multiple cards at once
- **Expected**: Each card animates sequentially with stagger
- **Expected**: Animations don't overlap or conflict
- **Expected**: All cards arrive at correct hand positions
- **Expected**: Deck count updates correctly

### 3. Empty Deck Test
- Draw last card from deck
- **Expected**: Animation plays normally
- **Expected**: Deck shows 0 count
- **Expected**: Deck visual shows minimal thickness
- **Expected**: Deck may hide or show "empty" state

### 4. Full Deck Test
- Start game with full deck
- **Expected**: Deck shows correct initial count
- **Expected**: Deck visual thickness reflects full deck
- **Expected**: Portal design is visible

### 5. Rapid Draw Test
- Draw cards in quick succession
- **Expected**: Animations play smoothly
- **Expected**: No jank or stuttering
- **Expected**: All cards arrive correctly

### 6. Hand Layout Test
- Draw cards when hand has existing cards
- **Expected**: New cards animate to correct positions
- **Expected**: Existing cards don't shift during animation
- **Expected**: Hand re-layouts after animation completes

## Verification Steps

### Visual Verification
1. Start a new game with full deck
2. **Expected**: Deck displays portal design with card count in center
3. **Expected**: Deck has visual thickness reflecting card count
4. Draw a card during your turn
5. **Expected**: Card appears at deck position face-down (portal design visible)
6. **Expected**: Card smoothly flies to hand position
7. **Expected**: Card performs 3D flip during flight (face-down to face-up)
8. **Expected**: Card arrives at hand position face-up
9. **Expected**: Deck count decreases by 1
10. **Expected**: Deck visual thickness decreases
11. Draw another card
12. **Expected**: Same animation sequence repeats
13. **Expected**: Both cards are visible in hand

### Functional Verification
1. Verify card is actually added to hand after animation
2. Verify card is playable after draw
3. Verify deck count matches actual deck size
4. Verify drawing multiple cards works correctly
5. Verify animation doesn't block other game actions

### Timing Verification
1. Measure flight duration (should be 400-600ms)
2. Verify flip timing (30%-70% of flight)
3. Verify stagger timing for multi-card draws (100-150ms)
4. Verify deck thickness transition (should be ~300ms)
5. Verify animations don't excessively delay gameplay

## Additional Considerations

### Visual Consistency
- Portal design should match game's dark/ethereal aesthetic
- Card back should be consistent across all cards
- Animation should feel satisfying and tactile
- Flip effect should be smooth and natural

### Performance
- Use transform/opacity for GPU-accelerated animations
- Avoid layout thrashing during animation
- Clean up DOM elements promptly
- Consider limiting concurrent animations if needed

### Mobile Considerations
- On mobile, deck and hand positions may differ
- Animation should adapt to different screen sizes
- Touch interactions shouldn't interfere with animation
- Card size may need adjustment for smaller screens

### Game Flow
- Animation shouldn't block player actions excessively
- Consider if animation can be skipped (optional)
- Ensure it doesn't conflict with other card animations
- Verify it works during all game phases

### Accessibility
- Consider adding option to disable animations
- Ensure deck count is readable (high contrast)
- Animation shouldn't cause motion sickness issues

### Edge Cases
- What if deck element is off-screen or hidden?
- What if hand is full when drawing?
- What if card draw is canceled or undone?
- Handle cases where deck/hand DOM elements aren't found

### Future Enhancements
- Could add sound effect for card draw
- Could vary animation based on card type
- Could add particle trail during flight
- Could make deck glow when low on cards
- Could add shuffle animation when deck is reshuffled

## Related Files
- Hand component (need to locate - likely `packages/client/src/components/GameHUD.tsx`)
- Game store (`packages/client/src/store/game-store.js` - draw state)
- Deck component (need to create or locate)
- `packages/client/src/scenes/GameScene.ts` (if using Phaser animations)
- Card type definitions (`packages/shared/src/types/`)
- Reference: `SOUL_ORB_DISCARD_ANIMATION_PROMPT.md` (similar DOM animation pattern)
- Reference: `BENCH_SUMMON_UI_REMOVAL_PROMPT.md` (card movement animation)

## Context
This change adds a satisfying card draw animation and visual deck representation to enhance the game's tactile feel. When cards are drawn, they emerge from the deck face-down showing a mystical portal design, fly horizontally to the hand while performing a 3D flip, and arrive face-up. The main deck displays the portal card back design with a count indicator in the center, and visually shrinks as cards are drawn. This creates a more engaging card-drawing experience similar to physical TCGs, with the portal design giving the deck visual identity and the count providing clear information about remaining cards.

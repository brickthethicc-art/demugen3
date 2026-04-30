# Game End Screens and Modals Implementation

## Problem Summary
Currently, the game lacks proper end-game UI for players who lose or win. When a player reaches 0 life points, there is no death screen or modal. When a player is eliminated in a 2, 3, or 4 player game, there is no modal informing them of their loss with options to spectate or return to the main menu. When the last remaining player wins, there is no victory screen with a button to return to the main menu.

## Desired Behavior

### 1. Player Elimination Modal (2, 3, or 4 Player Games)
When a player loses (reaches 0 life points):
- A small modal should pop up indicating they have lost
- The modal should display: "You have been eliminated" or similar message
- Two buttons should be available:
  - "Spectate" - allows the eliminated player to watch the remaining players continue
  - "Return to Main Menu" - exits the game and returns to the main screen
- This should work for 2, 3, and 4 player games

### 2. Death Screen on 0 Life Points
When a player hits 0 life points:
- Ensure the death screen triggers properly
- Ensure any post-death modals appear correctly
- The death sequence should lead to the elimination modal described above

### 3. Victory Screen for Last Remaining Player
When only one player remains with health:
- A victory modal should appear
- The modal should display: "Victory! You Won!" or similar message
- A single button should be available: "Return to Main Menu"
- This should trigger when all other players have been eliminated

## Current State
- Need to investigate existing game end logic in shared code
- Need to locate where player elimination is detected
- Need to check if any existing modal components can be reused
- Need to identify where victory condition is checked
- Need to determine if spectate functionality exists or needs to be implemented

## Key Files to Investigate

### 1. Game State Management
**Files to search:**
- `packages/shared/src/` - look for game end conditions, player elimination logic
- `packages/shared/src/engines/` - check for win/loss detection
- `packages/shared/src/types/` - look for game state types that track player status

### 2. Client Game Store
**File**: `packages/client/src/store/game-store.js` or similar
- Look for player elimination state
- Check if spectate state exists
- Look for game end state management

### 3. Existing Modal Components
**Files to search:**
- `packages/client/src/components/` - look for existing modal patterns
- Check if there's a base modal component to reuse
- Look for existing game-over or victory screens

### 4. Game Scene / Game Screen
**Files to search:**
- `packages/client/src/scenes/GameScene.ts` - check for game end handling
- `packages/client/src/components/GameScreen.tsx` or similar - main game UI component
- Look for where player life points are tracked

### 5. Main Menu Navigation
**Files to search:**
- Look for routing/navigation logic
- Check how "Return to Main Menu" is implemented elsewhere
- Look for main menu component location

## Implementation Approach

### Phase 1: Detect Player Elimination and Victory
1. Identify where player life points are tracked in shared code
2. Add or enhance logic to detect when a player reaches 0 life points
3. Add logic to detect when only one player remains with health
4. Ensure these state changes are synchronized across all clients

### Phase 2: Add Game End States to Game Store
1. Add state for player elimination (e.g., `isEliminated`, `eliminationReason`)
2. Add state for game victory (e.g., `isVictory`, `victoryReason`)
3. Add state for spectate mode (e.g., `isSpectating`)
4. Ensure these states are updated when game end conditions are met

### Phase 3: Create Elimination Modal Component
1. Create `EliminationModal.tsx` in `packages/client/src/components/`
2. Display elimination message
3. Add "Spectate" button that sets spectate state
4. Add "Return to Main Menu" button that navigates to main menu
5. Style to match existing game UI

### Phase 4: Create Victory Modal Component
1. Create `VictoryModal.tsx` in `packages/client/src/components/`
2. Display victory message
3. Add "Return to Main Menu" button
4. Style to match existing game UI (possibly with celebratory visuals)

### Phase 5: Integrate Modals into Game Screen
1. Conditionally render EliminationModal when player is eliminated
2. Conditionally render VictoryModal when player wins
3. Ensure modals appear at appropriate times (not during other animations)
4. Handle spectate mode UI changes (if different from normal gameplay)

### Phase 6: Implement Spectate Functionality (if not existing)
1. When spectating, disable player controls
2. Allow camera/view to follow remaining players or show overview
3. Ensure spectate player receives game state updates
4. Optionally add UI to indicate "Spectating" status

## Required Changes

### 1. Shared Code - Player Elimination Detection
Add or enhance logic to detect when a player reaches 0 life points:
```typescript
// In shared game state or engine:
if (player.lifePoints <= 0 && !player.isEliminated) {
  player.isEliminated = true;
  player.eliminationTime = currentTime;
  // Emit elimination event
}
```

### 2. Shared Code - Victory Detection
Add logic to detect when only one player remains:
```typescript
// In shared game state or engine:
const activePlayers = players.filter(p => p.lifePoints > 0 && !p.isEliminated);
if (activePlayers.length === 1 && !game.isGameOver) {
  game.winner = activePlayers[0].id;
  game.isGameOver = true;
  // Emit victory event
}
```

### 3. Client Game Store - Add Game End States
```typescript
// In game store:
isEliminated: boolean
isVictory: boolean
isSpectating: boolean
winnerId: string | null
setEliminated: (eliminated: boolean) => void
setVictory: (victory: boolean, winnerId?: string) => void
setSpectating: (spectating: boolean) => void
```

### 4. Create EliminationModal Component
```typescript
// packages/client/src/components/EliminationModal.tsx
export function EliminationModal() {
  const { isEliminated, setSpectating, navigateToMainMenu } = useGameStore();

  if (!isEliminated) return null;

  return (
    <Modal>
      <h2>You Have Been Eliminated</h2>
      <p>Your life points have reached 0.</p>
      <div className="button-group">
        <button onClick={() => setSpectating(true)}>Spectate</button>
        <button onClick={navigateToMainMenu}>Return to Main Menu</button>
      </div>
    </Modal>
  );
}
```

### 5. Create VictoryModal Component
```typescript
// packages/client/src/components/VictoryModal.tsx
export function VictoryModal() {
  const { isVictory, navigateToMainMenu } = useGameStore();

  if (!isVictory) return null;

  return (
    <Modal className="victory-modal">
      <h2>Victory! You Won!</h2>
      <p>You are the last player standing.</p>
      <button onClick={navigateToMainMenu}>Return to Main Menu</button>
    </Modal>
  );
}
```

### 6. Integrate into Game Screen
```typescript
// In GameScreen.tsx or similar:
import { EliminationModal } from './components/EliminationModal';
import { VictoryModal } from './components/VictoryModal';

// In render:
<EliminationModal />
<VictoryModal />
```

### 7. Handle Spectate Mode
```typescript
// When spectating:
// - Disable all player controls (card selection, unit movement, etc.)
// - Possibly add "Spectating" badge to UI
// - Allow view to pan/zoom freely or cycle between remaining players
// - Ensure spectate player can still click "Return to Main Menu" from elimination modal
```

## Implementation Details

### Modal Styling
Use consistent styling with existing game UI:
- Modal should be centered on screen
- Semi-transparent backdrop to dim game
- Clear, readable text
- Buttons with hover states
- Match the game's color scheme and aesthetic

### Victory Modal Special Effects
Consider adding celebratory elements:
- Confetti or particle effects
- Golden or bright color scheme
- Trophy or crown icon
- Sound effect (if audio system exists)

### Elimination Modal Tone
Keep the tone clear but not overly harsh:
- Neutral or dark color scheme
- Clear message about elimination
- Quick access to spectate or exit

### Spectate Mode Behavior
When spectating:
- Player cannot take any game actions
- Player can still view the board and see other players' turns
- Player can exit spectate mode via "Return to Main Menu"
- Optionally allow spectating player to cycle between remaining players' views

### Game End Timing
- Elimination modal should appear immediately when player reaches 0 life points
- Victory modal should appear immediately when last opponent is eliminated
- Ensure modals don't conflict with other animations (death effects, etc.)
- Consider a brief delay (500-1000ms) after death effects before showing modal

### Multiplayer Synchronization
- Ensure all clients receive elimination/victory events
- Elimination modal only shows for the eliminated player
- Victory modal only shows for the winning player
- Other players continue playing normally until they are eliminated or win

### State Cleanup
- Clear game end states when returning to main menu
- Reset spectate mode when starting a new game
- Ensure no modal state persists between games

## Testing Strategy

### 1. 2-Player Game Elimination Test
- Start a 2-player game
- Reduce one player to 0 life points
- **Expected**: Elimination modal appears for eliminated player
- **Expected**: Other player continues playing
- Click "Spectate"
- **Expected**: Eliminated player enters spectate mode, can watch remaining player
- Click "Return to Main Menu"
- **Expected**: Game exits, returns to main menu

### 2. 3-Player Game Elimination Test
- Start a 3-player game
- Eliminate one player (reduce to 0 life)
- **Expected**: Elimination modal appears for that player
- **Expected**: Two remaining players continue
- Remaining players eliminate each other until one wins
- **Expected**: Victory modal appears for last remaining player
- **Expected**: Eliminated player (if spectating) sees victory

### 3. 4-Player Game Elimination Test
- Start a 4-player game
- Eliminate players one by one
- **Expected**: Each eliminated player sees elimination modal
- **Expected**: Each can choose to spectate or exit
- **Expected**: Last player sees victory modal

### 4. Victory Screen Test
- Start any game (2, 3, or 4 players)
- Eliminate all opponents
- **Expected**: Victory modal appears for winning player
- Click "Return to Main Menu"
- **Expected**: Game exits, returns to main menu

### 5. Spectate Mode Test
- Get eliminated in a multiplayer game
- Click "Spectate"
- **Expected**: Player controls are disabled
- **Expected**: Can still view the game
- **Expected**: Can see remaining players' actions
- **Expected**: "Return to Main Menu" button still available

### 6. Death Screen Integration Test
- Reduce player to exactly 0 life points
- **Expected**: Death effects play (existing functionality)
- **Expected**: After death effects, elimination modal appears
- **Expected**: No modal appears before death effects complete

### 7. Edge Cases
- Player eliminated during their own turn
- Multiple players eliminated simultaneously (rare but possible)
- Network disconnection during elimination
- Player clicks "Spectate" then immediately "Return to Main Menu"

## Verification Steps

### Elimination Flow
1. Start a multiplayer game
2. Play until a player reaches 0 life points
3. **Expected**: That player sees death effects
4. **Expected**: After death effects, elimination modal appears
5. **Expected**: Modal reads "You Have Been Eliminated" or similar
6. **Expected**: "Spectate" and "Return to Main Menu" buttons are present
7. Click "Spectate"
8. **Expected**: Modal closes, player enters spectate mode
9. **Expected**: Player cannot take game actions
10. **Expected**: Player can view remaining gameplay

### Victory Flow
1. Start a multiplayer game
2. Eliminate all opponents
3. **Expected**: Last remaining player sees victory modal
4. **Expected**: Modal reads "Victory! You Won!" or similar
5. **Expected**: "Return to Main Menu" button is present
6. Click "Return to Main Menu"
7. **Expected**: Game exits, main menu appears

### Return to Main Menu
1. From elimination modal, click "Return to Main Menu"
2. **Expected**: Game state is cleared
3. **Expected**: Main menu screen appears
4. **Expected**: Can start a new game normally

## Additional Considerations

### Visual Consistency
- Ensure modals match the game's existing UI style
- Use consistent fonts, colors, and spacing
- Consider the game's theme (dark, fantasy, etc.) in modal design

### Performance
- Modals should render quickly
- Avoid expensive animations on modal show/hide
- Clean up any event listeners or timers when modals unmount

### Accessibility
- Ensure modals can be dismissed with keyboard (Escape key)
- Add appropriate ARIA attributes for screen readers
- Ensure buttons have focus states
- Consider color contrast for text

### Mobile Considerations
- Modals should fit on smaller screens
- Buttons should have adequate touch targets
- Consider landscape vs portrait orientations
- Ensure modals don't cover critical game elements

### Network Reliability
- Ensure elimination/victory events are reliably sent to all clients
- Handle cases where a client disconnects during game end
- Consider what happens if a player is eliminated while disconnected

### Spectate Mode UX
- Clearly indicate when a player is spectating
- Consider adding a "Spectating" badge or overlay
- Allow spectating player to see all information (no fog of war)
- Optionally allow spectating player to switch views between remaining players

### Audio
- Consider adding sound effects for:
  - Elimination modal appearance
  - Victory modal appearance
  - Button clicks
- Ensure audio doesn't overlap with death effects

### Persistence
- No need to persist elimination/victory state (session-only)
- Clear all game end state when returning to main menu
- Ensure no state leaks between games

## Related Files
- Shared game state/engine files (to be located)
- `packages/client/src/store/game-store.js` (add game end states)
- `packages/client/src/components/EliminationModal.tsx` (new file)
- `packages/client/src/components/VictoryModal.tsx` (new file)
- Game screen component (to be located - integrate modals)
- Main menu component (to be located - navigation target)
- Existing modal components (to be located - reuse patterns)

## Context
This implementation adds proper game end UI for multiplayer games. When a player is eliminated (reaches 0 life points), they see a modal with options to spectate the remaining players or return to the main menu. When the last player remaining wins, they see a victory modal with a button to return to the main menu. This provides clear feedback to players about game outcomes and gives eliminated players a way to continue watching the game or exit gracefully. The implementation must work correctly for 2, 3, and 4 player games, with proper state synchronization across all clients.

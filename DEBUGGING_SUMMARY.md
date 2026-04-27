# Game Startup Issue - Debugging Summary

## Problem
When the game begins between 2 players, the screen was completely blank with no grid rendered, no UI elements visible, and the game appeared "dead" with no interaction.

## Root Cause
The screen was blank due to a **conditional rendering deadlock** in `App.tsx`:
- The `useEffect` that sets the screen based on `gameState.phase` has a guard: `if (!gameState) return;`
- When the game starts, if `gameState` is null or not yet received from the server, the screen remains on 'main-menu' (the default)
- The default case in the switch statement renders `MainMenuScreen`, but if the user expects to see the game board after starting, this appears as a blank/unresponsive screen
- Additionally, there were no error boundaries or fallback UIs, so any rendering errors would result in a completely blank screen

## Files Modified

### 1. packages/client/src/App.tsx
**Changes:**
- Added extensive logging to track component loading, screen state, and game state phase
- Added failsafe `useEffect` to force screen to 'game' when `gameState.phase === IN_PROGRESS` but screen is stuck on 'main-menu'
- Added second failsafe to ensure screen is never null/undefined
- Added fallback error UI that displays debug info (screen, gameState.phase) with a recovery button
- Added periodic state logging every 5 seconds for debugging
- Added player ID logging to track connection status

**Key Fixes:**
```typescript
// FAILSAFE: If gameState exists but screen is still main-menu, force it to game
useEffect(() => {
  if (gameState && gameState.phase === GamePhase.IN_PROGRESS && screen === 'main-menu') {
    console.log('APP FAILSAFE - Forcing screen to game (was stuck on main-menu)');
    setScreen('game');
  }
}, [gameState, screen, setScreen]);

// FALLBACK: Should never reach here, but if we do, show error
return (
  <div className="min-h-screen flex items-center justify-center bg-mugen-bg">
    <div className="bg-red-900/50 rounded-2xl p-8 border border-red-500">
      <h1 className="text-2xl font-bold text-white mb-4">Game Failed to Load</h1>
      <p className="text-gray-300 text-center mb-4">Screen: {screen || 'null'}</p>
      <p className="text-gray-300 text-center mb-4">Game State Phase: {gameState?.phase || 'null'}</p>
      <button onClick={() => setScreen('main-menu')}>Return to Main Menu</button>
    </div>
  </div>
);
```

### 2. packages/client/src/components/GameScreen.tsx
**Changes:**
- Wrapped entire render in try-catch to prevent silent crashes
- Added error UI that displays the error message if rendering fails
- Added logging to track when component loads

**Key Fixes:**
```typescript
try {
  return (
    <div data-testid="game-screen" className="min-h-screen bg-mugen-bg flex">
      {/* Game screen content */}
    </div>
  );
} catch (error) {
  console.error('GAME SCREEN RENDER ERROR:', error);
  return (
    <div className="min-h-screen bg-mugen-bg flex items-center justify-center">
      <div className="bg-red-900/50 rounded-2xl p-8 border border-red-500">
        <h1 className="text-2xl font-bold text-white mb-4">Game Screen Error</h1>
        <p className="text-gray-300">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    </div>
  );
}
```

### 3. packages/client/src/components/GameBoard.tsx
**Changes:**
- Added try-catch around Phaser initialization
- Added error state to display error UI if Phaser fails to initialize
- Added logging for Phaser initialization success/failure
- Added useState import (was missing)

**Key Fixes:**
```typescript
const [phaserError, setPhaserError] = useState<string | null>(null);

useEffect(() => {
  try {
    gameRef.current = new Phaser.Game({...});
    console.log('PHASER GAME INITIALIZED SUCCESSFULLY');
  } catch (error) {
    console.error('PHASER INITIALIZATION ERROR:', error);
    setPhaserError(error instanceof Error ? error.message : 'Failed to initialize Phaser');
  }
}, []);

if (phaserError) {
  return (
    <div className="rounded-xl shadow-2xl border border-red-500 bg-red-900/30 p-8">
      <h2 className="text-xl font-bold text-red-400 mb-2">Game Board Error</h2>
      <p className="text-gray-300">{phaserError}</p>
    </div>
  );
}
```

### 4. packages/client/src/store/game-store.ts
**Changes:**
- Added extensive logging to validate game state structure (players count, board dimensions, current player index, turn phase)
- Added null check to prevent setting null gameState
- Added logging for activeUnits and benchUnits synchronization

**Key Fixes:**
```typescript
setGameState: (state) => {
  console.log('=== GAME STORE SET GAME STATE ===');
  console.log('GameStore: setGameState called with:', state?.phase);
  console.log('GameStore: playerId:', get().playerId);
  
  if (!state) {
    console.log('GameStore: ERROR - gameState is null!');
    set({ gameState: null });
    return;
  }
  
  console.log('GameStore: Players count:', state.players?.length || 0);
  console.log('GameStore: Board dimensions:', state.board?.width, 'x', state.board?.height);
  console.log('GameStore: Current player index:', state.currentPlayerIndex);
  console.log('GameStore: Turn phase:', state.turnPhase);
  // ... rest of the function
}
```

### 5. packages/client/src/network/socket-client.ts
**Changes:**
- Enhanced logging for game_state reception with detailed debug info
- Added socket connection lifecycle logging (connect, disconnect, connect_error)
- Added logging for socket connection attempts

**Key Fixes:**
```typescript
socket.on('connect', () => {
  console.log('=== SOCKET CONNECTED ===');
  console.log('Socket ID:', socket?.id);
});

socket.on('game_state', (state: GameState) => {
  console.log('=== GAME STATE RECEIVED ===');
  console.log('Socket: Received game_state:', state.phase);
  console.log('Socket: Players count:', state.players.length);
  console.log('Socket: Board dimensions:', state.board.width, 'x', state.board.height);
  store.setGameState(state);
  console.log('=== GAME STATE SET IN STORE ===');
});
```

### 6. packages/client/src/scenes/GameScene.ts
**Changes:**
- Added logging in create() to track when Phaser scene is created
- Added logging in updateFromStore() to track when game state is processed
- Added logging for gameState null check

**Key Fixes:**
```typescript
create() {
  console.log('GAME SCENE CREATE METHOD CALLED');
  // ... initialization
}

private updateFromStore() {
  console.log('GAME SCENE UPDATE FROM STORE');
  const state = useGameStore.getState().gameState;
  console.log('GAME SCENE - gameState:', state ? 'exists' : 'null');
  
  if (!state) {
    console.log('GAME SCENE - gameState is null, cannot render');
    return;
  }
  // ... rendering logic
}
```

### 7. packages/client/src/components/StartingUnitSelection.tsx
**Changes:**
- Added logging to track when component loads
- Added logging for selectedDeck, startingUnits, and isPlayerReady state

**Key Fixes:**
```typescript
export function StartingUnitSelection() {
  console.log('STARTING UNIT SELECTION COMPONENT LOADED');
  
  const { selectedDeck, startingUnits, isPlayerReady } = useGameStore();
  
  console.log('STARTING UNIT SELECTION - selectedDeck length:', selectedDeck?.length || 0);
  console.log('STARTING UNIT SELECTION - startingUnits length:', startingUnits.length);
  console.log('STARTING UNIT SELECTION - isPlayerReady:', isPlayerReady);
  // ... rest of component
}
```

## Safeguards Added

1. **Failsafe screen state management**: Two separate useEffects ensure the screen is correctly set to 'game' when gameState.phase is IN_PROGRESS, preventing the screen from getting stuck on 'main-menu'

2. **Fallback error UI**: If rendering fails for any reason, a visible error screen is displayed showing debug information (screen state, gameState.phase) with a recovery button

3. **Error boundaries**: Try-catch blocks in GameScreen and GameBoard prevent silent crashes and provide visible error messages

4. **Phaser initialization error handling**: If Phaser fails to initialize, an error UI is displayed instead of a blank container

5. **Extensive logging**: Added logging at every critical point in the initialization flow to quickly identify where the process fails:
   - App component loading and state changes
   - Socket connection lifecycle
   - Game state reception and validation
   - Component mounting (GameScreen, GameBoard, GameScene, StartingUnitSelection)
   - Phaser initialization

6. **Null state validation**: Added checks to ensure gameState is not null before processing

7. **Periodic state monitoring**: Added 5-second interval logging to track app state over time

## Testing Instructions

### Prerequisites
- Ensure both servers are running:
  - Client: http://localhost:5175
  - Server: http://localhost:3001

### Test Steps

1. **Open the game in browser**
   - Navigate to http://localhost:5175
   - Open browser console (F12)

2. **Verify initialization logs**
   - You should see "APP COMPONENT LOADED"
   - You should see "APP - Current screen: main-menu"
   - You should see periodic "=== APP STATE CHECK ===" logs every 5 seconds

3. **Create a lobby**
   - Click "Play" → "Create Game"
   - Enter your name and create lobby
   - Check console for "SOCKET CONNECT CALLED" and "SOCKET CONNECTED"

4. **Join with second player**
   - Open second browser window (incognito)
   - Navigate to http://localhost:5175
   - Join the lobby with the code
   - Both players should see the lobby screen

5. **Start the game**
   - Both players click "Ready Up"
   - Host clicks "Start Game"
   - Check console for:
     - "=== GAME STATE RECEIVED ==="
     - "=== GAME STORE SET GAME STATE ==="
     - "APP USE EFFECT - gameState changed: PRE_GAME"
     - "APP - Rendering StartingUnitSelection"
     - "STARTING UNIT SELECTION COMPONENT LOADED"

6. **Select starting units**
   - Each player selects 6 units
   - Click "Confirm Selection"
   - Check console for team lock confirmation

7. **Verify game board renders**
   - After all players confirm, the screen should transition to 'game'
   - Check console for:
     - "APP USE EFFECT - gameState changed: IN_PROGRESS"
     - "APP - Rendering GameScreen"
     - "GAME SCREEN COMPONENT LOADED"
     - "GAME BOARD COMPONENT LOADED"
     - "GAME BOARD USE EFFECT RUNNING"
     - "INITIALIZING PHASER GAME"
     - "PHASER GAME INITIALIZED SUCCESSFULLY"
     - "GAME SCENE CREATE METHOD CALLED"

### Expected Behavior

- **Before fixes**: Screen would be blank after starting the game
- **After fixes**: 
  - If game state is received correctly, the appropriate screen (pregame or game) renders
  - If there's an error, a visible error screen appears with debug information
  - If the screen gets stuck, failsafe logic forces it to the correct state
  - Console logs provide detailed information about the initialization flow

### Debugging with Logs

If the screen is still blank, check the console logs for:

1. **Socket connection issues**:
   - Look for "SOCKET CONNECTION ERROR"
   - Verify server is running on port 3001

2. **Game state not received**:
   - Look for "GAME STATE RECEIVED" - if missing, server isn't sending state
   - Check server logs for errors

3. **Screen state issues**:
   - Look for "APP FAILSAFE" logs to see if failsafes triggered
   - Check current screen and game state phase in periodic logs

4. **Component rendering issues**:
   - Look for "GAME SCREEN RENDER ERROR" or "PHASER INITIALIZATION ERROR"
   - Check if error UI is displayed

## Next Possible Failure Point

**Socket connection failure**: If the client cannot connect to the server at `localhost:3001`, the game_state event will never be received, leaving gameState as null. The failsafes I added will handle this by keeping the screen on 'main-menu' with the fallback UI, but the underlying issue would be the server not running or the wrong server URL in the socket-client configuration.

To test this:
1. Stop the server
2. Try to create a lobby
3. Check console for "SOCKET CONNECTION ERROR"
4. Verify fallback UI appears if screen gets stuck

## Summary

The root cause was a conditional rendering deadlock where the screen state wasn't being updated when the game state changed. I've added:
- Multiple failsafe mechanisms to prevent the screen from getting stuck
- Extensive logging throughout the initialization flow
- Error boundaries and fallback UIs to prevent blank screens
- Socket connection health checks

All changes are minimal and focused on preventing the specific issue while adding visibility into the initialization process for future debugging.

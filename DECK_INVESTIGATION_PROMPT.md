# Developer Prompt: Deck Data Flow Investigation

## Objective
Investigate and fix the issue where the main deck shows 0 cards at game start, despite proper deck selection in the pre-game lobby.

## Current Issue Analysis
Based on debug logs, the root cause has been identified:
- Client successfully selects 16-card deck
- Client attempts to send deck data to server via WebSocket
- **CRITICAL ISSUE**: Socket connection is `undefined` when sending deck data
- Server receives no deck data, resulting in 0-card decks

## Step-by-Step Investigation Process

### Step 1: Verify Socket Connection Issue
**Action**: Check the socket connection timing in the client-side code
**Files to examine**:
- `packages/client/src/network/socket-client.ts`
- `packages/client/src/store/game-store.ts`

**Key investigation points**:
- When is the socket initialized vs when `setSelectedDeck` is called?
- Is there a race condition between socket connection and deck selection?
- Why is `socket?.connected` returning `undefined`?

### Step 2: Fix Socket Connection Timing
**Action**: Ensure socket is properly connected before sending deck data
**Potential solutions**:
- Add connection validation before sending deck data
- Implement retry mechanism for deck data transmission
- Fix socket initialization order

### Step 3: Verify Deck Data Transmission
**Action**: Test the complete flow after fixing socket connection
**Expected behavior**:
1. Client connects to WebSocket server
2. Client selects 16-card deck
3. Client sends deck data successfully
4. Server receives and processes deck data
5. Game starts with proper 10-card main deck (16 - 6 field cards)

### Step 4: Validate Game State Creation
**Action**: Ensure the 16-card deck is properly processed into 10-card main deck
**Files to examine**:
- `packages/server/src/resolver/action-resolver.ts`
- `packages/shared/src/engines/game/index.ts`
- `packages/shared/src/engines/card/index.ts`

**Expected flow**:
- 16-card deck received by server
- `initializePlayerDeck` splits into 6 field cards + 10 main deck cards
- Game state created with proper deck counts

### Step 5: End-to-End Testing
**Action**: Create comprehensive test to verify the complete flow
**Test scenarios**:
- 16-card deck selection and game start
- 6-card pre-game selection (3 active + 3 bench)
- Main deck shows 10 cards after game start
- Field cards properly separated

## Debugging Tools Available

### Server-Side Debug Logging
- WebSocket event logging (catch-all listener)
- Deck selection process logging
- Game state creation logging

### Client-Side Debug Logging  
- Socket connection status logging
- Deck emission logging
- Game store state logging

### Test Deck Creation
- "Create Test Deck" button in main menu
- Automatically generates valid 16-card deck
- Saves to localStorage slot 0

## Expected Resolution
After fixing the socket connection issue, the complete flow should work:
1. Client socket connects properly
2. Deck data transmitted successfully
3. Server processes 16-card deck into 10-card main deck
4. Game starts with correct deck counts
5. Pre-game 6-card selection works properly

## Success Criteria
- [ ] Socket connection established before deck selection
- [ ] Deck data successfully transmitted from client to server
- [ ] Server receives and processes 16-card deck
- [ ] Game state created with 10-card main deck
- [ ] Pre-game selection shows 6 cards (3 active + 3 bench)
- [ ] Main deck displays correct count during gameplay

## Additional Notes
- The issue is NOT with deck validation or game logic
- The issue is NOT with deck storage or loading
- The issue IS with WebSocket connection timing
- All existing debug logging should be preserved for verification

## Implementation Priority
1. **HIGH**: Fix socket connection timing issue
2. **MEDIUM**: Add connection validation and retry logic  
3. **LOW**: Clean up debug logging after issue resolved

This investigation should be approached methodically, testing each step before proceeding to the next.

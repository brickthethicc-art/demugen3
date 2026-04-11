# Error Log

## Game Start Investigation - April 7, 2026
### Bug 1: Cards are not drawn from the deck when the game starts
**Problem:** Players start with empty hands instead of 4 cards each  
**Root Cause:** `createGame()` doesn't initialize decks or draw cards  
**Evidence:** `game-start-bugs.test.ts` - 3 failing tests documenting the issue  
**Missing Integration:** Client selectedDeck never transferred to server game state  
**Status:** PENDING - Not yet implemented

### Bug 2: Players cannot select their starting 6 unit cards (3 active + 3 benched)
**Problem:** Starting unit selection UI never appears  
**Root Cause:** `App.tsx` routes PRE_GAME to 'game' screen instead of 'pregame' screen  
**Evidence:** `StartingUnitSelection` component exists but never rendered  
**Missing Integration:** No server intent handling for team selection  
**Status:** FIXED - App.tsx routing corrected on April 7, 2026

### Integration Flow Issues
**Complete Broken Flow:**
1. Lobby phase works (players ready, host starts game) 
2. Server creates game state with PRE_GAME phase
3. ~~Client receives game state and routes to wrong screen~~ FIXED
4. No card draw happens
5. No starting unit selection triggered

### Files Requiring Changes
- ~~`packages/client/src/App.tsx`~~ - **FIXED**: PRE_GAME phase now routes to 'pregame' screen
- `packages/shared/src/engines/game/index.ts` - Add deck initialization and card drawing
- `packages/server/src/resolver/action-resolver.ts` - Implement pre-game intent handling
- `packages/client/src/store/game-store.ts` - Add deck transfer mechanism
- `packages/server/src/gateway/websocket-gateway.ts` - Add team selection events
- `packages/client/src/network/socket-client.ts` - Add team selection communication

**Priority:** HIGH - Remaining issues prevent game functionality

## Phase 2+3: Starting Card Placement and Multiplayer Synchronization
- **Status**: Completed successfully on April 7, 2026
- **Test Results**: All 30 placement tests pass (26 shared + 4 client)
- **TypeScript**: Zero errors
- **Issues**: None encountered
- **Implementation**: Complete placement system with active units on board, bench units in reserve area, server-authoritative placement, client synchronization
- **Multiplayer**: Full synchronization across all clients with deterministic positioning

## Phase 9: Starting Card Visibility and Field Placement
- **Status**: Completed successfully
- **Test Results**: All 12 tests for starting card placement pass
- **TypeScript**: Zero errors
- **Issues**: None encountered
- **Implementation**: Active cards placed centered on player's half of board, reserve cards positioned outside board
- **Multiplayer**: Positions synchronized correctly across clients

## Phase 8: Initial Hand Draw & Starting Unit Selection
- **Status**: Completed successfully
- **Test Results**: All 289 tests pass (138 shared + 151 client + 21 server)
- **TypeScript**: Zero errors
- **Issues**: None encountered

## Phase 7: Grid Resize (30×30) & Hover Stats
- **Status**: Completed successfully
- **Test Results**: All 283 tests pass (120 shared + 142 client + 21 server)
- **TypeScript**: Zero errors
- **Issues**: None encountered

## Previous Phases
No errors logged.

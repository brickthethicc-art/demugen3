# Multiplayer Fix Prompt: 3-4 Player Support

## Problem Summary

The game currently has 4-player integration set up (MAX_PLAYERS = 4, MIN_PLAYERS = 2), but only 2-player (1v1) games work correctly. In 3-player (1v1v1) and 4-player (1v1v1v1) games, players 3-4 are unable to move their units or perform any actions. This is a free-for-all game mode that needs to support 2-4 players.

## Current State

### Configuration
- **MAX_PLAYERS**: 4 (defined in `packages/shared/src/types/game.ts`)
- **MIN_PLAYERS**: 2 (defined in `packages/shared/src/types/game.ts`)
- Lobby system correctly allows 2-4 players to join
- Game creation accepts 2-4 players

### Symptoms
- 2-player games work correctly
- In 3-4 player games, players 3-4 cannot:
  - Move units
  - Use abilities
  - Attack
  - Perform any game actions
- These players likely receive "Not your turn" errors

## Key Files to Investigate

### 1. Turn Validation Logic
**File**: `packages/shared/src/engines/turn/index.ts`
- Lines 134-137: `processMove` checks `currentPlayer.id !== playerId`
- Lines 201-204: `processAbility` checks `currentPlayer.id !== playerId`
- Lines 329-332: `processAttack` checks `currentPlayer.id !== playerId`
- Lines 457-464: `endTurn` rotates using `(state.currentPlayerIndex + 1) % state.players.length`

**File**: `packages/server/src/resolver/action-resolver.ts`
- Lines 98-102: Server-side intent validation checks `currentPlayer.id !== playerId`

**File**: `packages/client/src/hooks/useGameActions.ts`
- Lines 11-13: Client-side `isMyTurn` calculation uses `gameState.players[gameState.currentPlayerIndex]?.id === playerId`

### 2. Player Initialization and Ordering
**File**: `packages/shared/src/engines/starting-placement/match-init.ts`
- Lines 27-41: Players are sorted by ID for consistent ordering
- `currentPlayerIndex` is recalculated after sorting
- This sorting might cause index mismatches

### 3. Player Color Assignment
**File**: `packages/shared/src/engines/player-color/index.ts`
- Supports 4 colors (red, blue, yellow, green)
- Maps player index 0-3 to colors

### 4. Spawn Position Logic
**File**: `packages/shared/src/engines/starting-placement/index.ts`
- Lines 34-80: `getSpawnPositions` uses `playerIndex % 4` to determine side
- Supports 4 sides (bottom, top, left, right)

### 5. Lobby System
**File**: `packages/server/src/lobby/lobby-manager.ts`
- Lines 38-40: Enforces MAX_PLAYERS limit
- Lines 112-114: Requires MIN_PLAYERS to start

## Potential Root Causes

### Hypothesis 1: Player Index Mismatch After Sorting
The `initializeMatchUnits` function in `match-init.ts` sorts players by ID and recalculates `currentPlayerIndex`. If the sort changes the player order, the `currentPlayerIndex` might point to the wrong player after sorting.

**Check**: After sorting, does `currentPlayerIndex` correctly point to the player who should have the turn?

### Hypothesis 2: Turn Rotation Not Handling 3-4 Players Correctly
The `endTurn` function uses modulo arithmetic: `(state.currentPlayerIndex + 1) % state.players.length`. This should work for any number of players, but there might be an issue with how the initial `currentPlayerIndex` is set or how eliminated players are skipped.

**Check**: In a 3-player game, does the turn correctly rotate 0→1→2→0? In a 4-player game, does it rotate 0→1→2→3→0?

### Hypothesis 3: Client-Side Turn Calculation Issue
The client calculates `isMyTurn` using `gameState.players[gameState.currentPlayerIndex]?.id === playerId`. If the server's `currentPlayerIndex` doesn't match the client's player array ordering, this check will fail.

**Check**: Is the player array ordering consistent between server and client for all player counts?

### Hypothesis 4: Game State Initialization Issue
When creating the initial game state, the `currentPlayerIndex` might be hardcoded to 0 or not properly initialized for 3-4 player scenarios.

**Check**: Does `createGame` in `packages/shared/src/engines/game/index.ts` properly set the initial `currentPlayerIndex`?

## Investigation Steps

1. **Add Debug Logging**: Add console logs to track:
   - Player IDs and indices at game start
   - Player order before and after sorting in `initializeMatchUnits`
   - `currentPlayerIndex` before and after sorting
   - Turn rotation values in `endTurn`
   - "Not your turn" errors with full context (playerId, currentPlayerIndex, currentPlayer.id)

2. **Test Scenarios**:
   - Create a 3-player lobby and start a game
   - Create a 4-player lobby and start a game
   - For each, check:
     - Which player has the turn initially?
     - Can player 0 perform actions?
     - Can player 1 perform actions?
     - Can player 2 perform actions?
     - Can player 3 perform actions (in 4-player)?
     - Does the turn rotate correctly?

3. **Verify Player Array Consistency**:
   - Check if the player array order is the same on server and client
   - Verify that sorting doesn't cause desynchronization

4. **Check Turn Rotation Logic**:
   - Manually trace through `endTurn` for 3 and 4 player scenarios
   - Verify the modulo arithmetic works correctly
   - Check if eliminated player skipping logic works with 3-4 players

## Expected Fix

The fix should ensure that:
1. Player indices are correctly maintained through game initialization
2. `currentPlayerIndex` always points to the correct player regardless of player count
3. Turn rotation works correctly for 2, 3, and 4 player games
4. Client and server player array ordering is consistent
5. All players can perform actions when it's their turn

## Testing Strategy

After implementing the fix:
1. Test 2-player game (should still work)
2. Test 3-player game (players 0, 1, 2 should all be able to take turns)
3. Test 4-player game (players 0, 1, 2, 3 should all be able to take turns)
4. Verify turn rotation continues correctly through multiple rounds
5. Test that eliminated players are skipped correctly in 3-4 player games

## Additional Notes

- The game uses socket.io for real-time communication
- Game state is sanitized per player before sending to clients
- There is a 4-player test file: `packages/shared/__tests__/engines/turn-4player.test.ts` - review this for expected behavior
- The spawn position logic already supports 4 players with different board sides

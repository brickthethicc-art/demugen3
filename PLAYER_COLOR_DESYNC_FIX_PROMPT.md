# Player Color Desync Fix

## Problem Description
When a 4-player game starts, the colors displayed in the side menu (top-right player list) are desynced from the actual player colors. Player 1 is not controlling red, and the color assignments don't match the server-side color mapping.

## Root Cause Analysis
The client-side `GameHUD.tsx` has TWO different color mapping mechanisms that are inconsistent with the server-side color assignment:

### Server-Side Color Assignment (Authoritative)
Located in `packages/shared/src/engines/player-color/index.ts`:
```typescript
export const PLAYER_COLOR_MAP: Record<number, PlayerColor> = {
  0: 'red',
  1: 'blue',
  2: 'yellow',
  3: 'green',
};
```
This assigns colors based on player index in the `gameState.players` array: index 0=red, 1=blue, 2=yellow, 3=green.

### Client-Side Issues in `packages/client/src/components/GameHUD.tsx`

**Issue 1: PlayerList component (lines 265-335)**
- Uses `getPlayerColor()` function that reads from `player.team.activeUnits[0].color` (line 281)
- This is incorrect - should read from `player.color` which is the authoritative field assigned by the server
- Falls back to blue if the unit color is not found

**Issue 2: Top-right player display (lines 421-457)**
- Uses a hardcoded `positionColors` array: `['#ef4444', '#6366f1', '#22c55e', '#f59e0b']` (line 423)
- This maps to: red, blue, green, yellow
- **BUG**: Index 2 should be yellow (#f59e0b) not green (#22c55e)
- This doesn't match the server's PLAYER_COLOR_MAP which has yellow at index 2

## Required Changes

### 1. Fix PlayerList Component (lines 265-335)
Replace the `getPlayerColor` function to use `player.color` instead of reading from units:

```typescript
// Remove this function:
const getPlayerColor = (player: any) => {
  const firstUnit = player.team.activeUnits[0];
  if (firstUnit && firstUnit.color && colorMap[firstUnit.color]) {
    return colorMap[firstUnit.color];
  }
  return colorMap.blue;
};

// Replace with:
const getPlayerColor = (player: any) => {
  if (player.color && colorMap[player.color]) {
    return colorMap[player.color];
  }
  return colorMap.blue; // default fallback
};
```

### 2. Fix Top-Right Player Display (lines 421-457)
Update the `positionColors` array to match the server's PLAYER_COLOR_MAP:

```typescript
// Change from:
const positionColors = ['#ef4444', '#6366f1', '#22c55e', '#f59e0b']; // red, blue, green, yellow

// To:
const positionColors = ['#ef4444', '#6366f1', '#f59e0b', '#22c55e']; // red, blue, yellow, green
```

### 3. (Optional but Recommended) Import Shared Color Utilities
For better consistency, consider importing and using the shared color mapping utilities:
```typescript
import { PLAYER_COLOR_MAP } from '@mugen/shared/src/engines/player-color/index.js';
```

Then create a color mapping that aligns with the shared definition.

## Verification Steps
1. Start a 4-player game
2. Verify that player at index 0 (first in players array) shows red
3. Verify that player at index 1 shows blue
4. Verify that player at index 2 shows yellow
5. Verify that player at index 3 shows green
6. Check that the current turn indicator (pulsing dot) aligns with the correct colored player
7. Verify both the PlayerList (if used) and top-right display show consistent colors

## Related Files
- `packages/client/src/components/GameHUD.tsx` (primary fix location)
- `packages/shared/src/engines/player-color/index.ts` (reference for correct color mapping)
- `packages/shared/src/engines/starting-placement/match-init.ts` (where colors are assigned during initialization)

## Context from Previous Fixes
The memory system indicates that `initializeMatchUnits` in `match-init.ts` now preserves existing player order instead of sorting by player ID. This keeps `currentPlayerIndex` stable across PRE_GAME → IN_PROGRESS transitions. The color assignment happens at line 30 with `assignPlayerColors(gameState)`, which assigns colors based on the stable player index. The client must respect this index-based color assignment.

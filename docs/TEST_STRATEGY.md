# TEST STRATEGY — Active Unit Visibility Fix

## Date: April 7, 2026
## Status: IN PROGRESS

---

## Overview

This document covers the test plan for fixing the critical bug where **no active units appear on the board at game start** for any player (1–4).

### Root Cause

`action-resolver.ts` `SELECT_TEAM` / `LOCK_TEAM` intents corrupt the `PlayerTeam` type:
- Replaces `{ activeUnits, reserveUnits, locked }` with `{ unitCardIds, locked }`
- `placeStartingUnits()` then fails because `player.team.activeUnits` is undefined
- Result: `player.units` remains `[]` → nothing renders

---

## Test Categories

### 1. Active Unit Visibility (Shared Engine)

| Test | Purpose | Expected |
|------|---------|----------|
| Each player has exactly 3 active units after placement | Validates placement engine | 3 units per player with non-null positions |
| Units occupy valid grid positions | Validates bounds checking | All positions within board dimensions |
| Placement is deterministic | Validates sync safety | Same input → same output every time |
| 2-player placement on opposite sides | Validates multi-player spacing | Player 0 left side, Player 1 right side |
| 4-player placement | Validates 4-player support | All 4 players get 3 units each |

### 2. Multiplayer Sync (Server Integration)

| Test | Purpose | Expected |
|------|---------|----------|
| Server sends correct state after placement | End-to-end placement flow | All players' units in broadcast state |
| All clients receive identical unit positions | Broadcast consistency | Same positions across all client views |
| SELECT_TEAM intent stores proper PlayerTeam | Root cause regression test | `activeUnits` and `reserveUnits` arrays preserved |
| LOCK_TEAM intent triggers placement when all locked | Integration test | Phase transitions to IN_PROGRESS with units placed |

### 3. Pre-game Selection Integrity

| Test | Purpose | Expected |
|------|---------|----------|
| Active vs bench split is correct (3+3) | Validates split logic | Exactly 3 active, 3 reserve |
| Team structure preserved through intent pipeline | Regression for root cause | `PlayerTeam` interface intact after SELECT/LOCK |
| Exactly 3 active units enforced | Validation boundary | Rejects 0, 1, 2, 4+ active units |

### 4. Edge Cases

| Test | Purpose | Expected |
|------|---------|----------|
| Missing player data | Graceful failure | Returns error, no crash |
| Duplicate unit IDs across players | ID collision handling | Each player's units placed independently |
| Invalid team (0 active units) | Validation | Error returned, game stays in PRE_GAME |
| Partial lock (only some players locked) | Premature transition prevention | Game stays in PRE_GAME |

### 5. Client Rendering (Store)

| Test | Purpose | Expected |
|------|---------|----------|
| setGameState extracts activeUnits for ALL players | Store sync | `activeUnits` populated from server state |
| setGameState extracts benchUnits | Store sync | `benchUnits` populated from `team.reserveUnits` |
| gameState with placed units → store reflects them | End-to-end | Store units match server broadcast |

---

## Test File Locations

- `packages/shared/__tests__/active-unit-visibility.test.ts` — Core placement + visibility tests
- `packages/shared/__tests__/server-placement-integration.test.ts` — Existing integration tests (updated)
- `packages/client/__tests__/store/game-store.test.ts` — Existing store tests (updated)

---

## Run Command

```bash
pnpm --filter @mugen/shared test
pnpm --filter @mugen/server test
pnpm --filter @mugen/client test
```

---

## Success Criteria

- [ ] All tests pass after implementation
- [ ] Each player (1–4) has exactly 3 active units on board at game start
- [ ] Units render as light red squares at correct grid positions
- [ ] Server broadcasts complete state with all players' units
- [ ] Client store reflects all players' active units, not just local player

# Phase 7 — Grid Resize (30×30) & Hover Card Stats Display

## Overview

Phase 7 introduces two changes:

1. **Grid Resize**: Board dimensions change from 8×8 to 30×30
2. **Hover Stats Display**: Hovering a unit on the board shows its full stats on the left side of the screen

## Feature 1: Grid Resize to 30×30

### Scope

- Update `DEFAULT_BOARD_WIDTH` and `DEFAULT_BOARD_HEIGHT` from 8 to 30
- All board engine logic (placement, movement, bounds checking) already handles arbitrary sizes via parameterized width/height — no engine code changes needed
- Update all tests that hardcode 8×8 assumptions
- Update Phaser canvas dimensions in `GameBoard.tsx`
- Turn test fixtures: player 2 starting positions move from y:7 to y:29

### Affected Files

- `packages/shared/src/types/board.ts` — constants
- `packages/shared/__tests__/engines/board.test.ts` — boundary tests
- `packages/shared/__tests__/engines/turn.test.ts` — player 2 positions
- `packages/shared/__tests__/factories.ts` — uses DEFAULT constants (auto-adapts)
- `packages/client/src/components/GameBoard.tsx` — canvas dimensions
- `packages/client/src/scenes/GameScene.ts` — CELL_SIZE may need adjustment
- `packages/client/__tests__/store/game-store.test.ts` — mock board dimensions

### Business Logic Verification

The board engine functions are already parameterized:
- `createBoardState(width, height)` — works for any size
- `isInBounds(board, pos)` — uses `board.width`/`board.height`
- `moveUnit`, `placeUnit`, `removeUnit` — all delegate to `isInBounds`
- `getValidMoves` — iterates within movement range, checks bounds

No engine code changes needed. Only constants and test fixtures.

## Feature 2: Hover Card Stats Display

### Requirements

- When hovering over a unit on the board, display its stats on the left side
- Stats: HP, ATK, Movement, Range, Abilities, Cost
- Display appears on hover, disappears on unhover
- Must work for any player's units (not just your own)
- Pure logic for unit resolution and stats formatting

### Architecture

**Shared (pure logic):**
- `resolveHoveredUnit(state: GameState, pos: Position): UnitInstance | null`
  - Given a game state and grid position, find the UnitInstance occupying that cell

**Client logic (pure function):**
- `getUnitDisplayStats(unit: UnitInstance): UnitDisplayStats`
  - Extracts display-friendly stats from a UnitInstance

**Client store (Zustand):**
- Add `hoveredUnit: UnitInstance | null` to GameStore
- Add `setHoveredUnit(unit)` / `clearHoveredUnit()` actions

**Client UI:**
- `GameScene.ts` — Add `pointermove` / `pointerout` events on grid to detect hovered cell
- `UnitStatsPanel.tsx` — React component rendering stats panel (left side, conditionally visible)
- Integrate into `GameHUD.tsx`

### Edge Cases

- Hovering empty cell → no panel
- Rapid hover/unhover → store updates are synchronous, no race conditions
- Hovering multiple units quickly → last hover wins (no debounce needed for Zustand)
- Partially visible cards → panel always renders at fixed position, not card-relative

## Test Plan

### Grid Resize Tests (shared)

| Test | Input | Expected |
|------|-------|----------|
| Default board creates 30×30 | `createBoardState()` | width=30, height=30, 30 rows, 30 cols |
| Out of bounds at (30,30) | `placeUnit(board, id, {x:30,y:30})` | Error: out of bounds |
| Valid placement at (29,29) | `placeUnit(board, id, {x:29,y:29})` | Success |
| Move to boundary edge | From (28,29) to (29,29) | Success |
| Move out of bounds (29→30) | From (29,29) to (30,29) | Error |
| Corner valid moves | Unit at (0,0) with movement 2 | All moves within [0,29] |
| Player 2 at far side (y:29) | Turn test fixture | Units placed at y:29 |

### Hover Logic Tests (shared)

| Test | Input | Expected |
|------|-------|----------|
| Hover occupied cell | pos with unit | Returns UnitInstance |
| Hover empty cell | pos without unit | Returns null |
| Hover out of bounds | pos {x:-1,y:0} | Returns null |

### Hover Display Tests (client)

| Test | Input | Expected |
|------|-------|----------|
| getUnitDisplayStats extracts all fields | UnitInstance | { hp, maxHp, atk, movement, range, abilityName, abilityDesc, cost } |
| Store setHoveredUnit | UnitInstance | hoveredUnit set |
| Store clearHoveredUnit | — | hoveredUnit null |
| Store reset clears hoveredUnit | — | hoveredUnit null |

## Phase Gating

- **Prerequisite**: Phase 6 complete (all 143 tests passing)
- **Entry criteria**: Documentation written, test plan approved
- **Exit criteria**: All new + existing tests passing, zero TS errors

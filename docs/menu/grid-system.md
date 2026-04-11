# Grid System — 30×30 Board

## Overview

The Mugen game board is a 30×30 grid. Each cell can hold at most one unit. All coordinates are zero-indexed: `(0,0)` to `(29,29)`.

## Constants

- `DEFAULT_BOARD_WIDTH = 30` — defined in `packages/shared/src/types/board.ts`
- `DEFAULT_BOARD_HEIGHT = 30` — defined in `packages/shared/src/types/board.ts`

## Data Structures

```typescript
interface Position { x: number; y: number; }
interface GridCell { position: Position; occupantId: string | null; }
interface BoardState { width: number; height: number; cells: GridCell[][]; }
```

## Board Engine (`packages/shared/src/engines/board/index.ts`)

| Function | Purpose |
|----------|---------|
| `createBoardState(width?, height?)` | Creates empty grid; defaults to 30×30 |
| `placeUnit(board, unitId, pos)` | Places unit on empty, in-bounds cell |
| `removeUnit(board, pos)` | Removes unit from occupied cell |
| `moveUnit(board, from, to, range)` | Moves unit within Manhattan distance |
| `getValidMoves(board, pos, range)` | Returns all reachable empty cells |
| `getUnitAt(board, pos)` | Returns occupant ID or null |
| `getUnitsForPlayer(board, prefix)` | Returns all units matching ID prefix |

## Bounds Checking

All mutating functions validate `0 ≤ x < width` and `0 ≤ y < height`. Out-of-bounds operations return `Result<..., error>`.

## Rendering

- **Phaser.js** renders the grid with `CELL_SIZE = 24px` (total canvas: 720×720)
- Scale mode `FIT` + `CENTER_BOTH` adapts to viewport
- Grid lines: `0x3a3a5a` at 40% opacity
- Cell fill: `0x2a2a4a` at 60% opacity

## Player Starting Positions

- Player 1: top row (y = 0)
- Player 2: bottom row (y = 29)
- Players 3–4: additional rows as needed

## History

- **Phase 1–6**: Board was 8×8 (`DEFAULT_BOARD_WIDTH = 8`)
- **Phase 7**: Resized to 30×30 — constants updated, all tests updated, CELL_SIZE reduced from 64px to 24px

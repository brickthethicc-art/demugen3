# UI Hover Stats Display

## Overview

When the player hovers over a unit on the game board, a stats panel appears on the left side showing the unit's full details. The panel disappears when the mouse leaves the board or hovers over an empty cell.

## Architecture

### Shared Logic (pure)

`packages/shared/src/engines/board/hover.ts`:
```typescript
export function resolveHoveredUnit(
  state: GameState,
  pos: Position
): UnitInstance | null
```
- Given a game state and grid position, finds the UnitInstance occupying that cell
- Returns null for empty cells or out-of-bounds positions

### Client Logic (pure)

`packages/client/src/logic/hover-logic.ts`:
```typescript
export interface UnitDisplayStats {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  movement: number;
  range: number;
  cost: number;
  abilityName: string;
  abilityDescription: string;
  abilityCost: number;
  abilityType: AbilityType;
}

export function getUnitDisplayStats(unit: UnitInstance): UnitDisplayStats
```
- Extracts display-friendly stats from a UnitInstance
- Separates current HP from max HP for bar rendering
- Includes ability details and cost

### State Management (Zustand)

`packages/client/src/store/game-store.ts`:
```typescript
interface GameStore {
  hoveredUnit: UnitInstance | null;
  setHoveredUnit: (unit: UnitInstance | null) => void;
  clearHoveredUnit: () => void;
}
```

### UI Components

#### UnitStatsPanel
`packages/client/src/components/UnitStatsPanel.tsx`:
- Renders stats panel on left side when `hoveredUnit` is non-null
- Fixed position: `left-0 top-20 w-56`
- Shows HP bar, ATK/MOV/RNG/Cost grid, ability details
- Non-interactive (`pointer-events-none`)

#### GameScene Events
`packages/client/src/scenes/GameScene.ts`:
- `pointermove` on canvas: calculates grid cell, updates `hoveredUnit` via store
- `pointerout` on scene: clears `hoveredUnit`
- Debounces repeated hovers over same cell to avoid redundant updates

## Performance Considerations

- Hover resolution is O(1) for bounds check + O(1) for board cell lookup + O(N) for unit search (N = total units, typically < 24)
- Store updates are synchronous via Zustand
- No network calls; all logic runs locally
- No debouncing needed beyond same-cell optimization

## Edge Cases Handled

- **Empty cell**: `clearHoveredUnit()` called
- **Out of bounds**: `clearHoveredUnit()` called
- **Rapid hover/unhover**: Last hover wins; no race conditions
- **Multiple units in same cell**: Impossible by board engine invariant
- **Dead units**: Not rendered on board, so not hoverable
- **Game state null**: Clears hover

## Visual Design

- Panel: `bg-mugen-surface/95` with backdrop blur
- HP bar: Color-coded (green > 50%, yellow 25-50%, red < 25%)
- Icons: Lucide React (Heart, Swords, Move, Target, Zap, Coins)
- Typography: Truncated name, monospace numbers
- Shadow and border for depth

## Integration

The panel is rendered inside `GameHUD.tsx` alongside the main HUD elements. It appears above the unit list on the right side to avoid overlap.

# Deck System - Initial Hand & Starting Units

## Overview

The deck system manages player decks, initial hand drawing, and starting unit selection for game initialization.

## Deck Structure

```typescript
interface Deck {
  cards: Card[]; // 16 cards total (mix of units and sorceries)
}

interface Hand {
  cards: Card[]; // 4 cards drawn from deck
}
```

## Constants

- `MAX_DECK_SIZE = 16` - Total cards in deck
- `MAX_HAND_SIZE = 4` - Cards drawn initially
- `MAX_TEAM_COST = 40` - Cost limit for starting units
- `ACTIVE_UNIT_COUNT = 3` - Units placed on board
- `RESERVE_UNIT_COUNT = 3` - Units placed in reserve

## Initial Hand Draw

### Function: `drawInitialHand(deck: Deck)`

**Purpose**: Draw 4 cards from deck for starting hand

**Logic**:
1. Validate deck has at least 4 cards
2. Extract first 4 cards as hand
3. Return remaining 12 cards as updated deck

**Error Cases**:
- Deck has fewer than 4 cards: returns error "insufficient cards"

**Usage**:
```typescript
const result = drawInitialHand(playerDeck);
if (result.ok) {
  const { hand, remainingDeck } = result.value;
  // Update player state
}
```

## Starting Unit Selection

### Function: `validateStartingSelection(units: UnitCard[])`

**Purpose**: Validate 6-unit selection meets game rules

**Validation Rules**:
- Exactly 6 units required
- Total cost must be < 40
- All cards must be units (no sorceries)

**Error Messages**:
- Wrong count: "Must select exactly 6 units, got X"
- Cost exceeded: "Total cost X cost exceeds 40"
- Invalid type: "All selected cards must be units (no sorceries)"

### Function: `placeStartingUnits(units: UnitCard[], player: PlayerState)`

**Purpose**: Place selected units into player's active and reserve slots

**Placement Logic**:
- First 3 units become active units on board (positions 0,1,2 at y=0)
- Last 3 units become reserve units (no position)
- Creates UnitInstance objects with full state

**UnitInstance Creation**:
```typescript
{
  card: UnitCard,
  currentHp: unit.hp,
  position: index < 3 ? {x: index, y: 0} : null,
  ownerId: player.id,
  hasMovedThisTurn: false,
  hasUsedAbilityThisTurn: false,
  hasAttackedThisTurn: false,
  combatModifiers: []
}
```

## Game Flow Integration

1. **Pre-Game**: Player selects deck
2. **Unit Selection**: Player chooses 6 units under cost limit
3. **Validation**: System validates selection
4. **Placement**: Units placed as active/reserve
5. **Hand Draw**: 4 cards drawn from remaining deck
6. **Game Start**: Turn 1 begins

## Client Integration

### Store State
```typescript
interface GameStore {
  startingUnits: UnitCard[];
  setStartingUnits: (units: UnitCard[]) => void;
  confirmStartingUnits: () => void;
}
```

### UI Components
- `StartingUnitSelection.tsx` - Main selection interface
- Shows available units from selected deck
- Displays selection count and cost total
- Validates selection in real-time
- Confirms and transitions to game

## Error Handling

All functions return `Result<T, string>` for consistent error handling:
- Success: `{ ok: true, value: T }`
- Error: `{ ok: false, error: string }`

## Testing Coverage

- Hand draw with various deck sizes
- Unit selection validation (count, cost, type)
- Unit placement and state creation
- UI state updates and interactions
- Edge cases and error conditions

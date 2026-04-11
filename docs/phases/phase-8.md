# Phase 8 - Initial Hand Draw & Starting Unit Selection

## Overview

Phase 8 implements the game initialization flow where players draw their starting hand and select 6 starting units (3 active + 3 benched) before the first turn begins.

## Feature 1: Initial Hand Draw

### Requirements
- Draw 4 cards from player's selected deck at game start
- Cards must come from the player's deck (16 cards total)
- Hand must be fully populated and visible in UI
- Remaining cards stay in deck for future draws

### Business Logic
- `drawInitialHand(deck: Deck): { hand: Hand; remainingDeck: Deck }`
- Validate deck has at least 4 cards
- Remove top 4 cards from deck
- Create hand with those cards
- Return updated hand and remaining deck

## Feature 2: Starting Unit Selection

### Requirements
- Each player selects exactly 6 unit cards from their deck
- Total cost of selected units must be < 40
- 3 units placed as active (on board)
- 3 units placed as benched (reserve/off-board)
- Selection must be validated before game start

### Business Logic
- `validateStartingSelection(units: UnitCard[]): Result<boolean, Error>`
  - Check exactly 6 units
  - Check total cost < 40
  - Check all cards are units (no sorceries)
- `placeStartingUnits(units: UnitCard[], playerState: PlayerState): PlayerState`
  - Place first 3 as active on board (positions configurable)
  - Place next 3 as benched in reserve
  - Update player state

## Feature 3: Game Start Flow

### Sequence
1. Player joins lobby with selected deck
2. Game initialization triggers
3. Player selects 6 starting units from deck
4. System validates selection (cost < 40, exactly 6 units)
5. Place 3 active units on board, 3 in reserve
6. Draw initial hand of 4 cards from remaining deck
7. Turn 1 begins

### Integration Points
- Extend PreGameManager to handle unit selection
- Update GameEngine to initialize with starting units
- Modify client UI for unit selection screen
- Maintain multiplayer synchronization

## Constraints & Validation

### Unit Selection Rules
- Exactly 6 units required
- Total cost must be < 40
- Only UnitCard types allowed (no SorceryCard)
- Positions: 3 active (board), 3 benched (reserve)

### Error Handling
- Insufficient cards in deck for hand draw
- Invalid unit selection (count, cost, type)
- Duplicate unit selections
- Network synchronization issues

## Test Plan

### Initial Hand Tests
- Draw 4 cards from 16-card deck
- Draw from empty deck (error)
- Draw preserves deck order
- Hand size limit enforcement

### Unit Selection Tests
- Valid 6-unit selection under cost
- Selection over cost limit (error)
- Wrong number of units (error)
- Non-unit cards in selection (error)

### Integration Tests
- Complete game start flow
- Multiplayer synchronization
- UI state updates
- Edge cases and error recovery

## Phase Gating

- **Prerequisite**: Phase 7 complete (30×30 grid + hover stats)
- **Entry criteria**: Documentation written, test plan approved
- **Exit criteria**: All tests passing, zero TS errors, UI functional

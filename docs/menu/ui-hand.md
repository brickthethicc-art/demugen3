# UI Hand - Starting Unit Selection Interface

## Overview

The starting unit selection UI allows players to choose 6 units from their deck before the game begins, with real-time validation and visual feedback.

## Component: StartingUnitSelection

### Location
`packages/client/src/components/StartingUnitSelection.tsx`

### Purpose
- Display available units from selected deck
- Allow selection of exactly 6 units
- Show real-time cost calculation and validation
- Preview active/reserve unit placement
- Confirm selection and transition to game

## UI Layout

### Header Section
- Title: "Select 6 Starting Units"
- Selection status: Selected count (X / 6)
- Cost indicator: Total cost (X / 40)
- Confirm button (enabled/disabled based on validation)

### Unit Grid
- Grid layout: 2-4 columns responsive
- Each unit card shows:
  - Name and cost
  - ATK/HP stats
  - Movement/Range
  - Ability name
  - Selection indicator

### Selection Preview
- Bottom section showing selected units
- Active/Reserve labels for placement
- Visual confirmation of selection

## State Management

### Store Integration
```typescript
interface GameStore {
  startingUnits: UnitCard[];
  setStartingUnits: (units: UnitCard[]) => void;
  confirmStartingUnits: () => void;
}
```

### Real-time Validation
- Selection count limit (6 units max)
- Cost limit (< 40 LP)
- Visual feedback for invalid selections
- Error messages for validation failures

## Interaction Patterns

### Unit Selection
- **Click to select**: Add unit to selection if under limit
- **Click to deselect**: Remove unit from selection
- **Visual feedback**: Border highlight and "SELECTED" label
- **Hover effects**: Border color change on hover

### Validation Feedback
- **Cost exceeded**: Red cost text, warning message
- **Too many units**: Error message, prevent further selection
- **Valid selection**: Green confirm button, enabled state

## Responsive Design

### Breakpoints
- **Mobile**: 2 columns
- **Tablet**: 3 columns  
- **Desktop**: 4 columns

### Typography
- Unit names: Truncate with ellipsis
- Stats: Small, readable font
- Costs: Monospace font for alignment

## Accessibility

### Keyboard Navigation
- Tab navigation through unit cards
- Enter/Space to select/deselect
- Focus indicators on interactive elements

### Screen Reader Support
- Semantic HTML structure
- ARIA labels for selection state
- Announced validation messages

## Error Handling

### Client-side Validation
- Duplicate selection prevention
- Cost limit enforcement
- Selection count limits

### User Feedback
- Toast messages for errors
- Visual state changes
- Disabled button states

## Integration Points

### App Routing
- Screen: 'pregame' maps to StartingUnitSelection
- Transition: 'pregame' -> 'game' on confirmation

### Game Flow
1. Player arrives with selected deck
2. Filter deck for unit cards only
3. Display selection interface
4. Validate selection on confirm
5. Transition to game screen

## Testing Coverage

### Component Tests
- Renders with correct units from deck
- Updates selection on click
- Shows correct cost calculations
- Enables/disables confirm button
- Calls store actions correctly

### Integration Tests
- Full selection flow
- Validation error handling
- Screen transitions
- State persistence

## Performance Considerations

### Optimization
- Efficient filtering of unit cards
- Minimal re-renders with React.memo
- Debounced validation if needed
- Lazy loading for large decks

### Memory Management
- Cleanup on unmount
- No memory leaks in event handlers
- Efficient state updates

# Visual Debug System Test Plan

## Overview
Test plan for implementing red square debug visualization, bench layout, and unified hover system for Mugen units.

## Test Structure

### 1. ACTIVE UNITS - RED SQUARE RENDERING

#### 1.1 Grid Cell Overlay Tests
- **Test**: Active units render as bright red squares
- **Expected**: Each unit occupies exact grid cell with bg-red-500 color
- **Verification**: Square alignment to grid coordinates
- **Edge Cases**: Multiple units in adjacent cells
- **Failure Mode**: Squares not visible or misaligned

#### 1.2 Hover Interaction Tests  
- **Test**: Hovering red square triggers state update
- **Expected**: `setHoveredCard(unit)` called on mouse enter
- **Expected**: `clearHoveredCard()` called on mouse leave
- **Verification**: State updates instantly on hover events
- **Edge Cases**: Rapid hover switching between units
- **Failure Mode**: Hover state not updating or delayed

### 2. BENCH UNITS - RIGHT SIDE UI

#### 2.1 Layout Tests
- **Test**: Bench units render vertically on right side
- **Expected**: Fixed position (right-0), flex column layout
- **Verification**: Units stack in selection order
- **Edge Cases**: Empty bench, full bench (6 units)
- **Failure Mode**: Units not visible or incorrectly positioned

#### 2.2 Hover Interaction Tests
- **Test**: Hovering bench unit triggers state update  
- **Expected**: Same hover handlers as active units
- **Verification**: `setHoveredCard(unit)` called with correct unit data
- **Edge Cases**: Hovering between active and bench units rapidly
- **Failure Mode**: Hover not working on bench units

### 3. HOVER PANEL - LEFT SIDE DISPLAY

#### 3.1 State Binding Tests
- **Test**: Panel displays data from `hoveredCard` state
- **Expected**: Panel updates immediately when state changes
- **Verification**: Shows null state when no hover
- **Edge Cases**: State updates during rapid hover
- **Failure Mode**: Panel not updating or showing stale data

#### 3.2 Card Data Display Tests
- **Test**: Panel shows complete card information
- **Expected**: HP, ATK, Movement, Range, Ability, Cost
- **Verification**: All fields display correct values
- **Edge Cases**: Missing card data, invalid card types
- **Failure Mode**: Incomplete or incorrect data display

### 4. UNIFIED HOVER STATE MANAGEMENT

#### 4.1 Zustand Store Tests
- **Test**: Store manages `hoveredCard` correctly
- **Expected**: `setHoveredCard(card)` and `clearHoveredCard()` work
- **Verification**: State persists across component updates
- **Edge Cases**: Concurrent hover attempts, null handling
- **Failure Mode**: State corruption or race conditions

#### 4.2 Cross-Component Tests
- **Test**: Hover works consistently across all unit types
- **Expected**: Active units, bench units use same hover logic
- **Verification**: No duplicate hover state or conflicts
- **Edge Cases**: Hovering multiple units simultaneously
- **Failure Mode**: Inconsistent hover behavior

## Implementation Test Order

### Phase 1: State Management
1. Add `hoveredCard` to Zustand store
2. Test state setters/getters
3. Verify state persistence

### Phase 2: Active Units
1. Replace circle rendering with red squares
2. Add hover event handlers
3. Test hover state updates

### Phase 3: Bench Units
1. Create right-side bench component
2. Implement vertical layout
3. Add hover handlers
4. Test bench hover interactions

### Phase 4: Hover Panel
1. Create left-side panel component
2. Bind to `hoveredCard` state
3. Display card data
4. Test state-driven updates

### Phase 5: Integration
1. Test rapid hover switching
2. Verify no state conflicts
3. Test edge cases and error states

## Success Criteria

### Visual Requirements
- [ ] Active units visible as bright red squares
- [ ] Bench units visible on right side
- [ ] Hover panel visible on left side
- [ ] All elements properly positioned

### Interaction Requirements  
- [ ] Hover triggers immediate state update
- [ ] Hover clears when mouse leaves
- [ ] Rapid hover switching works correctly
- [ ] No hover state conflicts

### Data Requirements
- [ ] Hover panel shows correct card data
- [ ] State updates propagate to UI
- [ ] Null hover state handled gracefully
- [ ] Error states don't break UI

## Failure Documentation

All failures must be logged in `ERROR_LOG.md` with:
- Test case identifier
- Expected vs actual behavior
- Root cause analysis
- Resolution steps

## Test Tools

- Vitest for unit tests
- React Testing Library for component tests  
- Manual visual verification for rendering
- Browser dev tools for state inspection

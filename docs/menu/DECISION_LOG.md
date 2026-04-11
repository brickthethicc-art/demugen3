# Decision Log

## DEC-022: Fix PlayerTeam Type Corruption in Action Resolver
- **Date**: 2026-04-07
- **Context**: `SELECT_TEAM` and `LOCK_TEAM` handlers in `action-resolver.ts` replaced the typed `PlayerTeam` with a loose `{ unitCardIds, locked }` object using unsafe `as any` casts, causing `placeStartingUnits()` to fail silently
- **Decision**: Extend `SelectTeamIntent` to carry full `activeUnits: UnitCard[]` and `reserveUnits: UnitCard[]`; fix both handlers to build proper `PlayerTeam` objects
- **Rationale**: Server must preserve the `PlayerTeam` interface through the entire intent pipeline; the root cause was type erasure via `as any`
- **Impact**: Critical — this was the root cause of "no units visible at game start"

## DEC-023: Quadrant-Based Starting Positions for 4 Players
- **Date**: 2026-04-07
- **Context**: `getStartingPositions()` assigned identical Y positions for players 0+2 and 1+3, causing cell occupancy collisions in 4-player games
- **Decision**: Divide board into quadrants — upper-left, upper-right, lower-left, lower-right — based on `playerIndex`
- **Rationale**: Guarantees no position collisions for up to 4 players with deterministic results
- **Algorithm**: `isLeftSide = playerIndex % 2 === 0`, `isUpperHalf = playerIndex < 2`

## DEC-024: Store activeUnits Contains ALL Players' Units
- **Date**: 2026-04-07
- **Context**: Zustand store `activeUnits` previously only held the local player's units, preventing components from accessing other players' units for rendering
- **Decision**: Change `setGameState` to populate `activeUnits` with `state.players.flatMap(p => p.units)` — all players' placed units
- **Rationale**: `GameScene.drawUnits` already iterates all players from `gameState.players`, but any component reading `activeUnits` should also see the full board state; `benchUnits` remains local-player only

## DEC-018: Server-Triggered Unit Placement Integration
- **Date**: 2026-04-07
- **Context**: Need to integrate placement logic with server's LOCK_TEAM intent handling
- **Decision**: Enhance server's LOCK_TEAM case to place units for all players when all teams are locked
- **Rationale**: Ensures placement happens automatically and consistently when game transitions to IN_PROGRESS
- **Implementation**: Added StartingPlacementEngine.placeStartingUnits calls in action-resolver.ts

## DEC-019: Client Store Reactive Updates for Placement
- **Date**: 2026-04-07
- **Context**: Client needs to react to placement updates and display active/bench units
- **Decision**: Enhanced game store setGameState to automatically update activeUnits and benchUnits
- **Rationale**: Provides reactive UI updates without manual state management
- **Implementation**: Added activeUnits and benchUnits to game store with automatic synchronization

## DEC-020: Deterministic Multiplayer Positioning Algorithm
- **Date**: 2026-04-07
- **Context**: All clients must see identical unit positions for multiplayer consistency
- **Decision**: Implement deterministic algorithm based on player index and board dimensions
- **Rationale**: Guarantees same results across all clients and prevents desynchronization
- **Algorithm**: Even-indexed players on left side, odd-indexed on right side, with mathematical centering

## DEC-021: TDD Approach for Placement System
- **Date**: 2026-04-07
- **Context**: Complex placement logic needs comprehensive testing
- **Decision**: Follow strict TDD - write failing tests first, then implement minimal logic to pass
- **Rationale**: Ensures all edge cases covered and provides regression protection
- **Result**: 30 tests created, all passing, with comprehensive coverage

## DEC-013: Active Card Placement Strategy
- **Date**: 2026-04-07
- **Context**: Need to position 3 active cards on player's side of board at game start
- **Decision**: Center active cards horizontally on player's half of board, positioned at front edge
- **Rationale**: Ensures fair positioning, visual clarity, and strategic starting positions

## DEC-014: Reserve Card Placement Outside Board
- **Date**: 2026-04-07
- **Context**: Need to position 3 benched cards visible but outside active play area
- **Decision**: Position reserve cards in designated reserve area outside board grid
- **Rationale**: Keeps reserve cards visible but clearly distinct from active units

## DEC-015: Pure Function Placement Logic
- **Date**: 2026-04-07
- **Context**: Placement logic needs to be testable and multiplayer-synchronized
- **Decision**: Implement placement as pure functions in shared package: getStartingPositions, getReservePositions, placeStartingUnits
- **Rationale**: Ensures deterministic behavior, testability, and multiplayer synchronization

## DEC-016: Horizontal Centering Algorithm
- **Date**: 2026-04-07
- **Context**: Active cards need to be centered horizontally on player's half
- **Decision**: Calculate center offset based on board width and number of active units
- **Rationale**: Provides balanced positioning regardless of board size

## DEC-017: Multiplayer Synchronization Approach
- **Date**: 2026-04-07
- **Context**: Starting positions must be consistent across all clients
- **Decision**: Server calculates placement using deterministic functions and broadcasts to all clients
- **Rationale**: Ensures state consistency and prevents desynchronization

## DEC-012: PRE_GAME Phase Routing Fix Implementation
- **Date**: 2026-04-07
- **Context**: PRE_GAME phase was routing to wrong screen, preventing StartingUnitSelection from appearing
- **Decision**: Separate PRE_GAME and IN_PROGRESS phase routing in App.tsx useEffect
- **Rationale**: PRE_GAME needs to show StartingUnitSelection, IN_PROGRESS needs GameScreen
- **Implementation**: Changed from combined condition to separate if-else branches
- **Status**: COMPLETED - Fix successfully implemented

## DEC-008: Game Start Investigation - TDD Approach
- **Date**: 2026-04-07
- **Context**: Cards not drawn and starting unit selection fails at game start
- **Decision**: Write failing tests first to document bugs before attempting fixes
- **Rationale**: TDD ensures exact failure modes are understood and provides regression protection

## DEC-009: Test Scope Limitation to Shared Package
- **Date**: 2026-04-07
- **Context**: Initial attempt to test server-side functions from shared package
- **Decision**: Limit tests to shared package functionality only
- **Rationale**: Avoid cross-package import complexity, focus on core engine issues

## DEC-010: Root Cause Classification as Integration Issues
- **Date**: 2026-04-07
- **Context**: Multiple interconnected issues discovered during investigation
- **Decision**: Classify as "Missing Integration Points" rather than individual bugs
- **Rationale**: Individual functions work correctly, but orchestration is missing

## DEC-011: Fix Priority Sequence
- **Date**: 2026-04-07
- **Context**: Multiple integration points need fixing
- **Decision**: Tackle in dependency order - routing first, then data flow, then intents
- **Rationale**: UI routing must work before users can interact with other fixes

## DEC-001: Extend existing Screen type rather than create separate router
- **Date**: 2026-04-07
- **Context**: App.tsx uses a `screen` state in Zustand to render screens via switch/case. Adding new screens (main-menu, deck-builder, card-library, deck-select) should extend this pattern rather than introducing react-router.
- **Decision**: Extend the `Screen` union type in `game-store.ts` and add cases in `App.tsx`.
- **Rationale**: Minimal disruption to existing architecture. The app is a single-page game; a full router is unnecessary overhead.

## DEC-002: Default screen changes from 'lobby' to 'main-menu'
- **Date**: 2026-04-07
- **Context**: Currently the app defaults to the lobby screen. With a main menu, the default must change.
- **Decision**: Change `initialState.screen` from `'lobby'` to `'main-menu'`.
- **Rationale**: Players should always start at the main menu.

## DEC-003: localStorage for deck persistence
- **Date**: 2026-04-07
- **Context**: Need persistent deck storage without backend changes.
- **Decision**: Use localStorage with key `mugen-saved-decks` for 3–5 deck slots.
- **Rationale**: Simple, no server changes needed. Works offline.

## DEC-005: Separate deck-store from game-store
- **Date**: 2026-04-07
- **Context**: Deck builder state (currentDeck, filters, activeSlot) is orthogonal to game state (gameState, lobbyPlayers, etc.).
- **Decision**: Create a separate `deck-store.ts` Zustand store rather than extending `game-store.ts`.
- **Rationale**: Separation of concerns. Deck builder state resets independently. Avoids bloating the game store.

## DEC-006: Card database in client package
- **Date**: 2026-04-07
- **Context**: Card definitions could live in `packages/shared` or `packages/client`.
- **Decision**: Place in `packages/client/src/data/cards.ts` for now.
- **Rationale**: Only the client needs the full card catalog for browsing. The server uses card IDs from game state. Can migrate to shared later if needed.

## DEC-007: Card Library uses local state, not Zustand
- **Date**: 2026-04-07
- **Context**: Card Library needs filter/search/view state. Could use a new Zustand store or local component state.
- **Decision**: Use local component state (useState) since the library is read-only and state doesn't persist between visits.
- **Rationale**: Simpler. No need for a store when state is ephemeral and single-component.

## DEC-004: Phaser mock in test setup
- **Date**: 2026-04-07
- **Context**: App routing tests import `App.tsx` which transitively imports Phaser via `GameScreen` → `GameBoard` → `GameScene`. Phaser requires canvas, which jsdom doesn't support.
- **Decision**: Add global Phaser mock in `__tests__/setup.ts` via `vi.mock('phaser')`.
- **Rationale**: Lightweight solution that doesn't require restructuring the import tree. Only affects test environment.

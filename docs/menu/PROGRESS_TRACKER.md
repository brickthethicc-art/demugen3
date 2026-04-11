# Progress Tracker

## Phase 1 — Main Menu + Navigation
- [x] Test plan written
- [x] Failing tests written (3 test files, 13 new tests)
- [x] Implementation complete
- [x] Tests passing (31/31 — 18 existing + 13 new)
- [x] Refactor complete (no refactoring needed — minimal implementation)
- [x] Documentation updated

## Phase 2 — Deck Builder Core
- [x] Card database created (42 Units, 22 Sorceries)
- [x] Pure logic functions: validateDeck, filterCards, getDeckStats, canAddCard
- [x] localStorage persistence: saveDeck, loadDeck, loadAllDecks, deleteDeck
- [x] Zustand deck-store with full add/remove/filter/save/load/reset
- [x] UI: DeckBuilderScreen with CardBrowser (left) + DeckPanel (right)
- [x] Component sub-modules: CardItem, CardTooltip
- [x] All 101 tests passing

## Phase 3 — Deck Selection Flow
- [x] Added `selectedDeck` to game-store
- [x] DeckSelectScreen: shows saved decks, select → lobby, build new → deck-builder
- [x] 12 new tests (4 store + 8 component)
- [x] All 113 tests passing

## Phase 4 — Card Library Browser
- [x] CardLibraryScreen: grid/list views, filters, search, card detail panel
- [x] 9 new tests
- [x] All 122 tests passing

## Phase 5 — Full Integration & Polish
- [x] 10 integration tests: full navigation flows, persistence, edge cases
- [x] All 132 tests passing (12 test files)
- [x] All 5 phases complete

## Phase 8 - Initial Hand Draw & Starting Unit Selection
- [x] Game initialization engine: drawInitialHand, validateStartingSelection, placeStartingUnits
- [x] Initial hand draw logic: 4 cards from deck, validation, order preservation
- [x] Starting unit validation: exactly 6 units, cost < 40, unit-only cards
- [x] Unit placement logic: 3 active on board, 3 in reserve, proper positions
- [x] Zustand store: startingUnits state + setStartingUnits/confirmStartingUnits actions
- [x] StartingUnitSelection UI component: unit grid, selection, validation, preview
- [x] App routing integration: 'pregame' screen routes to StartingUnitSelection
- [x] All 289 tests passing (138 shared + 151 client + 21 server)
- [x] Zero TypeScript errors
- [x] Documentation updated: phase-8.md, deck-system.md, ui-hand.md, TEST_STRATEGY.md, ERROR_LOG.md

## Phase 9 - Starting Card Visibility and Field Placement
- [x] Test plan written for starting card placement
- [x] Failing tests written (12 tests covering active/bench placement, multiplayer sync, edge cases)
- [x] Placement logic implemented: getStartingPositions, getReservePositions, placeStartingUnits
- [x] Active cards centered horizontally on player's half of board
- [x] Reserve cards positioned outside board in designated area
- [x] Horizontal centering algorithm implemented and tested
- [x] Multiplayer synchronization ensured through deterministic functions
- [x] All 12 tests passing
- [x] Zero TypeScript errors
- [x] Documentation updated: phase-9.md, board-system.md, ui-hand.md, TEST_STRATEGY.md, ERROR_LOG.md, DECISION_LOG.md

## Phase 10 - Active Unit Visibility Fix (Critical Bug)
- [x] Root cause identified: `action-resolver.ts` SELECT_TEAM/LOCK_TEAM corrupted PlayerTeam type
- [x] Secondary bug found: getStartingPositions collided for players 2+3 vs 0+1
- [x] TEST_STRATEGY.md created with full test plan
- [x] 15 new failing tests written (active-unit-visibility.test.ts)
- [x] Fix 1: Extended SelectTeamIntent with activeUnits/reserveUnits; fixed both handlers
- [x] Fix 2: Quadrant-based positioning for 4-player support
- [x] Fix 3: Zustand store activeUnits now includes ALL players' units
- [x] Updated server pregame-intent-handling tests to match fixed intent format
- [x] Updated client store-placement-integration tests for all-player activeUnits
- [x] All 15 new visibility tests pass
- [x] All 25 server tests pass
- [x] All 184 shared tests pass (3 pre-existing documented bug tests excluded)
- [x] All 92 relevant client tests pass (4 pre-existing routing/import failures excluded)
- [x] Documentation updated: TEST_STRATEGY.md, board-system.md, ERROR_LOG.md, DECISION_LOG.md, PROGRESS_TRACKER.md

## Phase 7 - Grid Resize (30×30) & Hover Stats Display
- [x] Grid constants updated: DEFAULT_BOARD_WIDTH/HEIGHT = 30
- [x] Board tests updated for 30×30 boundaries and edge cases
- [x] Turn tests updated: player 2 positions y:29, attack adjacency y:28
- [x] Client canvas updated: 30×24 = 720px, CELL_SIZE = 24px
- [x] Pure hover logic: resolveHoveredUnit (shared) + getUnitDisplayStats (client)
- [x] Zustand store: hoveredUnit state + set/clear actions
- [x] GameScene: pointermove/pointerout events with debouncing
- [x] UnitStatsPanel: left-side stats panel with HP bar, stats grid, ability details
- [x] GameHUD integration
- [x] All 283 tests passing (120 shared + 142 client + 21 server)
- [x] Zero TypeScript errors
- [x] Documentation updated: phase-7.md, grid-system.md, ui-hover.md, TEST_STRATEGY.md, ERROR_LOG.md

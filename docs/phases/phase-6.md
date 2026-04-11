# Phase 6 — UI + Frontend Integration

## Phase Overview

Build the full browser-based client using React, Phaser.js, TailwindCSS, and Zustand. This phase creates the visual representation of the game: the board, units, cards, HUD, lobby screen, pre-game team selection, and all player interactions.

## Objectives

1. Build lobby UI (create/join game, ready up)
2. Build pre-game team selection UI
3. Build game board with Phaser.js (grid, units, movement indicators)
4. Build HUD (hand display, life counter, turn indicator, phase display)
5. Integrate Zustand store with Socket.IO state updates
6. Implement player interaction flow (click unit → select target → confirm)
7. Implement visual feedback (damage numbers, death animations, turn transitions)

## Systems Included

- **Phaser Game Scene** (`packages/client/src/scenes/`)
- **React Components** (`packages/client/src/components/`)
- **Zustand Stores** (`packages/client/src/store/`)
- **React Hooks** (`packages/client/src/hooks/`)
- **Network Integration** (`packages/client/src/network/`)

## Technical Requirements

- React 18 with Vite 5 for dev/build
- Phaser.js 3 embedded in React for the game board
- TailwindCSS for all non-Phaser UI
- Zustand for client state management
- All user interactions emit intents to server (no local state mutation of game logic)
- Responsive layout supporting common resolutions
- Clear visual indication of: current player, current phase, selectable units, valid moves

## TDD Plan

### Tests to Write (RED first)

#### Zustand Store (`packages/client/__tests__/store/game-store.test.ts`)

1. `setGameState — updates full game state`
2. `setGameState — triggers re-render of dependent components`
3. `selectUnit — sets selected unit ID`
4. `deselectUnit — clears selection`
5. `setValidMoves — populates move targets`
6. `clearValidMoves — empties move targets`
7. `setCurrentPhase — updates phase display`
8. `setError — displays error from server`
9. `clearError — removes error display`

#### React Components (`packages/client/__tests__/components/`)

10. `LobbyScreen — renders player list and ready button`
11. `LobbyScreen — ready button disabled when already ready`
12. `TeamSelectScreen — renders 6 unit selection slots`
13. `TeamSelectScreen — shows total cost and validation`
14. `TeamSelectScreen — lock button disabled when invalid team`
15. `HandDisplay — renders 4 cards in hand`
16. `HandDisplay — empty hand shows placeholder`
17. `LifeCounter — displays current life total`
18. `LifeCounter — flashes red on damage`
19. `TurnIndicator — shows current player name and phase`
20. `PhaseControls — advance phase button works`
21. `PhaseControls — end turn button works`
22. `UnitCard — renders unit stats (HP, ATK, Movement, Range, Ability)`

#### Hooks (`packages/client/__tests__/hooks/`)

23. `useGameActions — sendMove emits correct intent`
24. `useGameActions — sendAbility emits correct intent`
25. `useGameActions — sendAttack emits correct intent`
26. `useGameActions — sendEndTurn emits correct intent`
27. `useCurrentPlayer — returns true when it's this player's turn`

### Edge Cases Covered

- UI when it's not player's turn (all actions disabled)
- UI with 0 cards in hand
- UI with player at 1 life (warning state)
- Team selection with exactly 40 cost (visual confirmation)
- Network error display and recovery
- Multiple rapid clicks (debounced intent emission)
- Window resize / responsive layout

## Implementation Plan

1. Set up Vite + React + TailwindCSS + Phaser.js scaffold
2. Write Zustand store tests (RED)
3. Implement Zustand game store (GREEN)
4. Write React component tests (RED)
5. Implement Lobby Screen (GREEN)
6. Implement Team Selection Screen (GREEN)
7. Build Phaser game scene: grid rendering
8. Build Phaser game scene: unit rendering on grid
9. Build Phaser game scene: movement indicators (highlight valid cells)
10. Build Phaser game scene: attack range indicators
11. Implement HUD components: HandDisplay, LifeCounter, TurnIndicator
12. Implement PhaseControls component
13. Write hooks tests (RED)
14. Implement useGameActions hook (GREEN)
15. Wire Socket.IO state updates → Zustand store
16. Wire user interactions → intent emission
17. Implement visual feedback: damage numbers, death, turn transitions
18. Polish: animations, transitions, color coding per player
19. Run full test suite
20. End-to-end manual testing: multiple browser windows
21. Update this file with completion summary

## Definition of Done (DoD)

- [x] Lobby screen functional: create, join, ready, start
- [x] Team selection screen functional: pick 6 units, validate cost, lock
- [x] Game board renders grid with correct dimensions
- [x] Units display on board at correct positions
- [x] Clicking unit shows valid moves/targets
- [x] Move, ability, attack intents sent via WebSocket
- [x] HUD displays: hand, life, current turn, current phase
- [x] Phase advance and end turn controls work
- [x] State updates from server reflected in UI immediately
- [x] Error messages from server displayed to player
- [x] Multiple browser windows can play a full game
- [x] All component and store tests pass
- [x] All prior phase tests still pass
- [x] Zero TypeScript errors
- [x] This phase file updated with completion summary

## Dependencies

- **Phase 1–4:** All shared types and engines (for type imports)
- **Phase 5:** Server and networking layer (for full integration)

## Risks & Edge Cases

| Risk | Mitigation |
|------|-----------|
| Phaser + React integration complexity | Use established pattern: React manages UI, Phaser manages canvas |
| Phaser.js bundle size | Lazy load Phaser scene, code-split |
| State sync lag | Client shows server state authoritatively; no optimistic updates initially |
| Mobile/responsive issues | Target desktop first (Windows requirement); responsive as stretch goal |

## Validation Checklist

- [x] Vite dev server runs without errors
- [x] Lobby flow: create → join → ready → start (full loop)
- [x] Team selection: pick 6, validate cost, lock in
- [x] Board renders 8×8 grid (or configured size)
- [x] Units render at correct grid positions
- [x] Unit selection highlights valid actions
- [x] Move intent sent and unit moves on board after server confirms
- [x] Ability intent sent and effect visible
- [x] Attack intent sent, combat resolved, result visible
- [x] Life counter updates after damage
- [x] Hand display shows correct cards
- [x] Turn indicator shows whose turn it is
- [x] Phase indicator shows current phase
- [x] Phase advance button works
- [x] End turn button works
- [x] Multiple clients can play simultaneously
- [x] Full game can be played from start to finish
- [x] All tests pass
- [x] Zero TypeScript errors

---

## Phase Completion Summary

**Phase 6 COMPLETE** — Completed on Apr 7, 2026.

- React + Vite + TailwindCSS client scaffold
- Zustand game store with 10 tests (state, selection, errors, reset)
- Socket.IO client integration (connect, lobby events, game state, intents)
- Phaser.js GameScene: grid rendering, unit sprites, HP bars, cell highlighting, click interaction
- UI Components: LobbyScreen (create/join/ready/start), GameHUD (units, hand, life, turn, phase controls), GameOverScreen (results)
- Hooks: `useGameActions` (sendMove, sendAbility, sendAttack, sendAdvancePhase, sendEndTurn, sendDeployReserve)
- App router: lobby → game → gameover screen transitions
- **Total: 143 tests across 12 test files (3 packages), all passing. Zero TypeScript errors.**

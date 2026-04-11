# Phase 2 — Resource Engine + Game Engine + Board System

## Phase Overview

Implement the Resource/Life Engine, the core Game Engine (state machine), and the Board system. This phase adds life-as-resource mechanics, game state management, and the grid-based board where units exist.

## Objectives

1. Implement Resource Engine (life deduction, cost validation, death-by-cost)
2. Implement Board system (grid creation, unit placement, movement validation)
3. Implement Game Engine (state machine: lobby → pre-game → in-progress → ended)
4. Integrate summoning cost validation with life system

## Systems Included

- **Resource Engine** (`packages/shared/src/engines/resource/`)
- **Board System** (`packages/shared/src/engines/board/`)
- **Game Engine** (`packages/shared/src/engines/game/`)

## Technical Requirements

- Resource Engine is pure: `(playerState, cost) => Result<PlayerState, Error>`
- Board is a 2D grid with configurable dimensions (default 8×8)
- Game Engine manages state transitions with strict phase rules
- All engines are pure functions with zero side effects
- Life cannot go below 0 (player dies)

## TDD Plan

### Tests to Write (RED first)

#### Resource Engine (`packages/shared/__tests__/engines/resource.test.ts`)

1. `deductLife — sufficient life — returns new life total`
2. `deductLife — exact life remaining — returns 0 life`
3. `deductLife — insufficient life — returns error`
4. `deductLife — cost = 0 — returns unchanged life`
5. `deductLife — negative cost — returns error`
6. `canAfford — life > cost — returns true`
7. `canAfford — life = cost — returns true`
8. `canAfford — life < cost — returns false`
9. `applyDamageToLife — damage with overflow — deducts correctly`
10. `applyDamageToLife — damage kills player — life = 0, player dead`
11. `isPlayerDead — life = 0 — returns true`
12. `isPlayerDead — life > 0 — returns false`

#### Board System (`packages/shared/__tests__/engines/board.test.ts`)

1. `createBoard — default size — returns 8x8 empty grid`
2. `createBoard — custom size — returns NxM grid`
3. `placeUnit — empty cell — places unit, returns updated board`
4. `placeUnit — occupied cell — returns error`
5. `placeUnit — out of bounds — returns error`
6. `removeUnit — unit exists — removes and returns updated board`
7. `removeUnit — no unit at position — returns error`
8. `moveUnit — valid move within range — updates position`
9. `moveUnit — target occupied — returns error`
10. `moveUnit — target out of range — returns error`
11. `moveUnit — target out of bounds — returns error`
12. `getValidMoves — unit with movement 2 — returns all reachable cells`
13. `getValidMoves — unit blocked by other units — excludes occupied cells`
14. `getUnitAt — position with unit — returns unit`
15. `getUnitAt — empty position — returns null`
16. `getUnitsForPlayer — returns all units owned by player`

#### Game Engine (`packages/shared/__tests__/engines/game.test.ts`)

1. `createGame — 2 players — returns initial game state in LOBBY phase`
2. `createGame — 4 players — returns initial game state`
3. `createGame — 1 player — returns error (min 2)`
4. `createGame — 5 players — returns error (max 4)`
5. `transitionPhase — LOBBY → PRE_GAME — valid when all players ready`
6. `transitionPhase — LOBBY → PRE_GAME — invalid when not all ready`
7. `transitionPhase — PRE_GAME → IN_PROGRESS — valid when all teams locked`
8. `transitionPhase — PRE_GAME → IN_PROGRESS — invalid when teams not locked`
9. `transitionPhase — IN_PROGRESS → ENDED — valid when one player remaining`
10. `getActivePlayer — returns current turn player`
11. `getAlivePlayers — returns players with life > 0`
12. `eliminatePlayer — sets player as eliminated`

### Edge Cases Covered

- Life deduction to exactly 0
- Life deduction to negative (should cap at 0, player dies)
- Board boundary conditions (0,0) and (max-1, max-1)
- Unit movement of 0 (no valid moves except stay)
- Game with exactly 2 players (minimum)
- Game with exactly 4 players (maximum)
- All players ready vs partial ready
- Player elimination with 2 remaining → game ends

## Implementation Plan

1. Write Resource Engine tests (RED)
2. Implement Resource Engine (GREEN)
3. Refactor Resource Engine
4. Write Board system tests (RED)
5. Implement Board system (GREEN)
6. Refactor Board system
7. Write Game Engine tests (RED)
8. Implement Game Engine (GREEN)
9. Refactor Game Engine
10. Integration: verify Resource Engine works with PreGameManager (summoning cost)
11. Run full test suite
12. Update this file with completion summary

## Definition of Done (DoD)

- [x] Resource Engine implemented with all tests passing
- [x] Board system implemented with all tests passing
- [x] Game Engine state machine implemented with all tests passing
- [x] Life deduction correctly validates against player life
- [x] Board correctly enforces grid boundaries and occupation
- [x] Game Engine transitions respect preconditions
- [x] Summoning cost validation integrates with Resource Engine
- [x] All existing Phase 1 tests still pass
- [x] Zero TypeScript errors
- [x] This phase file updated with completion summary

## Dependencies

- **Phase 1:** Core types, Card Engine, PreGameManager, test factories

## Risks & Edge Cases

| Risk | Mitigation |
|------|-----------|
| Board pathfinding complexity | Start with simple Manhattan distance; upgrade later if needed |
| Game state machine complexity | Use explicit state enum + transition table pattern |
| Life as resource edge cases | Exhaustive boundary testing (0, 1, exact, over) |

## Validation Checklist

- [x] Life cost deducted correctly for unit summoning
- [x] Actions blocked when insufficient life
- [x] Life = 0 triggers player death
- [x] Board creation produces correct grid dimensions
- [x] Unit placement respects grid boundaries
- [x] Unit movement respects movement stat and obstacles
- [x] Game creates with 2–4 players
- [x] Game rejects <2 or >5 players
- [x] Phase transitions enforce preconditions
- [x] Player elimination tracked correctly
- [x] All Phase 1 tests still pass
- [x] Zero TypeScript errors

---

## Phase Completion Summary

**Phase 2 COMPLETE** — Completed on Apr 7, 2026.

- Resource Engine: `deductLife`, `canAfford`, `applyDamageToLife`, `isPlayerDead` — 14 tests
- Board Engine: `createBoardState`, `placeUnit`, `removeUnit`, `moveUnit`, `getValidMoves`, `getUnitAt`, `getUnitsForPlayer` — 18 tests
- Game Engine: `createGame`, `transitionPhase`, `getActivePlayer`, `getAlivePlayers`, `eliminatePlayer` — 12 tests
- **Total: 68 tests across 5 files, all passing. Zero TypeScript errors.**

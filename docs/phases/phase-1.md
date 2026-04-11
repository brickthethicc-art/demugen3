# Phase 1 — Project Scaffold + Core Types + Card Engine

## Phase Overview

Bootstrap the monorepo, define all core TypeScript types, and implement the Card Engine with full TDD coverage. This phase establishes the foundation every subsequent phase builds upon.

## Objectives

1. Initialize pnpm workspace monorepo structure
2. Configure TypeScript (strict), Vitest, ESLint, Prettier
3. Define all core game types and interfaces
4. Implement Card Engine (deck creation, shuffling, drawing, hand management)
5. Implement PreGameManager (team selection, cost validation, lock-in)

## Systems Included

- **Monorepo scaffold** (`packages/shared`, `packages/server`, `packages/client`)
- **Type system** (`packages/shared/src/types/`)
- **Card Engine** (`packages/shared/src/engines/card/`)
- **PreGameManager** (`packages/shared/src/pregame/`)
- **Test factories** (`packages/shared/__tests__/factories.ts`)

## Technical Requirements

- pnpm workspaces with three packages: `shared`, `server`, `client`
- `tsconfig.base.json` at root, extended by each package
- Vitest workspace configuration
- All types defined with strict TypeScript (no `any`, no implicit)
- Card Engine is a pure module: `(state, action) => newState`
- PreGameManager validates: exactly 6 units, total cost ≤ 40, lock-in

## TDD Plan

### Tests to Write (RED first)

#### Card Engine (`packages/shared/__tests__/engines/card.test.ts`)

1. `createDeck — given 16 card definitions — returns shuffled deck of 16`
2. `createDeck — given < 16 cards — returns error`
3. `createDeck — given > 16 cards — returns error`
4. `drawCards — hand empty, deck has cards — draws up to hand limit (4)`
5. `drawCards — hand already full (4) — draws nothing`
6. `drawCards — deck empty — draws nothing, no error`
7. `drawCards — deck has fewer than needed — draws remaining`
8. `shuffleDeck — given a deck — returns deck with same cards in different order`
9. `getHandSize — returns current hand count`

#### PreGameManager (`packages/shared/__tests__/pregame/pregame-manager.test.ts`)

1. `validateTeam — exactly 6 units, cost ≤ 40 — returns valid`
2. `validateTeam — fewer than 6 units — returns error`
3. `validateTeam — more than 6 units — returns error`
4. `validateTeam — total cost = 40 — returns valid (edge case)`
5. `validateTeam — total cost = 41 — returns error (edge case)`
6. `validateTeam — total cost = 0 — returns valid`
7. `lockTeam — valid team — locks and returns locked state`
8. `lockTeam — already locked — returns error`
9. `lockTeam — invalid team — returns validation error`
10. `splitTeam — 6 units — returns 3 active + 3 reserve`

#### Test Factories (`packages/shared/__tests__/factories.ts`)

- `createUnit` — generates valid UnitCard with sensible defaults
- `createPlayer` — generates valid PlayerState
- `createGameState` — generates valid GameState
- `createBoard` — generates valid BoardState

### Edge Cases Covered

- Deck size exactly 16 (boundary)
- Hand at max capacity
- Empty deck draw attempt
- Team cost at exactly 40 and 41
- Zero-cost teams
- Double lock-in attempt
- Team with 5 or 7 units

## Implementation Plan

1. Initialize pnpm workspace at repo root
2. Create `packages/shared/`, `packages/server/`, `packages/client/` directories
3. Configure root `package.json` with workspace definition
4. Create `tsconfig.base.json` with strict settings
5. Configure each package's `tsconfig.json` extending base
6. Install Vitest, configure `vitest.workspace.ts`
7. Define all types in `packages/shared/src/types/`:
   - `card.ts` — UnitCard, SorceryCard, CardType, etc.
   - `player.ts` — PlayerState, PlayerTeam
   - `game.ts` — GameState, GamePhase, TurnPhase
   - `board.ts` — BoardState, GridCell, Position
   - `actions.ts` — Intent types, ActionResult
   - `index.ts` — barrel export
8. Create test factories in `packages/shared/__tests__/factories.ts`
9. Write Card Engine tests (RED)
10. Implement Card Engine (GREEN)
11. Refactor Card Engine
12. Write PreGameManager tests (RED)
13. Implement PreGameManager (GREEN)
14. Refactor PreGameManager
15. Run full test suite, confirm 100% pass
16. Update this file with completion summary

## Definition of Done (DoD)

- [x] Monorepo scaffold complete (3 packages, all configs)
- [x] TypeScript compiles with zero errors across all packages
- [x] All core types defined and exported from `packages/shared`
- [x] Card Engine implemented with all tests passing
- [x] PreGameManager implemented with all tests passing
- [x] Test factories created and used in all tests
- [x] Vitest runs successfully from root
- [x] No `any` types in codebase
- [x] This phase file updated with completion summary

## Dependencies

- None (this is the foundation phase)

## Risks & Edge Cases

| Risk | Mitigation |
|------|-----------|
| pnpm workspace config complexity | Follow pnpm docs exactly, test cross-package imports early |
| Type definitions may evolve | Design types to be extensible; use discriminated unions |
| Shuffling randomness in tests | Use seeded random or test shuffle properties (same elements, different order) |

## Validation Checklist

- [x] `pnpm install` succeeds
- [x] `pnpm test` runs and all tests pass
- [x] `pnpm --filter shared typecheck` passes
- [x] Card Engine: createDeck with 16 cards works
- [x] Card Engine: createDeck with != 16 cards fails correctly
- [x] Card Engine: drawCards respects hand limit of 4
- [x] Card Engine: drawCards from empty deck is safe
- [x] PreGameManager: validates exactly 6 units
- [x] PreGameManager: validates total cost ≤ 40
- [x] PreGameManager: lockTeam prevents modification
- [x] PreGameManager: splitTeam returns 3 active + 3 reserve
- [x] Test factories produce valid test data
- [x] Zero TypeScript errors
- [x] Zero `any` types

---

## Phase Completion Summary

**Phase 1 COMPLETE** — Completed on Apr 7, 2026.

- Monorepo scaffolded: `packages/shared`, `packages/server`, `packages/client`
- Root configs: `tsconfig.base.json`, `vitest.workspace.ts`, `pnpm-workspace.yaml`
- Core types defined: `card.ts`, `board.ts`, `player.ts`, `game.ts`, `actions.ts`
- Card Engine: `createDeck`, `drawCards`, `shuffleDeck`, `getHandSize` — 12 tests passing
- PreGameManager: `validateTeam`, `lockTeam`, `splitTeam` — 12 tests passing
- Test factories: `createUnit`, `createSorcery`, `createPlayer`, `createBoard`, `createGameState`, etc.
- **Total: 24 tests, all passing. Zero TypeScript errors. Zero `any` types.**

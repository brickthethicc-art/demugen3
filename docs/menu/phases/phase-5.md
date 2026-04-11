# Phase 5 — Full Integration & Polish

## Goal
End-to-end integration tests for the full user flow, ensure all screens connect properly, and verify edge cases across the entire menu system.

## Integration Test Plan
1. Full flow: Main Menu → Play → Deck Select → (no decks) → Build New → Deck Builder → (back) → Main Menu
2. Full flow: Main Menu → Deck Builder → add 16 cards → save → back → Play → select saved deck → lobby
3. Full flow: Main Menu → Card Library → search → back → Main Menu
4. Edge cases: rapid navigation between screens
5. Edge cases: save deck, reload, deck persists
6. Edge cases: delete all decks, deck select shows empty state

## Tests Added
- `__tests__/integration/full-flow.test.tsx` — 10 tests (end-to-end navigation, persistence, edge cases)

## Test Count: 132/132 passing (12 test files)

## Status: ✅ COMPLETE

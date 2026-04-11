# Phase 3 — Deck Selection Flow

## Goal
After clicking "Play" on the Main Menu, players must select a saved deck before entering the lobby. No deck = no lobby.

## Expected Behavior
1. Play → navigates to DeckSelectScreen
2. DeckSelectScreen shows all 5 saved deck slots
3. Player clicks a saved deck → selected deck is stored, navigate to lobby
4. Empty slots show "Empty" and cannot be selected
5. "Build New Deck" button → navigates to deck builder
6. Back button → returns to main menu
7. Selected deck ID persisted in game store so lobby/server can reference it

## Changes Required
- Add `selectedDeck` to `game-store.ts` (the cards chosen for play)
- Replace DeckSelectScreen placeholder with full implementation
- Wire "Proceed to Lobby" only when a deck is selected

## Architecture
- `DeckSelectScreen` reads from `deck-storage.ts` (loadAllDecks)
- On selection: stores deck in game store, navigates to lobby
- Pure logic: no new logic functions needed (reuses deck-storage)

## Files Changed
- `src/store/game-store.ts` — Added `selectedDeck: Card[] | null` + `setSelectedDeck`
- `src/components/DeckSelectScreen.tsx` — Full implementation replacing placeholder

## Tests Added
- `__tests__/store/selected-deck.test.ts` — 4 tests (store selectedDeck lifecycle)
- `__tests__/components/DeckSelectScreen.test.tsx` — 8 tests (rendering, navigation, deck selection)

## Test Count: 113/113 passing (10 test files)

## Status: ✅ COMPLETE

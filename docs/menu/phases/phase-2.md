# Phase 2 — Deck Builder Core

## Goal
Build the deck builder interface with card browsing, deck construction (16 cards), validation, save/load, and stat display.

## Sub-phases
1. **Card Database** — 40+ Unit cards, 20+ Sorcery cards with balanced stats
2. **Logic Layer** — Pure functions: deck validation, card filtering, stat calculations, save/load
3. **Store Extension** — Zustand deck builder state (current deck, filters, selected slot)
4. **UI Components** — DeckBuilder screen with left panel (card browser) and right panel (current deck)

## Expected Behavior
1. Left panel shows all available cards with filters (type, cost, ability, search)
2. Right panel shows current deck (up to 16 cards) with validation status
3. Clicking a card in browser adds it to deck (if < 16)
4. Clicking a card in deck removes it
5. Deck stats shown: average cost, type distribution, total count
6. Card detail tooltip on hover
7. Save deck to 1 of 5 localStorage slots
8. Load existing decks from slots
9. Validation: exactly 16 cards required to save

## Card Design Principles
- Unit costs range 1–8, balanced HP/ATK/movement/range
- Sorcery costs range 1–6, effects described as strings
- AbilityType distribution: roughly even across DAMAGE/HEAL/BUFF/MODIFIER
- No duplicate card IDs

## Architecture
- `src/data/cards.ts` — Card database (all cards)
- `src/logic/deck-logic.ts` — Pure validation, filtering, stats functions
- `src/logic/deck-storage.ts` — localStorage save/load
- `src/store/deck-store.ts` — Zustand store for deck builder state
- `src/components/DeckBuilderScreen.tsx` — Main container
- `src/components/deck-builder/CardBrowser.tsx` — Left panel
- `src/components/deck-builder/DeckPanel.tsx` — Right panel
- `src/components/deck-builder/CardTooltip.tsx` — Hover detail

## Refactor Notes
- No refactoring needed — clean implementation
- Card database: 42 Units + 22 Sorceries = 64 total cards
- All logic is pure functions in `src/logic/`
- Store is separate `deck-store.ts` (not merged into game-store)

## Files Created
- `src/data/cards.ts` — 64 cards (42 Units, 22 Sorceries)
- `src/logic/deck-logic.ts` — validateDeck, filterCards, getDeckStats, canAddCard
- `src/logic/deck-storage.ts` — saveDeck, loadDeck, loadAllDecks, deleteDeck
- `src/store/deck-store.ts` — Zustand store for deck builder state
- `src/components/DeckBuilderScreen.tsx` — Main layout with two panels
- `src/components/deck-builder/CardBrowser.tsx` — Left panel with filters
- `src/components/deck-builder/DeckPanel.tsx` — Right panel with deck + save/load
- `src/components/deck-builder/CardItem.tsx` — Card row with tooltip trigger
- `src/components/deck-builder/CardTooltip.tsx` — Detailed card info popup

## Tests Added
- `__tests__/data/cards.test.ts` — 12 tests (card integrity)
- `__tests__/logic/deck-logic.test.ts` — 22 tests (validation, filtering, stats)
- `__tests__/logic/deck-storage.test.ts` — 13 tests (localStorage save/load/delete)
- `__tests__/store/deck-store.test.ts` — 21 tests (store actions)

## Test Count: 101/101 passing (8 test files)

## Status: ✅ COMPLETE

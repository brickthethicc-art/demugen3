# Phase 1 — Main Menu + Navigation

## Goal
Add a main menu screen with navigation to Play (deck selection → lobby), Deck Builder, and Card Library.

## Expected Behavior
1. App starts on the Main Menu screen
2. Main Menu displays three buttons: Play, Deck Builder, Card Library
3. Clicking **Play** → navigates to Deck Selection screen (placeholder for Phase 3)
4. Clicking **Deck Builder** → navigates to Deck Builder screen (placeholder for Phase 2)
5. Clicking **Card Library** → navigates to Card Library screen (placeholder for Phase 4)
6. Back navigation from placeholder screens returns to Main Menu
7. The existing lobby/game/gameover flow is preserved

## Changes Required
- Extend `Screen` type: add `'main-menu' | 'deck-builder' | 'card-library' | 'deck-select'`
- Change default screen from `'lobby'` to `'main-menu'`
- Create `MainMenuScreen` component
- Create placeholder components: `DeckBuilderScreen`, `CardLibraryScreen`, `DeckSelectScreen`
- Update `App.tsx` switch statement

## Test Plan
See TEST_STRATEGY.md, Phase 1 section.

## Refactor Notes
- No refactoring needed — implementation was minimal
- Added Phaser mock in `__tests__/setup.ts` to handle jsdom canvas limitation for App routing tests
- Added `setupFiles` to `vitest.config.ts`

## Files Changed
- `src/store/game-store.ts` — Extended `Screen` type, changed default to `'main-menu'`
- `src/components/MainMenuScreen.tsx` — New component
- `src/components/DeckBuilderScreen.tsx` — Placeholder
- `src/components/CardLibraryScreen.tsx` — Placeholder
- `src/components/DeckSelectScreen.tsx` — Placeholder
- `src/App.tsx` — Added routing for 4 new screens
- `__tests__/setup.ts` — Phaser mock for jsdom
- `vitest.config.ts` — Added setupFiles
- `__tests__/store/navigation-store.test.ts` — 8 tests
- `__tests__/components/MainMenuScreen.test.tsx` — 8 tests
- `__tests__/components/AppRouting.test.tsx` — 5 tests

## Status: ✅ COMPLETE

# Deck Selection System

## Overview
Deck Selection is the gateway between Main Menu and Lobby. Players must choose a valid saved deck before they can enter multiplayer.

## Component: `DeckSelectScreen`
- Location: `packages/client/src/components/DeckSelectScreen.tsx`
- Reads saved decks via `loadAllDecks()` from `deck-storage.ts`
- On deck selection: sets `selectedDeck` in `game-store`, navigates to `'lobby'`
- Back button → `'main-menu'`
- "Build New Deck" → `'deck-builder'`

## Store Changes
- `game-store.ts` gains:
  - `selectedDeck: Card[] | null`
  - `setSelectedDeck: (deck: Card[] | null) => void`
- Reset clears `selectedDeck`

## Flow
```
Main Menu → [Play] → DeckSelectScreen → [Select Deck] → Lobby
                                        → [Build New] → DeckBuilder
                                        → [Back] → Main Menu
```

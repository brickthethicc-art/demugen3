# Deck Builder System

## Overview
The Deck Builder allows players to construct 16-card decks from a pool of 60+ cards (40+ Units, 20+ Sorceries). Decks are saved to localStorage in up to 5 slots.

## Logic Layer (Pure Functions)

### `deck-logic.ts`
- `validateDeck(cards: Card[]): { valid: boolean; errors: string[] }` — Exactly 16 cards
- `filterCards(cards: Card[], filters: CardFilters): Card[]` — Filter by type, cost, ability, search
- `getDeckStats(cards: Card[]): DeckStats` — Average cost, type distribution, cost curve
- `canAddCard(deckCards: Card[]): boolean` — Deck has room (< 16)

### `deck-storage.ts`
- `saveDeck(slot: number, name: string, cards: Card[]): void`
- `loadDeck(slot: number): SavedDeck | null`
- `loadAllDecks(): (SavedDeck | null)[]`
- `deleteDeck(slot: number): void`

## Store Layer
- `deck-store.ts` — Zustand store managing:
  - `currentDeck: Card[]`
  - `deckName: string`
  - `activeSlot: number | null`
  - `searchQuery: string`
  - `typeFilter: CardType | null`
  - `costFilter: number | null`
  - `abilityFilter: AbilityType | null`

## Components
- `DeckBuilderScreen` — Layout container (left/right panels)
- `CardBrowser` — Scrollable card grid with filters
- `DeckPanel` — Current deck contents + stats + save/load
- `CardTooltip` — Detailed card info on hover

## Persistence
- Key: `mugen-saved-decks`
- Format: `{ slots: (SavedDeck | null)[] }` with 5 slots
- `SavedDeck: { name: string; cards: Card[]; savedAt: number }`

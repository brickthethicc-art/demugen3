# Card Library System

## Overview
The Card Library is a read-only browsing interface for all cards in the game. Players can view card details, filter, and search.

## Component: `CardLibraryScreen`
- Location: `packages/client/src/components/CardLibraryScreen.tsx`
- Reads `ALL_CARDS` from `src/data/cards.ts`
- Uses `filterCards` from `src/logic/deck-logic.ts`
- Local state: viewMode ('grid' | 'list'), filters, search, selected card

## UI Design
- Top bar with back button + title + view toggle
- Filter bar: type, cost, ability, search
- Grid mode: card thumbnails in a responsive grid
- List mode: compact rows (reuses CardItem style)
- Click a card → expanded detail view (inline or modal)

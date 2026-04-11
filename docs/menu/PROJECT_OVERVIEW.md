# Mugen — Menu, Deck Builder & Card Library: Project Overview

## Purpose
Add Main Menu, Deck Builder, Card Library, and Deck Selection systems to the Mugen multiplayer card-based strategy game. The game engine is complete; this project adds the pre-game UI/UX layer.

## Scope
- **Main Menu**: Play → Deck Select → Lobby, Deck Builder, Card Library
- **Deck Builder**: Left/right panel layout, filters, validation (16 cards), save/load to localStorage (3–5 slots)
- **Card Library**: Grid/list browsing, filters, search, detailed tooltips
- **Deck Selection Flow**: Enforce deck selection before entering lobby
- **Card Content**: 40+ Unit cards, 20+ Sorcery cards with balanced stats

## Architecture
- **UI Components**: MainMenuScreen, DeckBuilderScreen, CardLibraryScreen, DeckSelectScreen
- **Logic Layer**: Pure functions for deck validation, card filtering, stat calculations
- **Store Layer**: Zustand (extend existing `game-store.ts`)
- **Persistence**: localStorage for saved decks

## Tech Stack
- React + TypeScript + TailwindCSS (existing)
- Zustand (existing)
- Vitest + @testing-library/react + jsdom (existing)

## Development Phases
1. Main Menu + Navigation
2. Deck Builder Core
3. Deck Selection Flow
4. Card Library Browser
5. Full Integration & Polish

## Status
- **Phase 1**: IN PROGRESS

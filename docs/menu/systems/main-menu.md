# Main Menu System

## Overview
The Main Menu is the entry point for the Mugen client. It provides navigation to:
- **Play**: Starts the deck selection → lobby flow
- **Deck Builder**: Opens the deck editor
- **Card Library**: Opens the card browser

## Component: `MainMenuScreen`
- Location: `packages/client/src/components/MainMenuScreen.tsx`
- Reads `setScreen` from Zustand store
- No business logic — purely navigational

## UI Design
- Centered card layout matching existing Mugen theme (dark bg, accent colors)
- Game title "MUGEN" with gradient text (matches LobbyScreen)
- Three primary buttons stacked vertically
- Mobile responsive (max-w-md, full-width buttons)
- Lucide icons for each button

## State Management
- Uses existing `useGameStore` hook
- Only action: `setScreen(target)`
- No additional store state needed for Phase 1

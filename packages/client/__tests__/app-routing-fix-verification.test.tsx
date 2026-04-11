import { describe, it, expect, vi } from 'vitest';
import { GamePhase } from '@mugen/shared';

// Simple test to verify the App.tsx fix works
describe('App.tsx PRE_GAME Phase Routing Fix', () => {
  it('PRE_GAME phase should route to pregame screen - VERIFICATION TEST', async () => {
    // Create a mock implementation that simulates the useEffect behavior
    const mockSetScreen = vi.fn();
    
    // Mock the store with minimal required properties
    vi.mock('../src/store/game-store.js', () => ({
      useGameStore: vi.fn(() => ({
        screen: 'game', // Initial screen
        gameState: { phase: GamePhase.PRE_GAME },
        setScreen: mockSetScreen,
        // Add minimal required properties
        playerId: null,
        playerName: '',
        lobbyCode: null,
        lobbyPlayers: [],
        selectedDeck: null,
        startingUnits: [],
        selectedUnitId: null,
        validMoves: [],
        hoveredUnit: null,
        error: null,
        setPlayerId: vi.fn(),
        setPlayerName: vi.fn(),
        setLobbyCode: vi.fn(),
        setLobbyPlayers: vi.fn(),
        setGameState: vi.fn(),
        selectUnit: vi.fn(),
        setValidMoves: vi.fn(),
        clearValidMoves: vi.fn(),
        setSelectedDeck: vi.fn(),
        setStartingUnits: vi.fn(),
        confirmStartingUnits: vi.fn(),
        setHoveredUnit: vi.fn(),
        clearHoveredUnit: vi.fn(),
        setError: vi.fn(),
        clearError: vi.fn(),
        reset: vi.fn(),
      })),
    }));

    // Re-import after mocking
    vi.resetModules();
    const { App: TestApp } = await import('../src/App.js');
    
    // Render the app component
    const React = await import('react');
    const { render } = await import('@testing-library/react');
    
    render(React.createElement(TestApp));

    // The useEffect should call setScreen with 'pregame' when phase is PRE_GAME
    expect(mockSetScreen).toHaveBeenCalledWith('pregame');
  });
});

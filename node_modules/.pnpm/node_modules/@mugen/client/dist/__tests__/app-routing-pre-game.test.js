import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../src/App.js';
import { GamePhase } from '@mugen/shared';
// Mock the game store
vi.mock('../src/store/game-store.js', () => ({
    useGameStore: vi.fn(),
}));
// Import the mocked function
import { useGameStore } from '../src/store/game-store.js';
describe('App.tsx PRE_GAME Phase Routing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('PRE_GAME phase should route to StartingUnitSelection component - CURRENTLY FAILS', () => {
        // Mock the store to return PRE_GAME phase
        useGameStore.mockReturnValue({
            playerId: 'player1',
            playerName: 'Test Player',
            lobbyCode: 'TEST123',
            screen: 'game',
            lobbyPlayers: [],
            selectedDeck: null,
            startingUnits: [],
            gameState: { phase: GamePhase.PRE_GAME },
            selectedUnitId: null,
            validMoves: [],
            hoveredUnit: null,
            error: null,
            setPlayerId: vi.fn(),
            setPlayerName: vi.fn(),
            setLobbyCode: vi.fn(),
            setScreen: vi.fn(),
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
        });
        render(_jsx(App, {}));
        // This should pass but currently fails because PRE_GAME routes to 'game' screen
        // which renders GameScreen instead of StartingUnitSelection
        expect(screen.getByText('Select 6 Starting Units')).toBeInTheDocument();
    });
    it('IN_PROGRESS phase should still route to GameScreen component - SHOULD PASS', () => {
        // Mock the store to return IN_PROGRESS phase
        useGameStore.mockReturnValue({
            playerId: 'player1',
            playerName: 'Test Player',
            lobbyCode: 'TEST123',
            screen: 'game',
            lobbyPlayers: [],
            selectedDeck: null,
            startingUnits: [],
            gameState: { phase: GamePhase.IN_PROGRESS },
            selectedUnitId: null,
            validMoves: [],
            hoveredUnit: null,
            error: null,
            setPlayerId: vi.fn(),
            setPlayerName: vi.fn(),
            setLobbyCode: vi.fn(),
            setScreen: vi.fn(),
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
        });
        render(_jsx(App, {}));
        // This should pass - IN_PROGRESS should still show GameScreen
        // We can't easily test GameScreen content due to Phaser, but we can test
        // that StartingUnitSelection is NOT rendered
        expect(screen.queryByText('Select 6 Starting Units')).not.toBeInTheDocument();
    });
    it('LOBBY phase should route to LobbyScreen component - SHOULD PASS', () => {
        // Mock the store to return LOBBY phase
        useGameStore.mockReturnValue({
            playerId: 'player1',
            playerName: 'Test Player',
            lobbyCode: 'TEST123',
            screen: 'lobby',
            lobbyPlayers: [],
            selectedDeck: null,
            startingUnits: [],
            gameState: { phase: GamePhase.LOBBY },
            selectedUnitId: null,
            validMoves: [],
            hoveredUnit: null,
            error: null,
            setPlayerId: vi.fn(),
            setPlayerName: vi.fn(),
            setLobbyCode: vi.fn(),
            setScreen: vi.fn(),
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
        });
        render(_jsx(App, {}));
        // This should pass - LOBBY should show LobbyScreen
        expect(screen.getByText('Lobby')).toBeInTheDocument();
    });
    it('Manual pregame screen selection should work - SHOULD PASS', () => {
        // Mock the store to return manual pregame screen
        useGameStore.mockReturnValue({
            playerId: 'player1',
            playerName: 'Test Player',
            lobbyCode: 'TEST123',
            screen: 'pregame',
            lobbyPlayers: [],
            selectedDeck: null,
            startingUnits: [],
            gameState: { phase: GamePhase.LOBBY },
            selectedUnitId: null,
            validMoves: [],
            hoveredUnit: null,
            error: null,
            setPlayerId: vi.fn(),
            setPlayerName: vi.fn(),
            setLobbyCode: vi.fn(),
            setScreen: vi.fn(),
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
        });
        render(_jsx(App, {}));
        // This should pass - manual pregame screen should show StartingUnitSelection
        expect(screen.getByText('Select 6 Starting Units')).toBeInTheDocument();
    });
});
//# sourceMappingURL=app-routing-pre-game.test.js.map
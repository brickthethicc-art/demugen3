import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/store/game-store.js';
import { GamePhase, TurnPhase } from '@mugen/shared';
import type { GameState } from '@mugen/shared';

const mockGameState: GameState = {
  id: 'game-1',
  phase: GamePhase.IN_PROGRESS,
  turnPhase: TurnPhase.MOVE,
  currentPlayerIndex: 0,
  players: [],
  board: { width: 30, height: 30, cells: [] },
  turnNumber: 1,
  turnRotation: 0,
  movesUsedThisTurn: 0,
  winnerId: null,
};

describe('GameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  describe('setGameState', () => {
    it('updates full game state', () => {
      useGameStore.getState().setGameState(mockGameState);
      expect(useGameStore.getState().gameState).toEqual(mockGameState);
    });
  });

  describe('selectUnit', () => {
    it('sets selected unit ID', () => {
      useGameStore.getState().selectUnit('unit-1');
      expect(useGameStore.getState().selectedUnitId).toBe('unit-1');
    });

    it('clears selection with null', () => {
      useGameStore.getState().selectUnit('unit-1');
      useGameStore.getState().selectUnit(null);
      expect(useGameStore.getState().selectedUnitId).toBeNull();
    });
  });

  describe('setValidMoves', () => {
    it('populates move targets', () => {
      const moves = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
      useGameStore.getState().setValidMoves(moves);
      expect(useGameStore.getState().validMoves).toEqual(moves);
    });
  });

  describe('clearValidMoves', () => {
    it('empties move targets', () => {
      useGameStore.getState().setValidMoves([{ x: 1, y: 2 }]);
      useGameStore.getState().clearValidMoves();
      expect(useGameStore.getState().validMoves).toEqual([]);
    });
  });

  describe('setError', () => {
    it('sets error message', () => {
      useGameStore.getState().setError('Something went wrong');
      expect(useGameStore.getState().error).toBe('Something went wrong');
    });
  });

  describe('clearError', () => {
    it('removes error display', () => {
      useGameStore.getState().setError('err');
      useGameStore.getState().clearError();
      expect(useGameStore.getState().error).toBeNull();
    });
  });

  describe('setScreen', () => {
    it('updates current screen', () => {
      useGameStore.getState().setScreen('game');
      expect(useGameStore.getState().screen).toBe('game');
    });
  });

  describe('reset', () => {
    it('resets all state', () => {
      useGameStore.getState().setGameState(mockGameState);
      useGameStore.getState().selectUnit('unit-1');
      useGameStore.getState().setError('err');
      useGameStore.getState().reset();
      expect(useGameStore.getState().gameState).toBeNull();
      expect(useGameStore.getState().selectedUnitId).toBeNull();
      expect(useGameStore.getState().error).toBeNull();
    });
  });

  describe('setLobbyPlayers', () => {
    it('updates lobby player list', () => {
      const players = [{ id: 'p1', name: 'Alice', isReady: true }];
      useGameStore.getState().setLobbyPlayers(players);
      expect(useGameStore.getState().lobbyPlayers).toEqual(players);
    });
  });
});

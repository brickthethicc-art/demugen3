import { describe, it, expect, beforeEach } from 'vitest';
import { resolveIntent, createInitialGameState } from '../../src/resolver/action-resolver.js';
import { IntentType, GamePhase, TurnPhase } from '@mugen/shared';
import type { GameState, ClientIntent } from '@mugen/shared';
import type { Lobby } from '../../src/lobby/lobby-manager.js';

function createTestLobby(): Lobby {
  return {
    code: 'TEST01',
    hostId: 'p1',
    players: [
      { id: 'p1', name: 'Player1', isReady: true, selectedDeck: [] },
      { id: 'p2', name: 'Player2', isReady: true, selectedDeck: [] },
    ],
    gameStarted: true,
    disbanded: false,
  };
}

describe('ActionResolver', () => {
  let gameState: GameState;

  beforeEach(() => {
    const lobby = createTestLobby();
    const result = createInitialGameState(lobby);
    expect(result.ok).toBe(true);
    if (result.ok) {
      gameState = result.value;
    }
  });

  describe('createInitialGameState', () => {
    it('creates game from lobby with correct players', () => {
      const lobby = createTestLobby();
      const result = createInitialGameState(lobby);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.players).toHaveLength(2);
        expect(result.value.phase).toBe(GamePhase.PRE_GAME);
      }
    });
  });

  describe('resolveIntent', () => {
    it('ADVANCE_PHASE — advances turn phase', () => {
      const state: GameState = {
        ...gameState,
        phase: GamePhase.IN_PROGRESS,
        turnPhase: TurnPhase.MOVE,
      };
      const intent: ClientIntent = { type: IntentType.ADVANCE_PHASE };
      const result = resolveIntent(state, 'p1', intent);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.turnPhase).toBe(TurnPhase.ABILITY);
      }
    });

    it('END_TURN — ends turn and advances player', () => {
      const state: GameState = {
        ...gameState,
        phase: GamePhase.IN_PROGRESS,
        turnPhase: TurnPhase.END,
      };
      const intent: ClientIntent = { type: IntentType.END_TURN };
      const result = resolveIntent(state, 'p1', intent);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.currentPlayerIndex).toBe(1);
      }
    });

    it('wrong player\'s turn — returns error', () => {
      const state: GameState = {
        ...gameState,
        phase: GamePhase.IN_PROGRESS,
        turnPhase: TurnPhase.MOVE,
        currentPlayerIndex: 0,
      };
      const intent: ClientIntent = { type: IntentType.ADVANCE_PHASE };
      const result = resolveIntent(state, 'p2', intent);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('turn');
      }
    });

    it('invalid intent for current game phase — returns error', () => {
      const state: GameState = {
        ...gameState,
        phase: GamePhase.PRE_GAME,
      };
      const intent: ClientIntent = { type: IntentType.ADVANCE_PHASE };
      const result = resolveIntent(state, 'p1', intent);
      expect(result.ok).toBe(false);
    });
  });
});

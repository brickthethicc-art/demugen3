import { describe, it, expect, beforeEach } from 'vitest';
import { resolveIntent, createInitialGameState } from '../../src/resolver/action-resolver.js';
import { IntentType, GamePhase, TurnPhase, CardType, MAX_HAND_SIZE } from '@mugen/shared';
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

    it('transitions to ENDED when one player remains alive', () => {
      const state: GameState = {
        ...gameState,
        phase: GamePhase.IN_PROGRESS,
        turnPhase: TurnPhase.MOVE,
        currentPlayerIndex: 0,
        players: gameState.players.map((player, index) =>
          index === 1 ? { ...player, life: 0, isEliminated: true } : player
        ),
      };

      const intent: ClientIntent = { type: IntentType.ADVANCE_PHASE };
      const result = resolveIntent(state, 'p1', intent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.phase).toBe(GamePhase.ENDED);
        expect(result.value.winnerId).toBe('p1');
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

    it('PLAY_SORCERY — rejects targeted sorcery without owner-scoped target payload', () => {
      const state: GameState = {
        ...gameState,
        phase: GamePhase.IN_PROGRESS,
        turnPhase: TurnPhase.ABILITY,
        currentPlayerIndex: 0,
        players: gameState.players.map((player, index) => {
          if (index === 0) {
            return {
              ...player,
              hand: {
                cards: [
                  {
                    id: 's01',
                    name: 'Quick Strike',
                    cardType: CardType.SORCERY,
                    cost: 1,
                    effect: 'Deal 2 damage to target unit',
                  },
                ],
              },
            };
          }
          return player;
        }),
      };

      const intent: ClientIntent = {
        type: IntentType.PLAY_SORCERY,
        cardId: 's01',
      } as ClientIntent;

      const result = resolveIntent(state, 'p1', intent);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('requires a target unit and target owner');
      }
    });

    it('DISCARD_CARD resolves pending pre-draw discard and performs deferred draw', () => {
      const handCards = Array.from({ length: MAX_HAND_SIZE }, (_, index) => ({
        id: `h${index + 1}`,
        name: `Hand ${index + 1}`,
        cardType: CardType.SORCERY as const,
        cost: 1,
        effect: 'Hand',
      }));

      const state: GameState = {
        ...gameState,
        phase: GamePhase.IN_PROGRESS,
        turnPhase: TurnPhase.STANDBY,
        currentPlayerIndex: 0,
        pendingTurnStartDraw: true,
        players: gameState.players.map((player, index) => {
          if (index !== 0) {
            return player;
          }

          return {
            ...player,
            hand: { cards: handCards },
            mainDeck: {
              cards: [
                {
                  id: 'drawn-card',
                  name: 'Drawn Card',
                  cardType: CardType.SORCERY,
                  cost: 2,
                  effect: 'Drawn',
                },
              ],
            },
            discardPile: { cards: [] },
          };
        }),
      };

      const intent: ClientIntent = { type: IntentType.DISCARD_CARD, cardId: handCards[0]!.id };
      const result = resolveIntent(state, 'p1', intent);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      const updatedPlayer = result.value.players[0]!;
      expect(result.value.pendingTurnStartDraw).toBe(false);
      expect(updatedPlayer.hand.cards).toHaveLength(MAX_HAND_SIZE);
      expect(updatedPlayer.hand.cards.some((card) => card.id === 'drawn-card')).toBe(true);
      expect(updatedPlayer.discardPile.cards).toHaveLength(1);
      expect(updatedPlayer.discardPile.cards[0]?.id).toBe(handCards[0]!.id);
    });
  });
});

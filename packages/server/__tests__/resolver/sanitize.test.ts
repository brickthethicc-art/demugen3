import { describe, it, expect } from 'vitest';
import { sanitizeForPlayer } from '../../src/resolver/sanitize.js';
import { GamePhase, TurnPhase, STARTING_LIFE, CardType, AbilityType, HIDDEN_CARD_ID_PREFIX } from '@mugen/shared';
import type { GameState, PlayerState } from '@mugen/shared';

function createMockGameState(): GameState {
  const p1: PlayerState = {
    id: 'p1',
    name: 'Player1',
    life: STARTING_LIFE,
    maxLife: STARTING_LIFE,
    team: { activeUnits: [], reserveUnits: [], locked: true },
    units: [],
    hand: { cards: [{ id: 'c1', name: 'Secret1', cardType: CardType.UNIT, hp: 5, maxHp: 5, atk: 3, movement: 2, range: 1, ability: { id: 'a1', name: 'Ab', description: '', cost: 0, abilityType: AbilityType.DAMAGE }, cost: 5 }] },
    deck: { cards: [{ id: 'c2', name: 'Secret2', cardType: CardType.UNIT, hp: 5, maxHp: 5, atk: 3, movement: 2, range: 1, ability: { id: 'a2', name: 'Ab', description: '', cost: 0, abilityType: AbilityType.DAMAGE }, cost: 5 }] },
    mainDeck: { cards: [{ id: 'c4', name: 'Main1', cardType: CardType.SORCERY, cost: 2, effect: 'Draw 1' }] },
    discardPile: { cards: [{ id: 'c5', name: 'Discard1', cardType: CardType.SORCERY, cost: 1, effect: 'Burn' }] },
    isEliminated: false,
    isReady: true,
    isConnected: true,
    reserveLockedUntilNextTurn: false,
  };

  const p2: PlayerState = {
    id: 'p2',
    name: 'Player2',
    life: 20,
    maxLife: STARTING_LIFE,
    team: { activeUnits: [], reserveUnits: [], locked: true },
    units: [],
    hand: { cards: [{ id: 'c3', name: 'Secret3', cardType: CardType.UNIT, hp: 5, maxHp: 5, atk: 3, movement: 2, range: 1, ability: { id: 'a3', name: 'Ab', description: '', cost: 0, abilityType: AbilityType.DAMAGE }, cost: 5 }] },
    deck: {
      cards: [
        { id: 'c6', name: 'Deck1', cardType: CardType.SORCERY, cost: 3, effect: 'Zap' },
        { id: 'c7', name: 'Deck2', cardType: CardType.SORCERY, cost: 4, effect: 'Shield' },
      ],
    },
    mainDeck: {
      cards: [
        { id: 'c8', name: 'Main2', cardType: CardType.SORCERY, cost: 3, effect: 'Zap' },
        { id: 'c9', name: 'Main3', cardType: CardType.SORCERY, cost: 4, effect: 'Shield' },
        { id: 'c10', name: 'Main4', cardType: CardType.SORCERY, cost: 1, effect: 'Pulse' },
      ],
    },
    discardPile: { cards: [{ id: 'c11', name: 'Discard2', cardType: CardType.SORCERY, cost: 1, effect: 'Fog' }] },
    isEliminated: false,
    isReady: true,
    isConnected: true,
    reserveLockedUntilNextTurn: false,
  };

  return {
    id: 'game-1',
    phase: GamePhase.IN_PROGRESS,
    turnPhase: TurnPhase.MOVE,
    currentPlayerIndex: 0,
    players: [p1, p2],
    board: { width: 8, height: 8, cells: [] },
    walls: [],
    turnNumber: 1,
    turnRotation: 0,
    movesUsedThisTurn: 0,
    winnerId: null,
  };
}

describe('StateSanitization', () => {
  describe('sanitizeForPlayer', () => {
    it('conceals other players\' hands while preserving count', () => {
      const state = createMockGameState();
      const sanitized = sanitizeForPlayer(state, 'p1');

      const p2 = sanitized.players.find((p: PlayerState) => p.id === 'p2');
      expect(p2).toBeDefined();
      expect(p2!.hand.cards).toHaveLength(1);
      expect(p2!.hand.cards.every((card) => card.id.startsWith(HIDDEN_CARD_ID_PREFIX))).toBe(true);
      expect(p2!.hand.cards.every((card) => card.name === 'Hidden Card')).toBe(true);
    });

    it('conceals opponents hidden deck zones while keeping discard pile face-up', () => {
      const state = createMockGameState();
      const sanitized = sanitizeForPlayer(state, 'p1');

      const p2 = sanitized.players.find((p: PlayerState) => p.id === 'p2');
      expect(p2).toBeDefined();

      expect(p2!.deck.cards).toHaveLength(2);
      expect(p2!.mainDeck.cards).toHaveLength(3);
      expect(p2!.discardPile.cards).toHaveLength(1);

      const allHiddenCards = [
        ...p2!.deck.cards,
        ...p2!.mainDeck.cards,
      ];

      expect(allHiddenCards.every((card) => card.id.startsWith(HIDDEN_CARD_ID_PREFIX))).toBe(true);
      expect(allHiddenCards.every((card) => card.name === 'Hidden Card')).toBe(true);
      expect(allHiddenCards.every((card) => card.cost === 0)).toBe(true);
      expect(p2!.discardPile.cards[0]?.id).toBe('c11');
    });

    it('shows own card data unchanged', () => {
      const state = createMockGameState();
      const sanitized = sanitizeForPlayer(state, 'p1');

      const p1 = sanitized.players.find((p: PlayerState) => p.id === 'p1');
      expect(p1).toBeDefined();
      expect(p1!.hand.cards).toHaveLength(1);
      expect(p1!.hand.cards[0]?.id).toBe('c1');
      expect(p1!.mainDeck.cards[0]?.id).toBe('c4');
      expect(p1!.discardPile.cards[0]?.id).toBe('c5');
    });

    it('shows all players\' life totals', () => {
      const state = createMockGameState();
      const sanitized = sanitizeForPlayer(state, 'p1');

      const p2 = sanitized.players.find((p: PlayerState) => p.id === 'p2');
      expect(p2!.life).toBe(20);
    });
  });
});

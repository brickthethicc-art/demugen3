import { describe, it, expect } from 'vitest';
import { sanitizeForPlayer } from '../../src/resolver/sanitize.js';
import { GamePhase, TurnPhase, STARTING_LIFE, CardType, AbilityType } from '@mugen/shared';
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
    deck: { cards: [] },
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
    turnNumber: 1,
    turnRotation: 0,
    movesUsedThisTurn: 0,
    winnerId: null,
  };
}

describe('StateSanitization', () => {
  describe('sanitizeForPlayer', () => {
    it('hides other players\' hands', () => {
      const state = createMockGameState();
      const sanitized = sanitizeForPlayer(state, 'p1');

      const p2 = sanitized.players.find((p: PlayerState) => p.id === 'p2');
      expect(p2!.hand.cards).toHaveLength(0);
    });

    it('hides other players\' deck contents', () => {
      const state = createMockGameState();
      const sanitized = sanitizeForPlayer(state, 'p1');

      const p2 = sanitized.players.find((p: PlayerState) => p.id === 'p2');
      expect(p2!.deck.cards).toHaveLength(0);
    });

    it('shows own hand', () => {
      const state = createMockGameState();
      const sanitized = sanitizeForPlayer(state, 'p1');

      const p1 = sanitized.players.find((p: PlayerState) => p.id === 'p1');
      expect(p1!.hand.cards).toHaveLength(1);
    });

    it('shows all players\' life totals', () => {
      const state = createMockGameState();
      const sanitized = sanitizeForPlayer(state, 'p1');

      const p2 = sanitized.players.find((p: PlayerState) => p.id === 'p2');
      expect(p2!.life).toBe(20);
    });
  });
});

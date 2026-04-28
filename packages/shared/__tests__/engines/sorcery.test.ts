import { describe, it, expect, beforeEach } from 'vitest';
import { canPlaySorcery, executeSorceryEffect, discardSorceryCard } from '../../src/engines/sorcery/index.js';
import { processAttack, processMove } from '../../src/engines/turn/index.js';
import { createGameState, createPlayer, createUnit, createSorcery, createUnitInstance } from '../factories.js';
import { TurnPhase, CardType, MAX_HAND_SIZE } from '../../src/types/index.js';

describe('Sorcery Card System', () => {
  describe('STEP 1-3: Validation and Phase Checks', () => {
    it('should reject sorcery play outside Ability Phase', () => {
      const state = createGameState({
        turnPhase: TurnPhase.MOVE,
        players: [
          createPlayer({ hand: { cards: [createSorcery()] } }),
          createPlayer(),
        ],
      });
      const player = state.players[0]!;
      
      const result = canPlaySorcery(state, player.id, player.hand.cards[0]!.id);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Ability Phase');
      }
    });

    it('should reject sorcery play during opponent turn', () => {
      const state = createGameState({
        turnPhase: TurnPhase.ABILITY,
        currentPlayerIndex: 1,
        players: [
          createPlayer({ hand: { cards: [createSorcery()] } }),
          createPlayer(),
        ],
      });
      const player = state.players[0]!;
      
      const result = canPlaySorcery(state, player.id, player.hand.cards[0]!.id);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Not your turn');
      }
    });

    it('should reject non-sorcery cards', () => {
      const state = createGameState({
        turnPhase: TurnPhase.ABILITY,
        players: [
          createPlayer({ hand: { cards: [createUnit({ id: 'test-unit' })] } }),
          createPlayer(),
        ],
      });
      const player = state.players[0]!;
      
      const result = canPlaySorcery(state, player.id, player.hand.cards[0]!.id);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Only sorcery cards');
      }
    });

    it('should allow sorcery play during Ability Phase on own turn', () => {
      const state = createGameState({
        turnPhase: TurnPhase.ABILITY,
        currentPlayerIndex: 0,
        players: [
          createPlayer({ hand: { cards: [createSorcery()] } }),
          createPlayer(),
        ],
      });
      const player = state.players[0]!;
      
      const result = canPlaySorcery(state, player.id, player.hand.cards[0]!.id);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeDefined();
        expect(result.value.card.cardType).toBe(CardType.SORCERY);
      }
    });
  });

  describe('STEP 4-5: Effect Execution and Validation', () => {
    let state: any;
    let player1: any;
    let player2: any;

    beforeEach(() => {
      const unit1 = createUnitInstance({ card: createUnit({ id: 'unit-1' }), position: { x: 0, y: 0 } });
      const unit2 = createUnitInstance({ card: createUnit({ id: 'unit-2' }), position: { x: 1, y: 1 }, ownerId: 'player-2' });
      
      state = createGameState({
        turnPhase: TurnPhase.ABILITY,
        currentPlayerIndex: 0,
        players: [
          createPlayer({ id: 'player-1', units: [unit1] }),
          createPlayer({ id: 'player-2', units: [unit2] }),
        ],
      });
      player1 = state.players[0]!;
      player2 = state.players[1]!;
    });

    describe('s01: Quick Strike', () => {
      it('should deal 2 damage to enemy unit', () => {
        const sorcery = createSorcery({ id: 's01', effect: 'Deal 2 damage to target unit' });
        player1.hand.cards = [sorcery];
        
        const enemyUnit = player2.units[0]!;
        const initialHp = enemyUnit.currentHp;
        
        const result = executeSorceryEffect(state, player1.id, sorcery, enemyUnit.card.id, player2.id);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const updatedEnemy = result.value.players[1]!.units.find((u: any) => u.card.id === enemyUnit.card.id);
          expect(updatedEnemy?.currentHp).toBe(initialHp - 2);
        }
      });

      it('should reject targeting friendly units', () => {
        const sorcery = createSorcery({ id: 's01' });
        player1.hand.cards = [sorcery];
        
        const friendlyUnit = player1.units[0]!;
        
        const result = executeSorceryEffect(state, player1.id, sorcery, friendlyUnit.card.id, player1.id);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain('enemy');
        }
      });
    });

    describe('s02: Minor Heal', () => {
      it('should heal 2 HP to friendly unit', () => {
        const sorcery = createSorcery({ id: 's02', effect: 'Heal 2 HP to target unit' });
        player1.hand.cards = [sorcery];
        
        const friendlyUnit = player1.units[0]!;
        friendlyUnit.currentHp = 1;
        
        const result = executeSorceryEffect(state, player1.id, sorcery, friendlyUnit.card.id, player1.id);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const updatedUnit = result.value.players[0]!.units.find((u: any) => u.card.id === friendlyUnit.card.id);
          expect(updatedUnit?.currentHp).toBe(3);
        }
      });

      it('should not exceed max HP', () => {
        const sorcery = createSorcery({ id: 's02' });
        player1.hand.cards = [sorcery];
        
        const friendlyUnit = player1.units[0]!;
        friendlyUnit.currentHp = friendlyUnit.card.maxHp;
        
        const result = executeSorceryEffect(state, player1.id, sorcery, friendlyUnit.card.id, player1.id);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const updatedUnit = result.value.players[0]!.units.find((u: any) => u.card.id === friendlyUnit.card.id);
          expect(updatedUnit?.currentHp).toBe(friendlyUnit.card.maxHp);
        }
      });
    });

    describe('s09: Mass Heal', () => {
      it('should heal all friendly units by 2 HP', () => {
        const sorcery = createSorcery({ id: 's09', effect: 'Heal 2 HP to all friendly units' });
        player1.hand.cards = [sorcery];
        
        player1.units.forEach((u: any) => { u.currentHp = 1; });
        
        const result = executeSorceryEffect(state, player1.id, sorcery);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const updatedUnits = result.value.players[0]!.units;
          updatedUnits.forEach((u: any) => {
            expect(u.currentHp).toBe(3);
          });
        }
      });
    });

    describe('s03: Scout Ahead', () => {
      it('draws one card when hand has room', () => {
        const scoutAhead = createSorcery({ id: 's03', effect: 'Draw 1 card' });
        const filledHand = Array.from({ length: MAX_HAND_SIZE - 2 }, (_, i) =>
          createSorcery({ id: `hand-${i}` })
        );
        const drawnCard = createSorcery({ id: 'drawn-card' });

        const drawState = createGameState({
          turnPhase: TurnPhase.ABILITY,
          currentPlayerIndex: 0,
          players: [
            createPlayer({
              id: 'player-1',
              hand: { cards: [scoutAhead, ...filledHand] },
              mainDeck: { cards: [drawnCard] },
            }),
            createPlayer({ id: 'player-2' }),
          ],
        });

        const result = executeSorceryEffect(drawState, 'player-1', scoutAhead);
        expect(result.ok).toBe(true);
        if (!result.ok) return;

        const updatedPlayer = result.value.players[0]!;
        expect(updatedPlayer.hand.cards).toHaveLength(MAX_HAND_SIZE);
        expect(updatedPlayer.hand.cards.some((c: any) => c.id === drawnCard.id)).toBe(true);
        expect(updatedPlayer.mainDeck.cards).toHaveLength(0);
      });

      it('draws even when hand is already at MAX_HAND_SIZE', () => {
        const scoutAhead = createSorcery({ id: 's03', effect: 'Draw 1 card' });
        const fullHand = Array.from({ length: MAX_HAND_SIZE }, (_, i) =>
          createSorcery({ id: `hand-full-${i}` })
        );
        const topDeckCard = createSorcery({ id: 'top-deck-card' });

        const fullHandState = createGameState({
          turnPhase: TurnPhase.ABILITY,
          currentPlayerIndex: 0,
          players: [
            createPlayer({
              id: 'player-1',
              hand: { cards: fullHand },
              mainDeck: { cards: [topDeckCard] },
            }),
            createPlayer({ id: 'player-2' }),
          ],
        });

        const result = executeSorceryEffect(fullHandState, 'player-1', scoutAhead);
        expect(result.ok).toBe(true);
        if (!result.ok) return;

        const updatedPlayer = result.value.players[0]!;
        expect(updatedPlayer.hand.cards).toHaveLength(MAX_HAND_SIZE + 1);
        expect(updatedPlayer.hand.cards.some((c: any) => c.id === topDeckCard.id)).toBe(true);
        expect(updatedPlayer.mainDeck.cards).toHaveLength(0);
      });
    });

    describe('s07: Weaken', () => {
      it('should apply a positive ATK_DEBUFF value', () => {
        const sorcery = createSorcery({ id: 's07' });
        player1.hand.cards = [sorcery];

        const enemyUnit = player2.units[0]!;
        const result = executeSorceryEffect(state, player1.id, sorcery, enemyUnit.card.id, player2.id);

        expect(result.ok).toBe(true);
        if (result.ok) {
          const updatedEnemy = result.value.players[1]!.units.find((u: any) => u.card.id === enemyUnit.card.id);
          const weakenModifier = updatedEnemy?.combatModifiers.find((m: any) => m.type === 'ATK_DEBUFF');
          expect(weakenModifier?.value).toBe(2);
        }
      });
    });

    describe('s15: Paralyze', () => {
      it('should prevent the target from moving on their next move phase', () => {
        const sorcery = createSorcery({ id: 's15' });
        player1.hand.cards = [sorcery];

        const enemyUnit = player2.units[0]!;
        const paralyzeResult = executeSorceryEffect(state, player1.id, sorcery, enemyUnit.card.id, player2.id);
        expect(paralyzeResult.ok).toBe(true);
        if (!paralyzeResult.ok) return;

        const moveState = {
          ...paralyzeResult.value,
          turnPhase: TurnPhase.MOVE,
          currentPlayerIndex: 1,
        };

        const moveResult = processMove(
          moveState,
          player2.id,
          enemyUnit.card.id,
          { x: 2, y: 2 }
        );

        expect(moveResult.ok).toBe(false);
        if (!moveResult.ok) {
          expect(moveResult.error).toContain('paralyzed');
        }
      });

      it('should prevent the target from attacking on their next attack phase', () => {
        const sorcery = createSorcery({ id: 's15' });
        player1.hand.cards = [sorcery];

        const enemyUnit = player2.units[0]!;
        const paralyzeResult = executeSorceryEffect(state, player1.id, sorcery, enemyUnit.card.id, player2.id);
        expect(paralyzeResult.ok).toBe(true);
        if (!paralyzeResult.ok) return;

        const attackState = {
          ...paralyzeResult.value,
          turnPhase: TurnPhase.ATTACK,
          currentPlayerIndex: 1,
        };

        const attackResult = processAttack(
          attackState,
          player2.id,
          enemyUnit.card.id,
          player1.units[0]!.card.id,
          player1.id
        );

        expect(attackResult.ok).toBe(false);
        if (!attackResult.ok) {
          expect(attackResult.error).toContain('paralyzed');
        }
      });
    });

    describe('s22: Soul Drain', () => {
      it('should heal only by the actual damage dealt', () => {
        const sorcery = createSorcery({ id: 's22' });
        player1.hand.cards = [sorcery];

        const enemyUnit = player2.units[0]!;
        enemyUnit.currentHp = 2;
        player1.life = 10;

        const result = executeSorceryEffect(state, player1.id, sorcery, enemyUnit.card.id, player2.id);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const updatedCaster = result.value.players[0]!;
          expect(updatedCaster.life).toBe(12);
        }
      });
    });
  });

  describe('STEP 6: Discard After Use', () => {
    it('should remove sorcery from hand and add to discard pile', () => {
      const sorcery = createSorcery();
      const state = createGameState({
        turnPhase: TurnPhase.ABILITY,
        players: [
          createPlayer({ hand: { cards: [sorcery] } }),
          createPlayer(),
        ],
      });
      const player = state.players[0]!;
      
      const initialHandSize = player.hand.cards.length;
      const initialDiscardSize = player.discardPile.cards.length;
      
      const newState = discardSorceryCard(state, 0, sorcery);
      
      const updatedPlayer = newState.players[0]!;
      expect(updatedPlayer.hand.cards.length).toBe(initialHandSize - 1);
      expect(updatedPlayer.hand.cards.find((c: any) => c.id === sorcery.id)).toBeUndefined();
      expect(updatedPlayer.discardPile.cards.length).toBe(initialDiscardSize + 1);
      expect(updatedPlayer.discardPile.cards.find((c: any) => c.id === sorcery.id)).toBeDefined();
    });
  });

  describe('STEP 7: Error Handling', () => {
    it('should handle unknown sorcery cards gracefully', () => {
      const state = createGameState({
        turnPhase: TurnPhase.ABILITY,
        players: [
          createPlayer(),
          createPlayer(),
        ],
      });
      const player = state.players[0]!;
      const sorcery = createSorcery({ id: 'unknown-card' });
      
      const result = executeSorceryEffect(state, player.id, sorcery);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Unknown sorcery card');
      }
    });

    it('should handle missing target units', () => {
      const state = createGameState({
        turnPhase: TurnPhase.ABILITY,
        players: [
          createPlayer(),
          createPlayer(),
        ],
      });
      const player = state.players[0]!;
      const sorcery = createSorcery({ id: 's01' });
      
      const result = executeSorceryEffect(state, player.id, sorcery, 'non-existent-unit');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Target unit not found');
      }
    });
  });

  describe('STEP 8: Integration Test', () => {
    it('should complete full sorcery play flow', () => {
      const sorcery = createSorcery({ id: 's01' });
      const enemyUnit = createUnitInstance({ card: createUnit({ id: 'enemy-unit' }), position: { x: 1, y: 1 }, ownerId: 'player-2' });
      
      const state = createGameState({
        turnPhase: TurnPhase.ABILITY,
        currentPlayerIndex: 0,
        players: [
          createPlayer({ id: 'player-1', hand: { cards: [sorcery] } }),
          createPlayer({ id: 'player-2', units: [enemyUnit] }),
        ],
      });
      const player = state.players[0]!;
      
      // Step 1: Validate
      const validation = canPlaySorcery(state, player.id, sorcery.id);
      expect(validation.ok).toBe(true);
      
      // Step 2: Execute effect
      const effectResult = executeSorceryEffect(state, player.id, sorcery, enemyUnit.card.id, 'player-2');
      expect(effectResult.ok).toBe(true);
      if (!effectResult.ok) return;
      
      // Step 3: Discard
      const finalState = discardSorceryCard(effectResult.value, 0, sorcery);
      
      // Verify final state
      const finalPlayer = finalState.players[0]!;
      expect(finalPlayer.hand.cards.find((c: any) => c.id === sorcery.id)).toBeUndefined();
      expect(finalPlayer.discardPile.cards.find((c: any) => c.id === sorcery.id)).toBeDefined();
      
      const finalEnemy = finalState.players[1]!.units.find((u: any) => u.card.id === enemyUnit.card.id);
      expect(finalEnemy?.currentHp).toBeLessThan(enemyUnit.currentHp);
    });
  });
});

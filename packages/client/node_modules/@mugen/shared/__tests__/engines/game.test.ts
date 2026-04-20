import { describe, it, expect, beforeEach } from 'vitest';
import { createPlayer, resetIdCounter } from '../factories.js';
import {
  createGame,
  transitionPhase,
  getActivePlayer,
  getAlivePlayers,
  eliminatePlayer,
} from '../../src/engines/game/index.js';
import { GamePhase, MIN_PLAYERS, MAX_PLAYERS } from '../../src/types/index.js';
import type { PlayerState } from '../../src/types/index.js';

describe('GameEngine', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('createGame', () => {
    it('2 players — returns initial game state in LOBBY phase', () => {
      const players = [createPlayer(), createPlayer()];
      const result = createGame(players);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.phase).toBe(GamePhase.LOBBY);
        expect(result.value.players).toHaveLength(2);
      }
    });

    it('4 players — returns initial game state', () => {
      const players = Array.from({ length: 4 }, () => createPlayer());
      const result = createGame(players);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.players).toHaveLength(4);
      }
    });

    it('1 player — returns error (min 2)', () => {
      const players = [createPlayer()];
      const result = createGame(players);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain(`${MIN_PLAYERS}`);
      }
    });

    it('5 players — returns error (max 4)', () => {
      const players = Array.from({ length: 5 }, () => createPlayer());
      const result = createGame(players);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain(`${MAX_PLAYERS}`);
      }
    });
  });

  describe('transitionPhase', () => {
    it('LOBBY → PRE_GAME — valid when all players ready', () => {
      const players = [
        createPlayer({ isReady: true }),
        createPlayer({ isReady: true }),
      ];
      const gameResult = createGame(players);
      expect(gameResult.ok).toBe(true);
      if (!gameResult.ok) return;

      const result = transitionPhase(gameResult.value, GamePhase.PRE_GAME);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.phase).toBe(GamePhase.PRE_GAME);
      }
    });

    it('LOBBY → PRE_GAME — invalid when not all ready', () => {
      const players = [
        createPlayer({ isReady: true }),
        createPlayer({ isReady: false }),
      ];
      const gameResult = createGame(players);
      expect(gameResult.ok).toBe(true);
      if (!gameResult.ok) return;

      const result = transitionPhase(gameResult.value, GamePhase.PRE_GAME);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('ready');
      }
    });

    it('PRE_GAME → IN_PROGRESS — valid when all teams locked', () => {
      const players = [
        createPlayer({
          isReady: true,
          team: { activeUnits: [], reserveUnits: [], locked: true },
        }),
        createPlayer({
          isReady: true,
          team: { activeUnits: [], reserveUnits: [], locked: true },
        }),
      ];
      const gameResult = createGame(players);
      if (!gameResult.ok) return;

      const preGameResult = transitionPhase(gameResult.value, GamePhase.PRE_GAME);
      if (!preGameResult.ok) return;

      const result = transitionPhase(preGameResult.value, GamePhase.IN_PROGRESS);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.phase).toBe(GamePhase.IN_PROGRESS);
      }
    });

    it('PRE_GAME → IN_PROGRESS — invalid when teams not locked', () => {
      const players = [
        createPlayer({
          isReady: true,
          team: { activeUnits: [], reserveUnits: [], locked: true },
        }),
        createPlayer({
          isReady: true,
          team: { activeUnits: [], reserveUnits: [], locked: false },
        }),
      ];
      const gameResult = createGame(players);
      if (!gameResult.ok) return;

      const preGameResult = transitionPhase(gameResult.value, GamePhase.PRE_GAME);
      if (!preGameResult.ok) return;

      const result = transitionPhase(preGameResult.value, GamePhase.IN_PROGRESS);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('locked');
      }
    });

    it('IN_PROGRESS → ENDED — valid when one player remaining', () => {
      const players = [
        createPlayer({ isReady: true, isEliminated: false, team: { activeUnits: [], reserveUnits: [], locked: true } }),
        createPlayer({ isReady: true, isEliminated: true, team: { activeUnits: [], reserveUnits: [], locked: true } }),
      ];
      const gameResult = createGame(players);
      if (!gameResult.ok) return;

      let state = gameResult.value;
      const toPre = transitionPhase(state, GamePhase.PRE_GAME);
      if (!toPre.ok) return;
      const toInProgress = transitionPhase(toPre.value, GamePhase.IN_PROGRESS);
      if (!toInProgress.ok) return;

      const result = transitionPhase(toInProgress.value, GamePhase.ENDED);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.phase).toBe(GamePhase.ENDED);
      }
    });
  });

  describe('getActivePlayer', () => {
    it('returns current turn player', () => {
      const p1 = createPlayer({ id: 'p1' });
      const p2 = createPlayer({ id: 'p2' });
      const gameResult = createGame([p1, p2]);
      if (!gameResult.ok) return;

      const active = getActivePlayer(gameResult.value);
      expect(active.id).toBe('p1');
    });
  });

  describe('getAlivePlayers', () => {
    it('returns players with life > 0 and not eliminated', () => {
      const p1 = createPlayer({ isEliminated: false });
      const p2 = createPlayer({ isEliminated: true });
      const p3 = createPlayer({ isEliminated: false });
      const gameResult = createGame([p1, p2, p3]);
      if (!gameResult.ok) return;

      const alive = getAlivePlayers(gameResult.value);
      expect(alive).toHaveLength(2);
    });
  });

  describe('eliminatePlayer', () => {
    it('sets player as eliminated', () => {
      const p1 = createPlayer({ id: 'p1' });
      const p2 = createPlayer({ id: 'p2' });
      const gameResult = createGame([p1, p2]);
      if (!gameResult.ok) return;

      const result = eliminatePlayer(gameResult.value, 'p2');
      expect(result.ok).toBe(true);
      if (result.ok) {
        const eliminated = result.value.players.find((p: PlayerState) => p.id === 'p2');
        expect(eliminated?.isEliminated).toBe(true);
      }
    });
  });
});

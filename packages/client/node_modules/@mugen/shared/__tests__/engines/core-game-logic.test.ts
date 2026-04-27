import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGameState,
  createPlayer,
  createUnit,
  createUnitInstance,
  createBoard,
  createSorcery,
  resetIdCounter,
} from '../factories.js';
import {
  startTurn,
  advancePhase,
  processMove,
  processAttack,
  endTurn,
  deployReserve,
  playCard,
  getBenchDeploymentNotification,
} from '../../src/engines/turn/index.js';
import {
  TurnPhase,
  GamePhase,
  MAX_HAND_SIZE,
} from '../../src/types/index.js';
import type { GameState, UnitInstance, Position, Card } from '../../src/types/index.js';
import { placeUnit } from '../../src/engines/board/index.js';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function createTestGame(overrides?: Partial<GameState>): GameState {
  const u1 = createUnit({ id: 'u1', atk: 3, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });
  const u2 = createUnit({ id: 'u2', atk: 2, hp: 8, maxHp: 8, movement: 2, range: 1, cost: 5 });
  const u3 = createUnit({ id: 'u3', atk: 4, hp: 6, maxHp: 6, movement: 2, range: 1, cost: 5 });
  const u4 = createUnit({ id: 'u4', atk: 3, hp: 7, maxHp: 7, movement: 2, range: 1, cost: 5 });
  const u5 = createUnit({ id: 'u5', atk: 2, hp: 9, maxHp: 9, movement: 2, range: 1, cost: 5 });
  const u6 = createUnit({ id: 'u6', atk: 5, hp: 5, maxHp: 5, movement: 2, range: 1, cost: 5 });

  const r1 = createUnit({ id: 'r1', atk: 2, hp: 4, maxHp: 4, movement: 1, range: 1, cost: 3 });
  const r2 = createUnit({ id: 'r2', atk: 2, hp: 4, maxHp: 4, movement: 1, range: 1, cost: 3 });

  const deckCard1 = createSorcery({ id: 'deck-1' });
  const deckCard2 = createSorcery({ id: 'deck-2' });
  const deckCard3 = createSorcery({ id: 'deck-3' });
  const deckCard4 = createSorcery({ id: 'deck-4' });
  const deckCard5 = createSorcery({ id: 'deck-5' });
  const deckCard6 = createSorcery({ id: 'deck-6' });

  const p1Units: UnitInstance[] = [
    createUnitInstance({ card: u1, currentHp: 10, ownerId: 'p1', position: { x: 5, y: 5 } }),
    createUnitInstance({ card: u2, currentHp: 8, ownerId: 'p1', position: { x: 7, y: 5 } }),
    createUnitInstance({ card: u3, currentHp: 6, ownerId: 'p1', position: { x: 9, y: 5 } }),
  ];

  const p2Units: UnitInstance[] = [
    createUnitInstance({ card: u4, currentHp: 7, ownerId: 'p2', position: { x: 5, y: 17 } }),
    createUnitInstance({ card: u5, currentHp: 9, ownerId: 'p2', position: { x: 7, y: 17 } }),
    createUnitInstance({ card: u6, currentHp: 5, ownerId: 'p2', position: { x: 9, y: 17 } }),
  ];

  const p1 = createPlayer({
    id: 'p1',
    life: 24,
    isReady: true,
    units: p1Units,
    team: { activeUnits: [u1, u2, u3], reserveUnits: [r1], locked: true },
    mainDeck: { cards: [deckCard1, deckCard2, deckCard3] },
    discardPile: { cards: [] },
    hand: { cards: [] },
  });

  const p2 = createPlayer({
    id: 'p2',
    life: 24,
    isReady: true,
    units: p2Units,
    team: { activeUnits: [u4, u5, u6], reserveUnits: [r2], locked: true },
    mainDeck: { cards: [deckCard4, deckCard5, deckCard6] },
    discardPile: { cards: [] },
    hand: { cards: [] },
  });

  let board = createBoard();
  for (const u of [...p1Units, ...p2Units]) {
    if (u.position) {
      const r = placeUnit(board, u.card.id, u.position);
      if (r.ok) board = r.value;
    }
  }

  return createGameState({
    phase: GamePhase.IN_PROGRESS,
    turnPhase: TurnPhase.MOVE,
    currentPlayerIndex: 0,
    players: [p1, p2],
    board,
    turnNumber: 1,
    turnRotation: 0,
    movesUsedThisTurn: 0,
    ...overrides,
  });
}

// ─── 1. Turn Rotation & Card Draw ────────────────────────────────────────────

describe('1. Turn Rotation & Card Draw', () => {
  beforeEach(() => resetIdCounter());

  it('draws a card from mainDeck at start of turn when turnRotation >= 1', () => {
    const state = createTestGame({ turnRotation: 1 });
    const before = state.players[0]!;
    expect(before.hand.cards).toHaveLength(0);
    expect(before.mainDeck.cards).toHaveLength(3);

    const after = startTurn(state);
    const p1 = after.players[0]!;
    expect(p1.hand.cards).toHaveLength(1);
    expect(p1.hand.cards[0]!.id).toBe('deck-1');
  });

  it('deck count decreases by 1 after drawing', () => {
    const state = createTestGame({ turnRotation: 1 });
    const deckBefore = state.players[0]!.mainDeck.cards.length;

    const after = startTurn(state);
    const deckAfter = after.players[0]!.mainDeck.cards.length;
    expect(deckAfter).toBe(deckBefore - 1);
  });

  it('does NOT draw during first rotation (turnRotation === 0)', () => {
    const state = createTestGame({ turnRotation: 0 });
    const after = startTurn(state);
    expect(after.players[0]!.hand.cards).toHaveLength(0);
    expect(after.players[0]!.mainDeck.cards).toHaveLength(3);
  });

  it('does not draw when mainDeck is empty', () => {
    const state = createTestGame({ turnRotation: 1 });
    const p1 = { ...state.players[0]!, mainDeck: { cards: [] } };
    const emptyDeckState = { ...state, players: [p1, state.players[1]!] };

    const after = startTurn(emptyDeckState);
    expect(after.players[0]!.hand.cards).toHaveLength(0);
  });

  it('does not draw when hand is already at MAX_HAND_SIZE', () => {
    const state = createTestGame({ turnRotation: 1 });
    const fullHand: Card[] = Array.from({ length: MAX_HAND_SIZE }, (_, i) =>
      createSorcery({ id: `hand-${i}` })
    );
    const p1 = { ...state.players[0]!, hand: { cards: fullHand } };
    const fullHandState = { ...state, players: [p1, state.players[1]!] };

    const after = startTurn(fullHandState);
    expect(after.players[0]!.hand.cards).toHaveLength(MAX_HAND_SIZE);
    expect(after.players[0]!.mainDeck.cards).toHaveLength(3);
  });

  it('discard pile increases after card use via playCard', () => {
    const handCard = createSorcery({ id: 'in-hand' });
    const state = createTestGame();
    const p1 = { ...state.players[0]!, hand: { cards: [handCard] } };
    const withHand = { ...state, players: [p1, state.players[1]!] };

    const result = playCard(withHand, 'p1', 'in-hand');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.players[0]!.hand.cards).toHaveLength(0);
      expect(result.value.players[0]!.discardPile.cards).toHaveLength(1);
      expect(result.value.players[0]!.discardPile.cards[0]!.id).toBe('in-hand');
    }
  });

  it('deck + discard + hand total stays constant across draw + use', () => {
    const state = createTestGame({ turnRotation: 1 });
    const totalBefore =
      state.players[0]!.mainDeck.cards.length +
      state.players[0]!.discardPile.cards.length +
      state.players[0]!.hand.cards.length;

    // Draw a card
    let current = startTurn(state);
    // Use the drawn card
    const drawnId = current.players[0]!.hand.cards[0]!.id;
    const useResult = playCard(current, 'p1', drawnId);
    expect(useResult.ok).toBe(true);
    if (useResult.ok) current = useResult.value;

    const totalAfter =
      current.players[0]!.mainDeck.cards.length +
      current.players[0]!.discardPile.cards.length +
      current.players[0]!.hand.cards.length;
    expect(totalAfter).toBe(totalBefore);
  });

  it('only draws one card per turn start — no multiple draws', () => {
    const state = createTestGame({ turnRotation: 2 });
    const after = startTurn(state);
    expect(after.players[0]!.hand.cards).toHaveLength(1);
    expect(after.players[0]!.mainDeck.cards).toHaveLength(2);
  });

  it('endTurn rotates to next player and draws for them on rotation >= 1', () => {
    const state = createTestGame({
      turnPhase: TurnPhase.END,
      currentPlayerIndex: 0,
      turnRotation: 1,
    });
    const result = endTurn(state);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.currentPlayerIndex).toBe(1);
      // turnRotation stays 1 (no wrap), p2 draws
      const p2 = result.value.players[1]!;
      expect(p2.hand.cards).toHaveLength(1);
      expect(p2.mainDeck.cards).toHaveLength(2);
    }
  });
});

// ─── 2. Move Phase ───────────────────────────────────────────────────────────

describe('2. Move Phase', () => {
  beforeEach(() => resetIdCounter());

  // u1 at (5,5) with movement=2

  it('valid move north (0, -1)', () => {
    const state = createTestGame();
    const result = processMove(state, 'p1', 'u1', { x: 5, y: 4 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const unit = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
      expect(unit!.position).toEqual({ x: 5, y: 4 });
    }
  });

  it('valid move south (0, +1)', () => {
    const state = createTestGame();
    const result = processMove(state, 'p1', 'u1', { x: 5, y: 6 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const unit = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
      expect(unit!.position).toEqual({ x: 5, y: 6 });
    }
  });

  it('valid move east (+1, 0)', () => {
    const state = createTestGame();
    const result = processMove(state, 'p1', 'u1', { x: 6, y: 5 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const unit = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
      expect(unit!.position).toEqual({ x: 6, y: 5 });
    }
  });

  it('valid move west (-1, 0)', () => {
    const state = createTestGame();
    const result = processMove(state, 'p1', 'u1', { x: 4, y: 5 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const unit = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
      expect(unit!.position).toEqual({ x: 4, y: 5 });
    }
  });

  it('valid move northeast (+1, -1) — diagonal, manhattan dist 2', () => {
    const state = createTestGame();
    const result = processMove(state, 'p1', 'u1', { x: 6, y: 4 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const unit = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
      expect(unit!.position).toEqual({ x: 6, y: 4 });
    }
  });

  it('valid move northwest (-1, -1) — diagonal', () => {
    const state = createTestGame();
    const result = processMove(state, 'p1', 'u1', { x: 4, y: 4 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const unit = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
      expect(unit!.position).toEqual({ x: 4, y: 4 });
    }
  });

  it('valid move southeast (+1, +1) — diagonal', () => {
    const state = createTestGame();
    const result = processMove(state, 'p1', 'u1', { x: 6, y: 6 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const unit = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
      expect(unit!.position).toEqual({ x: 6, y: 6 });
    }
  });

  it('valid move southwest (-1, +1) — diagonal', () => {
    const state = createTestGame();
    const result = processMove(state, 'p1', 'u1', { x: 4, y: 6 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const unit = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
      expect(unit!.position).toEqual({ x: 4, y: 6 });
    }
  });

  it('rejects move off board — negative coordinates', () => {
    // Place unit at board edge
    const u = createUnit({ id: 'edge', movement: 2, range: 1, hp: 5, maxHp: 5, atk: 1, cost: 3 });
    const state = createTestGame();
    const p1 = {
      ...state.players[0]!,
      units: [
        createUnitInstance({ card: u, currentHp: 5, ownerId: 'p1', position: { x: 0, y: 0 } }),
        ...state.players[0]!.units.slice(1),
      ],
    };
    let board = createBoard();
    for (const unit of [...p1.units, ...state.players[1]!.units]) {
      if (unit.position) {
        const r = placeUnit(board, unit.card.id, unit.position);
        if (r.ok) board = r.value;
      }
    }
    const edgeState = { ...state, players: [p1, state.players[1]!], board };
    const result = processMove(edgeState, 'p1', 'edge', { x: -1, y: 0 });
    expect(result.ok).toBe(false);
  });

  it('rejects move off board — exceeds dimensions', () => {
    const u = createUnit({ id: 'edge2', movement: 2, range: 1, hp: 5, maxHp: 5, atk: 1, cost: 3 });
    const state = createTestGame();
    const p1 = {
      ...state.players[0]!,
      units: [
        createUnitInstance({ card: u, currentHp: 5, ownerId: 'p1', position: { x: 22, y: 22 } }),
        ...state.players[0]!.units.slice(1),
      ],
    };
    let board = createBoard();
    for (const unit of [...p1.units, ...state.players[1]!.units]) {
      if (unit.position) {
        const r = placeUnit(board, unit.card.id, unit.position);
        if (r.ok) board = r.value;
      }
    }
    const edgeState = { ...state, players: [p1, state.players[1]!], board };
    const result = processMove(edgeState, 'p1', 'edge2', { x: 23, y: 22 });
    expect(result.ok).toBe(false);
  });

  it('rejects move to occupied space', () => {
    const state = createTestGame();
    // u2 is at (7,5), try to move u1 (5,5) there (within movement=2)
    const result = processMove(state, 'p1', 'u1', { x: 7, y: 5 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('occupied');
  });

  it('rejects move by bench/inactive unit (no position)', () => {
    const bench = createUnit({ id: 'bench-u', movement: 2, range: 1, hp: 5, maxHp: 5, atk: 1, cost: 3 });
    const state = createTestGame();
    const p1 = {
      ...state.players[0]!,
      units: [
        ...state.players[0]!.units,
        createUnitInstance({ card: bench, currentHp: 5, ownerId: 'p1', position: null }),
      ],
    };
    const benchState = { ...state, players: [p1, state.players[1]!] };
    const result = processMove(benchState, 'p1', 'bench-u', { x: 3, y: 3 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('no position');
  });

  it('rejects more than MAX_MOVES_PER_TURN (3) moves per turn', () => {
    const state = createTestGame({ movesUsedThisTurn: 3 });
    const result = processMove(state, 'p1', 'u1', { x: 5, y: 4 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('maximum');
  });

  it('updates position on the moved unit in player state', () => {
    const state = createTestGame();
    const result = processMove(state, 'p1', 'u1', { x: 5, y: 4 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const unit = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
      expect(unit!.position).toEqual({ x: 5, y: 4 });
      expect(unit!.hasMovedThisTurn).toBe(true);
    }
  });

  it('updates board cells after move — old cell empty, new cell occupied', () => {
    const state = createTestGame();
    const result = processMove(state, 'p1', 'u1', { x: 5, y: 4 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.board.cells[5]![5]!.occupantId).toBeNull();
      expect(result.value.board.cells[4]![5]!.occupantId).toBe('u1');
    }
  });

  it('increments movesUsedThisTurn on each valid move', () => {
    let state = createTestGame();
    const r1 = processMove(state, 'p1', 'u1', { x: 5, y: 4 });
    expect(r1.ok).toBe(true);
    if (r1.ok) {
      expect(r1.value.movesUsedThisTurn).toBe(1);
      state = r1.value;
    }
    const r2 = processMove(state, 'p1', 'u2', { x: 7, y: 4 });
    expect(r2.ok).toBe(true);
    if (r2.ok) {
      expect(r2.value.movesUsedThisTurn).toBe(2);
    }
  });
});

// ─── 3. Attack / Ability Phase ───────────────────────────────────────────────

describe('3. Attack / Ability Phase', () => {
  beforeEach(() => resetIdCounter());

  function adjacentCombatState(): GameState {
    // Place u1 (atk=3, hp=10) adjacent to u4 (atk=3, hp=7) for attack
    const base = createTestGame({ turnPhase: TurnPhase.ATTACK });
    const p1 = base.players[0]!;
    const p2 = base.players[1]!;

    const updatedP1Units = p1.units.map((u: UnitInstance) =>
      u.card.id === 'u1' ? { ...u, position: { x: 5, y: 16 } as Position } : u
    );

    let board = createBoard();
    for (const u of updatedP1Units) {
      if (u.position) {
        const r = placeUnit(board, u.card.id, u.position);
        if (r.ok) board = r.value;
      }
    }
    for (const u of p2.units) {
      if (u.position) {
        const r = placeUnit(board, u.card.id, u.position);
        if (r.ok) board = r.value;
      }
    }

    return { ...base, players: [{ ...p1, units: updatedP1Units }, p2], board };
  }

  it('bidirectional damage: both attacker and defender lose HP', () => {
    const state = adjacentCombatState();
    const attackerBefore = state.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1')!;
    const defenderBefore = state.players[1]!.units.find((u: UnitInstance) => u.card.id === 'u4')!;

    const result = processAttack(state, 'p1', 'u1', 'u4');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const attacker = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
      const defender = result.value.players[1]!.units.find((u: UnitInstance) => u.card.id === 'u4');

      // Both should have taken damage (unless one died and was removed)
      if (attacker) expect(attacker.currentHp).toBeLessThan(attackerBefore.currentHp);
      if (defender) expect(defender.currentHp).toBeLessThan(defenderBefore.currentHp);
    }
  });

  it('attacker HP reduced by defender ATK', () => {
    const state = adjacentCombatState();
    // u1: hp=10, u4: atk=3 → u1 should have 10-3=7 after combat
    const result = processAttack(state, 'p1', 'u1', 'u4');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const attacker = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
      expect(attacker).toBeDefined();
      expect(attacker!.currentHp).toBe(7); // 10 - 3
    }
  });

  it('defender HP reduced by attacker ATK', () => {
    const state = adjacentCombatState();
    // u4: hp=7, u1: atk=3 → u4 should have 7-3=4 after combat
    const result = processAttack(state, 'p1', 'u1', 'u4');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const defender = result.value.players[1]!.units.find((u: UnitInstance) => u.card.id === 'u4');
      expect(defender).toBeDefined();
      expect(defender!.currentHp).toBe(4); // 7 - 3
    }
  });

  it('unit with HP <= 0 is removed from player units array', () => {
    // Create fragile defender: hp=1, gets hit by atk=3 → dies
    const fragile = createUnit({ id: 'fragile', atk: 1, hp: 1, maxHp: 1, movement: 2, range: 1, cost: 2 });
    const base = createTestGame({ turnPhase: TurnPhase.ATTACK });
    const p2 = {
      ...base.players[1]!,
      units: [
        createUnitInstance({ card: fragile, currentHp: 1, ownerId: 'p2', position: { x: 5, y: 16 } }),
        ...base.players[1]!.units.slice(1),
      ],
    };

    const p1 = base.players[0]!;
    const updatedP1Units = p1.units.map((u: UnitInstance) =>
      u.card.id === 'u1' ? { ...u, position: { x: 5, y: 15 } as Position } : u
    );

    let board = createBoard();
    for (const u of updatedP1Units) {
      if (u.position) {
        const r = placeUnit(board, u.card.id, u.position);
        if (r.ok) board = r.value;
      }
    }
    for (const u of p2.units) {
      if (u.position) {
        const r = placeUnit(board, u.card.id, u.position);
        if (r.ok) board = r.value;
      }
    }

    const state = { ...base, players: [{ ...p1, units: updatedP1Units }, p2], board };
    const result = processAttack(state, 'p1', 'u1', 'fragile');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const deadUnit = result.value.players[1]!.units.find((u: UnitInstance) => u.card.id === 'fragile');
      expect(deadUnit).toBeUndefined();
    }
  });

  it('dead unit cannot move on subsequent turn', () => {
    // After a unit dies and is removed from units[], processMove cannot find it
    const state = createTestGame();
    const p1 = {
      ...state.players[0]!,
      units: state.players[0]!.units.filter((u: UnitInstance) => u.card.id !== 'u1'),
    };
    const noU1State = { ...state, players: [p1, state.players[1]!] };

    const result = processMove(noU1State, 'p1', 'u1', { x: 5, y: 4 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('own');
  });

  it('dead unit cannot attack', () => {
    const state = createTestGame({ turnPhase: TurnPhase.ATTACK });
    const p1 = {
      ...state.players[0]!,
      units: state.players[0]!.units.filter((u: UnitInstance) => u.card.id !== 'u1'),
    };
    const noU1State = { ...state, players: [p1, state.players[1]!] };

    const result = processAttack(noU1State, 'p1', 'u1', 'u4');
    expect(result.ok).toBe(false);
  });

  it('single attack can kill both units (mutual destruction)', () => {
    const a = createUnit({ id: 'a', atk: 5, hp: 3, maxHp: 3, movement: 2, range: 1, cost: 5 });
    const b = createUnit({ id: 'b', atk: 5, hp: 3, maxHp: 3, movement: 2, range: 1, cost: 5 });

    const aInstance = createUnitInstance({ card: a, currentHp: 3, ownerId: 'p1', position: { x: 10, y: 10 } });
    const bInstance = createUnitInstance({ card: b, currentHp: 3, ownerId: 'p2', position: { x: 10, y: 11 } });

    const state = createTestGame({ turnPhase: TurnPhase.ATTACK });
    const p1 = { ...state.players[0]!, units: [aInstance, ...state.players[0]!.units.slice(1)] };
    const p2 = { ...state.players[1]!, units: [bInstance, ...state.players[1]!.units.slice(1)] };

    let board = createBoard();
    for (const u of [...p1.units, ...p2.units]) {
      if (u.position) {
        const r = placeUnit(board, u.card.id, u.position);
        if (r.ok) board = r.value;
      }
    }

    const combatState = { ...state, players: [p1, p2], board };
    const result = processAttack(combatState, 'p1', 'a', 'b');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const unitA = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'a');
      const unitB = result.value.players[1]!.units.find((u: UnitInstance) => u.card.id === 'b');
      expect(unitA).toBeUndefined();
      expect(unitB).toBeUndefined();
    }
  });

  it('turn ownership enforced: cannot attack with opponent unit', () => {
    const state = adjacentCombatState();
    const result = processAttack(state, 'p2', 'u4', 'u1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('turn');
  });

  it('marks attacker as having attacked after valid attack', () => {
    const state = adjacentCombatState();
    const result = processAttack(state, 'p1', 'u1', 'u4');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const unit = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'u1');
      if (unit) expect(unit.hasAttackedThisTurn).toBe(true);
    }
  });

  it('unit cannot attack twice in one turn', () => {
    const state = adjacentCombatState();
    const p1 = state.players[0]!;
    const updatedUnits = p1.units.map((u: UnitInstance) =>
      u.card.id === 'u1' ? { ...u, hasAttackedThisTurn: true } : u
    );
    const attacked = { ...state, players: [{ ...p1, units: updatedUnits }, state.players[1]!] };
    const result = processAttack(attacked, 'p1', 'u1', 'u4');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('already attacked');
  });
});

// ─── 4. Bench Unit Management ────────────────────────────────────────────────

describe('4. Bench Unit Management', () => {
  beforeEach(() => resetIdCounter());

  it('reserve locked during same turn when attacker dies', () => {
    // Simulate attacker dying → reserveLockedUntilNextTurn set to true
    const weak = createUnit({ id: 'weak', atk: 1, hp: 1, maxHp: 1, movement: 2, range: 1, cost: 2 });
    const strong = createUnit({ id: 'strong', atk: 10, hp: 10, maxHp: 10, movement: 2, range: 1, cost: 5 });

    const weakInst = createUnitInstance({ card: weak, currentHp: 1, ownerId: 'p1', position: { x: 10, y: 10 } });
    const strongInst = createUnitInstance({ card: strong, currentHp: 10, ownerId: 'p2', position: { x: 10, y: 11 } });

    const state = createTestGame({ turnPhase: TurnPhase.ATTACK });
    const p1 = { ...state.players[0]!, units: [weakInst, ...state.players[0]!.units.slice(1)] };
    const p2 = { ...state.players[1]!, units: [strongInst, ...state.players[1]!.units.slice(1)] };

    let board = createBoard();
    for (const u of [...p1.units, ...p2.units]) {
      if (u.position) {
        const r = placeUnit(board, u.card.id, u.position);
        if (r.ok) board = r.value;
      }
    }

    const combatState = { ...state, players: [p1, p2], board };
    const result = processAttack(combatState, 'p1', 'weak', 'strong');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.players[0]!.reserveLockedUntilNextTurn).toBe(true);
    }
  });

  it('reserve unlocked on next turn start', () => {
    const state = createTestGame({ turnRotation: 1 });
    const p1 = { ...state.players[0]!, reserveLockedUntilNextTurn: true };
    const lockedState = { ...state, players: [p1, state.players[1]!] };

    const after = startTurn(lockedState);
    expect(after.players[0]!.reserveLockedUntilNextTurn).toBe(false);
  });

  it('bench units cannot be deployed when reserve is locked', () => {
    const state = createTestGame();
    const p1 = { ...state.players[0]!, reserveLockedUntilNextTurn: true };
    const lockedState = { ...state, players: [p1, state.players[1]!] };

    const result = deployReserve(lockedState, 'p1', 'r1', { x: 3, y: 3 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('locked');
  });

  it('getBenchDeploymentNotification returns notification when active < 3 and reserves available', () => {
    const state = createTestGame();
    // Remove one active unit from p1
    const p1 = {
      ...state.players[0]!,
      units: state.players[0]!.units.slice(0, 2), // only 2 active
      reserveLockedUntilNextTurn: false,
    };
    const updatedState = { ...state, players: [p1, state.players[1]!] };

    const notification = getBenchDeploymentNotification(updatedState, 'p1');
    expect(notification).toBe('Please move your available bench units into the field');
  });

  it('no notification when all 3 active units are on board', () => {
    const state = createTestGame();
    const notification = getBenchDeploymentNotification(state, 'p1');
    expect(notification).toBeNull();
  });

  it('no notification when reserves are empty', () => {
    const state = createTestGame();
    const p1 = {
      ...state.players[0]!,
      units: state.players[0]!.units.slice(0, 2),
      team: { ...state.players[0]!.team, reserveUnits: [] },
    };
    const updatedState = { ...state, players: [p1, state.players[1]!] };

    const notification = getBenchDeploymentNotification(updatedState, 'p1');
    expect(notification).toBeNull();
  });

  it('no notification when reserve is locked', () => {
    const state = createTestGame();
    const p1 = {
      ...state.players[0]!,
      units: state.players[0]!.units.slice(0, 2),
      reserveLockedUntilNextTurn: true,
    };
    const updatedState = { ...state, players: [p1, state.players[1]!] };

    const notification = getBenchDeploymentNotification(updatedState, 'p1');
    expect(notification).toBeNull();
  });

  it('cannot deploy more than ACTIVE_UNIT_COUNT (3) units on board', () => {
    // All 3 active units are on board → deploy should fail
    const state = createTestGame();
    const result = deployReserve(state, 'p1', 'r1', { x: 3, y: 3 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('exceed');
  });

  it('deployed reserve unit appears on board and in player units', () => {
    const state = createTestGame();
    // Remove one active unit so we have < 3
    const p1 = {
      ...state.players[0]!,
      units: state.players[0]!.units.slice(0, 2),
    };
    const updatedState = { ...state, players: [p1, state.players[1]!] };

    const result = deployReserve(updatedState, 'p1', 'r1', { x: 3, y: 3 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const deployed = result.value.players[0]!.units.find((u: UnitInstance) => u.card.id === 'r1');
      expect(deployed).toBeDefined();
      expect(deployed!.position).toEqual({ x: 3, y: 3 });
      expect(result.value.board.cells[3]![3]!.occupantId).toBe('p1-r1');
    }
  });

  it('deployed reserve removed from team.reserveUnits', () => {
    const state = createTestGame();
    const p1 = {
      ...state.players[0]!,
      units: state.players[0]!.units.slice(0, 2),
    };
    const updatedState = { ...state, players: [p1, state.players[1]!] };

    const result = deployReserve(updatedState, 'p1', 'r1', { x: 3, y: 3 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const remaining = result.value.players[0]!.team.reserveUnits;
      expect(remaining.find((u) => u.id === 'r1')).toBeUndefined();
    }
  });
});

// ─── 5. Multi-turn Integration ───────────────────────────────────────────────

describe('5. Multi-turn Integration', () => {
  beforeEach(() => resetIdCounter());

  it('full 2-player turn cycle maintains state integrity', () => {
    let state = createTestGame();
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.turnRotation).toBe(0);

    // P1 turn: move → advance → advance → advance → end
    let result = advancePhase(state); // MOVE → ABILITY
    expect(result.ok).toBe(true);
    if (result.ok) state = result.value;

    result = advancePhase(state); // ABILITY → ATTACK
    expect(result.ok).toBe(true);
    if (result.ok) state = result.value;

    result = advancePhase(state); // ATTACK → END
    expect(result.ok).toBe(true);
    if (result.ok) state = result.value;

    result = endTurn(state); // END → next player
    expect(result.ok).toBe(true);
    if (result.ok) state = result.value;
    expect(state.currentPlayerIndex).toBe(1);
    expect(state.turnRotation).toBe(0);

    // P2 turn: advance through phases → end
    result = advancePhase(state);
    expect(result.ok).toBe(true);
    if (result.ok) state = result.value;

    result = advancePhase(state);
    expect(result.ok).toBe(true);
    if (result.ok) state = result.value;

    result = advancePhase(state);
    expect(result.ok).toBe(true);
    if (result.ok) state = result.value;

    result = endTurn(state);
    expect(result.ok).toBe(true);
    if (result.ok) state = result.value;

    // Back to P1, rotation incremented
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.turnRotation).toBe(1);
    expect(state.turnNumber).toBe(2);

    // P1 should have drawn a card
    expect(state.players[0]!.hand.cards).toHaveLength(1);
    expect(state.players[0]!.mainDeck.cards).toHaveLength(2);
  });

  it('multiple rotation draws deplete deck correctly', () => {
    let state = createTestGame();

    // Simulate 3 full rotations to draw all 3 cards for p1
    for (let rotation = 0; rotation < 3; rotation++) {
      // P1 turn
      let r = advancePhase(state);
      if (r.ok) state = r.value;
      r = advancePhase(state);
      if (r.ok) state = r.value;
      r = advancePhase(state);
      if (r.ok) state = r.value;
      r = endTurn(state);
      if (r.ok) state = r.value;

      // P2 turn
      r = advancePhase(state);
      if (r.ok) state = r.value;
      r = advancePhase(state);
      if (r.ok) state = r.value;
      r = advancePhase(state);
      if (r.ok) state = r.value;
      r = endTurn(state);
      if (r.ok) state = r.value;
    }

    // After 3 rotations, p1 should have drawn 3 cards (one per rotation after first)
    // rotation 0: no draw, rotation 1: draw, rotation 2: draw → total 2 draws
    // Wait: rotation 0 ends → rotation 1 starts with draw → that's 1 draw
    // rotation 1 ends → rotation 2 starts with draw → that's 2 draws
    // rotation 2 ends → rotation 3 starts with draw → that's 3 draws
    // After 3 full rotations: turnRotation = 3, p1 drew at rotations 1, 2, 3
    expect(state.turnRotation).toBe(3);
    expect(state.players[0]!.hand.cards).toHaveLength(3);
    expect(state.players[0]!.mainDeck.cards).toHaveLength(0);
  });

  it('state consistent: player units remain unchanged through opponent turn', () => {
    let state = createTestGame();
    const p1UnitsBeforeP2Turn = state.players[0]!.units.map((u: UnitInstance) => u.card.id);

    // P1 advances to END and ends turn
    let r = advancePhase(state);
    if (r.ok) state = r.value;
    r = advancePhase(state);
    if (r.ok) state = r.value;
    r = advancePhase(state);
    if (r.ok) state = r.value;
    r = endTurn(state);
    if (r.ok) state = r.value;

    // During P2 turn, P1 units should remain the same
    const p1UnitsDuringP2Turn = state.players[0]!.units.map((u: UnitInstance) => u.card.id);
    expect(p1UnitsDuringP2Turn).toEqual(p1UnitsBeforeP2Turn);
  });

  it('overlapping move attempts on same cell are rejected', () => {
    let state = createTestGame();

    // Move u1 to (5,4)
    const r1 = processMove(state, 'p1', 'u1', { x: 5, y: 4 });
    expect(r1.ok).toBe(true);
    if (r1.ok) state = r1.value;

    // Try to move u2 to (5,4) — should fail (occupied by u1)
    const r2 = processMove(state, 'p1', 'u2', { x: 5, y: 4 });
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error).toContain('occupied');
  });
});

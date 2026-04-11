import type { GameState, UnitInstance, Position, PlayerState } from '../../types/index.js';
import { TurnPhase, MAX_MOVES_PER_TURN } from '../../types/index.js';
import type { Result } from '../../types/actions.js';
import { moveUnit as boardMoveUnit, placeUnit, removeUnit as boardRemoveUnit } from '../board/index.js';
import { resolveCombat } from '../combat/index.js';
import { useAbility } from '../ability/index.js';
import { applyDamageToLife } from '../resource/index.js';

export function startTurn(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex]!;
  const resetUnits = currentPlayer.units.map((u) => ({
    ...u,
    hasMovedThisTurn: false,
    hasUsedAbilityThisTurn: false,
    hasAttackedThisTurn: false,
  }));

  const newPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, units: resetUnits } : p
  );

  return {
    ...state,
    turnPhase: TurnPhase.MOVE,
    movesUsedThisTurn: 0,
    players: newPlayers,
  };
}

const PHASE_ORDER: TurnPhase[] = [
  TurnPhase.MOVE,
  TurnPhase.ABILITY,
  TurnPhase.ATTACK,
  TurnPhase.END,
];

export function advancePhase(state: GameState): Result<GameState> {
  const currentIndex = PHASE_ORDER.indexOf(state.turnPhase);
  if (currentIndex === -1 || currentIndex >= PHASE_ORDER.length - 1) {
    return { ok: false, error: `Cannot advance from ${state.turnPhase} phase` };
  }

  const nextPhase = PHASE_ORDER[currentIndex + 1]!;
  return { ok: true, value: { ...state, turnPhase: nextPhase } };
}

function findUnit(state: GameState, playerId: string, unitId: string): { player: PlayerState; unit: UnitInstance; playerIndex: number } | null {
  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i]!;
    if (player.id === playerId) {
      const unit = player.units.find((u) => u.card.id === unitId);
      if (unit) return { player, unit, playerIndex: i };
    }
  }
  return null;
}

function findUnitById(state: GameState, unitId: string): { player: PlayerState; unit: UnitInstance; playerIndex: number } | null {
  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i]!;
    const unit = player.units.find((u) => u.card.id === unitId);
    if (unit) return { player, unit, playerIndex: i };
  }
  return null;
}

function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function processMove(
  state: GameState,
  playerId: string,
  unitId: string,
  target: Position
): Result<GameState> {
  if (state.turnPhase !== TurnPhase.MOVE) {
    return { ok: false, error: `Cannot move units outside MOVE phase (current: ${state.turnPhase})` };
  }

  if (state.movesUsedThisTurn >= MAX_MOVES_PER_TURN) {
    return { ok: false, error: `Already used maximum ${MAX_MOVES_PER_TURN} moves this turn` };
  }

  const currentPlayer = state.players[state.currentPlayerIndex]!;
  if (currentPlayer.id !== playerId) {
    return { ok: false, error: 'Not your turn' };
  }

  const found = findUnit(state, playerId, unitId);
  if (!found) {
    return { ok: false, error: `Cannot move a unit you don't own: ${unitId}` };
  }

  const { unit } = found;
  if (!unit.position) {
    return { ok: false, error: 'Unit has no position on board' };
  }

  if (unit.hasMovedThisTurn) {
    return { ok: false, error: 'Unit has already moved this turn' };
  }

  const moveResult = boardMoveUnit(state.board, unit.position, target, unit.card.movement);
  if (!moveResult.ok) {
    return { ok: false, error: moveResult.error };
  }

  const newUnits = currentPlayer.units.map((u) =>
    u.card.id === unitId ? { ...u, position: target, hasMovedThisTurn: true } : u
  );

  const newPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, units: newUnits } : p
  );

  return {
    ok: true,
    value: {
      ...state,
      board: moveResult.value,
      players: newPlayers,
      movesUsedThisTurn: state.movesUsedThisTurn + 1,
    },
  };
}

export function processAbility(
  state: GameState,
  playerId: string,
  unitId: string,
  targetUnitId: string | null
): Result<GameState> {
  if (state.turnPhase !== TurnPhase.ABILITY) {
    return { ok: false, error: `Cannot use abilities outside ABILITY phase (current: ${state.turnPhase})` };
  }

  const currentPlayer = state.players[state.currentPlayerIndex]!;
  if (currentPlayer.id !== playerId) {
    return { ok: false, error: 'Not your turn' };
  }

  const found = findUnit(state, playerId, unitId);
  if (!found) {
    return { ok: false, error: `Unit ${unitId} not found for player ${playerId}` };
  }

  const { unit } = found;
  let targetUnit: UnitInstance | null = null;
  if (targetUnitId) {
    const targetFound = findUnitById(state, targetUnitId);
    if (targetFound) {
      targetUnit = targetFound.unit;
    }
  }

  const abilityResult = useAbility(unit, targetUnit, currentPlayer.life);
  if (!abilityResult.ok) {
    return { ok: false, error: abilityResult.error };
  }

  const { unit: updatedUnit, target: updatedTarget, lifeCost } = abilityResult.value;
  let newPlayers = state.players.map((p, i) => {
    if (i === state.currentPlayerIndex) {
      const newUnits = p.units.map((u) =>
        u.card.id === unitId ? updatedUnit : u
      );
      return { ...p, units: newUnits, life: p.life - lifeCost };
    }
    return p;
  });

  if (updatedTarget && targetUnitId) {
    newPlayers = newPlayers.map((p) => ({
      ...p,
      units: p.units.map((u) =>
        u.card.id === targetUnitId ? updatedTarget : u
      ),
    }));
  }

  return {
    ok: true,
    value: { ...state, players: newPlayers },
  };
}

export function processAttack(
  state: GameState,
  playerId: string,
  attackerUnitId: string,
  defenderUnitId: string
): Result<GameState> {
  if (state.turnPhase !== TurnPhase.ATTACK) {
    return { ok: false, error: `Cannot attack outside ATTACK phase (current: ${state.turnPhase})` };
  }

  const currentPlayer = state.players[state.currentPlayerIndex]!;
  if (currentPlayer.id !== playerId) {
    return { ok: false, error: 'Not your turn' };
  }

  const attackerFound = findUnit(state, playerId, attackerUnitId);
  if (!attackerFound) {
    return { ok: false, error: `Attacker unit ${attackerUnitId} not found` };
  }

  const { unit: attacker } = attackerFound;
  if (attacker.hasAttackedThisTurn) {
    return { ok: false, error: `Unit ${attackerUnitId} has already attacked this turn` };
  }

  const defenderFound = findUnitById(state, defenderUnitId);
  if (!defenderFound) {
    return { ok: false, error: `Defender unit ${defenderUnitId} not found` };
  }

  const { unit: defender } = defenderFound;

  if (!attacker.position || !defender.position) {
    return { ok: false, error: 'Both units must be on the board' };
  }

  const dist = manhattanDistance(attacker.position, defender.position);
  if (dist > attacker.card.range) {
    return { ok: false, error: `Target out of range: distance ${dist}, range ${attacker.card.range}` };
  }

  const combatResult = resolveCombat(attacker, defender);

  let newPlayers = state.players.map((p) => {
    const newUnits = p.units.map((u) => {
      if (u.card.id === attackerUnitId) {
        return { ...combatResult.attacker, hasAttackedThisTurn: true };
      }
      if (u.card.id === defenderUnitId) {
        return combatResult.defender;
      }
      return u;
    });
    return { ...p, units: newUnits };
  });

  // Apply overflow damage
  if (combatResult.defenderOverflow > 0) {
    newPlayers = newPlayers.map((p) =>
      p.id === defenderFound.player.id
        ? applyDamageToLife(p, combatResult.defenderOverflow)
        : p
    );
  }
  if (combatResult.attackerOverflow > 0) {
    newPlayers = newPlayers.map((p) =>
      p.id === attackerFound.player.id
        ? applyDamageToLife(p, combatResult.attackerOverflow)
        : p
    );
  }

  // Remove dead units from board
  let newBoard = state.board;
  if (combatResult.defenderDied && defender.position) {
    const removeResult = boardRemoveUnit(newBoard, defender.position);
    if (removeResult.ok) newBoard = removeResult.value;

    // Set reserve lock if defender died during their own turn
    if (defenderFound.player.id === currentPlayer.id) {
      newPlayers = newPlayers.map((p) =>
        p.id === defenderFound.player.id
          ? { ...p, reserveLockedUntilNextTurn: true }
          : p
      );
    }
  }
  if (combatResult.attackerDied && attacker.position) {
    const removeResult = boardRemoveUnit(newBoard, attacker.position);
    if (removeResult.ok) newBoard = removeResult.value;

    // Attacker always dies during own turn → lock reserve
    newPlayers = newPlayers.map((p) =>
      p.id === attackerFound.player.id
        ? { ...p, reserveLockedUntilNextTurn: true }
        : p
    );
  }

  // Remove dead units from player unit arrays
  newPlayers = newPlayers.map((p) => ({
    ...p,
    units: p.units.filter((u) => u.currentHp > 0),
  }));

  return {
    ok: true,
    value: { ...state, players: newPlayers, board: newBoard },
  };
}

export function endTurn(state: GameState): Result<GameState> {
  if (state.turnPhase !== TurnPhase.END) {
    return { ok: false, error: `Cannot end turn outside END phase (current: ${state.turnPhase})` };
  }

  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;

  // Skip eliminated players
  let attempts = 0;
  while (state.players[nextIndex]?.isEliminated && attempts < state.players.length) {
    nextIndex = (nextIndex + 1) % state.players.length;
    attempts++;
  }

  const isNewRotation = nextIndex <= state.currentPlayerIndex;

  return {
    ok: true,
    value: {
      ...startTurn({
        ...state,
        currentPlayerIndex: nextIndex,
        turnNumber: isNewRotation ? state.turnNumber + 1 : state.turnNumber,
        turnRotation: isNewRotation ? state.turnRotation + 1 : state.turnRotation,
      }),
    },
  };
}

export function deployReserve(
  state: GameState,
  playerId: string,
  unitId: string,
  position: Position
): Result<GameState> {
  const playerIdx = state.players.findIndex((p) => p.id === playerId);
  if (playerIdx === -1) {
    return { ok: false, error: `Player ${playerId} not found` };
  }

  const player = state.players[playerIdx]!;

  if (player.reserveLockedUntilNextTurn) {
    return { ok: false, error: 'Reserve deployment is locked until next turn' };
  }

  const reserveUnit = player.team.reserveUnits.find((u) => u.id === unitId);
  if (!reserveUnit) {
    return { ok: false, error: `Reserve unit ${unitId} not found` };
  }

  const placeResult = placeUnit(state.board, unitId, position);
  if (!placeResult.ok) {
    return { ok: false, error: placeResult.error };
  }

  const newInstance: UnitInstance = {
    card: reserveUnit,
    currentHp: reserveUnit.hp,
    position,
    ownerId: playerId,
    hasMovedThisTurn: false,
    hasUsedAbilityThisTurn: false,
    hasAttackedThisTurn: false,
    combatModifiers: [],
  };

  const newReserves = player.team.reserveUnits.filter((u) => u.id !== unitId);
  const newPlayers = state.players.map((p, i) =>
    i === playerIdx
      ? {
          ...p,
          units: [...p.units, newInstance],
          team: { ...p.team, reserveUnits: newReserves },
        }
      : p
  );

  return {
    ok: true,
    value: { ...state, board: placeResult.value, players: newPlayers },
  };
}

export function checkReserveLocks(state: GameState, playerId: string): GameState {
  const newPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, reserveLockedUntilNextTurn: false } : p
  );
  return { ...state, players: newPlayers };
}

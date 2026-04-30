import type { GameState, UnitInstance, Position, PlayerState, UnitCard } from '../../types/index.js';
import { TurnPhase, MAX_MOVES_PER_TURN, ACTIVE_UNIT_COUNT, RESERVE_UNIT_COUNT, CardType, CombatModifierType } from '../../types/index.js';
import type { Result } from '../../types/actions.js';
import { moveUnit as boardMoveUnit, placeUnit, removeUnit as boardRemoveUnit } from '../board/index.js';
import { resolveCombat } from '../combat/index.js';
import { useAbility, isSelfTargetAbility } from '../ability/index.js';
import { applyDamageToLife } from '../resource/index.js';
import { drawOne } from '../card/index.js';
import { handleUnitDeath } from '../discard-pile/index.js';
import { getCurrentPlayerStandbyStatus, canExitStandbyPhase } from '../standby/index.js';
import { chebyshevDistance } from '../../utils/position.js';
import { hasLineOfSight } from '../visibility/index.js';
import { isWallCell } from '../../utils/walls.js';

export function startTurn(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex]!;
  const resetUnits = currentPlayer.units.map((u) => ({
    ...u,
    hasMovedThisTurn: false,
    hasUsedAbilityThisTurn: false,
    hasAttackedThisTurn: false,
  }));

  let updatedPlayer: PlayerState = {
    ...currentPlayer,
    units: resetUnits,
    reserveLockedUntilNextTurn: false,
  };

  if (
    state.turnRotation >= 1 &&
    updatedPlayer.mainDeck.cards.length > 0
  ) {
    const { card, deck: newMainDeck } = drawOne(updatedPlayer.mainDeck);
    if (card) {
      updatedPlayer = {
        ...updatedPlayer,
        mainDeck: newMainDeck,
        hand: { cards: [...updatedPlayer.hand.cards, card] },
      };
    }
  }

  const newPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? updatedPlayer : p
  );

  // Check if standby phase should be triggered
  const newState = {
    ...state,
    players: newPlayers,
    movesUsedThisTurn: 0,
  };

  const standbyStatus = getCurrentPlayerStandbyStatus(newState);
  
  return {
    ...newState,
    turnPhase: standbyStatus.isActive ? TurnPhase.STANDBY : TurnPhase.MOVE,
  };
}

const PHASE_ORDER: TurnPhase[] = [
  TurnPhase.MOVE,
  TurnPhase.ABILITY,
  TurnPhase.ATTACK,
  TurnPhase.END,
];

export function advancePhase(state: GameState): Result<GameState> {
  // Handle standby phase separately
  if (state.turnPhase === TurnPhase.STANDBY) {
    if (!canExitStandbyPhase(state)) {
      return { ok: false, error: 'Cannot exit standby phase: requirements not met' };
    }
    // Exit standby phase and go to MOVE phase
    return { ok: true, value: { ...state, turnPhase: TurnPhase.MOVE } };
  }

  const currentIndex = PHASE_ORDER.indexOf(state.turnPhase);
  if (currentIndex === -1 || currentIndex >= PHASE_ORDER.length - 1) {
    return { ok: false, error: `Cannot advance from ${state.turnPhase} phase` };
  }

  const nextPhase = PHASE_ORDER[currentIndex + 1]!;
  return { ok: true, value: { ...state, turnPhase: nextPhase } };
}

export function exitStandbyPhase(state: GameState): Result<GameState> {
  if (state.turnPhase !== TurnPhase.STANDBY) {
    return { ok: false, error: 'Not in standby phase' };
  }

  if (!canExitStandbyPhase(state)) {
    return { ok: false, error: 'Standby phase requirements not met' };
  }

  return { ok: true, value: { ...state, turnPhase: TurnPhase.MOVE } };
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

function findUnitById(state: GameState, unitId: string, excludePlayerId?: string): { player: PlayerState; unit: UnitInstance; playerIndex: number } | null {
  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i]!;
    if (excludePlayerId && player.id === excludePlayerId) continue;
    const unit = player.units.find((u) => u.card.id === unitId);
    if (unit) return { player, unit, playerIndex: i };
  }
  return null;
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

  const isParalyzed = unit.combatModifiers.some(
    (m) => m.type === CombatModifierType.MOVEMENT_DEBUFF && (m.value ?? 0) >= 999
  );
  if (isParalyzed) {
    return { ok: false, error: 'Unit is paralyzed and cannot move' };
  }

  // Apply movement debuffs from combat modifiers
  const movementDebuff = unit.combatModifiers
    .filter((m) => m.type === CombatModifierType.MOVEMENT_DEBUFF)
    .reduce((sum, m) => sum + (m.value || 0), 0);
  const effectiveMovement = Math.max(0, unit.card.movement - movementDebuff);

  const moveResult = boardMoveUnit(state.board, unit.position, target, effectiveMovement, state.walls);
  if (!moveResult.ok) {
    return { ok: false, error: 'error' in moveResult ? moveResult.error : 'Failed to move unit' };
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
  targetUnitId: string | null,
  targetOwnerId?: string | null
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

  // Use ability engine's helper function for self-target detection
  const isSelfTarget = isSelfTargetAbility(unit.card.ability.abilityType, unit.card.ability.description);

  let targetUnit: UnitInstance | null = null;
  let targetFound: { player: PlayerState; unit: UnitInstance; playerIndex: number } | null = null;

  if (targetUnitId) {
    // Use targetOwnerId for direct owner-scoped lookup (handles 3+ player card ID collisions)
    if (targetOwnerId) {
      targetFound = findUnit(state, targetOwnerId, targetUnitId);
    } else {
      // Fallback: search all players (legacy compatibility)
      targetFound = findUnitById(state, targetUnitId);
    }
    if (targetFound) {
      targetUnit = targetFound.unit;
    }
  } else if (!isSelfTarget) {
    return { ok: false, error: 'This ability requires a target' };
  }

  // All validation (range, target type, board state) is handled by the ability engine
  // This ensures single source of truth for ability rules
  const abilityResult = useAbility(unit, targetUnit, state.walls);
  if (!abilityResult.ok) {
    return { ok: false, error: 'error' in abilityResult ? abilityResult.error : 'Failed to use ability' };
  }

  const { unit: updatedUnit, target: updatedTarget } = abilityResult.value;
  let newPlayers = state.players.map((p, i) => {
    if (i === state.currentPlayerIndex) {
      const newUnits = p.units.map((u) =>
        u.card.id === unitId ? updatedUnit : u
      );
      return { ...p, units: newUnits };
    }
    return p;
  });

  if (updatedTarget && targetUnitId && targetUnit) {
    const targetOwnerId = targetUnit.ownerId;
    newPlayers = newPlayers.map((p) => {
      if (p.id !== targetOwnerId) return p;
      return {
        ...p,
        units: p.units.map((u) =>
          u.card.id === targetUnitId ? updatedTarget : u
        ),
      };
    });
  }

  // Handle unit death after ability damage
  let newBoard = state.board;

  // Handle source unit death from self-damage
  if (updatedUnit.currentHp <= 0 && updatedUnit.position) {
    const removeResult = boardRemoveUnit(newBoard, updatedUnit.position);
    if (removeResult.ok) newBoard = removeResult.value;

    newPlayers = newPlayers.map((p) => {
      if (p.id === playerId) {
        const updatedPlayer = handleUnitDeath(p, updatedUnit);
        return { ...updatedPlayer, reserveLockedUntilNextTurn: true };
      }
      return p;
    });
  }

  // Handle target unit death
  if (updatedTarget && updatedTarget.currentHp <= 0 && updatedTarget.position) {
    // Remove dead unit from board
    const removeResult = boardRemoveUnit(newBoard, updatedTarget.position);
    if (removeResult.ok) newBoard = removeResult.value;

    // Send unit to discard pile
    const targetOwnerId2 = targetUnit!.ownerId;
    newPlayers = newPlayers.map((p) => {
      if (p.id === targetOwnerId2) {
        // Add the dead unit's card to the discard pile
        const updatedPlayer = handleUnitDeath(p, updatedTarget);
        
        // Set reserve lock if the killed unit's owner is the current player
        const withReserveLock = targetOwnerId2 === currentPlayer.id
          ? { ...updatedPlayer, reserveLockedUntilNextTurn: true }
          : updatedPlayer;
        
        return withReserveLock;
      }
      return p;
    });

    // Remove dead units from player unit arrays
    newPlayers = newPlayers.map((p) => ({
      ...p,
      units: p.units.filter((u) => u.currentHp > 0),
    }));
  }

  return {
    ok: true,
    value: { ...state, players: newPlayers, board: newBoard },
  };
}

export function processAttack(
  state: GameState,
  playerId: string,
  attackerUnitId: string,
  defenderUnitId: string,
  defenderOwnerId?: string
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

  const isParalyzed = attacker.combatModifiers.some(
    (m) => m.type === CombatModifierType.ATK_DEBUFF && (m.value ?? 0) >= 999
  );
  if (isParalyzed) {
    return { ok: false, error: 'Unit is paralyzed and cannot attack' };
  }

  // Use defenderOwnerId for direct owner-scoped lookup (handles 3+ player card ID collisions)
  const defenderFound = defenderOwnerId
    ? findUnit(state, defenderOwnerId, defenderUnitId)
    : findUnitById(state, defenderUnitId, playerId);
  if (!defenderFound) {
    return { ok: false, error: `Defender unit ${defenderUnitId} not found` };
  }

  const { unit: defender } = defenderFound;

  if (!attacker.position || !defender.position) {
    return { ok: false, error: 'Both units must be on the board' };
  }

  const dist = chebyshevDistance(attacker.position, defender.position);
  if (dist > attacker.card.range) {
    return { ok: false, error: `Target out of range: distance ${dist}, range ${attacker.card.range}` };
  }
  if (!hasLineOfSight(attacker.position, defender.position, state.walls)) {
    return { ok: false, error: 'Target is blocked by a wall' };
  }

  const combatResult = resolveCombat(attacker, defender);

  let newPlayers = state.players.map((p) => {
    const newUnits = p.units.map((u) => {
      if (p.id === attackerFound.player.id && u.card.id === attackerUnitId) {
        return { ...combatResult.attacker, hasAttackedThisTurn: true };
      }
      if (p.id === defenderFound.player.id && u.card.id === defenderUnitId) {
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

  // Remove dead units from board and send to discard pile
  let newBoard = state.board;
  if (combatResult.defenderDied && defender.position) {
    const removeResult = boardRemoveUnit(newBoard, defender.position);
    if (removeResult.ok) newBoard = removeResult.value;

    // Send defender to discard pile and handle reserve lock
    newPlayers = newPlayers.map((p) => {
      if (p.id === defenderFound.player.id) {
        // Add the dead unit's card to the discard pile
        const updatedPlayer = handleUnitDeath(p, combatResult.defender);
        
        // Set reserve lock if defender died during their own turn
        const withReserveLock = defenderFound.player.id === currentPlayer.id
          ? { ...updatedPlayer, reserveLockedUntilNextTurn: true }
          : updatedPlayer;
        
        return withReserveLock;
      }
      return p;
    });
  }
  if (combatResult.attackerDied && attacker.position) {
    const removeResult = boardRemoveUnit(newBoard, attacker.position);
    if (removeResult.ok) newBoard = removeResult.value;

    // Send attacker to discard pile and handle reserve lock
    newPlayers = newPlayers.map((p) => {
      if (p.id === attackerFound.player.id) {
        // Add the dead unit's card to the discard pile
        const updatedPlayer = handleUnitDeath(p, combatResult.attacker);
        
        // Attacker always dies during own turn -> lock reserve
        return { ...updatedPlayer, reserveLockedUntilNextTurn: true };
      }
      return p;
    });
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

  if (isWallCell(position, state.walls)) {
    return { ok: false, error: 'Cannot deploy to a wall cell' };
  }

  const activeCount = player.units.filter((u) => 
    u.position !== null && 
    u.position.x >= 0 && 
    u.position.x < state.board.width && 
    u.position.y >= 0 && 
    u.position.y < state.board.height
  ).length;
  if (activeCount >= ACTIVE_UNIT_COUNT) {
    return { ok: false, error: `Cannot exceed ${ACTIVE_UNIT_COUNT} active units on the board` };
  }

  const unitInstanceId = `${playerId}-${unitId}`;
  const placeResult = placeUnit(state.board, unitInstanceId, position);
  if (!placeResult.ok) {
    return { ok: false, error: 'error' in placeResult ? placeResult.error : 'Failed to place unit' };
  }

  const newInstance: UnitInstance = {
    card: reserveUnit,
    currentHp: reserveUnit.hp,
    position,
    ownerId: playerId,
    color: player.color,
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
          units: [...p.units.filter((u) => u.card.id !== unitId), newInstance],
          team: { ...p.team, reserveUnits: newReserves },
        }
      : p
  );

  const newState = { ...state, board: placeResult.value, players: newPlayers };

  // Check if we're still in standby phase and if all standby requirements are now met
  if (state.turnPhase === TurnPhase.STANDBY) {
    const standbyStatus = getCurrentPlayerStandbyStatus(newState);
    
    // Stay in standby if any step is still active (including required summon-to-bench)
    if (!standbyStatus.isActive) {
      return { ok: true, value: { ...newState, turnPhase: TurnPhase.MOVE } };
    }
  }

  return { ok: true, value: newState };
}

export function checkReserveLocks(state: GameState, playerId: string): GameState {
  const newPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, reserveLockedUntilNextTurn: false } : p
  );
  return { ...state, players: newPlayers };
}

export function playCard(
  state: GameState,
  playerId: string,
  cardId: string
): Result<GameState> {
  const currentPlayer = state.players[state.currentPlayerIndex]!;
  if (currentPlayer.id !== playerId) {
    return { ok: false, error: 'Not your turn' };
  }

  const playerIdx = state.currentPlayerIndex;
  const player = state.players[playerIdx]!;
  const cardIndex = player.hand.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    return { ok: false, error: `Card ${cardId} not in hand` };
  }

  const card = player.hand.cards[cardIndex]!;
  const newHand = { cards: player.hand.cards.filter((c) => c.id !== cardId) };
  const newDiscard = { cards: [...player.discardPile.cards, card] };

  const newPlayers = state.players.map((p, i) =>
    i === playerIdx ? { ...p, hand: newHand, discardPile: newDiscard } : p
  );

  const newState = { ...state, players: newPlayers };

  // Check if we're still in standby phase and if all standby requirements are now met
  if (state.turnPhase === TurnPhase.STANDBY) {
    const standbyStatus = getCurrentPlayerStandbyStatus(newState);
    
    // Stay in standby if any step is still active (including required summon-to-bench)
    if (!standbyStatus.isActive) {
      return { ok: true, value: { ...newState, turnPhase: TurnPhase.MOVE } };
    }
  }

  return { ok: true, value: newState };
}

export function getBenchDeploymentNotification(
  state: GameState,
  playerId: string
): string | null {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return null;

  const activeOnBoard = player.units.filter((u) => u.position !== null).length;
  if (
    activeOnBoard < ACTIVE_UNIT_COUNT &&
    player.team.reserveUnits.length > 0 &&
    !player.reserveLockedUntilNextTurn
  ) {
    return 'Please move your available bench units into the field';
  }
  return null;
}

export function summonToBench(
  state: GameState,
  playerId: string,
  cardId: string
): Result<GameState> {
  if (state.turnPhase !== TurnPhase.STANDBY) {
    return { ok: false, error: 'Bench summoning is only allowed during the Standby phase' };
  }

  const playerIdx = state.players.findIndex((p) => p.id === playerId);
  if (playerIdx === -1) {
    return { ok: false, error: `Player ${playerId} not found` };
  }

  const player = state.players[playerIdx]!;

  // Enforce strict phase ordering: discard and bench deploy must be resolved first
  const status = getCurrentPlayerStandbyStatus(state);
  if (status.needsHandDiscard) {
    return { ok: false, error: 'Must discard down to hand limit before summoning' };
  }
  if (status.needsBenchDeployment) {
    return { ok: false, error: 'Must promote a bench unit to the active zone before summoning' };
  }

  // Validate bench has an open slot
  if (player.team.reserveUnits.length >= RESERVE_UNIT_COUNT) {
    return { ok: false, error: 'Bench is full — no open slots' };
  }

  // Find the card in hand
  const cardIndex = player.hand.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    return { ok: false, error: `Card ${cardId} not found in hand` };
  }

  const card = player.hand.cards[cardIndex]!;

  // Must be a UNIT card
  if (card.cardType !== CardType.UNIT) {
    return { ok: false, error: 'Only unit cards can be summoned to the bench' };
  }

  const unitCard = card as UnitCard;

  // Validate LP cost
  if (unitCard.cost <= 0) {
    return { ok: false, error: 'Unit has no valid cost' };
  }
  if (player.life < unitCard.cost) {
    return { ok: false, error: `Insufficient LP: need ${unitCard.cost}, have ${player.life}` };
  }

  // Execute: remove from hand, add to bench reserve, deduct LP
  const newHandCards = player.hand.cards.filter((_, i) => i !== cardIndex);
  const newReserveUnits = [...player.team.reserveUnits, unitCard];
  const newLife = player.life - unitCard.cost;

  const updatedPlayers = state.players.map((p, i) =>
    i === playerIdx
      ? {
          ...p,
          hand: { cards: newHandCards },
          team: { ...p.team, reserveUnits: newReserveUnits },
          life: newLife,
          isEliminated: newLife <= 0,
        }
      : p
  );

  const newState = { ...state, players: updatedPlayers };

  // Re-evaluate standby status — if no more summons are available/possible, exit standby
  const newStatus = getCurrentPlayerStandbyStatus(newState);
  if (!newStatus.isActive) {
    return { ok: true, value: { ...newState, turnPhase: TurnPhase.MOVE } };
  }

  return { ok: true, value: newState };
}

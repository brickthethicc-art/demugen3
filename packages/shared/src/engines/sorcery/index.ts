import type { GameState, UnitInstance, PlayerState, SorceryCard, Position } from '../../types/index.js';
import { TurnPhase, CardType, CombatModifierType } from '../../types/index.js';
import type { Result } from '../../types/actions.js';
import { handleUnitDeath } from '../discard-pile/index.js';
import { removeUnit as boardRemoveUnit } from '../board/index.js';

export interface SorceryEffectResult {
  gameState: GameState;
  discardedCard: SorceryCard;
}

/**
 * Validates if a sorcery card can be played
 */
export function canPlaySorcery(
  state: GameState,
  playerId: string,
  cardId: string
): Result<{ card: SorceryCard; playerIndex: number }> {
  // Phase check: ONLY allow during Ability Phase
  if (state.turnPhase !== TurnPhase.ABILITY) {
    return { ok: false, error: `Sorcery cards can only be played during Ability Phase (current: ${state.turnPhase})` };
  }

  // Turn check
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) {
    return { ok: false, error: 'Not your turn' };
  }

  // Find player
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return { ok: false, error: 'Player not found' };
  }

  const player = state.players[playerIndex]!;

  // Find card in hand
  const card = player.hand.cards.find(c => c.id === cardId);
  if (!card) {
    return { ok: false, error: `Card ${cardId} not found in hand` };
  }

  // Must be a sorcery card
  if (card.cardType !== CardType.SORCERY) {
    return { ok: false, error: 'Only sorcery cards can be played with PLAY_SORCERY intent' };
  }

  return { ok: true, value: { card: card as SorceryCard, playerIndex } };
}

/**
 * Executes the effect of a sorcery card
 */
export function executeSorceryEffect(
  state: GameState,
  playerId: string,
  card: SorceryCard,
  targetUnitId?: string,
  targetOwnerId?: string,
  targetUnitId2?: string,
  targetOwnerId2?: string
): Result<GameState> {
  try {
    switch (card.id) {
      case 's01':
        return executeQuickStrike(state, playerId, targetUnitId, targetOwnerId);
      case 's02':
        return executeMinorHeal(state, playerId, targetUnitId, targetOwnerId);
      case 's03':
        return executeScoutAhead(state, playerId);
      case 's04':
        return executeFireball(state, playerId, targetUnitId, targetOwnerId);
      case 's05':
        return executeMendWounds(state, playerId, targetUnitId, targetOwnerId);
      case 's06':
        return executeHaste(state, playerId, targetUnitId, targetOwnerId);
      case 's07':
        return executeWeaken(state, playerId, targetUnitId, targetOwnerId);
      case 's08':
        return executeChainLightning(state, playerId, targetUnitId, targetOwnerId);
      case 's09':
        return executeMassHeal(state, playerId);
      case 's10':
        return executeFortification(state, playerId);
      case 's11':
        return executeDisplacement(state, playerId, targetUnitId, targetOwnerId);
      case 's12':
        return executeMeteorStrike(state, playerId, targetUnitId, targetOwnerId);
      case 's13':
        return executeFullRestore(state, playerId, targetUnitId, targetOwnerId);
      case 's14':
        return executeBattleRage(state, playerId, targetUnitId, targetOwnerId);
      case 's15':
        return executeParalyze(state, playerId, targetUnitId, targetOwnerId);
      case 's16':
        return executeInferno(state, playerId);
      case 's17':
        return executeDivineBlessing(state, playerId);
      case 's18':
        return executeDimensionalSwap(state, playerId, targetUnitId, targetOwnerId, targetUnitId2, targetOwnerId2);
      case 's19':
        return executeArmageddon(state, playerId);
      case 's20':
        return executeResurrection(state, playerId, targetUnitId, targetOwnerId);
      case 's21':
        return executeTimeStop(state, playerId);
      case 's22':
        return executeSoulDrain(state, playerId, targetUnitId, targetOwnerId);
      default:
        return { ok: false, error: `Unknown sorcery card: ${card.id}` };
    }
  } catch (error) {
    return { ok: false, error: `Error executing sorcery effect: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Discards a sorcery card from hand to discard pile
 */
export function discardSorceryCard(
  state: GameState,
  playerIndex: number,
  card: SorceryCard
): GameState {
  const player = state.players[playerIndex]!;
  const cardIndex = player.hand.cards.findIndex(c => c === card);
  const fallbackIndex = player.hand.cards.findIndex(c => c.id === card.id);
  const removeIndex = cardIndex !== -1 ? cardIndex : fallbackIndex;

  const newHand = {
    cards: removeIndex === -1
      ? player.hand.cards
      : player.hand.cards.filter((_, i) => i !== removeIndex),
  };
  const newDiscard = { cards: [...player.discardPile.cards, card] };

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, hand: newHand, discardPile: newDiscard } : p
  );

  return { ...state, players: newPlayers };
}

// ==================== INDIVIDUAL SORCERY EFFECTS ====================

function findUnitById(state: GameState, unitId: string, ownerId?: string): { player: PlayerState; unit: UnitInstance; playerIndex: number } | null {
  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i]!;
    if (ownerId && player.id !== ownerId) continue;
    const unit = player.units.find(u => u.card.id === unitId);
    if (unit) return { player, unit, playerIndex: i };
  }
  return null;
}

function getAdjacentPositions(pos: Position): Position[] {
  const adjacent: Position[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      adjacent.push({ x: pos.x + dx, y: pos.y + dy });
    }
  }
  return adjacent;
}

// s01: Quick Strike - Deal 2 damage to target unit
function executeQuickStrike(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Quick Strike requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;
  const isEnemy = targetPlayer.id !== playerId;

  if (!isEnemy) {
    return { ok: false, error: 'Quick Strike can only target enemy units' };
  }

  const newHp = Math.max(0, targetUnit.currentHp - 2);
  const updatedTarget = { ...targetUnit, currentHp: newHp };

  let newPlayers = state.players.map((p, i) =>
    i === targetPlayerIndex
      ? { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedTarget : u) }
      : p
  );

  // Handle unit death
  let newBoard = state.board;
  if (newHp <= 0 && targetUnit.position) {
    const removeResult = boardRemoveUnit(newBoard, targetUnit.position);
    if (removeResult.ok) newBoard = removeResult.value;

    newPlayers = newPlayers.map((p) => {
      if (p.id === targetPlayer.id) {
        const updatedPlayer = handleUnitDeath(p, updatedTarget);
        const withReserveLock = targetPlayer.id === playerId
          ? { ...updatedPlayer, reserveLockedUntilNextTurn: true }
          : updatedPlayer;
        return withReserveLock;
      }
      return p;
    });

    newPlayers = newPlayers.map(p => ({
      ...p,
      units: p.units.filter(u => u.currentHp > 0),
    }));
  }

  return { ok: true, value: { ...state, players: newPlayers, board: newBoard } };
}

// s02: Minor Heal - Heal 2 HP to target unit
function executeMinorHeal(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Minor Heal requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;
  const isFriendly = targetPlayer.id === playerId;

  if (!isFriendly) {
    return { ok: false, error: 'Minor Heal can only target friendly units' };
  }

  const newHp = Math.min(targetUnit.card.maxHp, targetUnit.currentHp + 2);
  const updatedTarget = { ...targetUnit, currentHp: newHp };

  const newPlayers = state.players.map((p, i) =>
    i === targetPlayerIndex
      ? { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedTarget : u) }
      : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s03: Scout Ahead - Draw 1 card (simplified since no fog of war system)
function executeScoutAhead(state: GameState, playerId: string): Result<GameState> {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return { ok: false, error: 'Player not found' };
  }

  const player = state.players[playerIndex]!;

  // Draw 1 card from main deck if available
  if (player.mainDeck.cards.length === 0) {
    return { ok: true, value: state }; // No cards to draw, just discard
  }

  const drawnCard = player.mainDeck.cards[0]!;
  const newMainDeck = { cards: player.mainDeck.cards.slice(1) };
  const newHand = { cards: [...player.hand.cards, drawnCard] };

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, mainDeck: newMainDeck, hand: newHand } : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s04: Fireball - Deal 3 damage to target unit
function executeFireball(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Fireball requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;
  const isEnemy = targetPlayer.id !== playerId;

  if (!isEnemy) {
    return { ok: false, error: 'Fireball can only target enemy units' };
  }

  const newHp = Math.max(0, targetUnit.currentHp - 3);
  const updatedTarget = { ...targetUnit, currentHp: newHp };

  let newPlayers = state.players.map((p, i) =>
    i === targetPlayerIndex
      ? { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedTarget : u) }
      : p
  );

  // Handle unit death
  let newBoard = state.board;
  if (newHp <= 0 && targetUnit.position) {
    const removeResult = boardRemoveUnit(newBoard, targetUnit.position);
    if (removeResult.ok) newBoard = removeResult.value;

    newPlayers = newPlayers.map((p) => {
      if (p.id === targetPlayer.id) {
        const updatedPlayer = handleUnitDeath(p, updatedTarget);
        const withReserveLock = targetPlayer.id === playerId
          ? { ...updatedPlayer, reserveLockedUntilNextTurn: true }
          : updatedPlayer;
        return withReserveLock;
      }
      return p;
    });

    newPlayers = newPlayers.map(p => ({
      ...p,
      units: p.units.filter(u => u.currentHp > 0),
    }));
  }

  return { ok: true, value: { ...state, players: newPlayers, board: newBoard } };
}

// s05: Mend Wounds - Heal 3 HP to target unit
function executeMendWounds(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Mend Wounds requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;
  const isFriendly = targetPlayer.id === playerId;

  if (!isFriendly) {
    return { ok: false, error: 'Mend Wounds can only target friendly units' };
  }

  const newHp = Math.min(targetUnit.card.maxHp, targetUnit.currentHp + 3);
  const updatedTarget = { ...targetUnit, currentHp: newHp };

  const newPlayers = state.players.map((p, i) =>
    i === targetPlayerIndex
      ? { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedTarget : u) }
      : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s06: Haste - Grant +2 movement to target unit this turn
function executeHaste(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Haste requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;
  const isFriendly = targetPlayer.id === playerId;

  if (!isFriendly) {
    return { ok: false, error: 'Haste can only target friendly units' };
  }

  // Add movement buff using negative MOVEMENT_DEBUFF (movement calculation subtracts debuff)
  const modifier = {
    type: CombatModifierType.MOVEMENT_DEBUFF,
    value: -2,
    duration: 1,
  };

  const updatedTarget = {
    ...targetUnit,
    combatModifiers: [...targetUnit.combatModifiers, modifier],
  };

  const newPlayers = state.players.map((p, i) =>
    i === targetPlayerIndex
      ? { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedTarget : u) }
      : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s07: Weaken - Reduce target unit ATK by 2 for 1 turn
function executeWeaken(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Weaken requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;
  const isEnemy = targetPlayer.id !== playerId;

  if (!isEnemy) {
    return { ok: false, error: 'Weaken can only target enemy units' };
  }

  const modifier = {
    type: CombatModifierType.ATK_DEBUFF,
    value: 2,
    duration: 1,
  };

  const updatedTarget = {
    ...targetUnit,
    combatModifiers: [...targetUnit.combatModifiers, modifier],
  };

  const newPlayers = state.players.map((p, i) =>
    i === targetPlayerIndex
      ? { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedTarget : u) }
      : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s08: Chain Lightning - Deal 2 damage to up to 3 adjacent units
function executeChainLightning(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Chain Lightning requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;

  if (targetPlayer.id === playerId) {
    return { ok: false, error: 'Chain Lightning can only target enemy units' };
  }

  if (!targetUnit.position) {
    return { ok: false, error: 'Target unit must be on the board' };
  }

  // Find all units adjacent to target
  const adjacentPositions = getAdjacentPositions(targetUnit.position);
  const adjacentUnits: { player: PlayerState; unit: UnitInstance; playerIndex: number }[] = [];

  for (const pos of adjacentPositions) {
    for (let i = 0; i < state.players.length; i++) {
      const player = state.players[i]!;
      const unit = player.units.find(u => u.position && u.position.x === pos.x && u.position.y === pos.y);
      if (unit && unit.card.id !== targetUnitId) {
        adjacentUnits.push({ player, unit, playerIndex: i });
      }
    }
  }

  // Deal 2 damage to target and up to 2 adjacent units
  const targetsToDamage = [
    { unit: targetUnit, playerIndex: targetPlayerIndex, playerId: targetFound.player.id },
    ...adjacentUnits.slice(0, 2).map(({ unit, playerIndex, player }) => ({ unit, playerIndex, playerId: player.id })),
  ];

  let newPlayers = state.players;
  let newBoard = state.board;

  for (const { unit, playerIndex, playerId: unitOwnerId } of targetsToDamage) {
    const newHp = Math.max(0, unit.currentHp - 2);
    const updatedUnit = { ...unit, currentHp: newHp };

    newPlayers = newPlayers.map((p, i) =>
      i === playerIndex
        ? { ...p, units: p.units.map(u => u.card.id === unit.card.id ? updatedUnit : u) }
        : p
    );

    // Handle unit death
    if (newHp <= 0 && unit.position) {
      const removeResult = boardRemoveUnit(newBoard, unit.position);
      if (removeResult.ok) newBoard = removeResult.value;

      newPlayers = newPlayers.map((p) => {
        if (p.id === unitOwnerId) {
          const updatedPlayer = handleUnitDeath(p, updatedUnit);
          const withReserveLock = unitOwnerId === playerId
            ? { ...updatedPlayer, reserveLockedUntilNextTurn: true }
            : updatedPlayer;
          return withReserveLock;
        }
        return p;
      });
    }
  }

  newPlayers = newPlayers.map(p => ({
    ...p,
    units: p.units.filter(u => u.currentHp > 0),
  }));

  return { ok: true, value: { ...state, players: newPlayers, board: newBoard } };
}

// s09: Mass Heal - Heal 2 HP to all friendly units
function executeMassHeal(state: GameState, playerId: string): Result<GameState> {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return { ok: false, error: 'Player not found' };
  }

  const player = state.players[playerIndex]!;

  const updatedUnits = player.units.map(unit => ({
    ...unit,
    currentHp: Math.min(unit.card.maxHp, unit.currentHp + 2),
  }));

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, units: updatedUnits } : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s10: Fortification - All friendly units gain +1 ATK this turn
function executeFortification(state: GameState, playerId: string): Result<GameState> {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return { ok: false, error: 'Player not found' };
  }

  const player = state.players[playerIndex]!;

  const modifier = {
    type: CombatModifierType.ATK_BUFF,
    value: 1,
    duration: 1,
  };

  const updatedUnits = player.units.map(unit => ({
    ...unit,
    combatModifiers: [...unit.combatModifiers, modifier],
  }));

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, units: updatedUnits } : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s11: Displacement - Move target unit to random adjacent empty cell (simplified)
function executeDisplacement(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Displacement requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;
  const isFriendly = targetPlayer.id === playerId;

  if (!isFriendly) {
    return { ok: false, error: 'Displacement can only target friendly units' };
  }

  if (!targetUnit.position) {
    return { ok: false, error: 'Target unit must be on the board' };
  }

  // Find all adjacent empty cells
  const adjacentPositions = getAdjacentPositions(targetUnit.position);
  const emptyPositions: Position[] = [];

  for (const pos of adjacentPositions) {
    // Check if position is on board
    if (pos.x < 0 || pos.x >= state.board.width || pos.y < 0 || pos.y >= state.board.height) {
      continue;
    }

    // Check if position is empty
    let isEmpty = true;
    for (const p of state.players) {
      const unitAtPos = p.units.find(u => u.position && u.position.x === pos.x && u.position.y === pos.y);
      if (unitAtPos) {
        isEmpty = false;
        break;
      }
    }

    if (isEmpty) {
      emptyPositions.push(pos);
    }
  }

  if (emptyPositions.length === 0) {
    return { ok: true, value: state }; // No valid moves, just discard
  }

  // Deterministic selection to keep simulation repeatable across environments
  const nextPos = [...emptyPositions].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  })[0]!;
  const updatedTarget = { ...targetUnit, position: nextPos };

  // Update board
  let newBoard = state.board;
  const removeResult = boardRemoveUnit(newBoard, targetUnit.position);
  if (removeResult.ok) newBoard = removeResult.value;

  // Add unit at new position
  newBoard = {
    ...newBoard,
    cells: newBoard.cells.map(row => 
      row.map(cell => {
        if (cell.position.x === nextPos.x && cell.position.y === nextPos.y) {
          return { ...cell, occupantId: `${targetPlayer.id}-${targetUnit.card.id}` };
        }
        return cell;
      })
    )
  };

  const newPlayers = state.players.map((p, i) =>
    i === targetPlayerIndex
      ? { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedTarget : u) }
      : p
  );

  return { ok: true, value: { ...state, players: newPlayers, board: newBoard } };
}
// s12: Meteor Strike - Deal 4 damage to target and 2 to adjacent units
function executeMeteorStrike(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Meteor Strike requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;

  if (targetPlayer.id === playerId) {
    return { ok: false, error: 'Meteor Strike can only target enemy units' };
  }

  if (!targetUnit.position) {
    return { ok: false, error: 'Target unit must be on the board' };
  }

  // Find all units adjacent to target
  const adjacentPositions = getAdjacentPositions(targetUnit.position);
  const adjacentUnits: { player: PlayerState; unit: UnitInstance; playerIndex: number }[] = [];

  for (const pos of adjacentPositions) {
    for (let i = 0; i < state.players.length; i++) {
      const player = state.players[i]!;
      const unit = player.units.find(u => u.position && u.position.x === pos.x && u.position.y === pos.y);
      if (unit) {
        adjacentUnits.push({ player, unit, playerIndex: i });
      }
    }
  }

  // Deal 4 damage to target, 2 to adjacent
  const targetsToDamage = [
    { unit: targetUnit, playerIndex: targetPlayerIndex, playerId: targetFound.player.id, damage: 4 },
    ...adjacentUnits.map(({ unit, playerIndex, player }) => ({ unit, playerIndex, playerId: player.id, damage: 2 })),
  ];

  let newPlayers = state.players;
  let newBoard = state.board;

  for (const { unit, playerIndex, playerId: unitOwnerId, damage } of targetsToDamage) {
    const newHp = Math.max(0, unit.currentHp - damage);
    const updatedUnit = { ...unit, currentHp: newHp };

    newPlayers = newPlayers.map((p, i) =>
      i === playerIndex
        ? { ...p, units: p.units.map(u => u.card.id === unit.card.id ? updatedUnit : u) }
        : p
    );

    // Handle unit death
    if (newHp <= 0 && unit.position) {
      const removeResult = boardRemoveUnit(newBoard, unit.position);
      if (removeResult.ok) newBoard = removeResult.value;

      newPlayers = newPlayers.map((p) => {
        if (p.id === unitOwnerId) {
          const updatedPlayer = handleUnitDeath(p, updatedUnit);
          const withReserveLock = unitOwnerId === playerId
            ? { ...updatedPlayer, reserveLockedUntilNextTurn: true }
            : updatedPlayer;
          return withReserveLock;
        }
        return p;
      });
    }
  }

  newPlayers = newPlayers.map(p => ({
    ...p,
    units: p.units.filter(u => u.currentHp > 0),
  }));

  return { ok: true, value: { ...state, players: newPlayers, board: newBoard } };
}

// s13: Full Restore - Heal target unit to full HP
function executeFullRestore(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Full Restore requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;
  const isFriendly = targetPlayer.id === playerId;

  if (!isFriendly) {
    return { ok: false, error: 'Full Restore can only target friendly units' };
  }

  const updatedTarget = { ...targetUnit, currentHp: targetUnit.card.maxHp };

  const newPlayers = state.players.map((p: PlayerState, i: number) =>
    i === targetPlayerIndex
      ? { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedTarget : u) }
      : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s14: Battle Rage - Target unit gains +3 ATK this turn
function executeBattleRage(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Battle Rage requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;
  const isFriendly = targetPlayer.id === playerId;

  if (!isFriendly) {
    return { ok: false, error: 'Battle Rage can only target friendly units' };
  }

  const modifier = {
    type: CombatModifierType.ATK_BUFF,
    value: 3,
    duration: 1,
  };

  const updatedTarget = {
    ...targetUnit,
    combatModifiers: [...targetUnit.combatModifiers, modifier],
  };

  const newPlayers = state.players.map((p, i) =>
    i === targetPlayerIndex
      ? { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedTarget : u) }
      : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s15: Paralyze - Target unit cannot move or attack next turn
function executeParalyze(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Paralyze requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;
  const isEnemy = targetPlayer.id !== playerId;

  if (!isEnemy) {
    return { ok: false, error: 'Paralyze can only target enemy units' };
  }

  // Add severe debuffs as a proxy for "cannot move or attack"
  const attackLockModifier = {
    type: CombatModifierType.ATK_DEBUFF,
    value: 999,
    duration: 1,
  };

  const movementLockModifier = {
    type: CombatModifierType.MOVEMENT_DEBUFF,
    value: 999,
    duration: 1,
  };

  const updatedTarget = {
    ...targetUnit,
    combatModifiers: [...targetUnit.combatModifiers, attackLockModifier, movementLockModifier],
  };

  const newPlayers = state.players.map((p, i) =>
    i === targetPlayerIndex
      ? { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedTarget : u) }
      : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s16: Inferno - Deal 3 damage to all enemy units
function executeInferno(state: GameState, playerId: string): Result<GameState> {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return { ok: false, error: 'Player not found' };
  }

  let newPlayers = state.players;
  let newBoard = state.board;

  for (let i = 0; i < state.players.length; i++) {
    if (i === playerIndex) continue; // Skip own units

    const enemyPlayer = state.players[i]!;
    for (const unit of enemyPlayer.units) {
      const newHp = Math.max(0, unit.currentHp - 3);
      const updatedUnit = { ...unit, currentHp: newHp };

      newPlayers = newPlayers.map((p, idx) =>
        idx === i ? { ...p, units: p.units.map(u => u.card.id === unit.card.id ? updatedUnit : u) } : p
      );

      // Handle unit death
      if (newHp <= 0 && unit.position) {
        const removeResult = boardRemoveUnit(newBoard, unit.position);
        if (removeResult.ok) newBoard = removeResult.value;

        newPlayers = newPlayers.map((p) => {
          if (p.id === enemyPlayer.id) {
            const updatedPlayer = handleUnitDeath(p, updatedUnit);
            return { ...updatedPlayer, reserveLockedUntilNextTurn: true };
          }
          return p;
        });
      }
    }
  }

  newPlayers = newPlayers.map(p => ({
    ...p,
    units: p.units.filter(u => u.currentHp > 0),
  }));

  return { ok: true, value: { ...state, players: newPlayers, board: newBoard } };
}

// s17: Divine Blessing - Heal 3 HP to all friendly units and gain +1 ATK
function executeDivineBlessing(state: GameState, playerId: string): Result<GameState> {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return { ok: false, error: 'Player not found' };
  }

  const player = state.players[playerIndex]!;

  const atkModifier = {
    type: CombatModifierType.ATK_BUFF,
    value: 1,
    duration: 1,
  };

  const updatedUnits = player.units.map(unit => ({
    ...unit,
    currentHp: Math.min(unit.card.maxHp, unit.currentHp + 3),
    combatModifiers: [...unit.combatModifiers, atkModifier],
  }));

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, units: updatedUnits } : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s18: Dimensional Swap - Swap two specific units on the board
function executeDimensionalSwap(
  state: GameState,
  _playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string,
  targetUnitId2?: string,
  targetOwnerId2?: string
): Result<GameState> {
  if (!targetUnitId || !targetUnitId2) {
    return { ok: false, error: 'Dimensional Swap requires two target units' };
  }

  const targetFound1 = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  const targetFound2 = targetOwnerId2
    ? findUnitById(state, targetUnitId2, targetOwnerId2)
    : findUnitById(state, targetUnitId2);

  if (!targetFound1 || !targetFound2) {
    return { ok: false, error: 'Both target units not found' };
  }

  const { unit: targetUnit1, playerIndex: playerIndex1 } = targetFound1;
  const { unit: targetUnit2, playerIndex: playerIndex2 } = targetFound2;

  if (!targetUnit1.position || !targetUnit2.position) {
    return { ok: false, error: 'Both units must be on the board' };
  }

  // Prevent swapping with self
  if (targetUnitId === targetUnitId2 && targetOwnerId === targetOwnerId2) {
    return { ok: false, error: 'Cannot swap a unit with itself' };
  }

  const pos1 = targetUnit1.position;
  const pos2 = targetUnit2.position;

  // Update both units' positions
  const updatedUnit1 = { ...targetUnit1, position: pos2 };
  const updatedUnit2 = { ...targetUnit2, position: pos1 };

  // Update board
  let newBoard = state.board;
  const removeResult1 = boardRemoveUnit(newBoard, pos1);
  if (removeResult1.ok) newBoard = removeResult1.value;
  const removeResult2 = boardRemoveUnit(newBoard, pos2);
  if (removeResult2.ok) newBoard = removeResult2.value;

  newBoard = {
    ...newBoard,
    cells: newBoard.cells.map(row => 
      row.map(cell => {
        if (cell.position.x === pos1.x && cell.position.y === pos1.y) {
          return { ...cell, occupantId: `${targetFound2.player.id}-${targetUnit2.card.id}` };
        }
        if (cell.position.x === pos2.x && cell.position.y === pos2.y) {
          return { ...cell, occupantId: `${targetFound1.player.id}-${targetUnit1.card.id}` };
        }
        return cell;
      })
    )
  };

  let newPlayers = state.players.map((p, i) => {
    if (i === playerIndex1) {
      return { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedUnit1 : u) };
    }
    if (i === playerIndex2) {
      return { ...p, units: p.units.map(u => u.card.id === targetUnitId2 ? updatedUnit2 : u) };
    }
    return p;
  });

  return { ok: true, value: { ...state, players: newPlayers, board: newBoard } };
}

// s19: Armageddon - Deal 4 damage to all units on the board
function executeArmageddon(state: GameState, playerId: string): Result<GameState> {
  let newPlayers = state.players;
  let newBoard = state.board;

  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i]!;
    for (const unit of player.units) {
      const newHp = Math.max(0, unit.currentHp - 4);
      const updatedUnit = { ...unit, currentHp: newHp };

      newPlayers = newPlayers.map((p, idx) =>
        idx === i ? { ...p, units: p.units.map(u => u.card.id === unit.card.id ? updatedUnit : u) } : p
      );

      // Handle unit death
      if (newHp <= 0 && unit.position) {
        const removeResult = boardRemoveUnit(newBoard, unit.position);
        if (removeResult.ok) newBoard = removeResult.value;

        newPlayers = newPlayers.map((p) => {
          if (p.id === player.id) {
            const updatedPlayer = handleUnitDeath(p, updatedUnit);
            const withReserveLock = player.id === playerId
              ? { ...updatedPlayer, reserveLockedUntilNextTurn: true }
              : updatedPlayer;
            return withReserveLock;
          }
          return p;
        });
      }
    }
  }

  newPlayers = newPlayers.map(p => ({
    ...p,
    units: p.units.filter(u => u.currentHp > 0),
  }));

  return { ok: true, value: { ...state, players: newPlayers, board: newBoard } };
}

// s20: Resurrection - Heal damaged unit to full HP (simplified since no destroyed unit tracking)
function executeResurrection(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Resurrection requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;
  const isFriendly = targetPlayer.id === playerId;

  if (!isFriendly) {
    return { ok: false, error: 'Resurrection can only target friendly units' };
  }

  // Heal to full HP
  const updatedTarget = { ...targetUnit, currentHp: targetUnit.card.maxHp };

  const newPlayers = state.players.map((p, i) =>
    i === targetPlayerIndex
      ? { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedTarget : u) }
      : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s21: Time Stop - All friendly units gain +2 ATK this turn (simplified since no turn skipping)
function executeTimeStop(state: GameState, playerId: string): Result<GameState> {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return { ok: false, error: 'Player not found' };
  }

  const player = state.players[playerIndex]!;

  const modifier = {
    type: CombatModifierType.ATK_BUFF,
    value: 2,
    duration: 1,
  };

  const updatedUnits = player.units.map(unit => ({
    ...unit,
    combatModifiers: [...unit.combatModifiers, modifier],
  }));

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, units: updatedUnits } : p
  );

  return { ok: true, value: { ...state, players: newPlayers } };
}

// s22: Soul Drain - Deal 5 damage to target, heal your life by the same amount
function executeSoulDrain(
  state: GameState,
  playerId: string,
  targetUnitId?: string,
  targetOwnerId?: string
): Result<GameState> {
  if (!targetUnitId) {
    return { ok: false, error: 'Soul Drain requires a target unit' };
  }

  const targetFound = targetOwnerId
    ? findUnitById(state, targetUnitId, targetOwnerId)
    : findUnitById(state, targetUnitId);

  if (!targetFound) {
    return { ok: false, error: 'Target unit not found' };
  }

  const { player: targetPlayer, unit: targetUnit, playerIndex: targetPlayerIndex } = targetFound;
  const isEnemy = targetPlayer.id !== playerId;

  if (!isEnemy) {
    return { ok: false, error: 'Soul Drain can only target enemy units' };
  }

  const damage = 5;
  const actualDamageDealt = Math.min(damage, targetUnit.currentHp);
  const newHp = Math.max(0, targetUnit.currentHp - damage);
  const updatedTarget = { ...targetUnit, currentHp: newHp };

  let newPlayers = state.players.map((p, i) =>
    i === targetPlayerIndex
      ? { ...p, units: p.units.map(u => u.card.id === targetUnitId ? updatedTarget : u) }
      : p
  );

  // Handle unit death
  let newBoard = state.board;
  if (newHp <= 0 && targetUnit.position) {
    const removeResult = boardRemoveUnit(newBoard, targetUnit.position);
    if (removeResult.ok) newBoard = removeResult.value;

    newPlayers = newPlayers.map((p) => {
      if (p.id === targetPlayer.id) {
        const updatedPlayer = handleUnitDeath(p, updatedTarget);
        const withReserveLock = targetPlayer.id === playerId
          ? { ...updatedPlayer, reserveLockedUntilNextTurn: true }
          : updatedPlayer;
        return withReserveLock;
      }
      return p;
    });

    newPlayers = newPlayers.map(p => ({
      ...p,
      units: p.units.filter(u => u.currentHp > 0),
    }));
  }

  // Heal caster by the actual damage dealt
  const casterIndex = state.players.findIndex(p => p.id === playerId);
  if (casterIndex !== -1) {
    const caster = state.players[casterIndex]!;
    const newCasterLife = Math.min(caster.maxLife, caster.life + actualDamageDealt);
    newPlayers = newPlayers.map((p, i) =>
      i === casterIndex ? { ...p, life: newCasterLife } : p
    );
  }

  return { ok: true, value: { ...state, players: newPlayers, board: newBoard } };
}

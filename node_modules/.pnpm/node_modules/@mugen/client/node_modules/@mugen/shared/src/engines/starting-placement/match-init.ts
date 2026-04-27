import type { GameState, UnitInstance, Position } from '../../types/index.js';
import { GamePhase, ACTIVE_UNIT_COUNT, RESERVE_UNIT_COUNT } from '../../types/index.js';
import type { Result } from '../../types/actions.js';
import { placeUnit } from '../board/index.js';
import { assignPlayerColors } from '../player-color/index.js';
import { getSpawnPositions, getReservePositions } from './index.js';

/**
 * Initialize match units for all players.
 *
 * Pre-conditions:
 *   - gameState.phase === PRE_GAME
 *   - Every player's team is locked
 *   - Every player has exactly 3 activeUnits and 3 reserveUnits
 *
 * Post-conditions:
 *   - Each player.units contains 6 UnitInstances (3 placed, 3 with position=null)
 *   - Board cells are updated with active-unit occupants
 *   - gameState.phase === IN_PROGRESS
 */
export function initializeMatchUnits(gameState: GameState): Result<GameState> {
  // Phase guard
  if (gameState.phase !== GamePhase.PRE_GAME) {
    return { ok: false, error: `Cannot initialize match units in phase ${gameState.phase}, expected PRE_GAME` };
  }

  // Step 1: Ensure consistent player ordering by sorting by ID
  // CRITICAL: Track which player should start before sorting
  const currentPlayerBeforeSort = gameState.players[gameState.currentPlayerIndex];
  const sortedPlayers = [...gameState.players].sort((a, b) => a.id.localeCompare(b.id));

  // Update currentPlayerIndex to match the sorted order
  const newCurrentPlayerIndex = currentPlayerBeforeSort
    ? sortedPlayers.findIndex(p => p.id === currentPlayerBeforeSort.id)
    : 0;

  const reorderedState = {
    ...gameState,
    players: sortedPlayers,
    currentPlayerIndex: newCurrentPlayerIndex >= 0 ? newCurrentPlayerIndex : 0,
  };

  // Step 2: Assign colors to all players
  let stateWithColors = assignPlayerColors(reorderedState);

  let updatedBoard = gameState.board;
  const updatedPlayers = [];

  for (let pIdx = 0; pIdx < stateWithColors.players.length; pIdx++) {
    const player = stateWithColors.players[pIdx]!;

    // Team must be locked
    if (!player.team.locked) {
      return { ok: false, error: `Player ${player.id} team not locked` };
    }

    // Validate active / reserve counts
    if (player.team.activeUnits.length !== ACTIVE_UNIT_COUNT) {
      return {
        ok: false,
        error: `Player ${player.id} must have exactly ${ACTIVE_UNIT_COUNT} active units, got ${player.team.activeUnits.length}`,
      };
    }
    if (player.team.reserveUnits.length !== RESERVE_UNIT_COUNT) {
      return {
        ok: false,
        error: `Player ${player.id} must have exactly ${RESERVE_UNIT_COUNT} reserve units, got ${player.team.reserveUnits.length}`,
      };
    }

    // Calculate grid positions for this player's active units
    const startingPositions: Position[] = getSpawnPositions(
      pIdx,
      updatedBoard.width,
      updatedBoard.height,
    );

    // Build UnitInstances for active units (placed on grid)
    const activeInstances: UnitInstance[] = [];
    for (let i = 0; i < player.team.activeUnits.length; i++) {
      const card = player.team.activeUnits[i]!;
      const position = startingPositions[i]!;

      // Create unique unit instance ID to avoid collisions between players
      const unitInstanceId = `${player.id}-${card.id}`;

      const instance: UnitInstance = {
        card,
        currentHp: card.hp,
        position,
        ownerId: player.id,
        color: player.color,
        hasMovedThisTurn: false,
        hasUsedAbilityThisTurn: false,
        hasAttackedThisTurn: false,
        combatModifiers: [],
      };
      activeInstances.push(instance);

      // Place unit on board using unique instance ID
      const placeResult = placeUnit(updatedBoard, unitInstanceId, position);
      if (!placeResult.ok) {
        return { ok: false, error: `Failed to place unit ${card.id} for player ${player.id}: ${placeResult.error}` };
      }
      updatedBoard = placeResult.value;
    }

    // Calculate reserve positions for bench units (vertical stack on player's side)
    const reservePositions: Position[] = getReservePositions(
      pIdx,
      updatedBoard.width,
      updatedBoard.height,
    );

    // Build UnitInstances for bench/reserve units (positioned in reserve area)
    const benchInstances: UnitInstance[] = player.team.reserveUnits.map((card, i) => ({
      card,
      currentHp: card.hp,
      position: reservePositions[i]!,
      ownerId: player.id,
      color: player.color,
      hasMovedThisTurn: false,
      hasUsedAbilityThisTurn: false,
      hasAttackedThisTurn: false,
      combatModifiers: [],
    }));

    updatedPlayers.push({
      ...player,
      units: [...activeInstances, ...benchInstances],
      // Explicitly preserve critical fields to prevent initialization bugs
      life: player.life,
      maxLife: player.maxLife,
      isEliminated: player.isEliminated,
      isReady: player.isReady,
      isConnected: player.isConnected,
      reserveLockedUntilNextTurn: player.reserveLockedUntilNextTurn,
      // team stays as-is (already has activeUnits / reserveUnits / locked)
    });
  }

  return {
    ok: true,
    value: {
      ...stateWithColors,
      board: updatedBoard,
      players: updatedPlayers,
      phase: GamePhase.IN_PROGRESS,
    },
  };
}

import type { GameState, UnitInstance, Position } from '../../types/index.js';
import { GamePhase, ACTIVE_UNIT_COUNT, RESERVE_UNIT_COUNT } from '../../types/index.js';
import type { Result } from '../../types/actions.js';
import { placeUnit } from '../board/index.js';
import { assignPlayerColors } from '../player-color/index.js';
import { getSpawnPositions, getReservePositions } from './index.js';

// ── Debug helpers (set DEBUG_MATCH_INIT=true to enable) ──
const DEBUG = typeof process !== 'undefined' && process.env?.DEBUG_MATCH_INIT === 'true';
function dbg(...args: unknown[]) {
  if (DEBUG) console.log('[match-init]', ...args);
}

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
  dbg('=== initializeMatchUnits START ===');
  dbg('Phase:', gameState.phase, '| Players:', gameState.players.length);

  // Phase guard
  if (gameState.phase !== GamePhase.PRE_GAME) {
    return { ok: false, error: `Cannot initialize match units in phase ${gameState.phase}, expected PRE_GAME` };
  }

  // Step 1: Ensure consistent player ordering by sorting by ID
  dbg('Original player order:', gameState.players.map(p => p.id));
  const sortedPlayers = [...gameState.players].sort((a, b) => a.id.localeCompare(b.id));
  dbg('Sorted player order:', sortedPlayers.map(p => p.id));
  const reorderedState = { ...gameState, players: sortedPlayers };
  
  // Step 2: Assign colors to all players
  let stateWithColors = assignPlayerColors(reorderedState);
  dbg('Colors assigned:', stateWithColors.players.map(p => `${p.id}=${p.color}`).join(', '));

  // Debug logging for player indices and colors
  stateWithColors.players.forEach((player, index) => {
    dbg(`Player ${index}: id=${player.id}, color=${player.color} (should be ${index === 0 ? 'bottom' : index === 1 ? 'top' : 'side'})`);
  });

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

    dbg(`Player ${player.id}: active=${player.team.activeUnits.map(u => u.id).join(',')} bench=${player.team.reserveUnits.map(u => u.id).join(',')}`);

    // Calculate grid positions for this player's active units
    const startingPositions: Position[] = getSpawnPositions(
      pIdx,
      updatedBoard.width,
      updatedBoard.height,
    );
    
    dbg(`Player ${player.id} (${player.color}) [index ${pIdx}] spawn positions:`, startingPositions);

    // Build UnitInstances for active units (placed on grid)
    const activeInstances: UnitInstance[] = [];
    for (let i = 0; i < player.team.activeUnits.length; i++) {
      const card = player.team.activeUnits[i]!;
      const position = startingPositions[i]!;

      // Create unique unit instance ID to avoid collisions between players
      const unitInstanceId = `${player.id}-${card.id}`;

      dbg(`Placing unit ${card.id} (instance: ${unitInstanceId}) at position (${position.x}, ${position.y})`);

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
      dbg(`  Placed ${unitInstanceId} at (${position.x}, ${position.y})`);
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

    dbg(`  Bench units placed at: ${reservePositions.map(p => `(${p.x},${p.y})`).join(', ')}`);

    updatedPlayers.push({
      ...player,
      units: [...activeInstances, ...benchInstances],
      // team stays as-is (already has activeUnits / reserveUnits / locked)
    });
  }

  dbg('=== initializeMatchUnits COMPLETE — phase → IN_PROGRESS ===');

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

import type { GameState, Position, Result, UnitInstance, UnitCard } from '../../types/index.js';
import { placeUnit } from '../board/index.js';
import { assignActiveAndBenchUnits, initializePlayerBoardState } from './assignment.js';

// Debug logging function
const dbg = (message: any, ...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SPAWN] ${message}`, ...args);
  }
};

// Helper function to create UnitInstance from UnitCard
function createUnitInstance(overrides: {
  card: UnitCard;
  currentHp: number;
  position: Position;
  ownerId: string;
  hasMovedThisTurn: boolean;
  hasUsedAbilityThisTurn: boolean;
  hasAttackedThisTurn: boolean;
  combatModifiers: any[];
}): UnitInstance {
  return overrides;
}

/**
 * Calculate spawn positions for active units based on player side.
 * Supports 2–4 players with no position collisions.
 *
 * Layout (bottom/top/left/right):
 *   Player 0 → Bottom side (3 rows up from bottom)
 *   Player 1 → Top side (3 rows down from top)
 *   Player 2 → Left side (3 columns right from left edge)
 *   Player 3 → Right side (3 columns left from right edge)
 *
 * Each player gets 3 evenly-spaced positions on their side.
 */
export function getSpawnPositions(playerIndex: number, boardWidth: number, boardHeight: number): Position[] {
  const positions: Position[] = [];

  // Determine side based on player index
  const side = playerIndex % 4;
  const offset = 2; // 3 tiles inward from edge (0-indexed)
  
  dbg(`getSpawnPositions: playerIndex=${playerIndex}, side=${side}, boardSize=${boardWidth}x${boardHeight}`);

  if (side === 0) {
    // Bottom side: 3 rows up from bottom
    const y = boardHeight - offset - 1;
    const centerX = Math.floor(boardWidth / 2);
    const xPositions = [centerX - 4, centerX, centerX + 4];
    for (const x of xPositions) {
      const clampedX = Math.max(0, Math.min(boardWidth - 1, x));
      positions.push({ x: clampedX, y });
    }
  } else if (side === 1) {
    // Top side: 3 rows down from top
    const y = offset;
    const centerX = Math.floor(boardWidth / 2);
    const xPositions = [centerX - 4, centerX, centerX + 4];
    for (const x of xPositions) {
      const clampedX = Math.max(0, Math.min(boardWidth - 1, x));
      positions.push({ x: clampedX, y });
    }
  } else if (side === 2) {
    // Left side: 3 columns right from left edge
    const x = offset;
    const centerY = Math.floor(boardHeight / 2);
    const yPositions = [centerY - 4, centerY, centerY + 4];
    for (const y of yPositions) {
      const clampedY = Math.max(0, Math.min(boardHeight - 1, y));
      positions.push({ x, y: clampedY });
    }
  } else if (side === 3) {
    // Right side: 3 columns left from right edge
    const x = boardWidth - offset - 1;
    const centerY = Math.floor(boardHeight / 2);
    const yPositions = [centerY - 4, centerY, centerY + 4];
    for (const y of yPositions) {
      const clampedY = Math.max(0, Math.min(boardHeight - 1, y));
      positions.push({ x, y: clampedY });
    }
  }

  return positions;
}

/**
 * Calculate reserve positions for benched units outside the main board area
 * Reserve units are positioned outside the board but visible to the player
 */
export function getReservePositions(playerIndex: number, boardWidth: number, boardHeight: number): Position[] {
  const positions: Position[] = [];
  const centerY = Math.floor(boardHeight / 2);
  
  // Determine which side of the board this player's reserve area is on
  const isLeftSide = playerIndex % 2 === 0;
  
  // Reserve positions are outside the board (negative X for left side, beyond board for right side)
  const baseX = isLeftSide ? -2 : boardWidth + 1;
  
  // Create 3 positions vertically aligned in reserve area
  const yPositions = [
    centerY - 3, // Top
    centerY,     // Middle
    centerY + 3  // Bottom
  ];
  
  for (const y of yPositions) {
    positions.push({ x: baseX, y });
  }
  
  return positions;
}

/**
 * Place starting units for a player on the board
 * Converts active units from player's team to UnitInstances and places them on board
 */
export function placeStartingUnits(gameState: GameState, playerId: string): Result<GameState> {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) {
    return { ok: false, error: `Player ${playerId} not found` };
  }
  
  if (!player.team.locked) {
    return { ok: false, error: `Player ${playerId} team not locked` };
  }
  
  if (player.team.activeUnits.length !== 3) {
    return { ok: false, error: `Player ${playerId} must have exactly 3 active units` };
  }
  
  const playerIndex = gameState.players.indexOf(player);
  const startingPositions = getSpawnPositions(playerIndex, gameState.board.width, gameState.board.height);
  
  let updatedBoard = gameState.board;
  const unitInstances: typeof player.units = [];
  
  // Place each active unit on the board
  for (let i = 0; i < player.team.activeUnits.length; i++) {
    const unitCard = player.team.activeUnits[i]!;
    const position = startingPositions[i]!;
    
    // Create UnitInstance from UnitCard
    const unitInstance = createUnitInstance({
      card: unitCard,
      currentHp: unitCard.hp,
      position,
      ownerId: playerId,
      hasMovedThisTurn: false,
      hasUsedAbilityThisTurn: false,
      hasAttackedThisTurn: false,
      combatModifiers: [],
    });
    
    unitInstances.push(unitInstance);
    
    // Place unit on board
    const placeResult = placeUnit(updatedBoard, unitInstance.card.id, position);
    if (!placeResult.ok) {
      return { ok: false, error: `Failed to place unit ${unitInstance.card.id}: ${placeResult.error}` };
    }
    
    updatedBoard = placeResult.value;
  }
  
  // Update game state with new board and unit instances
  const updatedPlayers = gameState.players.map(p => 
    p.id === playerId 
      ? { ...p, units: unitInstances }
      : p
  );
  
  return {
    ok: true,
    value: {
      ...gameState,
      board: updatedBoard,
      players: updatedPlayers,
    }
  };
}

// Export assignment + match-init functions
export { assignActiveAndBenchUnits, initializePlayerBoardState };
export { initializeMatchUnits } from './match-init.js';

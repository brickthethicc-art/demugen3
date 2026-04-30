import type { GameState, UnitInstance, Position } from '../../types/index.js';
import { createWallSet, wallKey } from '../../utils/walls.js';

function getLineCells(start: Position, end: Position): Position[] {
  const cells: Position[] = [];

  let x0 = start.x;
  let y0 = start.y;
  const x1 = end.x;
  const y1 = end.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    cells.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return cells;
}

export function hasLineOfSight(from: Position, to: Position, walls: Position[]): boolean {
  if (from.x === to.x && from.y === to.y) {
    return true;
  }

  if (walls.length === 0) {
    return true;
  }

  const wallSet = createWallSet(walls);
  const lineCells = getLineCells(from, to);

  for (let i = 1; i < lineCells.length - 1; i++) {
    const cell = lineCells[i]!;
    if (wallSet.has(wallKey(cell))) {
      return false;
    }
  }

  return true;
}

/**
 * Return ALL active units from ALL players.
 * 
 * This is the ONLY function used for rendering units.
 * It does NOT filter by current player - ALL players can see ALL opponent active units.
 * 
 * Returns units that:
 * - Have a valid position (not null)
 * - Have HP > 0 (alive)
 * - Are positioned within grid bounds (active units, not bench)
 * 
 * Expected behavior:
 * - Grid displays up to 12 active units total (3 per player × 4 players)
 * - Units are differentiated by color
 * - No ownership filtering
 */
export function getVisibleUnits(gameState: GameState): UnitInstance[] {
  const visible: UnitInstance[] = [];

  for (const player of gameState.players) {
    for (const unit of player.units) {
      // Only include active units (not bench/reserve)
      if (!unit.position) continue;
      
      // Only include alive units
      if (unit.currentHp <= 0) continue;
      
      // Only include units within grid bounds (exclude bench units with negative/out-of-bounds positions)
      if (
        unit.position.x < 0 || 
        unit.position.x >= gameState.board.width ||
        unit.position.y < 0 || 
        unit.position.y >= gameState.board.height
      ) continue;
      
      visible.push(unit);
    }
  }

  return visible;
}

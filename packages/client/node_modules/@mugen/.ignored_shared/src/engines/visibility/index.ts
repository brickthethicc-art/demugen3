import type { GameState, UnitInstance } from '../../types/index.js';

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

import type { GameState, Position, UnitInstance } from '../../types/index.js';
import { getUnitAt } from './index.js';

export function resolveHoveredUnit(
  state: GameState,
  pos: Position
): UnitInstance | null {
  const unitId = getUnitAt(state.board, pos);
  if (!unitId) return null;

  for (const player of state.players) {
    for (const unit of player.units) {
      if (unit.card.id === unitId) {
        return unit;
      }
    }
  }

  return null;
}

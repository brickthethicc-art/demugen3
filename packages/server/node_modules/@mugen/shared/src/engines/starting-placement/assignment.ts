import type { UnitCard, UnitInstance, Position } from '../../types/index.js';

/**
 * Assign active and bench units from selected units
 * Takes 6 selected units and splits them into 3 active and 3 bench units
 */
export function assignActiveAndBenchUnits(selectedUnits: UnitCard[]): {
  active: UnitCard[];
  bench: UnitCard[];
} {
  if (selectedUnits.length !== 6) {
    throw new Error(`Exactly 6 units required, got ${selectedUnits.length}`);
  }

  // For now, take first 3 as active, last 3 as bench
  // In a real implementation, this would be based on player selection
  const active = selectedUnits.slice(0, 3);
  const bench = selectedUnits.slice(3, 6);

  return { active, bench };
}

/**
 * Initialize player board state with placed units
 * Converts active units to UnitInstances and assigns positions
 */
export function initializePlayerBoardState(
  playerId: string,
  selectedUnits: UnitCard[],
  positions: Position[]
): UnitInstance[] {
  if (selectedUnits.length !== 3) {
    throw new Error(`Exactly 3 active units required, got ${selectedUnits.length}`);
  }

  if (positions.length !== 3) {
    throw new Error(`Exactly 3 positions required, got ${positions.length}`);
  }

  const unitInstances: UnitInstance[] = [];

  for (let i = 0; i < selectedUnits.length; i++) {
    const unitCard = selectedUnits[i]!;
    const position = positions[i]!;

    const unitInstance: UnitInstance = {
      card: unitCard,
      currentHp: unitCard.hp,
      position,
      ownerId: playerId,
      hasMovedThisTurn: false,
      hasUsedAbilityThisTurn: false,
      hasAttackedThisTurn: false,
      combatModifiers: [],
    };

    unitInstances.push(unitInstance);
  }

  return unitInstances;
}

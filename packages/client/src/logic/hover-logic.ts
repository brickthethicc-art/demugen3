import type { UnitInstance, AbilityType } from '@mugen/shared';

export interface UnitDisplayStats {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  movement: number;
  range: number;
  cost: number;
  abilityName: string;
  abilityDescription: string;
  abilityCost: number;
  abilityType: AbilityType;
}

export function getUnitDisplayStats(unit: UnitInstance): UnitDisplayStats {
  const { card } = unit;
  return {
    name: card.name,
    hp: unit.currentHp,
    maxHp: card.maxHp,
    atk: card.atk,
    movement: card.movement,
    range: card.range,
    cost: card.cost,
    abilityName: card.ability.name,
    abilityDescription: card.ability.description,
    abilityCost: card.ability.cost,
    abilityType: card.ability.abilityType,
  };
}

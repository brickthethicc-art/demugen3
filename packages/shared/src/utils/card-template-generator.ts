import {
  AbilityType,
  CardType,
  createDefaultCardFramework,
  DEFAULT_STAT_DISPLAY_ORDER,
} from '../types/index.js';
import type {
  CardFramework,
  SorceryCard,
  StatDisplayField,
  UnitCard,
} from '../types/index.js';

function resolveTemplateFramework(
  cardType: CardType,
  cost: number,
  framework?: Partial<CardFramework>
): CardFramework {
  const base = createDefaultCardFramework();
  const resolved = { ...base, ...framework };

  if (
    (cardType === CardType.UNIT && cost >= 7)
    || (cardType === CardType.SORCERY && cost >= 5)
  ) {
    resolved.cardFrameStyle = 'legendary';
    resolved.hasSpecialBorder = true;
  }

  return resolved;
}

export function createUnitCardTemplate(params: {
  id: string;
  name: string;
  cost: number;
  hp: number;
  atk: number;
  movement: number;
  range: number;
  abilityId: string;
  abilityName: string;
  abilityDesc: string;
  abilityCost: number;
  abilityType: AbilityType;
  framework?: Partial<CardFramework>;
  statDisplayOrder?: StatDisplayField[];
  abilityIconId?: string;
}): UnitCard {
  return {
    id: params.id,
    name: params.name,
    cardType: CardType.UNIT,
    hp: params.hp,
    maxHp: params.hp,
    atk: params.atk,
    movement: params.movement,
    range: params.range,
    cost: params.cost,
    ability: {
      id: params.abilityId,
      name: params.abilityName,
      description: params.abilityDesc,
      cost: params.abilityCost,
      abilityType: params.abilityType,
    },
    framework: resolveTemplateFramework(CardType.UNIT, params.cost, params.framework),
    statDisplayOrder: params.statDisplayOrder ?? [...DEFAULT_STAT_DISPLAY_ORDER],
    abilityIconId: params.abilityIconId,
  };
}

export function createSorceryCardTemplate(params: {
  id: string;
  name: string;
  cost: number;
  effect: string;
  framework?: Partial<CardFramework>;
  effectIconId?: string;
  targetIndicator?: string;
}): SorceryCard {
  return {
    id: params.id,
    name: params.name,
    cardType: CardType.SORCERY,
    cost: params.cost,
    effect: params.effect,
    framework: resolveTemplateFramework(CardType.SORCERY, params.cost, params.framework),
    effectIconId: params.effectIconId,
    targetIndicator: params.targetIndicator,
  };
}

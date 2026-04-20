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
    abilityType: AbilityType;
}
export declare function getUnitDisplayStats(unit: UnitInstance): UnitDisplayStats;
//# sourceMappingURL=hover-logic.d.ts.map
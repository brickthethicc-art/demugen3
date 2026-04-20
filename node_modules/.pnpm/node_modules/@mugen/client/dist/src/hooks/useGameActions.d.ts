import type { Position } from '@mugen/shared';
export declare function useGameActions(): {
    isMyTurn: boolean;
    sendMove: (unitId: string, target: Position) => void;
    sendAbility: (unitId: string, targetId?: string, targetOwnerId?: string) => void;
    sendAttack: (attackerId: string, defenderId: string, defenderOwnerId: string) => void;
    sendAdvancePhase: () => void;
    sendEndTurn: () => void;
    sendDeployReserve: (unitId: string, position: Position) => void;
};
//# sourceMappingURL=useGameActions.d.ts.map
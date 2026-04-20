import type { Card } from '@mugen/shared';
/**
 * Reusable hover handlers for cards
 * Centralizes hover logic to prevent duplication across components
 */
export declare function useCardHover(): {
    handleMouseEnter: (card: Card) => void;
    handleMouseLeave: () => void;
};
/**
 * Hover props that can be spread onto React elements
 * Usage: {...getHoverProps(card)}
 */
export declare function getHoverProps(card: Card): {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
};
export declare function useUnitHover(): {
    handleMouseEnter: (card: Card) => void;
    handleMouseLeave: () => void;
};
//# sourceMappingURL=useUnitHover.d.ts.map
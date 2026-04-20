import { useGameStore } from '../store/game-store.js';
/**
 * Reusable hover handlers for cards
 * Centralizes hover logic to prevent duplication across components
 */
export function useCardHover() {
    const setHoveredCard = useGameStore(state => state.setHoveredCard);
    const clearHoveredCard = useGameStore(state => state.clearHoveredCard);
    const handleMouseEnter = (card) => {
        setHoveredCard(card);
    };
    const handleMouseLeave = () => {
        clearHoveredCard();
    };
    return {
        handleMouseEnter,
        handleMouseLeave,
    };
}
/**
 * Hover props that can be spread onto React elements
 * Usage: {...getHoverProps(card)}
 */
export function getHoverProps(card) {
    const { handleMouseEnter, handleMouseLeave } = useCardHover();
    return {
        onMouseEnter: () => handleMouseEnter(card),
        onMouseLeave: handleMouseLeave,
    };
}
// Keep the old useUnitHook for backward compatibility
export function useUnitHover() {
    return useCardHover();
}
//# sourceMappingURL=useUnitHover.js.map
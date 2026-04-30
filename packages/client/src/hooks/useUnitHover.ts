import type { Card } from '@mugen/shared';
import { useGameStore } from '../store/game-store.js';

/**
 * Reusable hover handlers for cards
 * Centralizes hover logic to prevent duplication across components
 */
export function useCardHover() {
  const setHoveredCard = useGameStore(state => state.setHoveredCard);

  const handleMouseEnter = (card: Card) => {
    setHoveredCard(card);
  };

  const handleMouseLeave = () => {
    // Intentionally no-op: keep last hovered card visible until a new hover occurs.
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
export function getHoverProps(card: Card) {
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

import type { UnitCard } from '@mugen/shared';
import { useGameStore } from '../store/game-store.js';

/**
 * Reusable hover handlers for unit cards
 * Centralizes hover logic to prevent duplication across components
 */
export function useUnitHover() {
  const setHoveredCard = useGameStore(state => state.setHoveredCard);
  const clearHoveredCard = useGameStore(state => state.clearHoveredCard);

  const handleMouseEnter = (card: UnitCard) => {
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
export function getHoverProps(card: UnitCard) {
  const { handleMouseEnter, handleMouseLeave } = useUnitHover();
  
  return {
    onMouseEnter: () => handleMouseEnter(card),
    onMouseLeave: handleMouseLeave,
  };
}

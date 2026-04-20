import type { GameState, PlayerState } from '../../types/index.js';
import { MAX_HAND_SIZE, ACTIVE_UNIT_COUNT } from '../../types/index.js';

export interface StandbyPhaseStatus {
  isActive: boolean;
  needsBenchDeployment: boolean;
  needsHandDiscard: boolean;
  message: string;
  canProgress: boolean;
}

/**
 * Determines if the standby phase should be triggered for a player
 */
export function shouldTriggerStandbyPhase(player: PlayerState): StandbyPhaseStatus {
  const activeUnitCount = player.units.filter(u => u.position !== null).length;
  const hasBenchUnits = player.team.reserveUnits.length > 0;
  const handSize = player.hand.cards.length;

  const needsBenchDeployment = activeUnitCount < ACTIVE_UNIT_COUNT && hasBenchUnits;
  const needsHandDiscard = handSize > MAX_HAND_SIZE;

  // Standby phase triggers if either condition is true
  const isActive = needsBenchDeployment || needsHandDiscard;

  // Generate appropriate message(s)
  let message = '';
  if (needsBenchDeployment && needsHandDiscard) {
    message = 'Please move a bench/reserved unit onto the field and discard down to the maximum limit.';
  } else if (needsBenchDeployment) {
    message = 'Please move a bench/reserved unit onto the field.';
  } else if (needsHandDiscard) {
    message = 'Hand size exceeded. Please discard down to the maximum limit.';
  }

  // Can progress only when both requirements are satisfied
  const canProgress = !needsBenchDeployment && !needsHandDiscard;

  return {
    isActive,
    needsBenchDeployment,
    needsHandDiscard,
    message,
    canProgress,
  };
}

/**
 * Checks if the standby phase should trigger for the current player
 */
export function getCurrentPlayerStandbyStatus(state: GameState): StandbyPhaseStatus {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) {
    throw new Error(`Current player not found at index ${state.currentPlayerIndex}`);
  }
  return shouldTriggerStandbyPhase(currentPlayer);
}

/**
 * Validates if a bench deployment satisfies the standby phase requirements
 */
export function validateBenchDeployment(state: GameState): boolean {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) {
    throw new Error(`Current player not found at index ${state.currentPlayerIndex}`);
  }
  
  const status = shouldTriggerStandbyPhase(currentPlayer);
  
  // If bench deployment is not required, it's valid
  if (!status.needsBenchDeployment) {
    return true;
  }
  
  // Check if player has at least one active unit now (or no more bench units)
  const activeUnitCount = currentPlayer.units.filter(u => u.position !== null).length;
  const hasBenchUnits = currentPlayer.team.reserveUnits.length > 0;
  
  // Valid if: has at least 1 active unit OR no more bench units available
  return activeUnitCount >= 1 || !hasBenchUnits;
}

/**
 * Validates if hand size is within limits
 */
export function validateHandSize(state: GameState): boolean {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) {
    throw new Error(`Current player not found at index ${state.currentPlayerIndex}`);
  }
  
  const handSize = currentPlayer.hand.cards.length;
  return handSize <= MAX_HAND_SIZE;
}

/**
 * Checks if the standby phase can be exited
 */
export function canExitStandbyPhase(state: GameState): boolean {
  const status = getCurrentPlayerStandbyStatus(state);
  return status.canProgress;
}

/**
 * Gets the standby phase status for UI display
 */
export function getStandbyPhaseDisplay(state: GameState): StandbyPhaseStatus | null {
  if (state.turnPhase !== 'STANDBY') {
    return null;
  }
  
  return getCurrentPlayerStandbyStatus(state);
}

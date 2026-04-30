import type { GameState, PlayerState, UnitCard } from '../../types/index.js';
import { MAX_HAND_SIZE, ACTIVE_UNIT_COUNT, RESERVE_UNIT_COUNT, CardType } from '../../types/index.js';

export interface StandbyPhaseStatus {
  isActive: boolean;
  needsHandDiscard: boolean;
  needsBenchDeployment: boolean;
  canSummonToBench: boolean;
  summonableCards: UnitCard[];
  message: string;
  canProgress: boolean;
}

/**
 * Get unit cards from hand that are eligible for bench summoning.
 * Only UNIT cards can be summoned, and the player must have enough LP.
 */
export function getSummonableHandUnits(player: PlayerState): UnitCard[] {
  return player.hand.cards.filter(
    (c): c is UnitCard => c.cardType === CardType.UNIT && c.cost <= player.life
  );
}

/**
 * Determines if the standby phase should be triggered for a player.
 *
 * Strict ordering enforced:
 *   Step 1 — Discard (if hand > MAX_HAND_SIZE)
 *   Step 2 — Promote bench → active (if active < 3 AND bench has units)
 *   Step 3 — Summon hand → bench (required when bench has open slots AND hand has summonable units AND LP sufficient)
 */
export function shouldTriggerStandbyPhase(player: PlayerState, boardWidth: number = 23, boardHeight: number = 23): StandbyPhaseStatus {
  // Count only units actually ON the board (within bounds), not bench units with out-of-bounds positions
  const activeUnitCount = player.units.filter(u => 
    u.position !== null && 
    u.position!.x >= 0 && 
    u.position!.x < boardWidth && 
    u.position!.y >= 0 && 
    u.position!.y < boardHeight
  ).length;
  const hasBenchUnits = player.team.reserveUnits.length > 0;
  const handSize = player.hand.cards.length;
  const benchSlotCount = player.team.reserveUnits.length;

  // Step 1: Discard
  const needsHandDiscard = handSize > MAX_HAND_SIZE;

  // Step 2: Promote bench → active
  const needsBenchDeployment = activeUnitCount < ACTIVE_UNIT_COUNT && hasBenchUnits;

  // Step 3: Summon to bench (only available when steps 1 & 2 are resolved)
  const hasOpenBenchSlot = benchSlotCount < RESERVE_UNIT_COUNT;
  const summonableCards = getSummonableHandUnits(player);
  const canSummonToBench =
    !needsHandDiscard &&
    !needsBenchDeployment &&
    hasOpenBenchSlot &&
    summonableCards.length > 0;

  // Standby phase triggers if any condition is true
  const isActive = needsHandDiscard || needsBenchDeployment || canSummonToBench;

  // Generate appropriate message(s)
  let message = '';
  if (needsHandDiscard) {
    message = 'Hand size exceeded. Please discard down to the maximum limit.';
  } else if (needsBenchDeployment) {
    message = 'Please move a bench/reserved unit onto the field.';
  } else if (canSummonToBench) {
    message = 'You must summon a unit from your hand to the bench (costs LP).';
  }

  // Can progress only when mandatory requirements are satisfied
  const canProgress = !needsHandDiscard && !needsBenchDeployment && !canSummonToBench;

  return {
    isActive,
    needsHandDiscard,
    needsBenchDeployment,
    canSummonToBench,
    summonableCards,
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
  return shouldTriggerStandbyPhase(currentPlayer, state.board.width, state.board.height);
}

/**
 * Validates if a bench deployment satisfies the standby phase requirements
 */
export function validateBenchDeployment(state: GameState): boolean {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) {
    throw new Error(`Current player not found at index ${state.currentPlayerIndex}`);
  }
  
  const status = shouldTriggerStandbyPhase(currentPlayer, state.board.width, state.board.height);
  
  // If bench deployment is not required, it's valid
  if (!status.needsBenchDeployment) {
    return true;
  }
  
  // Check if player has at least one active unit now (or no more bench units)
  const activeUnitCount = currentPlayer.units.filter(u => 
    u.position !== null && 
    u.position!.x >= 0 && 
    u.position!.x < state.board.width && 
    u.position!.y >= 0 && 
    u.position!.y < state.board.height
  ).length;
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

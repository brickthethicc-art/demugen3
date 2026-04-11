import type { Deck, Hand, UnitCard, PlayerState } from '../../types/index.js';
import { MAX_HAND_SIZE, ACTIVE_UNIT_COUNT, MAX_TEAM_COST } from '../../types/index.js';
import type { Result } from '../../types/actions.js';

export interface DrawInitialHandResult {
  hand: Hand;
  remainingDeck: Deck;
}

export function drawInitialHand(deck: Deck): Result<DrawInitialHandResult, string> {
  // Validate deck has enough cards
  if (deck.cards.length < MAX_HAND_SIZE) {
    return {
      ok: false,
      error: `insufficient cards in deck: need ${MAX_HAND_SIZE}, have ${deck.cards.length}`,
    };
  }

  // Extract hand cards (first MAX_HAND_SIZE cards)
  const handCards = deck.cards.slice(0, MAX_HAND_SIZE);
  const remainingCards = deck.cards.slice(MAX_HAND_SIZE);

  const result: DrawInitialHandResult = {
    hand: { cards: handCards },
    remainingDeck: { cards: remainingCards },
  };

  return { ok: true, value: result };
}

export function validateStartingSelection(units: UnitCard[]): Result<boolean, string> {
  // Check exactly 6 units
  if (units.length !== 6) {
    return {
      ok: false,
      error: `Must select exactly 6 units, got ${units.length}`,
    };
  }

  // Check all are units (not sorceries)
  for (const unit of units) {
    if (unit.cardType !== 'UNIT') {
      return {
        ok: false,
        error: 'All selected cards must be units (no sorceries)',
      };
    }
  }

  // Check total cost < 40
  const totalCost = units.reduce((sum, unit) => sum + unit.cost, 0);
  if (totalCost >= MAX_TEAM_COST) {
    return {
      ok: false,
      error: `Total cost ${totalCost} cost exceeds 40`,
    };
  }

  return { ok: true, value: true };
}

export function placeStartingUnits(units: UnitCard[], player: PlayerState): Result<PlayerState, string> {
  // Validate selection first
  const validation = validateStartingSelection(units);
  if (!validation.ok) {
    return validation;
  }

  // Create unit instances
  const unitInstances = units.map((unit, index) => ({
    card: unit,
    currentHp: unit.hp,
    position: index < ACTIVE_UNIT_COUNT ? { x: index, y: 0 } : null, // First 3 on board at top row
    ownerId: player.id,
    hasMovedThisTurn: false,
    hasUsedAbilityThisTurn: false,
    hasAttackedThisTurn: false,
    combatModifiers: [],
  }));

  // Separate active and reserve units
  const activeUnits = units.slice(0, ACTIVE_UNIT_COUNT);
  const reserveUnits = units.slice(ACTIVE_UNIT_COUNT);

  // Return updated player state
  const updatedPlayer: PlayerState = {
    ...player,
    units: unitInstances,
    team: {
      activeUnits,
      reserveUnits,
      locked: true,
    },
  };

  return { ok: true, value: updatedPlayer };
}

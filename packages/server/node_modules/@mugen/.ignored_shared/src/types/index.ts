export {
  CardType,
  AbilityType,
  MAX_DECK_SIZE,
  MAX_HAND_SIZE,
  MAX_TEAM_SIZE,
  ACTIVE_UNIT_COUNT,
  RESERVE_UNIT_COUNT,
  MAX_TEAM_COST,
} from './card.js';
export type {
  AbilityDefinition,
  UnitCard,
  SorceryCard,
  Card,
  Deck,
  Hand,
} from './card.js';

export {
  DEFAULT_BOARD_WIDTH,
  DEFAULT_BOARD_HEIGHT,
} from './board.js';
export type {
  Position,
  GridCell,
  BoardState,
} from './board.js';

export {
  CombatModifierType,
  STARTING_LIFE,
} from './player.js';
export type {
  PlayerColor,
  UnitInstance,
  CombatModifier,
  PlayerTeam,
  PlayerState,
} from './player.js';

export {
  GamePhase,
  TurnPhase,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MAX_MOVES_PER_TURN,
} from './game.js';
export type {
  GameState,
} from './game.js';

export {
  IntentType,
} from './actions.js';
export type {
  MoveUnitIntent,
  UseAbilityIntent,
  AttackIntent,
  EndTurnIntent,
  SelectTeamIntent,
  LockTeamIntent,
  AdvancePhaseIntent,
  DeployReserveIntent,
  ClientIntent,
  ActionResult,
  Result,
} from './actions.js';

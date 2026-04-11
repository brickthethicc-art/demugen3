import {
  CardType,
  AbilityType,
  GamePhase,
  TurnPhase,
  STARTING_LIFE,
  DEFAULT_BOARD_WIDTH,
  DEFAULT_BOARD_HEIGHT,
} from '../src/types/index.js';
import type {
  UnitCard,
  SorceryCard,
  AbilityDefinition,
  PlayerState,
  PlayerTeam,
  UnitInstance,
  GameState,
  BoardState,
  GridCell,
} from '../src/types/index.js';

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter++;
  return `${prefix}-${idCounter}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}

export function createAbility(overrides?: Partial<AbilityDefinition>): AbilityDefinition {
  return {
    id: nextId('ability'),
    name: 'Test Ability',
    description: 'A test ability',
    cost: 0,
    abilityType: AbilityType.DAMAGE,
    ...overrides,
  };
}

export function createUnit(overrides?: Partial<UnitCard>): UnitCard {
  return {
    id: nextId('unit'),
    name: 'Test Unit',
    cardType: CardType.UNIT,
    hp: 5,
    maxHp: 5,
    atk: 3,
    movement: 2,
    range: 1,
    ability: createAbility(),
    cost: 5,
    ...overrides,
  };
}

export function createSorcery(overrides?: Partial<SorceryCard>): SorceryCard {
  return {
    id: nextId('sorcery'),
    name: 'Test Sorcery',
    cardType: CardType.SORCERY,
    cost: 3,
    effect: 'Deal 2 damage',
    ...overrides,
  };
}

export function createUnitInstance(overrides?: Partial<UnitInstance>): UnitInstance {
  const card = overrides?.card ?? createUnit();
  return {
    card,
    currentHp: card.hp,
    position: null,
    ownerId: 'player-1',
    hasMovedThisTurn: false,
    hasUsedAbilityThisTurn: false,
    hasAttackedThisTurn: false,
    combatModifiers: [],
    ...overrides,
  };
}

export function createPlayerTeam(overrides?: Partial<PlayerTeam>): PlayerTeam {
  return {
    activeUnits: [createUnit(), createUnit(), createUnit()],
    reserveUnits: [createUnit(), createUnit(), createUnit()],
    locked: false,
    ...overrides,
  };
}

export function createPlayer(overrides?: Partial<PlayerState>): PlayerState {
  const id = overrides?.id ?? nextId('player');
  return {
    id,
    name: `Player ${id}`,
    life: STARTING_LIFE,
    maxLife: STARTING_LIFE,
    team: createPlayerTeam(),
    units: [],
    hand: { cards: [] },
    deck: { cards: [] },
    isEliminated: false,
    isReady: false,
    isConnected: true,
    reserveLockedUntilNextTurn: false,
    ...overrides,
  };
}

export function createBoard(overrides?: Partial<BoardState>): BoardState {
  const width = overrides?.width ?? DEFAULT_BOARD_WIDTH;
  const height = overrides?.height ?? DEFAULT_BOARD_HEIGHT;
  const cells: GridCell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({ position: { x, y }, occupantId: null });
    }
    cells.push(row);
  }
  return { width, height, cells, ...overrides };
}

export function createGameState(overrides?: Partial<GameState>): GameState {
  return {
    id: nextId('game'),
    phase: GamePhase.LOBBY,
    turnPhase: TurnPhase.MOVE,
    currentPlayerIndex: 0,
    players: [createPlayer(), createPlayer()],
    board: createBoard(),
    turnNumber: 1,
    turnRotation: 0,
    movesUsedThisTurn: 0,
    winnerId: null,
    ...overrides,
  };
}

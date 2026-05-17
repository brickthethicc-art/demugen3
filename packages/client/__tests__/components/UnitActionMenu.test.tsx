import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CardType, AbilityType, TurnPhase, type GameState, type UnitCard, type UnitInstance } from '@mugen/shared';
import { UnitActionMenu } from '../../src/components/UnitActionMenu.js';
import { useGameStore } from '../../src/store/game-store.js';

const sendIntentMock = vi.fn();

vi.mock('../../src/network/socket-client.js', () => ({
  sendIntent: (...args: unknown[]) => sendIntentMock(...args),
}));

function makeAbility(id: string, name: string, description: string, abilityType: AbilityType) {
  return {
    id,
    name,
    description,
    cost: 0,
    abilityType,
  };
}

function makeUnitCard(id: string, name: string, abilities: ReturnType<typeof makeAbility>[]): UnitCard {
  const [primary, ...rest] = abilities;
  return {
    id,
    name,
    cardType: CardType.UNIT,
    hp: 10,
    maxHp: 10,
    atk: 4,
    movement: 2,
    range: 3,
    ability: primary!,
    cost: 5,
    ...(rest.length > 0 ? { abilities: rest } : {}),
  } as UnitCard;
}

function makeUnitInstance(card: UnitCard, ownerId: string, position: { x: number; y: number }, abilityCooldowns?: Record<string, number>): UnitInstance {
  return {
    card,
    currentHp: card.hp,
    position,
    ownerId,
    hasMovedThisTurn: false,
    hasUsedAbilityThisTurn: false,
    hasAttackedThisTurn: false,
    combatModifiers: [],
    ...(abilityCooldowns ? { abilityCooldowns } : {}),
  };
}

function buildGameState(myUnit: UnitInstance): GameState {
  const enemyCard = makeUnitCard('u-enemy', 'Enemy', [
    makeAbility('enemy-ab', 'Enemy Ability', 'Deal 3 damage to target enemy', AbilityType.DAMAGE),
  ]);
  const enemyUnit = makeUnitInstance(enemyCard, 'p2', { x: 4, y: 2 });

  const width = 8;
  const height = 8;
  const cells = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => ({
      position: { x, y },
      occupantId:
        x === myUnit.position!.x && y === myUnit.position!.y
          ? `${myUnit.ownerId}-${myUnit.card.id}`
          : x === enemyUnit.position!.x && y === enemyUnit.position!.y
            ? `${enemyUnit.ownerId}-${enemyUnit.card.id}`
            : null,
    }))
  );

  return {
    id: 'g1',
    phase: 'IN_PROGRESS',
    turnPhase: TurnPhase.ABILITY,
    currentPlayerIndex: 0,
    players: [
      {
        id: 'p1',
        name: 'P1',
        life: 20,
        maxLife: 20,
        team: { activeUnits: [myUnit.card], reserveUnits: [], locked: true },
        units: [myUnit],
        hand: { cards: [] },
        deck: { cards: [] },
        mainDeck: { cards: [] },
        discardPile: { cards: [] },
        isEliminated: false,
        isReady: true,
        isConnected: true,
        reserveLockedUntilNextTurn: false,
      },
      {
        id: 'p2',
        name: 'P2',
        life: 20,
        maxLife: 20,
        team: { activeUnits: [enemyUnit.card], reserveUnits: [], locked: true },
        units: [enemyUnit],
        hand: { cards: [] },
        deck: { cards: [] },
        mainDeck: { cards: [] },
        discardPile: { cards: [] },
        isEliminated: false,
        isReady: true,
        isConnected: true,
        reserveLockedUntilNextTurn: false,
      },
    ],
    board: { width, height, cells },
    walls: [],
    turnNumber: 1,
    turnRotation: 0,
    movesUsedThisTurn: 0,
    winnerId: null,
  } as GameState;
}

describe('UnitActionMenu multi-ability selection', () => {
  beforeEach(() => {
    sendIntentMock.mockReset();
    useGameStore.getState().reset();
  });

  it('shows 3 ability buttons for Zeus', () => {
    const zeusCard = makeUnitCard('u43', 'Zeus', [
      makeAbility('focus', 'Battle Focus', 'Gain +2 ATK', AbilityType.BUFF),
      makeAbility('storm', 'Storm Bolt', 'Deal 3 damage to target enemy', AbilityType.DAMAGE),
      makeAbility('heal', 'Divine Mend', 'Heal 3 HP to ally', AbilityType.HEAL),
    ]);
    const zeus = makeUnitInstance(zeusCard, 'p1', { x: 2, y: 2 });

    useGameStore.setState({
      playerId: 'p1',
      isSpectating: false,
      gameState: buildGameState(zeus),
      selectedUnitId: zeus.card.id,
      menuHiddenDuringMove: false,
    });

    render(<UnitActionMenu />);
    expect(screen.getByRole('button', { name: /battle focus/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /storm bolt/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /divine mend/i })).toBeInTheDocument();

  });

  it('shows 1 ability button for a single-ability unit', () => {
    const singleCard = makeUnitCard('u1', 'Soldier', [
      makeAbility('slash', 'Slash', 'Deal 3 damage to target enemy', AbilityType.DAMAGE),
    ]);
    const single = makeUnitInstance(singleCard, 'p1', { x: 2, y: 2 });

    useGameStore.setState({
      playerId: 'p1',
      isSpectating: false,
      gameState: buildGameState(single),
      selectedUnitId: single.card.id,
      menuHiddenDuringMove: false,
    });

    render(<UnitActionMenu />);
    expect(screen.getByRole('button', { name: /slash/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /storm bolt/i })).not.toBeInTheDocument();
  });

  it('stores selectedAbilityId for chosen Zeus targeted ability', () => {
    const zeusCard = makeUnitCard('u43', 'Zeus', [
      makeAbility('focus', 'Battle Focus', 'Gain +2 ATK', AbilityType.BUFF),
      makeAbility('storm', 'Storm Bolt', 'Deal 3 damage to target enemy', AbilityType.DAMAGE),
      makeAbility('heal', 'Divine Mend', 'Heal 3 HP to ally', AbilityType.HEAL),
    ]);
    const zeus = makeUnitInstance(zeusCard, 'p1', { x: 2, y: 2 });

    useGameStore.setState({
      playerId: 'p1',
      isSpectating: false,
      gameState: buildGameState(zeus),
      selectedUnitId: zeus.card.id,
      menuHiddenDuringMove: false,
      selectedAbilityId: null,
    });

    render(<UnitActionMenu />);

    fireEvent.click(screen.getByRole('button', { name: /storm bolt/i }));
    expect(useGameStore.getState().selectedAbilityId).toBe('storm');
    expect(useGameStore.getState().abilityModeActive).toBe(true);
  });

  it('sends selected Zeus abilityId in USE_ABILITY intent for self-target ability', () => {
    const zeusCard = makeUnitCard('u43', 'Zeus', [
      makeAbility('focus', 'Battle Focus', 'Gain +2 ATK', AbilityType.BUFF),
      makeAbility('storm', 'Storm Bolt', 'Deal 3 damage to target enemy', AbilityType.DAMAGE),
      makeAbility('heal', 'Divine Mend', 'Heal 3 HP to ally', AbilityType.HEAL),
    ]);
    const zeus = makeUnitInstance(zeusCard, 'p1', { x: 2, y: 2 });

    useGameStore.setState({
      playerId: 'p1',
      isSpectating: false,
      gameState: buildGameState(zeus),
      selectedUnitId: zeus.card.id,
      menuHiddenDuringMove: false,
      selectedAbilityId: null,
    });

    render(<UnitActionMenu />);

    fireEvent.click(screen.getByRole('button', { name: /battle focus/i }));
    expect(sendIntentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'USE_ABILITY',
        unitId: 'u43',
        abilityId: 'focus',
      })
    );
  });

  it('disables ability button when that ability cooldown is above 0', () => {
    const zeusCard = makeUnitCard('u43', 'Zeus', [
      makeAbility('focus', 'Battle Focus', 'Gain +2 ATK', AbilityType.BUFF),
      makeAbility('storm', 'Storm Bolt', 'Deal 3 damage to target enemy', AbilityType.DAMAGE),
      makeAbility('heal', 'Divine Mend', 'Heal 3 HP to ally', AbilityType.HEAL),
    ]);
    const zeus = makeUnitInstance(zeusCard, 'p1', { x: 2, y: 2 }, { storm: 2 });

    useGameStore.setState({
      playerId: 'p1',
      isSpectating: false,
      gameState: buildGameState(zeus),
      selectedUnitId: zeus.card.id,
      menuHiddenDuringMove: false,
    });

    render(<UnitActionMenu />);

    const stormButton = screen.getByRole('button', { name: /storm bolt/i });
    expect(stormButton).toBeDisabled();
    expect(screen.getByText(/cd 2/i)).toBeInTheDocument();
  });
});

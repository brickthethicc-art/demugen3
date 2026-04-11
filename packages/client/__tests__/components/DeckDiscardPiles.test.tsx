import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useGameStore } from '../../src/store/game-store.js';
import { MainDeckPile } from '../../src/components/MainDeckPile.js';
import { DiscardPile } from '../../src/components/DiscardPile.js';
import { CardType, AbilityType } from '@mugen/shared';
import type { Card, UnitCard } from '@mugen/shared';

function makeUnit(id: string): UnitCard {
  return {
    id,
    name: `Unit ${id}`,
    cardType: CardType.UNIT,
    hp: 5,
    maxHp: 5,
    atk: 3,
    movement: 2,
    range: 1,
    ability: {
      id: `ability-${id}`,
      name: 'Test Ability',
      description: 'Test',
      cost: 1,
      abilityType: AbilityType.DAMAGE,
    },
    cost: 5,
  };
}

describe('MainDeckPile', () => {
  beforeEach(() => {
    useGameStore.setState({ mainDeck: [], discardPile: [] });
  });

  it('renders with correct card count', () => {
    const cards: Card[] = [makeUnit('a'), makeUnit('b'), makeUnit('c'), makeUnit('d')];
    useGameStore.setState({ mainDeck: cards });
    render(<MainDeckPile />);
    expect(screen.getByTestId('main-deck-pile')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows 0 when deck is empty', () => {
    useGameStore.setState({ mainDeck: [] });
    render(<MainDeckPile />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders as a face-down card pile', () => {
    const cards: Card[] = [makeUnit('a')];
    useGameStore.setState({ mainDeck: cards });
    render(<MainDeckPile />);
    expect(screen.getByTestId('main-deck-pile')).toBeInTheDocument();
  });
});

describe('DiscardPile', () => {
  beforeEach(() => {
    useGameStore.setState({ mainDeck: [], discardPile: [] });
  });

  it('renders with correct card count', () => {
    const cards: Card[] = [makeUnit('x'), makeUnit('y')];
    useGameStore.setState({ discardPile: cards });
    render(<DiscardPile />);
    expect(screen.getByTestId('discard-pile')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows 0 when discard pile is empty', () => {
    useGameStore.setState({ discardPile: [] });
    render(<DiscardPile />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows top card name when pile is non-empty', () => {
    const cards: Card[] = [makeUnit('first'), makeUnit('top')];
    useGameStore.setState({ discardPile: cards });
    render(<DiscardPile />);
    expect(screen.getByText('Unit top')).toBeInTheDocument();
  });
});

vi.mock('../../src/components/GameBoard.js', () => ({
  GameBoard: () => <div data-testid="game-board-mock" />,
}));
vi.mock('../../src/components/GameHUD.js', () => ({
  GameHUD: () => <div data-testid="game-hud-mock" />,
}));
vi.mock('../../src/components/HoverPanel.js', () => ({
  HoverPanel: () => <div data-testid="hover-panel-mock" />,
}));

describe('GameScreen layout integration', () => {
  it('deck and discard piles render in the game screen', async () => {
    const { GameScreen } = await import('../../src/components/GameScreen.js');
    render(<GameScreen />);
    expect(screen.getByTestId('main-deck-pile')).toBeInTheDocument();
    expect(screen.getByTestId('discard-pile')).toBeInTheDocument();
  });
});

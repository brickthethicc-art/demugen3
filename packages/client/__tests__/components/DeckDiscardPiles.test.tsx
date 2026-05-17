import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useGameStore } from '../../src/store/game-store.js';
import { MainDeckPile } from '../../src/components/MainDeckPile.js';
import { DiscardPile } from '../../src/components/DiscardPile.js';
import { DiscardPileViewer } from '../../src/components/DiscardPileViewer.js';
import { CardType, AbilityType, HIDDEN_CARD_ID_PREFIX } from '@mugen/shared';
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

describe('DiscardPileViewer', () => {
  const makeEntries = (cards: Card[]) =>
    cards.map((card, index) => ({
      card,
      timestamp: 1000 + index,
      source: 'other' as const,
    }));

  it('renders normal discard entries face-up', () => {
    const cards: Card[] = [makeUnit('visible')];
    render(<DiscardPileViewer entries={makeEntries(cards)} count={cards.length} onClose={() => undefined} />);

    expect(screen.getByText('Unit visible')).toBeInTheDocument();
  });

  it('renders card back only for hidden-card IDs', () => {
    const hiddenCard: Card = {
      id: `${HIDDEN_CARD_ID_PREFIX}:p2:discardPile:0`,
      name: 'Hidden Card',
      cardType: CardType.SORCERY,
      cost: 0,
      effect: '',
    };

    const { container } = render(
      <DiscardPileViewer entries={makeEntries([hiddenCard])} count={1} onClose={() => undefined} />
    );

    expect(screen.queryByText('Hidden Card')).not.toBeInTheDocument();
    expect(container.querySelector('[style*="back-of-card.png"]')).toBeTruthy();
  });
});

describe('DiscardPile', () => {
  const setDiscardCards = (cards: Card[]) => {
    useGameStore.setState({
      playerId: 'p1',
      gameState: {
        players: [
          {
            id: 'p1',
            discardPile: { cards },
          },
        ],
      } as any,
    });
  };

  beforeEach(() => {
    useGameStore.setState({ mainDeck: [], discardPile: [], gameState: null, playerId: null });
  });

  it('renders with correct card count', () => {
    const cards: Card[] = [makeUnit('x'), makeUnit('y')];
    setDiscardCards(cards);
    render(<DiscardPile />);
    expect(screen.getByTestId('discard-pile')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows 0 when discard pile is empty', () => {
    setDiscardCards([]);
    render(<DiscardPile />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows top card name when pile is non-empty', () => {
    const cards: Card[] = [makeUnit('first'), makeUnit('top')];
    setDiscardCards(cards);
    render(<DiscardPile />);
    expect(screen.getByText('Unit top')).toBeInTheDocument();
  });

  it('renders only the recent stack while keeping total count', () => {
    const cards: Card[] = [
      makeUnit('1'),
      makeUnit('2'),
      makeUnit('3'),
      makeUnit('4'),
      makeUnit('5'),
      makeUnit('6'),
      makeUnit('7'),
    ];
    setDiscardCards(cards);

    render(<DiscardPile />);

    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('Unit 7')).toBeInTheDocument();
    expect(screen.queryByText('Unit 1')).not.toBeInTheDocument();
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

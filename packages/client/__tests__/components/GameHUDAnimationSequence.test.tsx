import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, waitFor, within } from '@testing-library/react';
import { GameHUD } from '../../src/components/GameHUD.js';
import { useGameStore } from '../../src/store/game-store.js';
import { CardType, AbilityType, TurnPhase, HIDDEN_CARD_ID_PREFIX, MAX_HAND_SIZE, type Card, type UnitCard } from '@mugen/shared';

const sendDiscardCardMock = vi.fn();

vi.mock('../../src/network/socket-client.js', () => ({
  sendDiscardCard: (cardId: string) => sendDiscardCardMock(cardId),
}));

vi.mock('../../src/hooks/useGameActions.js', () => ({
  useGameActions: () => ({
    isMyTurn: true,
    sendPlaySorcery: vi.fn(),
    sendSummonToBench: vi.fn(),
  }),
}));

vi.mock('../../src/hooks/useUnitHover.js', () => ({
  useCardHover: () => ({
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
  }),
}));

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
      id: `ab-${id}`,
      name: 'Test Ability',
      description: 'Test',
      cost: 1,
      abilityType: AbilityType.DAMAGE,
    },
    cost: 3,
  };
}

const makeHand = (prefix: string, count = 7): Card[] =>
  Array.from({ length: count }, (_, i) => makeUnit(`${prefix}${i}`));

function buildPlayer(id: string, handCards: Card[], deckCards: Card[], discardCards: Card[]) {
  return {
    id,
    name: id,
    color: 'red',
    life: 20,
    isEliminated: false,
    reserveLockedUntilNextTurn: false,
    hand: { cards: handCards },
    mainDeck: { cards: deckCards },
    deck: { cards: [] },
    discardPile: { cards: discardCards },
    team: { reserveUnits: [] },
    units: [],
  };
}

const animateCalls: number[] = [];
const drawFlightEndTransforms: string[] = [];
const compactionFlightEndTransforms: string[] = [];
let originalAnimate: typeof HTMLElement.prototype.animate;
let originalGetBoundingClientRect: typeof HTMLElement.prototype.getBoundingClientRect;

const deferredFinished: { resolve: () => void; duration: number }[] = [];
let deferDiscardFlight = true;
let deferDrawFlight = false;

const flushEffects = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

beforeEach(() => {
  useGameStore.getState().reset();
  sendDiscardCardMock.mockReset();
  animateCalls.length = 0;
  drawFlightEndTransforms.length = 0;
  compactionFlightEndTransforms.length = 0;
  deferredFinished.length = 0;
  deferDiscardFlight = true;
  deferDrawFlight = false;

  originalAnimate = HTMLElement.prototype.animate;
  originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

  HTMLElement.prototype.animate = function (_keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: KeyframeAnimationOptions) {
    const duration = Number(options?.duration ?? 0);
    animateCalls.push(duration);

    if (duration === 240 && Array.isArray(_keyframes)) {
      const lastKeyframe = _keyframes[_keyframes.length - 1];
      if (lastKeyframe && typeof lastKeyframe.transform === 'string') {
        compactionFlightEndTransforms.push(lastKeyframe.transform);
      }
    }

    if (duration === 760 && Array.isArray(_keyframes)) {
      const lastKeyframe = _keyframes[_keyframes.length - 1];
      if (lastKeyframe && typeof lastKeyframe.transform === 'string') {
        drawFlightEndTransforms.push(lastKeyframe.transform);
      }
    }

    if (duration === 720 && deferDiscardFlight) {
      let resolver: () => void = () => {};
      const finished = new Promise<void>((resolve) => {
        resolver = resolve;
      });
      deferredFinished.push({ resolve: resolver, duration });
      return { finished } as unknown as Animation;
    }

    if (duration === 760 && deferDrawFlight) {
      let resolver: () => void = () => {};
      const finished = new Promise<void>((resolve) => {
        resolver = resolve;
      });
      deferredFinished.push({ resolve: resolver, duration });
      return { finished } as unknown as Animation;
    }

    return { finished: Promise.resolve() } as unknown as Animation;
  };

  HTMLElement.prototype.getBoundingClientRect = function () {
    const el = this as HTMLElement;

    const slotIndexRaw = el.dataset.drawHandSlotIndex;
    if (slotIndexRaw !== undefined) {
      const slotIndex = Number(slotIndexRaw);
      const handOwnerId = el.dataset.drawHandSlotPlayerId;
      const isReversedHandOrder = handOwnerId === 'p1';
      const visualSlotPosition = isReversedHandOrder ? MAX_HAND_SIZE - 1 - slotIndex : slotIndex;
      const left = visualSlotPosition * 120;
      return {
        x: left,
        y: 500,
        top: 500,
        left,
        width: 100,
        height: 140,
        right: left + 100,
        bottom: 640,
        toJSON() {
          return {};
        },
      } as DOMRect;
    }

    if (el.dataset.drawDeckOwnerId) {
      const owner = el.dataset.drawDeckOwnerId;
      const left = owner === 'p2' ? 800 : owner === 'p3' ? 160 : 1040;
      return {
        x: left,
        y: 300,
        top: 300,
        left,
        width: 100,
        height: 140,
        right: left + 100,
        bottom: 440,
        toJSON() {
          return {};
        },
      } as DOMRect;
    }

    if (el.dataset.discardPilePlayerId) {
      const owner = el.dataset.discardPilePlayerId;
      const left = owner === 'p2' ? 620 : owner === 'p3' ? 220 : 920;
      return {
        x: left,
        y: 260,
        top: 260,
        left,
        width: 100,
        height: 140,
        right: left + 100,
        bottom: 400,
        toJSON() {
          return {};
        },
      } as DOMRect;
    }

    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      width: 100,
      height: 140,
      right: 100,
      bottom: 140,
      toJSON() {
        return {};
      },
    } as DOMRect;
  };
});

afterEach(() => {
  HTMLElement.prototype.animate = originalAnimate;
  HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
});

describe('GameHUD forced discard animation sequencing', () => {
  it('shows newest grave top card face-up and keeps hidden top card face-down', async () => {
    const localOldDiscard = makeUnit('local-old');
    const localNewestDiscard = makeUnit('local-newest');
    const hiddenTopDiscard: Card = {
      id: `${HIDDEN_CARD_ID_PREFIX}:p2:discardPile:1`,
      name: 'Hidden Card',
      cardType: CardType.SORCERY,
      cost: 0,
      effect: '',
    };

    const p1 = buildPlayer('p1', makeHand('l'), [makeUnit('ld')], [localOldDiscard, localNewestDiscard]);
    const p2 = buildPlayer('p2', makeHand('o'), [makeUnit('od')], [makeUnit('opp-visible'), hiddenTopDiscard]);

    act(() => {
      useGameStore.setState({
        playerId: 'p1',
        gameState: {
          phase: 'IN_PROGRESS',
          turnPhase: TurnPhase.STANDBY,
          currentPlayerIndex: 0,
          pendingTurnStartDraw: false,
          board: { width: 5, height: 5, cells: [] },
          players: [p1, p2],
        } as any,
      });
    });

    const { container } = render(<GameHUD />);
    await flushEffects();

    const localGravePile = container.querySelector('[data-discard-pile-player-id="p1"]') as HTMLElement | null;
    expect(localGravePile).toBeTruthy();
    expect(within(localGravePile as HTMLElement).getByText('Unit local-newest')).toBeInTheDocument();
    expect(within(localGravePile as HTMLElement).queryByText('Unit local-old')).not.toBeInTheDocument();

    const opponentGravePile = container.querySelector('[data-discard-pile-player-id="p2"]') as HTMLElement | null;
    expect(opponentGravePile).toBeTruthy();
    expect(within(opponentGravePile as HTMLElement).queryByText('Hidden Card')).not.toBeInTheDocument();
    expect(opponentGravePile?.getAttribute('style') ?? '').toContain('back-of-card.png');
  });

  it('runs discard, skips compaction when right destinations are occupied, then deferred draw in forced hand-limit flow', async () => {
    deferDiscardFlight = false;
    deferDrawFlight = true;

    const beforeHand = makeHand('l', MAX_HAND_SIZE);
    const p1Before = buildPlayer('p1', beforeHand, [makeUnit('drawn')], []);
    const p2 = buildPlayer('p2', makeHand('o'), [makeUnit('od')], []);

    act(() => {
      useGameStore.setState({
        playerId: 'p1',
        handLimitModalOpen: true,
        gameState: {
          phase: 'IN_PROGRESS',
          turnPhase: TurnPhase.STANDBY,
          currentPlayerIndex: 0,
          pendingTurnStartDraw: true,
          board: { width: 5, height: 5, cells: [] },
          players: [p1Before, p2],
        } as any,
      });
    });

    const { container } = render(<GameHUD />);
    await flushEffects();

    const slotEl = container.querySelector('[data-hand-slot-index="3"]') as HTMLElement | null;
    expect(slotEl).toBeTruthy();
    act(() => {
      fireEvent.click(slotEl as HTMLElement);
    });

    const discarded = beforeHand[3]!;
    const p1After = buildPlayer(
      'p1',
      [...beforeHand.slice(0, 3), ...beforeHand.slice(4), makeUnit('drawn')],
      [],
      [discarded]
    );

    act(() => {
      useGameStore.setState({
        gameState: {
          phase: 'IN_PROGRESS',
          turnPhase: TurnPhase.STANDBY,
          currentPlayerIndex: 0,
          pendingTurnStartDraw: false,
          board: { width: 5, height: 5, cells: [] },
          players: [p1After, p2],
        } as any,
      });
    });

    await waitFor(() => {
      const discardFlight = animateCalls.indexOf(720);
      const compactionAnimations = animateCalls
        .map((duration, index) => ({ duration, index }))
        .filter((entry) => entry.duration === 240)
        .map((entry) => entry.index);
      const drawFlight = animateCalls.indexOf(760);

      expect(discardFlight).toBeGreaterThanOrEqual(0);
      expect(compactionAnimations.length).toBe(0);

      if (drawFlight >= 0) {
        expect(drawFlight).toBeGreaterThan(discardFlight);
      }
    });

    await waitFor(() => {
      expect(deferredFinished.some((entry) => entry.duration === 760)).toBe(true);
    });

    const expectedTargetIndex = MAX_HAND_SIZE - 1;
    const expectedVisualTargetIndex = MAX_HAND_SIZE - 1 - expectedTargetIndex;
    const expectedDeltaX = expectedVisualTargetIndex * 120 - 1040;
    const expectedDeltaY = 200;
    expect(
      drawFlightEndTransforms.some((transform) =>
        transform.includes(`translate3d(${expectedDeltaX}px, ${expectedDeltaY}px, 0)`)
      )
    ).toBe(true);

    expect(container.querySelector(`[data-hand-slot-index="0"][data-hand-card-id="${beforeHand[0]?.id}"]`)).toBeTruthy();
    expect(container.querySelector('[data-hand-card-id="drawn"]')).toBeNull();

    act(() => {
      deferredFinished.filter((entry) => entry.duration === 760).forEach((entry) => entry.resolve());
    });

    await waitFor(() => {
      expect(container.querySelector('[data-hand-card-id="drawn"]')).toBeTruthy();
    });
  });

  it('keeps non-discarded cards visible when forced pre-draw discard starts from slot 0', async () => {
    deferDiscardFlight = false;
    deferDrawFlight = true;

    const beforeHand = makeHand('edge', MAX_HAND_SIZE);
    const p1Before = buildPlayer('p1', beforeHand, [makeUnit('edge-drawn')], []);
    const p2 = buildPlayer('p2', makeHand('o'), [makeUnit('od')], []);

    act(() => {
      useGameStore.setState({
        playerId: 'p1',
        handLimitModalOpen: true,
        gameState: {
          phase: 'IN_PROGRESS',
          turnPhase: TurnPhase.STANDBY,
          currentPlayerIndex: 0,
          pendingTurnStartDraw: true,
          board: { width: 5, height: 5, cells: [] },
          players: [p1Before, p2],
        } as any,
      });
    });

    const { container } = render(<GameHUD />);
    await flushEffects();

    const clickedSlot = container.querySelector('[data-hand-slot-index="0"]') as HTMLElement | null;
    expect(clickedSlot).toBeTruthy();
    act(() => {
      fireEvent.click(clickedSlot as HTMLElement);
    });

    const discarded = beforeHand[0]!;
    const remainingCards = beforeHand.slice(1);
    const drawnCard = makeUnit('edge-drawn');
    const p1After = buildPlayer('p1', [...remainingCards, drawnCard], [], [discarded]);

    act(() => {
      useGameStore.setState({
        gameState: {
          phase: 'IN_PROGRESS',
          turnPhase: TurnPhase.STANDBY,
          currentPlayerIndex: 0,
          pendingTurnStartDraw: false,
          board: { width: 5, height: 5, cells: [] },
          players: [p1After, p2],
        } as any,
      });
    });

    await waitFor(() => {
      for (const remainingCard of remainingCards) {
        expect(container.querySelector(`[data-hand-card-id="${remainingCard.id}"]`)).toBeTruthy();
      }
    });

    expect(container.querySelector(`[data-hand-card-id="${discarded.id}"]`)).toBeNull();
    expect(container.querySelector(`[data-hand-card-id="${drawnCard.id}"]`)).toBeNull();

    await waitFor(() => {
      expect(deferredFinished.some((entry) => entry.duration === 760)).toBe(true);
    });

    act(() => {
      deferredFinished.filter((entry) => entry.duration === 760).forEach((entry) => entry.resolve());
    });

    await waitFor(() => {
      expect(container.querySelector(`[data-hand-card-id="${drawnCard.id}"]`)).toBeTruthy();
    });
  });

  it.each(['first', 'middle', 'last'] as const)(
    'suppresses local source slot during discard flight from %s slot',
    async (slotPosition) => {
    const localHand = makeHand('m');
    const p1 = buildPlayer('p1', localHand, [makeUnit('draw-a')], []);
    const p2 = buildPlayer('p2', makeHand('o'), [makeUnit('draw-b')], []);

    act(() => {
      useGameStore.setState({
        playerId: 'p1',
        handLimitModalOpen: true,
        gameState: {
          phase: 'IN_PROGRESS',
          turnPhase: TurnPhase.STANDBY,
          currentPlayerIndex: 0,
          pendingTurnStartDraw: true,
          board: { width: 5, height: 5, cells: [] },
          players: [p1, p2],
        } as any,
      });
    });

    const { container } = render(<GameHUD />);
    await flushEffects();

    const slotElements = Array.from(container.querySelectorAll('[data-hand-slot-index]')) as HTMLElement[];
    expect(slotElements.length).toBeGreaterThan(0);
    const visibleHandCardsBeforeDiscard = container.querySelectorAll('[data-hand-card-id]').length;

    const slotIndex =
      slotPosition === 'first'
        ? 0
        : slotPosition === 'middle'
          ? Math.floor(slotElements.length / 2)
          : slotElements.length - 1;

    const slotEl = slotElements[slotIndex] ?? null;
    expect(slotEl).toBeTruthy();
    const clickedCardId = slotEl?.dataset.handCardId;
    expect(clickedCardId).toBeTruthy();
    act(() => {
      fireEvent.click(slotEl as HTMLElement);
    });

    await waitFor(() => {
      expect(container.querySelector(`[data-hand-card-id="${clickedCardId}"]`)).toBeNull();
    });

    expect(container.querySelectorAll('[data-hand-card-id]')).toHaveLength(visibleHandCardsBeforeDiscard - 1);

    act(() => {
      deferredFinished.forEach((d) => d.resolve());
    });
    await waitFor(() => {
      expect(slotEl).toBeTruthy();
    });
    }
  );

  it('keeps non-selected duplicate-id cards visible during local discard flight', async () => {
    const localHand: Card[] = [makeUnit('dup'), makeUnit('dup'), makeUnit('m2'), makeUnit('m3')];
    const p1 = buildPlayer('p1', localHand, [makeUnit('draw-a')], []);
    const p2 = buildPlayer('p2', makeHand('o'), [makeUnit('draw-b')], []);

    act(() => {
      useGameStore.setState({
        playerId: 'p1',
        handLimitModalOpen: true,
        gameState: {
          phase: 'IN_PROGRESS',
          turnPhase: TurnPhase.STANDBY,
          currentPlayerIndex: 0,
          pendingTurnStartDraw: true,
          board: { width: 5, height: 5, cells: [] },
          players: [p1, p2],
        } as any,
      });
    });

    const { container } = render(<GameHUD />);
    await flushEffects();

    const duplicateSlots = Array.from(container.querySelectorAll('[data-hand-card-id="dup"]')) as HTMLElement[];
    expect(duplicateSlots).toHaveLength(2);

    act(() => {
      fireEvent.click(duplicateSlots[0] as HTMLElement);
    });

    await waitFor(() => {
      expect(container.querySelectorAll('[data-hand-card-id="dup"]')).toHaveLength(1);
    });

    await act(async () => {
      deferredFinished.forEach((d) => d.resolve());
    });
    await flushEffects();
  });

  it('animates opponent hand-to-grave discard flight with face flip', async () => {
    deferDiscardFlight = false;
    deferDrawFlight = false;

    const opponentHidden = (slotIndex: number): Card => ({
      id: `${HIDDEN_CARD_ID_PREFIX}:p2:hand:${slotIndex}`,
      name: 'Hidden Card',
      cardType: CardType.SORCERY,
      cost: 0,
      effect: '',
    });

    const opponentHandBefore: Card[] = [
      opponentHidden(0),
      opponentHidden(1),
      opponentHidden(2),
      opponentHidden(3),
    ];
    const opponentHandAfter: Card[] = [
      opponentHidden(0),
      opponentHidden(1),
      opponentHidden(2),
    ];
    const revealedDiscarded = makeUnit('opp-discarded');

    const p1 = buildPlayer('p1', makeHand('l'), [makeUnit('ld')], []);
    const p2Before = buildPlayer('p2', opponentHandBefore, [makeUnit('od')], []);
    const p2After = buildPlayer('p2', opponentHandAfter, [makeUnit('od')], [revealedDiscarded]);

    act(() => {
      useGameStore.setState({
        playerId: 'p1',
        gameState: {
          phase: 'IN_PROGRESS',
          turnPhase: TurnPhase.ABILITY,
          currentPlayerIndex: 1,
          pendingTurnStartDraw: false,
          board: { width: 5, height: 5, cells: [] },
          players: [p1, p2Before],
        } as any,
      });
    });

    const { container } = render(<GameHUD />);
    await flushEffects();

    const initialDiscardFlightCount = animateCalls.filter((d) => d === 720).length;

    act(() => {
      useGameStore.setState({
        gameState: {
          phase: 'IN_PROGRESS',
          turnPhase: TurnPhase.ABILITY,
          currentPlayerIndex: 1,
          pendingTurnStartDraw: false,
          board: { width: 5, height: 5, cells: [] },
          players: [p1, p2After],
        } as any,
      });
    });

    await waitFor(() => {
      const discardFlightCount = animateCalls.filter((d) => d === 720).length;
      expect(discardFlightCount).toBeGreaterThan(initialDiscardFlightCount);
    });

    // Sanity: opponent grave anchor exists so animation has a destination.
    expect(container.querySelector('[data-discard-pile-player-id="p2"]')).toBeTruthy();
  });

  it('renders side-seat deck/hand anchors for shared observer animation mapping', async () => {
    const p1 = buildPlayer('p1', makeHand('l'), [makeUnit('ld')], []);
    const p2 = buildPlayer('p2', makeHand('t'), [makeUnit('td')], []);
    const p3BeforeHand = makeHand('left');
    const p4BeforeHand = makeHand('right');

    const p3Before = buildPlayer('p3', p3BeforeHand, [makeUnit('lnew')], []);
    const p4Before = buildPlayer('p4', p4BeforeHand, [makeUnit('rnew')], []);

    act(() => {
      useGameStore.setState({
        playerId: 'p1',
        gameState: {
          phase: 'IN_PROGRESS',
          turnPhase: TurnPhase.STANDBY,
          currentPlayerIndex: 2,
          pendingTurnStartDraw: true,
          board: { width: 5, height: 5, cells: [] },
          players: [p1, p2, p3Before, p4Before],
        } as any,
      });
    });

    render(<GameHUD />);
    await flushEffects();

    const deckAnchors = Array.from(document.querySelectorAll<HTMLElement>('[data-draw-deck-owner-id]'));
    const deckOwnerIds = new Set(deckAnchors.map((el) => el.dataset.drawDeckOwnerId));
    expect(deckOwnerIds.has('p3')).toBe(true);
    expect(deckOwnerIds.has('p4')).toBe(true);

    const handSlotAnchors = Array.from(document.querySelectorAll<HTMLElement>('[data-draw-hand-slot-player-id]'));
    const handAnchorOwnerIds = new Set(handSlotAnchors.map((el) => el.dataset.drawHandSlotPlayerId));
    expect(handAnchorOwnerIds.has('p3')).toBe(true);
    expect(handAnchorOwnerIds.has('p4')).toBe(true);
  });
});

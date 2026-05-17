import { useEffect, useMemo, useRef, useState } from 'react';
import { CardType, MAX_HAND_SIZE, RESERVE_UNIT_COUNT, TurnPhase } from '@mugen/shared';
import type { Card, GameState, UnitCard } from '@mugen/shared';
import { ArrowRight, Heart, ScrollText, SkipForward, X } from 'lucide-react';
import { GameBoard } from '../GameBoard.js';
import { DiscardPile } from '../DiscardPile.js';
import { MainDeckPile } from '../MainDeckPile.js';
import { CardFront } from '../CardFront.js';
import { useGameStore } from '../../store/game-store.js';
import { useGameActions } from '../../hooks/useGameActions.js';
import { sendDiscardCard } from '../../network/socket-client.js';
import { isCommittedPlayerActionLog } from '../../utils/game-log.js';
import wallpaperImage from '../../../../../wallpaper.avif';

const BOARD_SIZE_PX = 736;
const MOBILE_HAND_CARD_WIDTH_PX = 78;
const MOBILE_HAND_CARD_HEIGHT_PX = 118;
const MOBILE_BENCH_CARD_WIDTH_PX = 78;
const MOBILE_BENCH_CARD_HEIGHT_PX = 108;
const MOBILE_BENCH_PREVIEW_WIDTH_PX = 120;
const MOBILE_BENCH_PREVIEW_HEIGHT_PX = 166;
const MOBILE_GAME_BACKGROUND_STYLE = {
  backgroundImage: `url(${wallpaperImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundColor: '#050507',
} as const;

const PHASE_LABELS: Record<string, string> = {
  [TurnPhase.STANDBY]: 'Standby',
  [TurnPhase.MOVE]: 'Move',
  [TurnPhase.ABILITY]: 'Ability',
  [TurnPhase.ATTACK]: 'Attack',
  [TurnPhase.END]: 'End',
};

const SORCERY_CARDS_REQUIRING_TARGET = new Set([
  's01',
  's02',
  's04',
  's05',
  's06',
  's07',
  's08',
  's11',
  's12',
  's13',
  's14',
  's15',
  's18',
  's20',
  's22',
]);

function requiresTarget(cardId: string): boolean {
  return SORCERY_CARDS_REQUIRING_TARGET.has(cardId);
}

function getMinimumSorceryTargetCount(cardId: string): number {
  if (!requiresTarget(cardId)) return 0;
  return cardId === 's18' ? 2 : 1;
}

function getValidSorceryTargetCount(cardId: string, gameState: GameState, playerId: string): number {
  const nonTargetCards = new Set(['s03', 's09', 's10', 's16', 's17', 's19', 's21']);
  if (nonTargetCards.has(cardId)) return 0;

  let count = 0;

  for (const player of gameState.players) {
    for (const unit of player.units) {
      if (!unit.position) continue;

      const isFriendly = player.id === playerId;
      const isEnemy = !isFriendly;

      if (['s01', 's04', 's08', 's12', 's22', 's07', 's15'].includes(cardId) && isEnemy) {
        count += 1;
      } else if (['s02', 's05', 's06', 's11', 's13', 's14', 's20'].includes(cardId) && isFriendly) {
        count += 1;
      } else if (cardId === 's18') {
        count += 1;
      }
    }
  }

  return count;
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="inline-flex min-w-0 items-center gap-1 rounded border border-white/10 bg-black/30 px-1.5 py-1 text-[10px] leading-none">
      <span className="text-[8px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className="truncate font-semibold text-white">{value}</span>
    </div>
  );
}

function CompactUnitStats({ unit, hp }: { unit: UnitCard; hp: number }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        <StatChip label="NAME" value={unit.name} />
        <StatChip label="HP" value={hp} />
        <StatChip label="ATK" value={unit.atk} />
        <StatChip label="COST" value={unit.cost} />
        <StatChip label="MOVE" value={unit.movement} />
        <StatChip label="RANGE" value={unit.range} />
      </div>
      <div className="mt-1 border-t border-white/10 pt-1 text-[9px] italic leading-snug text-blue-200/90 line-clamp-2">
        ABILITY - {unit.ability.description}
      </div>
    </>
  );
}

export function MobileGameScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const hoveredCard = useGameStore((s) => s.hoveredCard);
  const hoveredUnitInstance = useGameStore((s) => s.hoveredUnitInstance);
  const benchUnits = useGameStore((s) => s.benchUnits);
  const canSelectBenchUnits = useGameStore((s) => s.canSelectBenchUnits);
  const isSpectating = useGameStore((s) => s.isSpectating);
  const handLimitModalOpen = useGameStore((s) => s.handLimitModalOpen);
  const standbyModalOpen = useGameStore((s) => s.standbyModalOpen);
  const summonModalOpen = useGameStore((s) => s.summonModalOpen);
  const sorceryModeActive = useGameStore((s) => s.sorceryModeActive);
  const selectedSorceryCard = useGameStore((s) => s.selectedSorceryCard);
  const error = useGameStore((s) => s.error);
  const gameLogs = useGameStore((s) => s.gameLogs);
  const clearError = useGameStore((s) => s.clearError);
  const setError = useGameStore((s) => s.setError);
  const enterSorceryMode = useGameStore((s) => s.enterSorceryMode);
  const exitSorceryMode = useGameStore((s) => s.exitSorceryMode);
  const enterDeploymentMode = useGameStore((s) => s.enterDeploymentMode);
  const { isMyTurn, sendAdvancePhase, sendEndTurn, sendPlaySorcery, sendSummonToBench } = useGameActions();

  const boardFrameRef = useRef<HTMLDivElement | null>(null);

  const [boardScale, setBoardScale] = useState(0.42);
  const [selectedBenchUnit, setSelectedBenchUnit] = useState<UnitCard | null>(null);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [summoningCardId, setSummoningCardId] = useState<string | null>(null);
  const [discardingCardId, setDiscardingCardId] = useState<string | null>(null);
  const [queuedLogToasts, setQueuedLogToasts] = useState<string[]>([]);
  const [activeLogToast, setActiveLogToast] = useState<string | null>(null);
  const processedLogCountRef = useRef(0);

  useEffect(() => {
    const updateScale = () => {
      const container = boardFrameRef.current;
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const widthScale = (rect.width - 8) / BOARD_SIZE_PX;
      const heightScale = (rect.height - 8) / BOARD_SIZE_PX;
      const scaled = Math.min(1, widthScale, heightScale);
      setBoardScale(Math.max(0.28, scaled));
    };

    updateScale();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updateScale())
      : null;

    if (resizeObserver && boardFrameRef.current) {
      resizeObserver.observe(boardFrameRef.current);
    }

    window.addEventListener('resize', updateScale);

    return () => {
      window.removeEventListener('resize', updateScale);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedBenchUnit) return;

    const unitStillInBench = benchUnits.some((unit) => unit.id === selectedBenchUnit.id);
    if (!unitStillInBench) {
      setSelectedBenchUnit(null);
    }
  }, [benchUnits, selectedBenchUnit]);

  useEffect(() => {
    if (gameLogs.length <= processedLogCountRef.current) {
      return;
    }

    const nextLogs = gameLogs.slice(processedLogCountRef.current);
    processedLogCountRef.current = gameLogs.length;
    const nextActionLogs = nextLogs.filter(isCommittedPlayerActionLog);

    if (nextActionLogs.length === 0) {
      return;
    }

    setQueuedLogToasts((currentQueue) => [...currentQueue, ...nextActionLogs]);
  }, [gameLogs]);

  useEffect(() => {
    if (activeLogToast || queuedLogToasts.length === 0) {
      return;
    }

    const nextToast = queuedLogToasts[0];
    if (!nextToast) {
      return;
    }

    setActiveLogToast(nextToast);
    setQueuedLogToasts((currentQueue) => currentQueue.slice(1));
  }, [activeLogToast, queuedLogToasts]);

  useEffect(() => {
    if (!activeLogToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveLogToast(null);
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeLogToast]);

  if (!gameState) {
    return null;
  }

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const reserveLocked = currentPlayer?.reserveLockedUntilNextTurn ?? false;
  const isEliminated = currentPlayer?.isEliminated ?? false;
  const isStandby = gameState.turnPhase === TurnPhase.STANDBY;
  const handCards = currentPlayer?.hand.cards ?? [];
  const handSlots = Array.from({ length: MAX_HAND_SIZE }, (_, index) => handCards[index] ?? null);

  const activeUnitCount =
    currentPlayer?.units.filter(
      (unit) =>
        unit.position !== null &&
        unit.position.x >= 0 &&
        unit.position.x < gameState.board.width &&
        unit.position.y >= 0 &&
        unit.position.y < gameState.board.height
    ).length ?? 0;

  const canDeploy =
    !!isMyTurn &&
    !!isStandby &&
    activeUnitCount < 3 &&
    canSelectBenchUnits &&
    !reserveLocked &&
    !isEliminated &&
    !isSpectating;

  const playerLife = currentPlayer?.life ?? 0;
  const openBenchSlots = Math.max(0, RESERVE_UNIT_COUNT - benchUnits.length);
  const summonModeActive = summonModalOpen && isMyTurn && openBenchSlots > 0;
  const requiresPreDrawDiscard =
    gameState.pendingTurnStartDraw === true &&
    isMyTurn &&
    handCards.length === MAX_HAND_SIZE;
  const discardModeActive = handLimitModalOpen && isMyTurn && (handCards.length > MAX_HAND_SIZE || requiresPreDrawDiscard);
  const controlsDisabled = handLimitModalOpen || standbyModalOpen;

  const activeUnit = useMemo(() => {
    if (!hoveredCard || hoveredCard.cardType !== CardType.UNIT) {
      return null;
    }

    return hoveredCard as UnitCard;
  }, [hoveredCard]);

  const activeUnitHp = hoveredUnitInstance?.currentHp ?? activeUnit?.hp ?? 0;

  const animateHandCardToBench = async (cardId: string, benchSlotIndex: number) => {
    const handCardEl = document.querySelector<HTMLElement>(`[data-hand-card-id="${cardId}"]`);
    const benchContainer = document.querySelector<HTMLElement>('[data-bench-container="desktop"]');
    const benchSlotEl = benchContainer?.querySelector<HTMLElement>(`[data-bench-slot-index="${benchSlotIndex}"]`);

    if (!handCardEl || !benchSlotEl) {
      return;
    }

    const handRect = handCardEl.getBoundingClientRect();
    const benchRect = benchSlotEl.getBoundingClientRect();
    const flyingCard = handCardEl.cloneNode(true) as HTMLElement;

    flyingCard.style.position = 'fixed';
    flyingCard.style.left = `${handRect.left}px`;
    flyingCard.style.top = `${handRect.top}px`;
    flyingCard.style.width = `${handRect.width}px`;
    flyingCard.style.height = `${handRect.height}px`;
    flyingCard.style.zIndex = '12000';
    flyingCard.style.pointerEvents = 'none';
    flyingCard.style.margin = '0';
    document.body.appendChild(flyingCard);

    const deltaX = benchRect.left + benchRect.width / 2 - (handRect.left + handRect.width / 2);
    const deltaY = benchRect.top + benchRect.height / 2 - (handRect.top + handRect.height / 2);

    try {
      await flyingCard
        .animate(
          [
            { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1 },
            {
              transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.84)`,
              opacity: 0.8,
            },
          ],
          {
            duration: 600,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards',
          }
        )
        .finished;
    } finally {
      flyingCard.remove();
    }
  };

  const animateHandCardToDiscardPile = async (cardId: string) => {
    const handCardEl = document.querySelector<HTMLElement>(`[data-hand-card-id="${cardId}"]`);
    const discardPileEl = document.querySelector<HTMLElement>('[data-discard-pile="desktop"]');

    if (!handCardEl || !discardPileEl) {
      return;
    }

    const handRect = handCardEl.getBoundingClientRect();
    const discardRect = discardPileEl.getBoundingClientRect();
    const flyingCard = handCardEl.cloneNode(true) as HTMLElement;

    flyingCard.style.position = 'fixed';
    flyingCard.style.left = `${handRect.left}px`;
    flyingCard.style.top = `${handRect.top}px`;
    flyingCard.style.width = `${handRect.width}px`;
    flyingCard.style.height = `${handRect.height}px`;
    flyingCard.style.zIndex = '12000';
    flyingCard.style.pointerEvents = 'none';
    flyingCard.style.margin = '0';
    document.body.appendChild(flyingCard);

    const deltaX = discardRect.left + discardRect.width / 2 - (handRect.left + handRect.width / 2);
    const deltaY = discardRect.top + discardRect.height / 2 - (handRect.top + handRect.height / 2);

    try {
      await flyingCard
        .animate(
          [
            { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)', opacity: 1 },
            {
              transform: `translate3d(${deltaX}px, ${deltaY}px, 0) rotate(300deg) scale(0.82)`,
              opacity: 0.86,
            },
          ],
          {
            duration: 600,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards',
          }
        )
        .finished;
    } finally {
      flyingCard.remove();
    }
  };

  const handleCardClick = async (card: Card) => {
    if (summoningCardId || discardingCardId) {
      return;
    }

    if (isSpectating || isEliminated) {
      setError('You cannot play cards while spectating');
      return;
    }

    if (discardModeActive) {
      setError(null);
      setDiscardingCardId(card.id);

      try {
        await animateHandCardToDiscardPile(card.id);
      } finally {
        sendDiscardCard(card.id);
        setDiscardingCardId(null);
      }
      return;
    }

    const isSummonableUnit =
      summonModeActive && card.cardType === CardType.UNIT && card.cost <= playerLife;

    if (isSummonableUnit) {
      setError(null);
      setSummoningCardId(card.id);
      const targetSlotIndex = Math.max(0, Math.min(RESERVE_UNIT_COUNT - 1, benchUnits.length));

      try {
        await animateHandCardToBench(card.id, targetSlotIndex);
      } finally {
        sendSummonToBench(card.id);
        setSummoningCardId(null);
      }
      return;
    }

    if (card.cardType !== CardType.SORCERY) {
      return;
    }

    if (gameState.turnPhase !== TurnPhase.ABILITY) {
      setError(`Sorcery cards can only be played during Ability Phase (current: ${gameState.turnPhase})`);
      return;
    }

    if (!isMyTurn) {
      setError('Not your turn');
      return;
    }

    if (requiresTarget(card.id)) {
      if (!playerId) {
        setError('Game state unavailable for sorcery targeting');
        return;
      }

      const validTargetCount = getValidSorceryTargetCount(card.id, gameState, playerId);
      const minimumTargetCount = getMinimumSorceryTargetCount(card.id);
      if (validTargetCount < minimumTargetCount) {
        if (card.id === 's18') {
          setError(`${card.name} requires at least two valid units on the board`);
        } else {
          setError(`No valid targets available for ${card.name}`);
        }
        return;
      }

      enterSorceryMode(card, true);
      if (card.id === 's18') {
        setError(`Select first target for ${card.name}`);
      } else {
        setError(`Select a target for ${card.name}`);
      }
    } else {
      if (sorceryModeActive) {
        exitSorceryMode();
      }

      setError(null);
      sendPlaySorcery(card.id);
    }
  };

  const handleCancelSorcery = () => {
    exitSorceryMode();
    setError(null);
  };

  const benchSlots: Array<UnitCard | null> = [
    benchUnits[0] ?? null,
    benchUnits[1] ?? null,
    benchUnits[2] ?? null,
  ];

  const currentTurnPlayerId = gameState.players[gameState.currentPlayerIndex]?.id;

  return (
    <div
      className="h-[100dvh] overflow-hidden text-white"
      style={{
        ...MOBILE_GAME_BACKGROUND_STYLE,
        paddingTop: 'max(4px, env(safe-area-inset-top))',
        paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-[460px] flex-col gap-1 px-1.5">
        <div className="shrink-0 rounded-lg border border-white/10 bg-black/35 px-2 py-1">
          <div className="flex items-center justify-between gap-1">
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold text-cyan-200">
                {isMyTurn ? 'Your Turn' : `${gameState.players[gameState.currentPlayerIndex]?.name}'s Turn`}
              </div>
              <div className="text-[10px] text-gray-300">{PHASE_LABELS[gameState.turnPhase] ?? gameState.turnPhase} Phase</div>
            </div>

            <div className="flex items-center gap-1">
              {isMyTurn && gameState.turnPhase !== TurnPhase.END && (
                <button
                  type="button"
                  onClick={sendAdvancePhase}
                  disabled={controlsDisabled}
                  className={`inline-flex h-9 items-center gap-1 rounded-md border border-cyan-300/30 px-2 text-[10px] font-semibold ${
                    controlsDisabled ? 'cursor-not-allowed opacity-40' : 'bg-cyan-400/15'
                  }`}
                >
                  <ArrowRight size={13} />
                  Phase
                </button>
              )}

              {isMyTurn && (
                <button
                  type="button"
                  onClick={sendEndTurn}
                  disabled={controlsDisabled}
                  className={`inline-flex h-9 items-center gap-1 rounded-md border border-amber-300/40 px-2 text-[10px] font-bold text-amber-100 ${
                    controlsDisabled ? 'cursor-not-allowed opacity-40' : 'bg-amber-400/15'
                  }`}
                >
                  <SkipForward size={13} />
                  End
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowLogPanel((value) => !value)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5"
                aria-label="Toggle log"
              >
                <ScrollText size={15} />
              </button>
            </div>
          </div>

          <div className="mt-1 flex items-center gap-1 overflow-x-auto pb-0.5">
            {gameState.players.map((player, index) => {
              const positionColors = ['#ef4444', '#6366f1', '#f59e0b', '#22c55e'];
              const playerColor = positionColors[index % positionColors.length];
              const isCurrentTurn = currentTurnPlayerId === player.id;
              const isCurrentPlayer = player.id === playerId;

              return (
                <div
                  key={player.id}
                  className={`inline-flex min-w-fit items-center gap-1 rounded-md border px-2 py-1 text-[10px] ${
                    isCurrentTurn ? 'border-cyan-300/45 bg-cyan-400/10' : 'border-white/10 bg-white/5'
                  } ${player.isEliminated ? 'opacity-40 line-through' : ''}`}
                >
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: playerColor }} />
                  <span style={{ color: playerColor }}>{player.name}{isCurrentPlayer ? ' (You)' : ''}</span>
                  <Heart size={10} className="text-red-400" />
                  <span className="font-semibold text-white">{player.life}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div ref={boardFrameRef} className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-black/30">
          <div className="absolute left-1 top-1 z-20 h-[81px] w-[60px] origin-top-left scale-[0.44] pointer-events-auto">
            <DiscardPile />
          </div>
          <div className="absolute right-6 top-1 z-20 h-[81px] w-[60px] origin-top-right scale-[0.44] pointer-events-auto">
            <MainDeckPile />
          </div>

          {activeLogToast && !showLogPanel && (
            <div className="pointer-events-none absolute left-2 right-2 top-[4.5rem] z-30 flex justify-center">
              <div className="max-w-full rounded-md border border-cyan-300/30 bg-black/78 px-2 py-1 text-center text-[10px] font-medium text-cyan-100 shadow-[0_6px_16px_rgba(6,182,212,0.2)] backdrop-blur-sm">
                <span className="line-clamp-2 break-words">{activeLogToast}</span>
              </div>
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="overflow-hidden rounded-lg border border-white/10"
              style={{
                width: BOARD_SIZE_PX * boardScale,
                height: BOARD_SIZE_PX * boardScale,
              }}
            >
              <div
                style={{
                  width: BOARD_SIZE_PX,
                  height: BOARD_SIZE_PX,
                  transform: `scale(${boardScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <GameBoard />
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-1 left-1 right-1 rounded-md border border-white/10 bg-black/55 px-1.5 py-1">
            {activeUnit ? (
              <CompactUnitStats unit={activeUnit} hp={activeUnitHp} />
            ) : (
              <div className="text-[10px] text-gray-300">Tap a unit on the board to inspect stats.</div>
            )}
          </div>
        </div>

        <div className="shrink-0 rounded-lg border border-white/10 bg-black/30 px-1.5 py-1">
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-gray-300">
            <span>Reserve Bench</span>
            <span>{benchUnits.length}/{RESERVE_UNIT_COUNT}</span>
          </div>

          <div data-bench-container="desktop" className="grid grid-cols-3 gap-1">
            {benchSlots.map((unit, index) => {
              if (!unit) {
                return (
                  <div
                    key={`empty-slot-${index}`}
                    data-bench-slot-index={index}
                    className="justify-self-center rounded-md border border-dashed border-white/15 bg-white/[0.03]"
                    style={{
                      width: `${MOBILE_BENCH_CARD_WIDTH_PX}px`,
                      height: `${MOBILE_BENCH_CARD_HEIGHT_PX}px`,
                    }}
                  >
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-600">Empty</div>
                  </div>
                );
              }

              return (
                <button
                  key={unit.id}
                  type="button"
                  data-bench-slot-index={index}
                  onClick={() => setSelectedBenchUnit(unit)}
                  className={`justify-self-center overflow-hidden rounded-md border p-0 text-left transition-all active:scale-[0.98] ${
                    canDeploy
                      ? 'border-green-400/50 bg-green-500/10 shadow-[0_0_8px_rgba(34,197,94,0.25)]'
                      : 'border-white/15 bg-white/[0.05]'
                  }`}
                  style={{
                    width: `${MOBILE_BENCH_CARD_WIDTH_PX}px`,
                    height: `${MOBILE_BENCH_CARD_HEIGHT_PX}px`,
                  }}
                >
                  <CardFront
                    card={unit}
                    width={MOBILE_BENCH_CARD_WIDTH_PX}
                    height={MOBILE_BENCH_CARD_HEIGHT_PX}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 rounded-lg border border-white/10 bg-black/40 px-1.5 py-1">
          {sorceryModeActive && selectedSorceryCard && (
            <div className="mb-1 flex items-center justify-between rounded-md border border-amber-300/35 bg-amber-300/10 px-2 py-1 text-[10px] text-amber-100">
              <span className="truncate">Targeting {selectedSorceryCard.name}</span>
              <button type="button" onClick={handleCancelSorcery} className="inline-flex items-center justify-center">
                <X size={13} />
              </button>
            </div>
          )}

          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-gray-300">
            <span>Hand {handCards.length}/{MAX_HAND_SIZE}</span>
            <span className={discardModeActive ? 'text-red-300' : summonModeActive ? 'text-green-300' : 'text-gray-400'}>
              {discardModeActive ? 'Discard required' : summonModeActive ? 'Summon to bench' : 'Tap card'}
            </span>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="flex gap-1.5 pr-1">
              {handSlots.map((card, index) => {
                if (!card) {
                  return (
                    <div
                      key={`mobile-empty-slot-${index}`}
                      data-hand-slot-index={index}
                      className="shrink-0 rounded-md border border-dashed border-white/10 bg-white/[0.02]"
                      style={{
                        width: `${MOBILE_HAND_CARD_WIDTH_PX}px`,
                        height: `${MOBILE_HAND_CARD_HEIGHT_PX}px`,
                      }}
                    />
                  );
                }

                const isSummonableUnit = summonModeActive && card.cardType === CardType.UNIT && card.cost <= playerLife;
                const isPlayableSorcery =
                  card.cardType === CardType.SORCERY &&
                  gameState.turnPhase === TurnPhase.ABILITY &&
                  isMyTurn &&
                  !summonModeActive;

                return (
                  <button
                    key={card.id}
                    type="button"
                    data-hand-slot-index={index}
                    data-hand-card={index}
                    data-hand-card-id={card.id}
                    disabled={Boolean(summoningCardId || discardingCardId)}
                    onClick={() => handleCardClick(card)}
                    className={`shrink-0 overflow-hidden rounded-md border p-0 text-left transition ${
                      discardModeActive
                        ? 'border-red-400 ring-2 ring-red-400/90 shadow-[0_0_14px_rgba(248,113,113,0.7)] animate-pulse'
                        : isSummonableUnit
                          ? 'border-green-400 ring-1 ring-green-400/80 shadow-[0_0_10px_rgba(74,222,128,0.45)]'
                          : isPlayableSorcery
                            ? 'border-cyan-300/45 bg-cyan-300/10'
                            : 'border-white/10 bg-white/[0.04]'
                    } ${(summoningCardId === card.id || discardingCardId === card.id) ? 'opacity-30' : ''}`}
                    style={{
                      width: `${MOBILE_HAND_CARD_WIDTH_PX}px`,
                      height: `${MOBILE_HAND_CARD_HEIGHT_PX}px`,
                    }}
                  >
                    <CardFront
                      card={card}
                      width={MOBILE_HAND_CARD_WIDTH_PX}
                      height={MOBILE_HAND_CARD_HEIGHT_PX}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showLogPanel && (
        <div className="fixed inset-0 z-[10010] flex items-end justify-center bg-black/65 p-2" onClick={() => setShowLogPanel(false)}>
          <div
            className="w-full max-w-[520px] rounded-xl border border-white/10 bg-mugen-surface p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Game Log</div>
              <button type="button" onClick={() => setShowLogPanel(false)} className="text-xs text-gray-300">
                Close
              </button>
            </div>
            <div className="max-h-[42dvh] space-y-1 overflow-y-auto rounded-md border border-white/10 bg-black/20 p-2">
              {gameLogs.length === 0 ? (
                <div className="text-xs text-gray-500">No events yet</div>
              ) : (
                gameLogs.map((message, index) => (
                  <div key={`${message}-${index}`} className="text-xs text-gray-200">
                    {message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedBenchUnit && (
        <div className="fixed inset-0 z-[10011] flex items-end justify-center bg-black/70 p-2" onClick={() => setSelectedBenchUnit(null)}>
          <div
            className="w-full max-w-[560px] rounded-xl border border-white/10 bg-mugen-surface p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 text-sm font-semibold text-white">Bench Unit</div>

            <div className="mb-3 flex justify-center">
              <CardFront
                card={selectedBenchUnit}
                width={MOBILE_BENCH_PREVIEW_WIDTH_PX}
                height={MOBILE_BENCH_PREVIEW_HEIGHT_PX}
                isHovered
              />
            </div>

            <CompactUnitStats unit={selectedBenchUnit} hp={selectedBenchUnit.hp} />

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedBenchUnit(null)}
                className="rounded-md border border-white/10 bg-mugen-bg px-3 py-2 text-xs text-gray-300"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!canDeploy}
                onClick={() => {
                  if (canDeploy) {
                    enterDeploymentMode(selectedBenchUnit);
                    setSelectedBenchUnit(null);
                  }
                }}
                className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                  canDeploy
                    ? 'bg-mugen-success text-black'
                    : 'cursor-not-allowed bg-gray-700 text-gray-500'
                }`}
              >
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed left-1/2 top-16 z-[10020] -translate-x-1/2 px-3">
          <button
            type="button"
            onClick={clearError}
            className="rounded-lg border border-red-400/35 bg-mugen-danger/90 px-3 py-2 text-xs font-semibold text-white"
          >
            {error} ✕
          </button>
        </div>
      )}

      {isSpectating && (
        <div className="fixed left-1/2 top-3 z-[10020] -translate-x-1/2 rounded-full border border-white/20 bg-black/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-200">
          Spectating
        </div>
      )}
    </div>
  );
}

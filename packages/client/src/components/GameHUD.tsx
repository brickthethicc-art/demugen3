import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../store/game-store.js';
import { useGameActions } from '../hooks/useGameActions.js';
import { useCardHover } from '../hooks/useUnitHover.js';
import { sendDiscardCard } from '../network/socket-client.js';
import type { Card, GameState } from '@mugen/shared';
import { TurnPhase, CardType, MAX_HAND_SIZE, RESERVE_UNIT_COUNT } from '@mugen/shared';
import { Heart, Zap, ArrowRight, SkipForward, X } from 'lucide-react';

const HAND_SLOT_COUNT = MAX_HAND_SIZE;
const HAND_CARD_GAP_REM = 0.5;
const HAND_CARD_MAX_WIDTH_PX = 136;
const HAND_ROW_MAX_WIDTH_PX = HAND_SLOT_COUNT * HAND_CARD_MAX_WIDTH_PX + (HAND_SLOT_COUNT - 1) * 8;
const HAND_PANEL_HORIZONTAL_PADDING_PX = 48;
const HAND_PANEL_MAX_WIDTH_PX = HAND_ROW_MAX_WIDTH_PX + HAND_PANEL_HORIZONTAL_PADDING_PX;
const HAND_CARD_WIDTH = `calc((100% - ${(HAND_SLOT_COUNT - 1) * HAND_CARD_GAP_REM}rem) / ${HAND_SLOT_COUNT})`;
const DRAW_FLIGHT_DURATION_MS = 540;
const DRAW_STAGGER_MS = 120;

const PHASE_LABELS: Record<string, string> = {
  [TurnPhase.STANDBY]: 'Standby Phase',
  [TurnPhase.MOVE]: 'Move Phase',
  [TurnPhase.ABILITY]: 'Ability Phase',
  [TurnPhase.ATTACK]: 'Attack Phase',
  [TurnPhase.END]: 'End Phase',
};

// Sorcery cards that require a target unit
const SORCERY_CARDS_REQUIRING_TARGET = new Set([
  's01', // Quick Strike
  's02', // Minor Heal
  's04', // Fireball
  's05', // Mend Wounds
  's06', // Haste
  's07', // Weaken
  's08', // Chain Lightning
  's11', // Displacement
  's12', // Meteor Strike
  's13', // Full Restore
  's14', // Battle Rage
  's15', // Paralyze
  's18', // Dimensional Swap
  's20', // Resurrection
  's22', // Soul Drain
]);

function requiresTarget(cardId: string): boolean {
  return SORCERY_CARDS_REQUIRING_TARGET.has(cardId);
}

function getMinimumSorceryTargetCount(cardId: string): number {
  if (!requiresTarget(cardId)) return 0;
  return cardId === 's18' ? 2 : 1;
}

function getValidSorceryTargetCount(cardId: string, gameState: GameState, playerId: string): number {
  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  if (!currentPlayer) return 0;

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

function HandDisplay() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const summonModalOpen = useGameStore((s) => s.summonModalOpen);
  const handLimitModalOpen = useGameStore((s) => s.handLimitModalOpen);
  const benchUnits = useGameStore((s) => s.benchUnits);
  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const { handleMouseEnter, handleMouseLeave } = useCardHover();
  const { isMyTurn, sendPlaySorcery, sendSummonToBench } = useGameActions();
  const setError = useGameStore((s) => s.setError);
  const sorceryModeActive = useGameStore((s) => s.sorceryModeActive);
  const selectedSorceryCard = useGameStore((s) => s.selectedSorceryCard);
  const { enterSorceryMode, exitSorceryMode } = useGameStore();
  const handCards = myPlayer?.hand.cards ?? [];
  const handSlots = Array.from({ length: HAND_SLOT_COUNT }, (_, i) => handCards[i] ?? null);
  const playerLife = myPlayer?.life ?? 0;
  const openBenchSlots = Math.max(0, RESERVE_UNIT_COUNT - benchUnits.length);
  const summonModeActive = summonModalOpen && isMyTurn && openBenchSlots > 0;
  const discardModeActive = handLimitModalOpen && isMyTurn && handCards.length > MAX_HAND_SIZE;
  const [summoningCardId, setSummoningCardId] = useState<string | null>(null);
  const [discardingCardId, setDiscardingCardId] = useState<string | null>(null);
  const drawQueueRef = useRef<{ card: Card; targetIndex: number }[]>([]);
  const drawAnimationRunningRef = useRef(false);
  const previousHandIdsRef = useRef<string[]>([]);
  const hasInitializedHandRef = useRef(false);

  const wait = (durationMs: number) =>
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, durationMs);
    });

  const createDrawOverlayCard = (card: Card, startRect: DOMRect): HTMLElement => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.left = `${startRect.left}px`;
    overlay.style.top = `${startRect.top}px`;
    overlay.style.width = `${startRect.width}px`;
    overlay.style.height = `${startRect.height}px`;
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '12000';
    overlay.style.perspective = '1000px';
    overlay.style.transformStyle = 'preserve-3d';

    const rotator = document.createElement('div');
    rotator.style.position = 'absolute';
    rotator.style.inset = '0';
    rotator.style.transformStyle = 'preserve-3d';

    const commonFaceStyle = (face: HTMLElement) => {
      face.style.position = 'absolute';
      face.style.inset = '0';
      face.style.borderRadius = '10px';
      face.style.border = '1px solid rgba(255,255,255,0.15)';
      face.style.backfaceVisibility = 'hidden';
      face.style.overflow = 'hidden';
    };

    const backFace = document.createElement('div');
    commonFaceStyle(backFace);
    backFace.style.background =
      'radial-gradient(circle at 50% 48%, rgba(125, 211, 252, 0.42) 0%, rgba(74, 144, 226, 0.22) 22%, rgba(22, 33, 62, 0.95) 62%, rgba(8, 12, 28, 1) 100%)';
    backFace.style.boxShadow =
      'inset 0 0 0 2px rgba(148, 197, 255, 0.35), inset 0 0 22px rgba(56, 189, 248, 0.24), 0 6px 16px rgba(2, 6, 23, 0.65)';

    const backRingOuter = document.createElement('div');
    backRingOuter.style.position = 'absolute';
    backRingOuter.style.inset = '9%';
    backRingOuter.style.borderRadius = '9999px';
    backRingOuter.style.border = '1px solid rgba(125, 211, 252, 0.45)';
    backFace.appendChild(backRingOuter);

    const backRingInner = document.createElement('div');
    backRingInner.style.position = 'absolute';
    backRingInner.style.inset = '24%';
    backRingInner.style.borderRadius = '9999px';
    backRingInner.style.border = '1px solid rgba(186, 230, 253, 0.4)';
    backFace.appendChild(backRingInner);

    const frontFace = document.createElement('div');
    commonFaceStyle(frontFace);
    frontFace.style.transform = 'rotateY(180deg)';
    frontFace.style.background = 'linear-gradient(160deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))';
    frontFace.style.boxShadow = '0 10px 22px rgba(2,6,23,0.6), inset 0 0 0 1px rgba(255,255,255,0.08)';
    frontFace.style.padding = '10px';
    frontFace.style.display = 'flex';
    frontFace.style.flexDirection = 'column';

    const title = document.createElement('div');
    title.textContent = card.name;
    title.style.fontSize = '12px';
    title.style.fontWeight = '700';
    title.style.color = 'rgba(248,250,252,0.95)';
    title.style.lineHeight = '1.1';
    title.style.whiteSpace = 'nowrap';
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';

    const type = document.createElement('div');
    type.textContent = card.cardType;
    type.style.marginTop = '4px';
    type.style.fontSize = '10px';
    type.style.fontWeight = '600';
    type.style.color = 'rgba(148,163,184,0.95)';
    type.style.letterSpacing = '0.04em';

    const cost = document.createElement('div');
    cost.textContent = `Cost ${card.cost}`;
    cost.style.marginTop = 'auto';
    cost.style.fontSize = '11px';
    cost.style.fontWeight = '700';
    cost.style.color = 'rgba(125,211,252,0.98)';

    frontFace.appendChild(title);
    frontFace.appendChild(type);
    frontFace.appendChild(cost);

    rotator.appendChild(backFace);
    rotator.appendChild(frontFace);
    overlay.appendChild(rotator);

    (overlay as any).__rotator = rotator;
    return overlay;
  };

  const animateDeckCardToHand = async (card: Card, targetIndex: number) => {
    const deckEl = document.querySelector<HTMLElement>('[data-deck="main"]');
    const handSlotEl = document.querySelector<HTMLElement>(`[data-hand-slot-index="${targetIndex}"]`);

    if (!deckEl || !handSlotEl) {
      return;
    }

    const deckRect = deckEl.getBoundingClientRect();
    const targetRect = handSlotEl.getBoundingClientRect();
    const overlay = createDrawOverlayCard(card, deckRect);
    const rotator = (overlay as any).__rotator as HTMLElement;
    document.body.appendChild(overlay);

    const deltaX = targetRect.left + targetRect.width / 2 - (deckRect.left + deckRect.width / 2);
    const deltaY = targetRect.top + targetRect.height / 2 - (deckRect.top + deckRect.height / 2);
    const arcLift = Math.min(80, Math.max(36, Math.abs(deltaX) * 0.18));

    try {
      const flightAnimation = overlay.animate(
        [
          { transform: 'translate3d(0, 0, 0) rotateZ(0deg) scale(1)', opacity: 1, offset: 0 },
          {
            transform: `translate3d(${deltaX * 0.5}px, ${deltaY * 0.5 - arcLift}px, 0) rotateZ(-10deg) scale(0.93)`,
            opacity: 1,
            offset: 0.5,
          },
          {
            transform: `translate3d(${deltaX}px, ${deltaY}px, 0) rotateZ(0deg) scale(1)`,
            opacity: 1,
            offset: 1,
          },
        ],
        {
          duration: DRAW_FLIGHT_DURATION_MS,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        }
      );

      const flipAnimation = rotator.animate(
        [
          { transform: 'rotateY(0deg)', offset: 0 },
          { transform: 'rotateY(0deg)', offset: 0.3 },
          { transform: 'rotateY(180deg)', offset: 0.72 },
          { transform: 'rotateY(180deg)', offset: 1 },
        ],
        {
          duration: DRAW_FLIGHT_DURATION_MS,
          easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
          fill: 'forwards',
        }
      );

      await Promise.all([flightAnimation.finished, flipAnimation.finished]);
    } finally {
      overlay.remove();
    }
  };

  const drainDrawQueue = async () => {
    if (drawAnimationRunningRef.current) {
      return;
    }

    drawAnimationRunningRef.current = true;
    try {
      while (drawQueueRef.current.length > 0) {
        const nextDraw = drawQueueRef.current.shift();
        if (!nextDraw) {
          continue;
        }
        await animateDeckCardToHand(nextDraw.card, nextDraw.targetIndex);
        await wait(DRAW_STAGGER_MS);
      }
    } finally {
      drawAnimationRunningRef.current = false;
    }
  };

  useEffect(() => {
    const currentHandIds = handCards.map((card) => card.id);

    if (!hasInitializedHandRef.current) {
      previousHandIdsRef.current = currentHandIds;
      hasInitializedHandRef.current = true;
      return;
    }

    const previousHandIds = previousHandIdsRef.current;
    previousHandIdsRef.current = currentHandIds;

    if (currentHandIds.length <= previousHandIds.length) {
      return;
    }

    const previousIdSet = new Set(previousHandIds);
    const newCards = handCards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => !previousIdSet.has(card.id));

    if (newCards.length === 0) {
      return;
    }

    drawQueueRef.current.push(...newCards.map(({ card, index }) => ({ card, targetIndex: index })));
    void drainDrawQueue();
  }, [handCards]);

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

    // Only sorcery cards are clickable for playing
    if (card.cardType !== CardType.SORCERY) {
      return;
    }

    // Phase check: ONLY allow during Ability Phase
    if (gameState?.turnPhase !== TurnPhase.ABILITY) {
      setError(`Sorcery cards can only be played during Ability Phase (current: ${gameState?.turnPhase})`);
      return;
    }

    // Turn check
    if (!isMyTurn) {
      setError('Not your turn');
      return;
    }

    // Check if sorcery requires a target
    if (requiresTarget(card.id)) {
      if (!gameState || !playerId) {
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

      // Enter targeting mode
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

      // Play immediately without target
      setError(null);
      sendPlaySorcery(card.id);
    }
  };

  const handleCancelSorcery = () => {
    exitSorceryMode();
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {sorceryModeActive && selectedSorceryCard && (
        <div className="bg-mugen-gold/20 border border-mugen-gold rounded-lg px-3 py-2 flex items-center justify-between">
          <span className="text-sm text-mugen-gold font-medium">
            Select target for {selectedSorceryCard.name}
          </span>
          <button
            onClick={handleCancelSorcery}
            className="text-mugen-gold hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="flex w-full gap-2 pb-2">
        {handSlots.map((card, index) => {
          const slotBaseClass = 'h-[184px] rounded-lg';

          if (!card) {
            return (
              <div
                key={`empty-slot-${index}`}
                data-hand-slot-index={index}
                className={`${slotBaseClass} border border-dashed border-white/10 bg-mugen-bg/40`}
                style={{ width: HAND_CARD_WIDTH, maxWidth: '136px' }}
              />
            );
          }

          return (
            <div
              key={card.id}
              data-hand-slot-index={index}
              data-hand-card={index}
              data-hand-card-id={card.id}
              className={`${slotBaseClass} bg-mugen-bg border p-3 transition-all ${
                discardModeActive
                  ? 'cursor-pointer border-red-500 ring-2 ring-red-500/80 animate-pulse shadow-[0_0_16px_rgba(239,68,68,0.55)] hover:scale-[1.02]'
                  : summonModeActive && card.cardType === CardType.UNIT && card.cost <= playerLife
                  ? 'cursor-pointer border-green-500 ring-2 ring-green-500/80 animate-pulse shadow-[0_0_16px_rgba(34,197,94,0.55)] hover:scale-[1.02]'
                  : card.cardType === CardType.SORCERY && gameState?.turnPhase === TurnPhase.ABILITY && isMyTurn && !summonModeActive
                    ? 'cursor-pointer border-white/10 hover:border-mugen-accent/50'
                    : 'cursor-not-allowed opacity-60 border-white/10'
              } ${(summoningCardId === card.id || discardingCardId === card.id) ? 'opacity-30' : ''}`}
              style={{ width: HAND_CARD_WIDTH, maxWidth: '136px' }}
              onMouseEnter={() => handleMouseEnter(card)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleCardClick(card)}
            >
              <div className="text-white font-semibold text-sm truncate">{card.name}</div>
              <div className="flex flex-col text-xs text-gray-300 mt-1">
                {card.cardType === CardType.UNIT ? (
                  <>
                    <span>HP: {card.hp}</span>
                    <span>ATK: {card.atk}</span>
                    <span>Cost: {card.cost}</span>
                  </>
                ) : (
                  <span>Cost: {card.cost}</span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1 truncate">
                {card.cardType === CardType.UNIT ? card.ability?.name : card.effect}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LifeCounter() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const life = myPlayer?.life ?? 0;
  const maxLife = myPlayer?.maxLife ?? 24;
  const pct = maxLife > 0 ? (life / maxLife) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <Heart size={20} className={life <= 5 ? 'text-mugen-danger animate-pulse' : 'text-mugen-danger'} />
      <div className="flex-1">
        <div className="h-2 bg-mugen-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct > 50 ? 'bg-mugen-success' : pct > 25 ? 'bg-mugen-gold' : 'bg-mugen-danger'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-mono font-bold">{life}</span>
    </div>
  );
}

function TurnIndicator() {
  const gameState = useGameStore((s) => s.gameState);
  const { isMyTurn } = useGameActions();

  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const phase = PHASE_LABELS[gameState.turnPhase] ?? gameState.turnPhase;

  return (
    <div className={`rounded-lg px-4 py-2 text-sm font-medium ${
      isMyTurn ? 'bg-mugen-accent/20 text-mugen-accent border border-mugen-accent/30' : 'bg-mugen-bg text-gray-400 border border-white/5'
    }`}>
      <div className="flex items-center gap-2">
        <Zap size={14} />
        <span>{isMyTurn ? 'Your Turn' : `${currentPlayer?.name}'s Turn`}</span>
        <span className="text-xs opacity-60">• {phase}</span>
      </div>
    </div>
  );
}

function PlayerList() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);

  if (!gameState) return null;

  // Map player colors to CSS colors
  const colorMap: Record<string, string> = {
    red: '#ef4444',
    blue: '#6366f1', 
    yellow: '#f59e0b',
    green: '#22c55e',
  };

  // Get player color from the authoritative server-assigned player.color field
  const getPlayerColor = (player: any) => {
    if (player.color && colorMap[player.color]) {
      return colorMap[player.color];
    }
    return colorMap.blue; // default fallback
  };

  return (
    <div className="bg-mugen-surface/50 rounded-lg border border-white/10 p-3 mt-2">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Players</div>
      <div className="space-y-2">
        {gameState.players.map((player) => {
          const playerColor = getPlayerColor(player);
          const isCurrentPlayer = player.id === playerId;
          const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === player.id;
          
          return (
            <div 
              key={player.id}
              className={`flex items-center justify-between p-2 rounded border transition-all ${
                isCurrentTurn 
                  ? 'border-mugen-accent/50 bg-mugen-accent/10' 
                  : 'border-white/5 bg-mugen-surface/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full border-2 border-white/30"
                  style={{ backgroundColor: playerColor }}
                />
                <span 
                  className="font-medium text-sm"
                  style={{ color: playerColor }}
                >
                  {player.name}
                  {isCurrentPlayer && <span className="text-xs text-gray-400 ml-1">(You)</span>}
                </span>
                {isCurrentTurn && (
                  <div className="w-2 h-2 bg-mugen-accent rounded-full animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <Heart size={12} className="text-mugen-danger" />
                <span className="text-sm font-mono font-bold text-white">{player.life}</span>
                {player.isEliminated && (
                  <span className="text-xs text-red-400 line-through ml-1">Eliminated</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseControls() {
  const { isMyTurn, sendAdvancePhase, sendEndTurn } = useGameActions();
  const gameState = useGameStore((s) => s.gameState);
  const handLimitModalOpen = useGameStore((s) => s.handLimitModalOpen);
  const standbyModalOpen = useGameStore((s) => s.standbyModalOpen);

  if (!gameState || !isMyTurn) return null;
  const controlsDisabled = handLimitModalOpen || standbyModalOpen;

  return (
    <div className="flex gap-2">
      {gameState.turnPhase !== TurnPhase.END && (
        <button
          onClick={sendAdvancePhase}
          disabled={controlsDisabled}
          className={`flex items-center gap-1.5 px-4 py-2 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg text-sm font-medium transition ${controlsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <ArrowRight size={14} /> Next Phase
        </button>
      )}
      <button
        onClick={sendEndTurn}
        disabled={controlsDisabled}
        className={`flex items-center gap-1.5 px-4 py-2 bg-mugen-gold hover:bg-mugen-gold/80 text-black rounded-lg text-sm font-bold transition ${controlsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <SkipForward size={14} /> End Turn
      </button>
    </div>
  );
}

function GameLog() {
  const gameLogs = useGameStore((s) => s.gameLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameLogs.length]);

  return (
    <div className="bg-mugen-surface/80 backdrop-blur-sm rounded-lg border border-white/10 p-2 w-[440px]">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Game Log</div>
      <div
        ref={scrollRef}
        className="overflow-y-auto max-h-[78px] space-y-0.5"
        style={{ scrollbarWidth: 'thin' }}
      >
        {gameLogs.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No events yet</div>
        ) : (
          gameLogs.map((message, i) => (
            <div key={i} className="text-xs text-gray-300 leading-tight break-words">
              {message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function GameHUD() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const error = useGameStore((s) => s.error);
  const clearError = useGameStore((s) => s.clearError);
  const summonModalOpen = useGameStore((s) => s.summonModalOpen);

  if (!gameState) return null;

  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === playerId;
  const myPlayer = gameState.players.find((p) => p.id === playerId);
  const hasEligibleSummonUnit = (myPlayer?.hand.cards ?? []).some(
    (card) => card.cardType === CardType.UNIT && card.cost <= (myPlayer?.life ?? 0)
  );
  const shouldShowSummonHint = summonModalOpen && isMyTurn && hasEligibleSummonUnit;

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Top bar: turn indicator + opponent info */}
      <div className="absolute top-0 left-0 right-0 p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-3 pointer-events-auto">
            <TurnIndicator />
            <PhaseControls />
            <GameLog />
          </div>
          <div className="flex flex-col gap-2 pointer-events-auto">
            {gameState.players.map((player, index) => {
              // Color mapping based on player position, matching server PLAYER_COLOR_MAP
              // index 0=red, 1=blue, 2=yellow, 3=green
              const positionColors = ['#ef4444', '#6366f1', '#f59e0b', '#22c55e']; // red, blue, yellow, green
              const playerColor = positionColors[index % 4];
              const isCurrentPlayer = player.id === playerId;
              const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === player.id;
              
              return (
                <div
                  key={player.id}
                  className={`bg-mugen-surface border rounded-lg px-3 py-2 text-sm transition-all ${
                    isCurrentTurn 
                      ? 'border-mugen-accent/50 bg-mugen-accent/10' 
                      : 'border-white/5'
                  } ${
                    player.isEliminated ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isCurrentTurn && (
                      <div className="w-2 h-2 bg-mugen-accent rounded-full animate-pulse" />
                    )}
                    <div 
                      className="font-medium text-xs"
                      style={{ color: playerColor }}
                    >
                      {player.name}
                      {isCurrentPlayer && <span className="text-xs text-gray-400 ml-1">(You)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-mugen-danger text-xs">
                    <Heart size={10} /> {player.life}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      
      
      {/* Bottom: standby phase + hand */}
      <div
        className="absolute left-0 p-6 pointer-events-auto"
        style={{
          bottom: '-21px',
          width: `min(calc(50% - 48px), ${HAND_PANEL_MAX_WIDTH_PX}px)`,
        }}
      >
        <div className="relative bg-mugen-surface/90 backdrop-blur-sm rounded-xl border border-white/5 px-6 pb-1 pt-[16px] w-full">
          {shouldShowSummonHint && (
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 z-20">
              <div className="rounded-md border border-green-400/40 bg-green-500/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-green-200 shadow-[0_0_12px_rgba(34,197,94,0.25)]">
                Select an eligible unit from hand to place on bench
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Hand</h3>
            <HandDisplay />
          </div>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={clearError}
            className="bg-mugen-danger/90 text-white px-4 py-2 rounded-lg text-sm shadow-lg"
          >
            {error} ✕
          </button>
        </div>
      )}
    </div>
  );
}

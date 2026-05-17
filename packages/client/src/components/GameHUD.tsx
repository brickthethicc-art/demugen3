import { useRef, useEffect, useLayoutEffect, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';







import { useGameStore } from '../store/game-store.js';







import { useGameActions } from '../hooks/useGameActions.js';







import { useCardHover } from '../hooks/useUnitHover.js';







import { sendDiscardCard } from '../network/socket-client.js';







import type { Card, GameState } from '@mugen/shared';







import { TurnPhase, CardType, MAX_HAND_SIZE, RESERVE_UNIT_COUNT, isHiddenCardId } from '@mugen/shared';







import { Heart, Zap, ArrowRight, SkipForward } from 'lucide-react';







import { DiscardPileViewer } from './DiscardPileViewer.js';
import { CardFront } from './CardFront.js';
import { CARD_BACK_IMAGE_URL, getCardBackStyle } from '../utils/card-back-style.js';















const HAND_SLOT_COUNT = MAX_HAND_SIZE;







const DRAW_EMERGE_DURATION_MS = 180;

const DRAW_FLIGHT_DURATION_MS = 760;

const DRAW_FLIP_DURATION_MS = 420;

const DRAW_SETTLE_DURATION_MS = 180;







const DRAW_STAGGER_MS = 140;

const DISCARD_FLIGHT_DURATION_MS = 720;

const DISCARD_SETTLE_DURATION_MS = 180;

const DISCARD_STAGGER_MS = 120;

void DRAW_STAGGER_MS;
void DISCARD_STAGGER_MS;







const EDGE_CARD_WIDTH_PX = 101;







const EDGE_CARD_HEIGHT_PX = 139;







const EDGE_CARD_GAP_CLASS = 'gap-1.5';

const SIDE_EDGE_CARD_GAP_CLASS = EDGE_CARD_GAP_CLASS;







const BOARD_SIZE_PX = 598;



export const COMBINED_UI_GROUP_SHIFT_UP_PX = 30;

let discardFlightStartHandler: ((playerId: string, previousTopCard: Card | null) => void) | undefined;
let discardFlightCompleteHandler: ((playerId: string) => void) | undefined;







const CARD_GAP_PX = 6;







const BOARD_EDGE_OFFSET_PX = 6;







const TOP_GROUP_SHIFT_DOWN_PX = 64;



const BOTTOM_GROUP_SHIFT_DOWN_PX = 34;







const RESERVE_ROW_SPAN_PX = RESERVE_UNIT_COUNT * EDGE_CARD_WIDTH_PX + (RESERVE_UNIT_COUNT - 1) * CARD_GAP_PX;



const HAND_COLUMN_SPAN_PX = HAND_SLOT_COUNT * EDGE_CARD_HEIGHT_PX + (HAND_SLOT_COUNT - 1) * CARD_GAP_PX;

const SIDE_HAND_OVERLAP_PX = EDGE_CARD_HEIGHT_PX - EDGE_CARD_WIDTH_PX;

const SIDE_HAND_LAYOUT_SPAN_PX =

  HAND_COLUMN_SPAN_PX - (HAND_SLOT_COUNT - 1) * SIDE_HAND_OVERLAP_PX;





const RESERVE_COLUMN_SPAN_PX = RESERVE_UNIT_COUNT * EDGE_CARD_HEIGHT_PX + (RESERVE_UNIT_COUNT - 1) * CARD_GAP_PX;

const SIDE_RESERVE_OVERLAP_PX = EDGE_CARD_HEIGHT_PX - EDGE_CARD_WIDTH_PX;

const SIDE_RESERVE_LAYOUT_SPAN_PX =

  RESERVE_COLUMN_SPAN_PX - (RESERVE_UNIT_COUNT - 1) * SIDE_RESERVE_OVERLAP_PX;















type SeatEdge = 'bottom' | 'top' | 'left' | 'right';







type ZoneGroup = 'label' | 'hint' | 'hand' | 'reserve' | 'deck' | 'grave';







type PlayerStateLike = GameState['players'][number];















interface DiscardPileEntry {







  card: Card;







  timestamp: number;







  source: 'unit_death' | 'sorcery_played' | 'other';







  unitInstance?: unknown;







}

function getCardFacingAngleDeg(edge: SeatEdge): number {

  if (edge === 'top') {

    return 180;

  }

  if (edge === 'left') {

    return 90;

  }

  if (edge === 'right') {

    return -90;

  }

  return 0;

}















const RELATIVE_EDGE_BY_PLAYER_INDEX: SeatEdge[] = ['bottom', 'top', 'left', 'right'];










const PLAYER_COLORS_BY_INDEX = ['#ef4444', '#6366f1', '#f59e0b', '#22c55e'];

const PLAYER_COLORS_BY_NAME: Record<string, string> = {
  red: '#ef4444',
  blue: '#6366f1',
  yellow: '#f59e0b',
  green: '#22c55e',
};
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















function getSeatEdge(playerIndex: number, localPlayerIndex: number, playerCount: number): SeatEdge {







  const normalizedCount = Math.max(playerCount, 1);







  const relativeIndex = ((playerIndex - localPlayerIndex) % normalizedCount + normalizedCount) % normalizedCount;







  return RELATIVE_EDGE_BY_PLAYER_INDEX[relativeIndex % RELATIVE_EDGE_BY_PLAYER_INDEX.length] ?? 'bottom';







}















function isVerticalEdge(edge: SeatEdge): boolean {







  return edge === 'left' || edge === 'right';







}















function getCardFacingStyle(edge: SeatEdge): CSSProperties {







  if (edge === 'top') {







    return { transform: 'rotate(180deg)', transformOrigin: 'center center' };







  }















  if (edge === 'left') {







    return { transform: 'rotate(90deg)', transformOrigin: 'center center' };







  }















  if (edge === 'right') {







    return { transform: 'rotate(-90deg)', transformOrigin: 'center center' };







  }















  return {};







}















function getSeatZoneStyle(edge: SeatEdge, zone: ZoneGroup): CSSProperties {







  return getZoneGroupStyle(edge, zone);







}















function getPlayerAccentColor(player: PlayerStateLike, index: number): string {







  if (player.color) {







    const mappedColor = PLAYER_COLORS_BY_NAME[player.color];







    if (mappedColor) {







      return mappedColor;







    }







  }















  return PLAYER_COLORS_BY_INDEX[index % PLAYER_COLORS_BY_INDEX.length] ?? '#6366f1';







}















function getZoneGroupStyle(edge: SeatEdge, zone: ZoneGroup): CSSProperties {

  const boardHalf = BOARD_SIZE_PX / 2;

  const bottomEdgeInsetPx = 8;

  const bottomGroupLiftPx = 24;



  const topReserveOffset = boardHalf + EDGE_CARD_HEIGHT_PX + BOARD_EDGE_OFFSET_PX;



  const bottomReserveOffset =

    boardHalf + BOARD_EDGE_OFFSET_PX - bottomEdgeInsetPx - bottomGroupLiftPx + BOTTOM_GROUP_SHIFT_DOWN_PX;

  const bottomHandOffset = bottomReserveOffset + EDGE_CARD_HEIGHT_PX + CARD_GAP_PX + 2;



  const frameworkGridGapPx = bottomReserveOffset - boardHalf;

  const frameworkInterZoneGapPx = bottomHandOffset - bottomReserveOffset - EDGE_CARD_HEIGHT_PX;

  const topHandOffset = topReserveOffset + EDGE_CARD_HEIGHT_PX + frameworkInterZoneGapPx;



  const topLeftOffset = RESERVE_ROW_SPAN_PX / 2 + EDGE_CARD_WIDTH_PX + CARD_GAP_PX + 4;

  const topRightOffset = RESERVE_ROW_SPAN_PX / 2 + CARD_GAP_PX + 4;



  const sideNearLaneEdgeOffsetPx = boardHalf + frameworkGridGapPx - 6;

  const sideFarLaneEdgeOffsetPx = sideNearLaneEdgeOffsetPx + EDGE_CARD_HEIGHT_PX + frameworkInterZoneGapPx;

  const sideTopNearOffset = topRightOffset;

  const sideTopFarOffset = topLeftOffset;



  switch (edge) {

    case 'top':

      if (zone === 'hand') {

        return {

          left: '50%',

          transform: 'translateX(-50%)',

          top: `calc(50% - ${topHandOffset}px + ${TOP_GROUP_SHIFT_DOWN_PX}px)`,

        };

      }



      if (zone === 'reserve') {

        return {

          left: '50%',

          transform: 'translateX(-50%)',

          top: `calc(50% - ${topReserveOffset}px + ${TOP_GROUP_SHIFT_DOWN_PX}px)`,

        };

      }



      if (zone === 'grave') {

        return {

          left: `calc(50% - ${topLeftOffset}px)`,

          top: `calc(50% - ${topReserveOffset}px + ${TOP_GROUP_SHIFT_DOWN_PX}px)`,

        };

      }



      if (zone === 'deck') {

        return {

          left: `calc(50% + ${topRightOffset}px)`,

          top: `calc(50% - ${topReserveOffset}px + ${TOP_GROUP_SHIFT_DOWN_PX}px)`,

        };

      }



      if (zone === 'hint') {

        return {

          left: '50%',

          transform: 'translateX(-50%)',

          top: `calc(50% - ${topHandOffset + 24}px + ${TOP_GROUP_SHIFT_DOWN_PX}px)`,

        };

      }



      return {

        left: '50%',

        transform: 'translateX(-50%)',

        top: `calc(50% - ${boardHalf + 18}px + ${TOP_GROUP_SHIFT_DOWN_PX}px)`,

      };



    case 'bottom':

      if (zone === 'reserve') {

        return {

          left: '50%',

          transform: 'translateX(-50%)',

          top: `calc(50% + ${bottomReserveOffset}px)`,

        };

      }



      if (zone === 'hand') {

        return {

          left: '50%',

          transform: 'translateX(-50%)',

          top: `calc(50% + ${bottomHandOffset}px)`,

        };

      }



      if (zone === 'grave') {

        return {

          left: `calc(50% + ${topRightOffset}px)`,

          top: `calc(50% + ${bottomReserveOffset}px)`,

        };

      }



      if (zone === 'deck') {

        return {

          left: `calc(50% - ${topLeftOffset}px)`,

          top: `calc(50% + ${bottomReserveOffset}px)`,

        };

      }



      if (zone === 'hint') {

        return {

          left: '50%',

          transform: 'translateX(-50%)',

          top: `calc(50% + ${bottomReserveOffset - 22}px)`,

        };

      }



      return {

        left: `calc(50% - ${RESERVE_ROW_SPAN_PX / 2 + 34}px)`,

        top: `calc(50% + ${bottomReserveOffset - 12}px)`,

      };



    case 'left':

      if (zone === 'hand') {

        return {

          left: `calc(50% - ${sideFarLaneEdgeOffsetPx + EDGE_CARD_WIDTH_PX}px + 5px)`,

          top: `calc(50% - ${SIDE_HAND_LAYOUT_SPAN_PX / 2}px + 32px)`,

        };

      }



      if (zone === 'reserve') {

        return {

          left: `calc(50% - ${sideNearLaneEdgeOffsetPx + EDGE_CARD_WIDTH_PX}px + 5px)`,

          top: `calc(50% - ${SIDE_RESERVE_LAYOUT_SPAN_PX / 2}px + 32px)`,

        };

      }



      if (zone === 'grave') {

        return {

          left: `calc(50% - ${sideNearLaneEdgeOffsetPx + EDGE_CARD_WIDTH_PX}px + 5px)`,

          top: `calc(50% + ${sideTopNearOffset}px + 13px)`,

        };

      }



      if (zone === 'deck') {

        return {

          left: `calc(50% - ${sideNearLaneEdgeOffsetPx + EDGE_CARD_WIDTH_PX}px + 5px)`,

          top: `calc(50% - ${sideTopFarOffset}px + 15px)`,

        };

      }



      if (zone === 'hint') {

        return {

          left: `calc(50% - ${sideFarLaneEdgeOffsetPx + EDGE_CARD_WIDTH_PX}px)`,

          top: `calc(50% - ${sideTopNearOffset + 24}px)`,

        };

      }



      return {

        left: `calc(50% - ${boardHalf + EDGE_CARD_WIDTH_PX + 8}px)`,

        top: 'calc(50% - 10px)',

      };



    case 'right':

      if (zone === 'reserve') {

        return {

          left: `calc(50% + ${sideNearLaneEdgeOffsetPx}px - 5px)`,

          top: `calc(50% - ${SIDE_RESERVE_LAYOUT_SPAN_PX / 2}px + 32px)`,

        };

      }



      if (zone === 'hand') {

        return {

          left: `calc(50% + ${sideFarLaneEdgeOffsetPx}px - 5px)`,

          top: `calc(50% - ${SIDE_HAND_LAYOUT_SPAN_PX / 2}px + 32px)`,

        };

      }



      if (zone === 'grave') {

        return {

          left: `calc(50% + ${sideNearLaneEdgeOffsetPx}px - 5px)`,

          top: `calc(50% - ${sideTopFarOffset}px + 15px)`,

        };

      }



      if (zone === 'deck') {

        return {

          left: `calc(50% + ${sideNearLaneEdgeOffsetPx}px - 5px)`,

          top: `calc(50% + ${sideTopNearOffset}px + 13px)`,

        };

      }



      if (zone === 'hint') {

        return {

          left: `calc(50% + ${sideFarLaneEdgeOffsetPx}px)`,

          top: `calc(50% - ${sideTopNearOffset + 24}px)`,

        };

      }



      return {

        left: `calc(50% + ${boardHalf + 14}px)`,

        top: `calc(50% + ${RESERVE_COLUMN_SPAN_PX / 2 + 8}px)`,

      };



    default:

      return {};

  }

}















function CompactPile({







  label,







  count,







  topCard,







  accentColor,







  edge,







  onClick,







  isLocalDeck,

  deckOwnerId,

  discardOwnerId,







  isLocalDiscard,

  showTopCardFaceUp,







}: {







  label: string;







  count: number;







  topCard: Card | null;







  accentColor: string;







  edge: SeatEdge;







  onClick?: () => void;







  isLocalDeck?: boolean;

  deckOwnerId?: string;

  discardOwnerId?: string;







  isLocalDiscard?: boolean;

  showTopCardFaceUp?: boolean;







}) {







  const canClick = Boolean(onClick);

  const shouldRenderTopCardFaceUp = Boolean(showTopCardFaceUp && topCard && !isHiddenCardId(topCard.id));















  return (







    <button







      type="button"







      data-deck={isLocalDeck ? 'main' : undefined}

      data-draw-deck-owner-id={deckOwnerId}

      data-discard-pile-player-id={discardOwnerId}







      data-discard-pile={isLocalDiscard ? 'desktop' : undefined}







      onClick={onClick}







      disabled={!canClick}







      className={`relative overflow-hidden rounded-md border px-1.5 py-1 text-left transition-colors ${







        canClick







          ? 'cursor-pointer border-white/20 bg-slate-900/85 hover:border-white/45'







          : 'cursor-default border-white/15 bg-slate-950/70'







      }`}







      style={{







        width: `${EDGE_CARD_WIDTH_PX}px`,







        height: `${EDGE_CARD_HEIGHT_PX}px`,







        boxShadow: `inset 0 0 10px ${accentColor}20`,

        ...(topCard && !shouldRenderTopCardFaceUp ? getCardBackStyle() : {}),







        ...getCardFacingStyle(edge),







      }}







    >







      {shouldRenderTopCardFaceUp && topCard ? (
        <div className="absolute inset-[1px] overflow-hidden rounded-[5px]">
          <CardFront card={topCard} width={EDGE_CARD_WIDTH_PX - 2} height={EDGE_CARD_HEIGHT_PX - 2} />
        </div>
      ) : null}

      <div className="absolute right-1 top-1 rounded-full bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white">







        {count}







      </div>







      {!topCard ? (







        <div className="flex h-full flex-col items-center justify-center text-center">







          <div className="text-[9px] font-semibold text-gray-400">EMPTY</div>







        </div>







      ) : null}







      <div className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[8px] font-semibold uppercase tracking-[0.08em] text-gray-200">







        {label}







      </div>







    </button>







  );







}















function HandZone({







  player,







  orientation,







  edge,







  isLocalPlayer,







}: {







  player: PlayerStateLike;







  orientation: 'horizontal' | 'vertical';







  edge: SeatEdge;







  isLocalPlayer: boolean;







}) {







  const gameState = useGameStore((s) => s.gameState);







  const localPlayerId = useGameStore((s) => s.playerId);







  const summonModalOpen = useGameStore((s) => s.summonModalOpen);







  const handLimitModalOpen = useGameStore((s) => s.handLimitModalOpen);







  const benchUnits = useGameStore((s) => s.benchUnits);







  const { handleMouseEnter, handleMouseLeave } = useCardHover();







  const { isMyTurn, sendPlaySorcery, sendSummonToBench } = useGameActions();







  const setError = useGameStore((s) => s.setError);







  const sorceryModeActive = useGameStore((s) => s.sorceryModeActive);







  const selectedSorceryCard = useGameStore((s) => s.selectedSorceryCard);







  const { enterSorceryMode, exitSorceryMode } = useGameStore();

  const [suppressedDrawSlotCounts, setSuppressedDrawSlotCounts] = useState<Record<number, number>>({});

  const [suppressedDiscardSlotCounts, setSuppressedDiscardSlotCounts] = useState<Record<number, number>>({});

  const [suppressedDiscardSlotsByCard, setSuppressedDiscardSlotsByCard] = useState<
    Record<number, { cardId: string; count: number }>
  >({});







  const handCards = player.hand.cards ?? [];

  const discardCards = player.discardPile?.cards ?? [];







  const handSlots = Array.from({ length: HAND_SLOT_COUNT }, (_, i) => {
    const card = handCards[i] ?? null;

    if (!card) {
      return null;
    }

    if ((suppressedDrawSlotCounts[i] ?? 0) > 0) {
      return null;
    }

    if ((suppressedDiscardSlotCounts[i] ?? 0) > 0) {
      return null;
    }

    const cardBoundSuppression = suppressedDiscardSlotsByCard[i];
    if (cardBoundSuppression && cardBoundSuppression.cardId === card.id && cardBoundSuppression.count > 0) {
      return null;
    }

    return card;
  });







  const shouldReverseSlotOrder = edge === 'bottom' || edge === 'left' || edge === 'right';







  const orderedHandSlots = handSlots







    .map((card, slotIndex) => ({ card, slotIndex }))







    .sort((a, b) => (shouldReverseSlotOrder ? b.slotIndex - a.slotIndex : a.slotIndex - b.slotIndex));







  const playerLife = player.life ?? 0;







  const openBenchSlots = Math.max(0, RESERVE_UNIT_COUNT - benchUnits.length);







  const summonModeActive = isLocalPlayer && summonModalOpen && isMyTurn && openBenchSlots > 0;







  const requiresPreDrawDiscard =
    gameState?.pendingTurnStartDraw === true &&
    isMyTurn &&
    handCards.length === MAX_HAND_SIZE;

  const discardModeActive =
    isLocalPlayer &&
    handLimitModalOpen &&
    isMyTurn &&
    (handCards.length > MAX_HAND_SIZE || requiresPreDrawDiscard);







  const [summoningCardId, setSummoningCardId] = useState<string | null>(null);







  const [discardingCardId, setDiscardingCardId] = useState<string | null>(null);

  const [discardingSlotIndex, setDiscardingSlotIndex] = useState<number | null>(null);



  const edgeCardGapClass = orientation === 'vertical' ? SIDE_EDGE_CARD_GAP_CLASS : EDGE_CARD_GAP_CLASS;







  const drawQueueRef = useRef<
    {
      card: Card;
      targetIndex: number;
      requiresPreDrawCompaction: boolean;
      startSuppressionIndices: number[];
      clearSuppressionIndices: number[];
    }[]
  >([]);

  const discardQueueRef = useRef<{ card: Card; sourceRect: DOMRect; sourceIndex: number; shouldFlipFaceUp: boolean }[]>([]);







  const drawAnimationRunningRef = useRef(false);

  const discardAnimationRunningRef = useRef(false);

  const handSlotElementsByIndexRef = useRef(new Map<number, HTMLElement>());

  const previousHandSlotRectsRef = useRef(new Map<number, DOMRect>());







  const previousHandIdsRef = useRef<string[]>([]);







  const hasInitializedHandRef = useRef(false);

  const previousHandForDiscardRef = useRef<Card[]>([]);

  const previousDiscardForDiscardRef = useRef<Card[]>([]);

  const previousPendingTurnStartDrawRef = useRef(gameState?.pendingTurnStartDraw === true);

  const hasInitializedDiscardTrackingRef = useRef(false);

  const suppressNextAutoDiscardAnimationRef = useRef(0);

  const discardFlightHoldActiveRef = useRef(false);

  const pendingPostDiscardCompactionRef = useRef(false);

  const postDiscardCompactionRunningRef = useRef(false);

  const forcedRefillCompactionCompletedRef = useRef(false);

  const pendingForcedRefillDrawRef = useRef(false);

  const pendingCompactionHoleIndicesRef = useRef<number[]>([]);

  const deferredDiscardSuppressionReleaseSlotsRef = useRef<Array<{ slotIndex: number; cardId: string }>>([]);

  void setSuppressedDrawSlotCounts;
  void setSuppressedDiscardSlotCounts;
  void discardCards;
  void drawQueueRef;
  void discardQueueRef;
  void drawAnimationRunningRef;
  void discardAnimationRunningRef;
  void previousHandSlotRectsRef;
  void previousHandIdsRef;
  void hasInitializedHandRef;
  void previousHandForDiscardRef;
  void previousDiscardForDiscardRef;
  void previousPendingTurnStartDrawRef;
  void hasInitializedDiscardTrackingRef;















  const wait = (durationMs: number) =>







    new Promise<void>((resolve) => {







      window.setTimeout(resolve, durationMs);







    });

  const releaseSuppressedDiscardSlot = (slotIndex: number) => {
    setSuppressedDiscardSlotCounts((prev) => {
      const count = prev[slotIndex] ?? 0;
      if (count <= 1) {
        const { [slotIndex]: _removed, ...rest } = prev;
        void _removed;
        return rest;
      }
      return { ...prev, [slotIndex]: count - 1 };
    });
  };

  const suppressDiscardSlotForCard = (slotIndex: number, cardId: string) => {
    setSuppressedDiscardSlotsByCard((prev) => {
      const existing = prev[slotIndex];
      if (existing && existing.cardId === cardId) {
        return {
          ...prev,
          [slotIndex]: {
            cardId,
            count: existing.count + 1,
          },
        };
      }

      return {
        ...prev,
        [slotIndex]: {
          cardId,
          count: 1,
        },
      };
    });
  };

  const releaseSuppressedDiscardSlotForCard = (slotIndex: number, cardId: string) => {
    setSuppressedDiscardSlotsByCard((prev) => {
      const existing = prev[slotIndex];
      if (!existing || existing.cardId !== cardId) {
        return prev;
      }

      if (existing.count <= 1) {
        const { [slotIndex]: _removed, ...rest } = prev;
        void _removed;
        return rest;
      }

      return {
        ...prev,
        [slotIndex]: {
          cardId,
          count: existing.count - 1,
        },
      };
    });
  };

  const releaseDeferredDiscardSuppressionSlots = () => {
    const slotsToRelease = [...deferredDiscardSuppressionReleaseSlotsRef.current];
    if (slotsToRelease.length === 0) {
      return;
    }

    deferredDiscardSuppressionReleaseSlotsRef.current = [];

    setSuppressedDiscardSlotsByCard((prev) => {
      let next = { ...prev };
      for (const { slotIndex, cardId } of slotsToRelease) {
        const existing = next[slotIndex];
        if (!existing || existing.cardId !== cardId) {
          continue;
        }

        if (existing.count <= 1) {
          const { [slotIndex]: _removed, ...rest } = next;
          void _removed;
          next = rest;
        } else {
          next[slotIndex] = {
            cardId,
            count: existing.count - 1,
          };
        }
      }
      return next;
    });
  };

  const hideHandSlotElement = (slotIndex: number): (() => void) => {
    const handSlotEl = handSlotElementsByIndexRef.current.get(slotIndex);
    if (!handSlotEl) {
      return () => {};
    }

    const previousVisibility = handSlotEl.style.visibility;
    handSlotEl.style.visibility = 'hidden';

    return () => {
      if (!handSlotEl.isConnected) {
        return;
      }
      handSlotEl.style.visibility = previousVisibility;
    };
  };

  const animateHandCompactionRightOneSlot = async () => {
    const slotIndexDirection = shouldReverseSlotOrder ? -1 : 1;
    const pendingCompactionHoleIndices = [...pendingCompactionHoleIndicesRef.current];
    pendingCompactionHoleIndicesRef.current = [];

    if (pendingCompactionHoleIndices.length === 0) {
      return;
    }

    const occupiedSlots = Array.from({ length: HAND_SLOT_COUNT }, (_, index) => handSlots[index] !== null);
    for (const holeIndex of pendingCompactionHoleIndices) {
      if (holeIndex >= 0 && holeIndex < HAND_SLOT_COUNT) {
        occupiedSlots[holeIndex] = false;
      }
    }

    const plannedMoves: Array<{ sourceIndex: number; destinationIndex: number }> = [];

    if (slotIndexDirection > 0) {
      for (let sourceIndex = HAND_SLOT_COUNT - 2; sourceIndex >= 0; sourceIndex -= 1) {
        const destinationIndex = sourceIndex + slotIndexDirection;
        if (!occupiedSlots[sourceIndex] || occupiedSlots[destinationIndex]) {
          continue;
        }

        plannedMoves.push({ sourceIndex, destinationIndex });
        occupiedSlots[sourceIndex] = false;
        occupiedSlots[destinationIndex] = true;
      }
    } else {
      for (let sourceIndex = 1; sourceIndex < HAND_SLOT_COUNT; sourceIndex += 1) {
        const destinationIndex = sourceIndex + slotIndexDirection;
        if (!occupiedSlots[sourceIndex] || occupiedSlots[destinationIndex]) {
          continue;
        }

        plannedMoves.push({ sourceIndex, destinationIndex });
        occupiedSlots[sourceIndex] = false;
        occupiedSlots[destinationIndex] = true;
      }
    }

    if (plannedMoves.length === 0) {
      return;
    }

    const overlayAnimations: Promise<void>[] = [];
    const restoreSlotVisibilities: Array<() => void> = [];
    const hiddenSlotIndices = new Set<number>();
    const compactionOverlays: HTMLElement[] = [];
    let compactionMoveOrder = 0;

    const hideSlotForCompaction = (slotIndex: number) => {
      if (hiddenSlotIndices.has(slotIndex)) {
        return;
      }

      hiddenSlotIndices.add(slotIndex);
      restoreSlotVisibilities.push(hideHandSlotElement(slotIndex));
    };

    try {
      for (const { sourceIndex, destinationIndex } of plannedMoves) {
        const sourceEl = handSlotElementsByIndexRef.current.get(sourceIndex);
        const destinationRect = previousHandSlotRectsRef.current.get(destinationIndex);
        if (!sourceEl || !destinationRect) {
          continue;
        }

        hideSlotForCompaction(sourceIndex);
        hideSlotForCompaction(destinationIndex);

        const sourceRect = sourceEl.getBoundingClientRect();
        const deltaX = destinationRect.left + destinationRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
        const deltaY = destinationRect.top + destinationRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
        const sourceTransform = sourceEl.style.transform;
        const baseTransform = sourceTransform && sourceTransform !== 'none' ? sourceTransform : '';
        const fromTransform = baseTransform ? `${baseTransform} translate3d(0, 0, 0)` : 'translate3d(0, 0, 0)';
        const toTransform = baseTransform
          ? `${baseTransform} translate3d(${deltaX}px, ${deltaY}px, 0)`
          : `translate3d(${deltaX}px, ${deltaY}px, 0)`;

        const flyingCard = sourceEl.cloneNode(true) as HTMLElement;
        flyingCard.style.position = 'fixed';
        flyingCard.style.left = `${sourceRect.left}px`;
        flyingCard.style.top = `${sourceRect.top}px`;
        flyingCard.style.width = `${sourceRect.width}px`;
        flyingCard.style.height = `${sourceRect.height}px`;
        flyingCard.style.visibility = 'visible';
        flyingCard.style.opacity = '1';
        flyingCard.style.transform = fromTransform;
        flyingCard.style.willChange = 'transform, opacity';
        flyingCard.style.zIndex = '12000';
        flyingCard.style.pointerEvents = 'none';
        document.body.appendChild(flyingCard);
        compactionOverlays.push(flyingCard);

        const animationPromise = flyingCard
          .animate(
            [
              { transform: fromTransform, opacity: 1 },
              { transform: toTransform, opacity: 1 },
            ],
            {
              delay: compactionMoveOrder * 24,
              duration: 240,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              fill: 'forwards',
            }
          )
          .finished.then(() => {
            flyingCard.remove();
          })
          .catch(() => {
            flyingCard.remove();
          });

        compactionMoveOrder += 1;

        overlayAnimations.push(animationPromise);
      }

      if (overlayAnimations.length > 0) {
        await Promise.all(overlayAnimations);
      }
    } finally {
      for (const restoreVisibility of restoreSlotVisibilities) {
        restoreVisibility();
      }

      for (const overlay of compactionOverlays) {
        if (overlay.isConnected) {
          overlay.remove();
        }
      }
    }
  };

  void wait;















  const createDrawOverlayCard = (card: Card, startRect: DOMRect): HTMLElement => {







    const overlay = document.createElement('div');







    overlay.style.position = 'fixed';







    overlay.style.left = `${startRect.left}px`;







    overlay.style.top = `${startRect.top}px`;







    overlay.style.width = `${startRect.width}px`;







    overlay.style.height = `${startRect.height}px`;







    overlay.style.pointerEvents = 'none';







    overlay.style.zIndex = '12000';















    const rotator = document.createElement('div');







    rotator.style.position = 'absolute';







    rotator.style.inset = '0';

    rotator.style.transformOrigin = 'center center';

    rotator.style.willChange = 'transform';















    const commonFaceStyle = (face: HTMLElement) => {







      face.style.position = 'absolute';







      face.style.inset = '0';







      face.style.borderRadius = '10px';







      face.style.border = '1px solid rgba(255,255,255,0.15)';







      face.style.backfaceVisibility = 'hidden';







      face.style.overflow = 'hidden';

      face.style.willChange = 'opacity';







    };















    const backFace = document.createElement('div');







    commonFaceStyle(backFace);







    backFace.style.backgroundImage = `url("${CARD_BACK_IMAGE_URL}")`;

    backFace.style.backgroundSize = '100% 100%';

    backFace.style.backgroundPosition = 'center';

    backFace.style.backgroundRepeat = 'no-repeat';

    backFace.style.backgroundColor = '#1a120d';















    const frontFace = document.createElement('div');







    commonFaceStyle(frontFace);







frontFace.style.opacity = '0';







const frontCardHost = document.createElement('div');

frontCardHost.style.width = '100%';

frontCardHost.style.height = '100%';

frontFace.appendChild(frontCardHost);

const frontCardRoot = createRoot(frontCardHost);

frontCardRoot.render(<CardFront card={card} width={startRect.width} height={startRect.height} />);















rotator.appendChild(backFace);







rotator.appendChild(frontFace);







overlay.appendChild(rotator);















(overlay as any).__backFace = backFace;







(overlay as any).__frontFace = frontFace;

(overlay as any).__rotator = rotator;

(overlay as any).__frontCardRoot = frontCardRoot;







return overlay;







};















const animateDeckCardToHand = async (card: Card, targetIndex: number) => {







  const deckEl = Array.from(document.querySelectorAll<HTMLElement>('[data-draw-deck-owner-id]')).find(

    (el) => el.dataset.drawDeckOwnerId === player.id

  );







  const handSlotEl = handSlotElementsByIndexRef.current.get(targetIndex) ?? null;















  if (!deckEl || !handSlotEl) {







    return;







  }















  const deckRect = deckEl.getBoundingClientRect();







  const targetRect = handSlotEl.getBoundingClientRect();







  const overlay = createDrawOverlayCard(card, deckRect);







  const backFace = (overlay as any).__backFace as HTMLElement;







  const frontFace = (overlay as any).__frontFace as HTMLElement;

  const rotator = (overlay as any).__rotator as HTMLElement;

  const shouldRevealCardFace = isLocalPlayer && !isHiddenCardId(card.id);

  if (!shouldRevealCardFace) {

    frontFace.style.opacity = '0';

    backFace.style.opacity = '1';

  }







  document.body.appendChild(overlay);















  const deltaX = targetRect.left + targetRect.width / 2 - (deckRect.left + deckRect.width / 2);







  const deltaY = targetRect.top + targetRect.height / 2 - (deckRect.top + deckRect.height / 2);







  const arcLift = Math.min(112, Math.max(48, Math.abs(deltaX) * 0.22));

  const facingAngleDeg = getCardFacingAngleDeg(edge);

  const travelTiltDeg = deltaX > 0 ? -8 : deltaX < 0 ? 8 : 0;

  const emergeOffsetX = edge === 'left' ? 18 : edge === 'right' ? -18 : 0;

  const emergeOffsetY = edge === 'top' ? 16 : edge === 'bottom' ? -16 : 0;

  const emergeEndTransform = `translate3d(${emergeOffsetX}px, ${emergeOffsetY}px, 0) rotateZ(${facingAngleDeg}deg) scale(1)`;

  const flightMidTransform = `translate3d(${emergeOffsetX + (deltaX - emergeOffsetX) * 0.52}px, ${emergeOffsetY + (deltaY - emergeOffsetY) * 0.52 - arcLift}px, 0) rotateZ(${facingAngleDeg + travelTiltDeg}deg) scale(1.06)`;

  const flightEndTransform = `translate3d(${deltaX}px, ${deltaY}px, 0) rotateZ(${facingAngleDeg}deg) scale(1.03)`;

  const settleEndTransform = `translate3d(${deltaX}px, ${deltaY}px, 0) rotateZ(${facingAngleDeg}deg) scale(1)`;















  try {







    const emergeAnimation = overlay.animate(







      [







        {

          transform: `translate3d(0, 0, 0) rotateZ(${facingAngleDeg}deg) scale(0.9)`,

          opacity: 0.86,

          filter: 'drop-shadow(0 4px 8px rgba(15,23,42,0.32))',

        },







        {

          transform: emergeEndTransform,

          opacity: 1,

          filter: 'drop-shadow(0 10px 20px rgba(14,116,144,0.35))',

        },







      ],







      {







        duration: DRAW_EMERGE_DURATION_MS,







        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',







        fill: 'forwards',







      }







    );

    await emergeAnimation.finished;

    const flightAnimation = overlay.animate(

      [

        { transform: emergeEndTransform, opacity: 1, filter: 'drop-shadow(0 10px 20px rgba(14,116,144,0.35))' },

        { transform: flightMidTransform, opacity: 1, filter: 'drop-shadow(0 14px 30px rgba(30,64,175,0.36))' },

        { transform: flightEndTransform, opacity: 1, filter: 'drop-shadow(0 10px 20px rgba(8,47,73,0.42))' },

      ],

      {

        duration: DRAW_FLIGHT_DURATION_MS,

        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',

        fill: 'forwards',

      }

    );

    await flightAnimation.finished;

    if (isLocalPlayer) {

      const flipAnimation = rotator.animate(

        [

          { transform: 'scaleX(1) scale(1)', offset: 0 },

          { transform: 'scaleX(0.08) scale(1.12)', offset: 0.5 },

          { transform: 'scaleX(1) scale(1)', offset: 1 },

        ],

        {

          duration: DRAW_FLIP_DURATION_MS,

          easing: 'cubic-bezier(0.65, 0, 0.35, 1)',

          fill: 'forwards',

        }

      );

      const frontFaceSwapAnimation = shouldRevealCardFace
        ? frontFace.animate(

          [

            { opacity: 0, offset: 0 },
            { opacity: 0, offset: 0.45 },
            { opacity: 1, offset: 0.7 },
            { opacity: 1, offset: 1 },

          ],

          {

            duration: DRAW_FLIP_DURATION_MS,

            easing: 'ease-in-out',

            fill: 'forwards',

          }

        )

        : null;


      const backFaceSwapAnimation = shouldRevealCardFace
        ? backFace.animate(

          [

            { opacity: 1, offset: 0 },

            { opacity: 1, offset: 0.45 },

            { opacity: 0, offset: 0.7 },

            { opacity: 0, offset: 1 },

          ],

          {

            duration: DRAW_FLIP_DURATION_MS,
            easing: 'ease-in-out',


            fill: 'forwards',


          }

        )

        : null;


      await Promise.all([

        flipAnimation.finished,

        frontFaceSwapAnimation?.finished ?? Promise.resolve(),

        backFaceSwapAnimation?.finished ?? Promise.resolve(),

      ]);


    }


    const settleAnimation = overlay.animate(

      [

        { transform: flightEndTransform, opacity: 1, filter: 'drop-shadow(0 0 16px rgba(56,189,248,0.52))' },

        { transform: settleEndTransform, opacity: 1, filter: 'drop-shadow(0 6px 12px rgba(15,23,42,0.25))' },

      ],

      {

        duration: DRAW_SETTLE_DURATION_MS,

        easing: 'cubic-bezier(0.17, 0.84, 0.44, 1)',

        fill: 'forwards',

      }

    );

    await settleAnimation.finished;

  } finally {

    const frontCardRoot = (overlay as any).__frontCardRoot as { unmount: () => void } | undefined;

    frontCardRoot?.unmount();

    overlay.remove();

  }

};

void animateDeckCardToHand;





const animateDiscardCardToGrave = async ({

  card,

  sourceRect,

  shouldFlipFaceUp,

}: {

  card: Card;

  sourceRect: DOMRect;

  shouldFlipFaceUp: boolean;

}) => {

  const discardPileEl = Array.from(document.querySelectorAll<HTMLElement>('[data-discard-pile-player-id]')).find(

    (el) => el.dataset.discardPilePlayerId === player.id

  );

  if (!discardPileEl) {

    return;

  }

  const discardRect = discardPileEl.getBoundingClientRect();

  const overlay = createDrawOverlayCard(card, sourceRect);

  const backFace = (overlay as any).__backFace as HTMLElement;

  const frontFace = (overlay as any).__frontFace as HTMLElement;

  const rotator = (overlay as any).__rotator as HTMLElement;

  frontFace.style.opacity = shouldFlipFaceUp ? '0' : '1';

  backFace.style.opacity = '1';

  document.body.appendChild(overlay);

  const deltaX = discardRect.left + discardRect.width / 2 - (sourceRect.left + sourceRect.width / 2);

  const deltaY = discardRect.top + discardRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

  const facingAngleDeg = getCardFacingAngleDeg(edge);

  const arcLift = Math.min(72, Math.max(30, Math.abs(deltaX) * 0.18));

  const flightMidTransform = `translate3d(${deltaX * 0.55}px, ${deltaY * 0.55 - arcLift}px, 0) rotateZ(${facingAngleDeg}deg) scale(0.96)`;

  const flightEndTransform = `translate3d(${deltaX}px, ${deltaY}px, 0) rotateZ(${facingAngleDeg}deg) scale(0.88)`;

  const settleEndTransform = `translate3d(${deltaX}px, ${deltaY}px, 0) rotateZ(${facingAngleDeg}deg) scale(0.84)`;

  try {

    const flightAnimation = overlay.animate(

      [

        {

          transform: `translate3d(0, 0, 0) rotateZ(${facingAngleDeg}deg) scale(1)`,

          opacity: 1,

          filter: 'drop-shadow(0 6px 12px rgba(15,23,42,0.32))',

        },

        {

          transform: flightMidTransform,

          opacity: 1,

          filter: 'drop-shadow(0 12px 24px rgba(8,47,73,0.35))',

          offset: 0.58,

        },

        {

          transform: flightEndTransform,

          opacity: 0.92,

          filter: 'drop-shadow(0 10px 20px rgba(2,6,23,0.35))',

        },

      ],

      {

        duration: DISCARD_FLIGHT_DURATION_MS,

        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',

        fill: 'forwards',

      }

    );

    const flipAnimation = shouldFlipFaceUp
      ? rotator.animate(

        [

          { transform: 'scaleX(1) scale(1)', offset: 0 },

          { transform: 'scaleX(0.08) scale(1.05)', offset: 0.5 },

          { transform: 'scaleX(1) scale(1)', offset: 1 },

        ],

        {

          duration: DISCARD_FLIGHT_DURATION_MS,

          easing: 'cubic-bezier(0.65, 0, 0.35, 1)',

          fill: 'forwards',

        }

      )

      : null;

    const frontFaceSwapAnimation = shouldFlipFaceUp
      ? frontFace.animate(

        [

          { opacity: 0, offset: 0 },
          { opacity: 0, offset: 0.45 },
          { opacity: 1, offset: 0.75 },
          { opacity: 1, offset: 1 },

        ],

        {

          duration: DISCARD_FLIGHT_DURATION_MS,

          easing: 'ease-in-out',

          fill: 'forwards',

        }

      )

      : null;

    const backFaceSwapAnimation = shouldFlipFaceUp
      ? backFace.animate(

        [

          { opacity: 1, offset: 0 },

          { opacity: 1, offset: 0.45 },

          { opacity: 0, offset: 0.75 },

          { opacity: 0, offset: 1 },

        ],

        {

          duration: DISCARD_FLIGHT_DURATION_MS,

          easing: 'ease-in-out',

          fill: 'forwards',

        }

      )

      : null;

    await Promise.all([

      flightAnimation.finished,

      flipAnimation?.finished ?? Promise.resolve(),

      frontFaceSwapAnimation?.finished ?? Promise.resolve(),

      backFaceSwapAnimation?.finished ?? Promise.resolve(),

    ]);

    const settleAnimation = overlay.animate(

      [

        { transform: flightEndTransform, opacity: 0.92 },

        { transform: settleEndTransform, opacity: 0.82 },

      ],

      {

        duration: DISCARD_SETTLE_DURATION_MS,

        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',

        fill: 'forwards',

      }

    );

    await settleAnimation.finished;

  } finally {

    const frontCardRoot = (overlay as any).__frontCardRoot as { unmount: () => void } | undefined;

    frontCardRoot?.unmount();

    overlay.remove();

  }

};





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

const runDrawQueue = async () => {
  if (drawAnimationRunningRef.current) {
    return;
  }

  if (
    discardingCardId ||
    discardAnimationRunningRef.current ||
    pendingPostDiscardCompactionRef.current ||
    postDiscardCompactionRunningRef.current
  ) {
    return;
  }

  drawAnimationRunningRef.current = true;

  try {
    while (drawQueueRef.current.length > 0) {
      const nextDraw = drawQueueRef.current.shift();
      if (!nextDraw) {
        continue;
      }

      if (nextDraw.requiresPreDrawCompaction && !forcedRefillCompactionCompletedRef.current) {
        postDiscardCompactionRunningRef.current = true;
        try {
          await animateHandCompactionRightOneSlot();
          forcedRefillCompactionCompletedRef.current = true;
        } finally {
          postDiscardCompactionRunningRef.current = false;
        }
      }

      if (nextDraw.startSuppressionIndices.length > 0) {
        setSuppressedDrawSlotCounts((prev) => {
          const next = { ...prev };
          for (const slotIndex of nextDraw.startSuppressionIndices) {
            next[slotIndex] = (next[slotIndex] ?? 0) + 1;
          }
          return next;
        });
      }

      try {
        await animateDeckCardToHand(nextDraw.card, nextDraw.targetIndex);
      } finally {
        setSuppressedDrawSlotCounts((prev) => {
          const next = { ...prev };
          for (const slotIndex of nextDraw.clearSuppressionIndices) {
            const count = next[slotIndex] ?? 0;
            if (count <= 1) {
              delete next[slotIndex];
            } else {
              next[slotIndex] = count - 1;
            }
          }
          return next;
        });
      }

      if (drawQueueRef.current.length > 0) {
        await wait(DRAW_STAGGER_MS);
      }
    }
  } finally {
    drawAnimationRunningRef.current = false;

    if (!pendingPostDiscardCompactionRef.current && !postDiscardCompactionRunningRef.current) {
      releaseDeferredDiscardSuppressionSlots();
    }
  }
};

const runDiscardQueue = async () => {
  if (discardingCardId || discardAnimationRunningRef.current) {
    return;
  }

  discardAnimationRunningRef.current = true;

  try {
    while (discardQueueRef.current.length > 0) {
      const nextDiscard = discardQueueRef.current.shift();
      if (!nextDiscard) {
        continue;
      }

      try {
        await animateDiscardCardToGrave(nextDiscard);
      } finally {
        releaseSuppressedDiscardSlot(nextDiscard.sourceIndex);
      }

      if (discardQueueRef.current.length > 0) {
        await wait(DISCARD_STAGGER_MS);
      }
    }

    if (pendingPostDiscardCompactionRef.current) {
      pendingPostDiscardCompactionRef.current = false;
      postDiscardCompactionRunningRef.current = true;

      try {
        await animateHandCompactionRightOneSlot();
        forcedRefillCompactionCompletedRef.current = true;
      } finally {
        postDiscardCompactionRunningRef.current = false;
      }
    }
  } finally {
    discardAnimationRunningRef.current = false;

    if (!pendingPostDiscardCompactionRef.current && !postDiscardCompactionRunningRef.current) {
      releaseDeferredDiscardSuppressionSlots();
    }

    if (discardFlightHoldActiveRef.current) {
      discardFlightCompleteHandler?.(player.id);
      discardFlightHoldActiveRef.current = false;
    }

    if (drawQueueRef.current.length > 0) {
      void runDrawQueue();
    }
  }
};

useEffect(() => {
  if (discardingCardId) {
    return;
  }

  if (discardQueueRef.current.length > 0 || pendingPostDiscardCompactionRef.current) {
    void runDiscardQueue();
    return;
  }

  if (drawQueueRef.current.length > 0) {
    void runDrawQueue();
  }
}, [discardingCardId]);

useLayoutEffect(() => {
  const currentHandCards = player.hand.cards ?? [];
  const currentHandIds = currentHandCards.map((card) => card.id);
  const currentDiscardCards = player.discardPile?.cards ?? [];
  const previousDiscardCards = previousDiscardForDiscardRef.current;
  const previousHandCards = previousHandForDiscardRef.current;
  const currentPendingTurnStartDraw = gameState?.pendingTurnStartDraw === true;
  const previousPendingTurnStartDraw = previousPendingTurnStartDrawRef.current;

  if (!hasInitializedHandRef.current) {
    previousHandIdsRef.current = currentHandIds;
    hasInitializedHandRef.current = true;
    return;
  }

  const previousCountById = new Map<string, number>();
  for (const id of previousHandIdsRef.current) {
    previousCountById.set(id, (previousCountById.get(id) ?? 0) + 1);
  }

  const currentSeenById = new Map<string, number>();
  const drawnCards = currentHandCards
    .map((card, index) => {
      const seenCount = (currentSeenById.get(card.id) ?? 0) + 1;
      currentSeenById.set(card.id, seenCount);
      const previousCount = previousCountById.get(card.id) ?? 0;
      return seenCount > previousCount ? { card, targetIndex: index } : null;
    })
    .filter((entry): entry is { card: Card; targetIndex: number } => entry !== null);

  const discardGrowth = currentDiscardCards.length - previousDiscardCards.length;
  const handShrink = previousHandCards.length - currentHandCards.length;

  const shouldPreGateForcedRefillFromPendingSignal =
    discardGrowth > 0 &&
    handShrink === 0 &&
    !currentPendingTurnStartDraw &&
    previousHandCards.length === MAX_HAND_SIZE &&
    currentHandCards.length === MAX_HAND_SIZE &&
    (previousPendingTurnStartDraw || (isLocalPlayer && suppressNextAutoDiscardAnimationRef.current > 0));

  const shouldPreGateForcedRefillFromLocalManualSignal =
    isLocalPlayer &&
    suppressNextAutoDiscardAnimationRef.current > 0 &&
    discardGrowth > 0 &&
    !currentPendingTurnStartDraw &&
    currentHandCards.length === MAX_HAND_SIZE &&
    drawnCards.length > 0;

  const shouldPreGateForcedRefillSequence =
    shouldPreGateForcedRefillFromPendingSignal || shouldPreGateForcedRefillFromLocalManualSignal;

  const shouldUseForcedRefillDrawEntry =
    pendingForcedRefillDrawRef.current || shouldPreGateForcedRefillSequence;

  if (shouldPreGateForcedRefillSequence) {
    pendingPostDiscardCompactionRef.current = true;
    pendingForcedRefillDrawRef.current = true;
  }

  if (drawnCards.length > 0) {
    let drawQueueEntries = drawnCards.map((drawnCard) => ({
      card: drawnCard.card,
      targetIndex: drawnCard.targetIndex,
      requiresPreDrawCompaction: false,
      suppressIndices: [drawnCard.targetIndex],
      startSuppressionIndices: [] as number[],
      clearSuppressionIndices: [drawnCard.targetIndex],
    }));

    if (shouldUseForcedRefillDrawEntry) {
      const deferredDrawCard = drawnCards[0];
      if (deferredDrawCard) {
        forcedRefillCompactionCompletedRef.current = false;
        drawQueueEntries = [
          {
            card: deferredDrawCard.card,
            targetIndex: deferredDrawCard.targetIndex,
            requiresPreDrawCompaction: true,
            suppressIndices: [] as number[],
            startSuppressionIndices: [deferredDrawCard.targetIndex],
            clearSuppressionIndices: [deferredDrawCard.targetIndex],
          },
        ];
      }
      pendingForcedRefillDrawRef.current = false;
    }

    setSuppressedDrawSlotCounts((prev) => {
      const next = { ...prev };
      for (const drawEntry of drawQueueEntries) {
        for (const slotIndex of drawEntry.suppressIndices) {
          next[slotIndex] = (next[slotIndex] ?? 0) + 1;
        }
      }
      return next;
    });

    drawQueueRef.current.push(
      ...drawQueueEntries.map(
        ({ card, targetIndex, requiresPreDrawCompaction, startSuppressionIndices, clearSuppressionIndices }) => ({
        card,
        targetIndex,
        requiresPreDrawCompaction,
        startSuppressionIndices,
        clearSuppressionIndices,
      })
      )
    );
    void runDrawQueue();
  }

  previousHandIdsRef.current = currentHandIds;
}, [player.hand.cards, player.discardPile?.cards, gameState?.pendingTurnStartDraw, isLocalPlayer]);

useEffect(() => {
  const currentHandCards = player.hand.cards ?? [];
  const currentDiscardCards = player.discardPile?.cards ?? [];
  const currentPendingTurnStartDraw = gameState?.pendingTurnStartDraw === true;
  const previousPendingTurnStartDraw = previousPendingTurnStartDrawRef.current;

  if (!hasInitializedDiscardTrackingRef.current) {
    previousHandForDiscardRef.current = [...currentHandCards];
    previousDiscardForDiscardRef.current = [...currentDiscardCards];
    previousPendingTurnStartDrawRef.current = currentPendingTurnStartDraw;
    hasInitializedDiscardTrackingRef.current = true;
    return;
  }

  const previousHandCards = previousHandForDiscardRef.current;
  const previousDiscardCards = previousDiscardForDiscardRef.current;

  const discardGrowth = currentDiscardCards.length - previousDiscardCards.length;
  const handShrink = previousHandCards.length - currentHandCards.length;
  const forcedPreDrawDiscardResolved = previousPendingTurnStartDraw && !currentPendingTurnStartDraw;

  const shouldHandleForcedPreDrawDiscardAnimation =
    discardGrowth > 0 &&
    handShrink === 0 &&
    !currentPendingTurnStartDraw &&
    previousHandCards.length === MAX_HAND_SIZE &&
    currentHandCards.length === MAX_HAND_SIZE &&
    (forcedPreDrawDiscardResolved || (isLocalPlayer && suppressNextAutoDiscardAnimationRef.current > 0));

  if (
    discardGrowth > 0 &&
    (handShrink > 0 || shouldHandleForcedPreDrawDiscardAnimation)
  ) {
    const currentCountById = new Map<string, number>();
    for (const card of currentHandCards) {
      currentCountById.set(card.id, (currentCountById.get(card.id) ?? 0) + 1);
    }

    const previousSeenById = new Map<string, number>();
    let removedCards = previousHandCards
      .map((card, index) => {
        const seenCount = (previousSeenById.get(card.id) ?? 0) + 1;
        previousSeenById.set(card.id, seenCount);
        const currentCount = currentCountById.get(card.id) ?? 0;
        return seenCount > currentCount ? { card, sourceIndex: index } : null;
      })
      .filter((entry): entry is { card: Card; sourceIndex: number } => entry !== null)
      .slice(0, discardGrowth);

    if (removedCards.length === 0 && shouldHandleForcedPreDrawDiscardAnimation) {
      const fallbackCard = currentDiscardCards[currentDiscardCards.length - 1];
      const fallbackSourceIndex = previousHandCards.length - 1;
      if (fallbackCard && fallbackSourceIndex >= 0) {
        removedCards = [{ card: fallbackCard, sourceIndex: fallbackSourceIndex }];
      }
    }

    const suppressedCount = Math.min(suppressNextAutoDiscardAnimationRef.current, removedCards.length);

    if (suppressedCount > 0) {
      suppressNextAutoDiscardAnimationRef.current -= suppressedCount;
    }

    const suppressedDiscardSourceIndices = removedCards.slice(0, suppressedCount).map((entry) => entry.sourceIndex);
    const cardsToAnimate = removedCards.slice(suppressedCount);
    const previousDiscardTopCard = previousDiscardCards[previousDiscardCards.length - 1] ?? null;
    const queuedDiscardSourceIndices: number[] = [];
    let queuedDiscardAnimation = false;

    if (cardsToAnimate.length > 0) {
      for (const removedCard of cardsToAnimate) {
        const sourceRect =
          previousHandSlotRectsRef.current.get(removedCard.sourceIndex) ??
          handSlotElementsByIndexRef.current.get(removedCard.sourceIndex)?.getBoundingClientRect() ??
          null;
        if (!sourceRect) {
          continue;
        }

        const animationCard = isLocalPlayer
          ? removedCard.card
          : currentDiscardCards[currentDiscardCards.length - 1] ?? removedCard.card;

        setSuppressedDiscardSlotCounts((prev) => ({
          ...prev,
          [removedCard.sourceIndex]: (prev[removedCard.sourceIndex] ?? 0) + 1,
        }));

        discardQueueRef.current.push({
          card: animationCard,
          sourceRect,
          sourceIndex: removedCard.sourceIndex,
          shouldFlipFaceUp: !isLocalPlayer && !isHiddenCardId(animationCard.id),
        });

        if (!discardFlightHoldActiveRef.current) {
          discardFlightHoldActiveRef.current = true;
          discardFlightStartHandler?.(player.id, previousDiscardTopCard);
        }

        queuedDiscardSourceIndices.push(removedCard.sourceIndex);

        queuedDiscardAnimation = true;
      }

    }

    const shouldQueueForcedRefillAfterCompaction =
      shouldHandleForcedPreDrawDiscardAnimation &&
      (queuedDiscardAnimation || suppressedCount > 0);

    pendingCompactionHoleIndicesRef.current = shouldQueueForcedRefillAfterCompaction
      ? Array.from(new Set([...suppressedDiscardSourceIndices, ...queuedDiscardSourceIndices]))
      : [];

    pendingPostDiscardCompactionRef.current = shouldQueueForcedRefillAfterCompaction;
    pendingForcedRefillDrawRef.current = shouldQueueForcedRefillAfterCompaction;

    if (discardQueueRef.current.length > 0 || shouldQueueForcedRefillAfterCompaction) {
      void runDiscardQueue();
    } else if (drawQueueRef.current.length > 0) {
      void runDrawQueue();
    }
  }

  previousHandForDiscardRef.current = [...currentHandCards];
  previousDiscardForDiscardRef.current = [...currentDiscardCards];
  previousPendingTurnStartDrawRef.current = currentPendingTurnStartDraw;
}, [player.hand.cards, player.discardPile?.cards, gameState?.pendingTurnStartDraw, isLocalPlayer, player.id]);

useEffect(() => {
  const rectsByIndex = new Map<number, DOMRect>();
  for (const [slotIndex, element] of handSlotElementsByIndexRef.current.entries()) {
    rectsByIndex.set(slotIndex, element.getBoundingClientRect());
  }
  previousHandSlotRectsRef.current = rectsByIndex;
});

const handleCardClick = async (card: Card, slotIndex: number) => {




  if (!isLocalPlayer) {







    return;







  }















  if (summoningCardId || discardingCardId) {







    return;







  }















  if (discardModeActive) {




    setError(null);
    setDiscardingCardId(card.id);
    setDiscardingSlotIndex(slotIndex);

    let restoreSourceSlotVisibility: () => void = () => {};

    try {
      const sourceRect = handSlotElementsByIndexRef.current.get(slotIndex)?.getBoundingClientRect() ?? null;
      const shouldSuppressSourceSlot = sourceRect !== null;
      restoreSourceSlotVisibility = shouldSuppressSourceSlot ? hideHandSlotElement(slotIndex) : () => {};

      if (shouldSuppressSourceSlot) {
        suppressDiscardSlotForCard(slotIndex, card.id);
      }

      suppressNextAutoDiscardAnimationRef.current += 1;
      sendDiscardCard(card.id);

      if (sourceRect) {
        await animateDiscardCardToGrave({
          card,
          sourceRect,
          shouldFlipFaceUp: false,
        });
      }







    } finally {
      restoreSourceSlotVisibility();
      setDiscardingCardId(null);
      setDiscardingSlotIndex(null);

      if (requiresPreDrawDiscard) {
        const alreadyQueued = deferredDiscardSuppressionReleaseSlotsRef.current.some(
          (entry) => entry.slotIndex === slotIndex && entry.cardId === card.id
        );
        if (!alreadyQueued) {
          deferredDiscardSuppressionReleaseSlotsRef.current.push({ slotIndex, cardId: card.id });
        }
      } else {
        releaseSuppressedDiscardSlotForCard(slotIndex, card.id);
      }
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







    if (!gameState || !localPlayerId) {







      setError('Game state unavailable for sorcery targeting');







      return;







    }















    const validTargetCount = getValidSorceryTargetCount(card.id, gameState, localPlayerId);







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

void handleCancelSorcery;

  return (
    <div
      className={`relative flex ${orientation === 'vertical' ? `flex-col ${edgeCardGapClass}` : `flex-row ${edgeCardGapClass}`}`}
    >
      {isLocalPlayer && sorceryModeActive && selectedSorceryCard && (
        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-black/65 px-3 py-1 text-xs text-gray-200">
          Select target for {selectedSorceryCard.name}
        </div>
      )}

      {orderedHandSlots.map(({ card, slotIndex }, visualIndex) => {
        const sideHandOverlapStyle =
          orientation === 'vertical' && visualIndex > 0
            ? { marginTop: `-${SIDE_HAND_OVERLAP_PX}px` }
            : undefined;

        if (!card) {
          return (
            <div
              key={`hand-slot-${slotIndex}`}
              data-hand-slot-index={isLocalPlayer ? slotIndex : undefined}
              data-draw-hand-slot-player-id={player.id}
              data-draw-hand-slot-index={slotIndex}
              ref={(el) => {
                if (el) {
                  handSlotElementsByIndexRef.current.set(slotIndex, el);
                  return;
                }
                handSlotElementsByIndexRef.current.delete(slotIndex);
              }}
              className="rounded-md border border-dashed border-white/15 bg-mugen-bg/35"
              style={{
                width: `${EDGE_CARD_WIDTH_PX}px`,
                height: `${EDGE_CARD_HEIGHT_PX}px`,
                ...getCardFacingStyle(edge),
                ...sideHandOverlapStyle,
              }}
            />
          );
        }

        const summonHighlight = summonModeActive && card.cardType === CardType.UNIT && card.cost <= playerLife;

        const sorceryPlayable =
          isLocalPlayer &&
          card.cardType === CardType.SORCERY &&
          gameState?.turnPhase === TurnPhase.ABILITY &&
          isMyTurn &&
          !summonModeActive;

        const localInteractionClass = !isLocalPlayer
          ? 'cursor-default border-white/15'
          : summoningCardId || discardingCardId
            ? 'cursor-not-allowed border-white/15 opacity-70'
            : summonHighlight
              ? 'cursor-pointer border-green-500 ring-1 ring-green-500/70 shadow-[0_0_10px_rgba(34,197,94,0.4)] hover:brightness-110'
              : sorceryPlayable
                ? 'cursor-pointer border-blue-500/70 ring-1 ring-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:brightness-110'
                : discardModeActive
                  ? 'cursor-pointer border-red-500 ring-2 ring-red-500/90 shadow-[0_0_16px_rgba(239,68,68,0.75)] animate-pulse hover:brightness-110'
                  : 'cursor-pointer border-white/15 hover:brightness-110';

        const showCardBackInHand = !isLocalPlayer || isHiddenCardId(card.id);

        return (
          <div
            key={`hand-slot-${slotIndex}`}
            data-hand-slot-index={isLocalPlayer ? slotIndex : undefined}
            data-draw-hand-slot-player-id={player.id}
            data-draw-hand-slot-index={slotIndex}
            ref={(el) => {
              if (el) {
                handSlotElementsByIndexRef.current.set(slotIndex, el);
                return;
              }
              handSlotElementsByIndexRef.current.delete(slotIndex);
            }}
            data-hand-card={isLocalPlayer ? slotIndex : undefined}
            data-hand-card-id={isLocalPlayer ? card.id : undefined}
            className={`rounded-md border overflow-hidden bg-mugen-bg/85 p-0 transition-colors ${localInteractionClass} ${(summoningCardId === card.id || discardingSlotIndex === slotIndex) ? 'opacity-30' : ''}`}
            style={{
              width: `${EDGE_CARD_WIDTH_PX}px`,
              height: `${EDGE_CARD_HEIGHT_PX}px`,
              ...getCardFacingStyle(edge),
              ...sideHandOverlapStyle,
            }}
            onMouseEnter={() => handleMouseEnter(card)}
            onMouseLeave={handleMouseLeave}
            onClick={isLocalPlayer ? () => void handleCardClick(card, slotIndex) : undefined}
          >
            {showCardBackInHand ? (
              <div className="h-full w-full" style={getCardBackStyle()} />
            ) : (
              <CardFront card={card} width={EDGE_CARD_WIDTH_PX} height={EDGE_CARD_HEIGHT_PX} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const ReserveZone = ({
  player,
  orientation,
  edge,
  isLocalPlayer,
}: {
  player: PlayerStateLike;
  orientation: 'horizontal' | 'vertical';
  edge: SeatEdge;
  isLocalPlayer: boolean;
}) => {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const canSelectBenchUnits = useGameStore((s) => s.canSelectBenchUnits);
  const isSpectating = useGameStore((s) => s.isSpectating);
  const { enterDeploymentMode } = useGameStore();
  const { handleMouseEnter, handleMouseLeave } = useCardHover();

  const reserveCards = player.team.reserveUnits ?? [];
  const reserveSlots = Array.from({ length: RESERVE_UNIT_COUNT }, (_, index) => reserveCards[index] ?? null);
  const shouldReverseSlotOrder = edge === 'bottom' || edge === 'right';
  const orderedReserveSlots = reserveSlots
    .map((unit, slotIndex) => ({ unit, slotIndex }))
    .sort((a, b) => (shouldReverseSlotOrder ? b.slotIndex - a.slotIndex : a.slotIndex - b.slotIndex));

  const isMyTurn = gameState?.players[gameState.currentPlayerIndex]?.id === playerId;
  const isStandby = gameState?.turnPhase === TurnPhase.STANDBY;
  const reserveLocked = player.reserveLockedUntilNextTurn ?? false;
  const isEliminated = player.isEliminated ?? false;

  const activeUnitCount = player.units.filter(
    (unit) =>
      unit.position !== null &&
      unit.position.x >= 0 &&
      unit.position.x < (gameState?.board.width ?? 0) &&
      unit.position.y >= 0 &&
      unit.position.y < (gameState?.board.height ?? 0)
  ).length;

  const canDeploy =
    isLocalPlayer &&
    isMyTurn &&
    isStandby &&
    activeUnitCount < 3 &&
    canSelectBenchUnits &&
    !reserveLocked &&
    !isEliminated &&
    !isSpectating;

  const edgeCardGapClass = orientation === 'vertical' ? SIDE_EDGE_CARD_GAP_CLASS : EDGE_CARD_GAP_CLASS;

  return (
    <div
      data-bench-container={isLocalPlayer ? 'desktop' : undefined}
      className={`flex ${orientation === 'vertical' ? `flex-col ${edgeCardGapClass}` : `flex-row ${edgeCardGapClass}`}`}
    >
      {orderedReserveSlots.map(({ unit, slotIndex }, visualIndex) => {
        const sideReserveOverlapStyle =
          orientation === 'vertical' && visualIndex > 0 ? { marginTop: `-${SIDE_RESERVE_OVERLAP_PX}px` } : undefined;

        if (!unit) {
          return (
            <div
              key={`empty-reserve-${slotIndex}`}
              data-bench-slot-index={isLocalPlayer ? slotIndex : undefined}
              className="rounded-md border border-dashed border-white/15 bg-mugen-bg/35"
              style={{
                width: `${EDGE_CARD_WIDTH_PX}px`,
                height: `${EDGE_CARD_HEIGHT_PX}px`,
                ...getCardFacingStyle(edge),
                ...sideReserveOverlapStyle,
              }}
            />
          );
        }

        const reserveInteractionClass = canDeploy
          ? 'cursor-pointer border-green-500 ring-2 ring-green-500/80 shadow-[0_0_12px_rgba(34,197,94,0.5)] animate-pulse hover:brightness-110'
          : 'cursor-default border-white/15';

        const showCardBackInReserve = !isLocalPlayer || isHiddenCardId(unit.id);

        return (
          <div
            key={`reserve-slot-${slotIndex}`}
            data-bench-slot-index={isLocalPlayer ? slotIndex : undefined}
            className={`rounded-md border overflow-hidden bg-mugen-bg/85 p-0 transition-colors ${reserveInteractionClass}`}
            style={{
              width: `${EDGE_CARD_WIDTH_PX}px`,
              height: `${EDGE_CARD_HEIGHT_PX}px`,
              ...getCardFacingStyle(edge),
              ...sideReserveOverlapStyle,
            }}
            onMouseEnter={() => handleMouseEnter(unit)}
            onMouseLeave={handleMouseLeave}
            onClick={canDeploy ? () => enterDeploymentMode(unit) : undefined}
          >
            {showCardBackInReserve ? (
              <div className="h-full w-full" style={getCardBackStyle()} />
            ) : (
              <CardFront card={unit} width={EDGE_CARD_WIDTH_PX} height={EDGE_CARD_HEIGHT_PX} />
            )}
          </div>
        );
      })}
    </div>
  );
};

function TurnIndicator() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);

  if (!gameState) return null;

  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === playerId;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const phaseLabel = PHASE_LABELS[gameState.turnPhase] ?? gameState.turnPhase;

  return (
    <div
      className={`rounded-lg px-4 py-2 text-sm font-medium ${
        isMyTurn
          ? 'bg-mugen-accent/20 text-mugen-accent border border-mugen-accent/30'
          : 'bg-mugen-bg text-gray-400 border border-white/5'
      }`}
    >
      <div className="flex items-center gap-2">
        <Zap size={14} />
        <span>{isMyTurn ? 'Your Turn' : `${currentPlayer?.name}'s Turn`}</span>
        <span className="text-xs opacity-60">• {phaseLabel}</span>
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
          className={`flex items-center gap-1.5 px-4 py-2 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg text-sm font-medium transition ${
            controlsDisabled ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <ArrowRight size={14} /> Next Phase
        </button>
      )}
      <button
        onClick={sendEndTurn}
        disabled={controlsDisabled}
        className={`flex items-center gap-1.5 px-4 py-2 bg-mugen-gold hover:bg-mugen-gold/80 text-black rounded-lg text-sm font-bold transition ${
          controlsDisabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
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
    <div className="bg-mugen-surface/80 backdrop-blur-sm rounded-lg border border-white/10 p-2 w-[360px]">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Game Log</div>
      <div ref={scrollRef} className="overflow-y-auto max-h-[78px] space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
        {gameLogs.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No events yet</div>
        ) : (
          gameLogs.map((message, index) => (
            <div key={index} className="text-xs text-gray-300 leading-tight break-words">
              {message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PlayerSeatGroups({
  gameState,
  player,
  playerIndex,
  edge,
  isLocalPlayer,
  showSummonHint,
  onOpenDiscard,
  frozenDiscardTopCard,
}: {
  gameState: GameState;
  player: PlayerStateLike;
  playerIndex: number;
  edge: SeatEdge;
  isLocalPlayer: boolean;
  showSummonHint: boolean;
  onOpenDiscard: (playerId: string) => void;
  frozenDiscardTopCard?: Card | null;
}) {
  const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === player.id;
  const accentColor = getPlayerAccentColor(player, playerIndex);

  const deckCards = player.mainDeck?.cards ?? [];
  const discardCards = player.discardPile?.cards ?? [];
  const topDeckCard = deckCards.length > 0 ? deckCards[deckCards.length - 1] ?? null : null;
  const topDiscardCard = discardCards.length > 0 ? discardCards[discardCards.length - 1] ?? null : null;
  const renderedTopDiscardCard = frozenDiscardTopCard !== undefined ? frozenDiscardTopCard : topDiscardCard;
  const orientation = isVerticalEdge(edge) ? 'vertical' : 'horizontal';

  return (
    <>
      <div
        className="absolute pointer-events-none z-10 rounded border bg-black/55 px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
        style={{
          ...getSeatZoneStyle(edge, 'label'),
          borderColor: `${accentColor}66`,
          color: accentColor,
        }}
      >
        <span className="inline-flex items-center gap-1">
          {isCurrentTurn ? <span className="h-1.5 w-1.5 rounded-full bg-mugen-accent" /> : null}
          <span>Player {playerIndex + 1}</span>
          {isLocalPlayer ? <span className="text-gray-200">(You)</span> : null}
          <Heart size={10} className="text-red-400" />
          <span className="font-mono text-gray-100">{player.life}</span>
        </span>
      </div>

      {showSummonHint && !player.isEliminated && (
        <div
          className="absolute pointer-events-none z-10 rounded border border-green-400/30 bg-green-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-green-200"
          style={getSeatZoneStyle(edge, 'hint')}
        >
          Summon from hand
        </div>
      )}

      {!player.isEliminated && (
        <>
          <div className="absolute pointer-events-auto" style={getSeatZoneStyle(edge, 'hand')}>
            <HandZone
              player={player}
              orientation={orientation}
              edge={edge}
              isLocalPlayer={isLocalPlayer}
            />
          </div>

          <div className="absolute pointer-events-auto" style={getSeatZoneStyle(edge, 'reserve')}>
            <ReserveZone player={player} orientation={orientation} edge={edge} isLocalPlayer={isLocalPlayer} />
          </div>

          <div className="absolute pointer-events-auto" style={getSeatZoneStyle(edge, 'deck')}>
            <CompactPile
              label="Deck"
              count={deckCards.length}
              topCard={topDeckCard}
              accentColor={accentColor}
              edge={edge}
              deckOwnerId={player.id}
              isLocalDeck={isLocalPlayer}
            />
          </div>

          <div className="absolute pointer-events-auto" style={getSeatZoneStyle(edge, 'grave')}>
            <CompactPile
              label="Grave"
              count={discardCards.length}
              topCard={renderedTopDiscardCard}
              accentColor={accentColor}
              edge={edge}
              discardOwnerId={player.id}
              showTopCardFaceUp
              isLocalDiscard={isLocalPlayer}
              onClick={discardCards.length > 0 ? () => onOpenDiscard(player.id) : undefined}
            />
          </div>
        </>
      )}
    </>
  );
}

interface GameHUDProps {
  combinedGroupShiftUpPx?: number;
}

export function GameHUD({ combinedGroupShiftUpPx = COMBINED_UI_GROUP_SHIFT_UP_PX }: GameHUDProps = {}) {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const error = useGameStore((s) => s.error);
  const clearError = useGameStore((s) => s.clearError);
  const summonModalOpen = useGameStore((s) => s.summonModalOpen);

  const [discardViewerPlayerId, setDiscardViewerPlayerId] = useState<string | null>(null);
  const [frozenDiscardTopByPlayerId, setFrozenDiscardTopByPlayerId] = useState<
    Record<string, { card: Card | null; count: number }>
  >({});

  const handleDiscardFlightStart = (playerIdForFreeze: string, previousTopCard: Card | null) => {
    setFrozenDiscardTopByPlayerId((prev) => {
      const existing = prev[playerIdForFreeze];
      if (existing) {
        return {
          ...prev,
          [playerIdForFreeze]: {
            card: existing.card,
            count: existing.count + 1,
          },
        };
      }

      return {
        ...prev,
        [playerIdForFreeze]: {
          card: previousTopCard,
          count: 1,
        },
      };
    });
  };

  const handleDiscardFlightComplete = (playerIdForFreeze: string) => {
    setFrozenDiscardTopByPlayerId((prev) => {
      const existing = prev[playerIdForFreeze];
      if (!existing) {
        return prev;
      }

      if (existing.count <= 1) {
        const { [playerIdForFreeze]: _removed, ...rest } = prev;
        void _removed;
        return rest;
      }

      return {
        ...prev,
        [playerIdForFreeze]: {
          card: existing.card,
          count: existing.count - 1,
        },
      };
    });
  };

  discardFlightStartHandler = handleDiscardFlightStart;
  discardFlightCompleteHandler = handleDiscardFlightComplete;

  if (!gameState) return null;

  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === playerId;
  const myPlayer = gameState.players.find((p) => p.id === playerId);
  const hasEligibleSummonUnit = (myPlayer?.hand.cards ?? []).some(
    (card) => card.cardType === CardType.UNIT && card.cost <= (myPlayer?.life ?? 0)
  );
  const shouldShowSummonHint = summonModalOpen && isMyTurn && hasEligibleSummonUnit;

  const localPlayerIndex = Math.max(0, gameState.players.findIndex((player) => player.id === playerId));
  const playersWithSeats = gameState.players.map((player, index) => ({
    player,
    playerIndex: index,
    edge: getSeatEdge(index, localPlayerIndex, gameState.players.length),
  }));

  const discardViewerPlayer = gameState.players.find((player) => player.id === discardViewerPlayerId) ?? null;
  const discardViewerEntries: DiscardPileEntry[] = discardViewerPlayer
    ? discardViewerPlayer.discardPile.cards.map((card, index, cards) => ({
        card,
        timestamp: Date.now() - (cards.length - index) * 1000,
        source: 'other',
      }))
    : [];

  return (
    <div className="fixed inset-0 z-[9000] pointer-events-none">
      <div className="absolute left-4 top-4 z-20 flex flex-col gap-3 pointer-events-auto">
        <TurnIndicator />
        <PhaseControls />
        <GameLog />
      </div>

      <div className="absolute inset-0" style={{ transform: `translateY(-${combinedGroupShiftUpPx}px)` }}>
        {playersWithSeats.map(({ player, playerIndex, edge }) => (
          <PlayerSeatGroups
            key={player.id}
            gameState={gameState}
            player={player}
            playerIndex={playerIndex}
            edge={edge}
            isLocalPlayer={player.id === playerId}
            showSummonHint={player.id === playerId && shouldShowSummonHint}
            onOpenDiscard={(id) => setDiscardViewerPlayerId(id)}
            frozenDiscardTopCard={frozenDiscardTopByPlayerId[player.id]?.card}
          />
        ))}
      </div>

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

      {discardViewerPlayer && (
        <DiscardPileViewer
          entries={discardViewerEntries}
          count={discardViewerPlayer.discardPile.cards.length}
          onClose={() => setDiscardViewerPlayerId(null)}
        />
      )}
    </div>
  );
}



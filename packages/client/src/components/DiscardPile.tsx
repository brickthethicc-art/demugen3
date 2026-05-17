import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../store/game-store.js';
import { Trash2 } from 'lucide-react';
import { DiscardPileViewer } from './DiscardPileViewer.js';
import { CardFront } from './CardFront.js';

const MAX_VISIBLE_STACK_CARDS = 5;
const MAX_PILE_THICKNESS_PX = 18;
const DISCARD_CARD_REVEAL_LEAD_MS = 110;
const DISCARD_CARD_REVEAL_DURATION_MS = 460;

type DiscardPileFlashDetail = {
  startedAt: number;
  durationMs: number;
};

export function DiscardPile() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const [showViewer, setShowViewer] = useState(false);
  const [isTopCardRevealSuppressed, setIsTopCardRevealSuppressed] = useState(false);
  const topCardRef = useRef<HTMLDivElement | null>(null);
  const previousTopCardKeyRef = useRef<string | null>(null);
  const latestDiscardFlashRef = useRef<DiscardPileFlashDetail | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);

  // Get the current player's discard pile
  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const discardPile = myPlayer?.discardPile || { cards: [] };
  const count = discardPile.cards.length;
  const topCard = count > 0 ? discardPile.cards[count - 1] : null;
  const topCardKey = topCard ? `${topCard.id}-${count - 1}` : null;
  const visibleStackCards = useMemo(
    () => discardPile.cards.slice(-MAX_VISIBLE_STACK_CARDS),
    [discardPile.cards]
  );
  const hiddenCardCount = Math.max(0, count - visibleStackCards.length);
  const pileThicknessPx = Math.min(Math.max(count, 1) * 1.35, MAX_PILE_THICKNESS_PX);

  useEffect(() => {
    const handleDiscardPileFlash = (event: Event) => {
      const customEvent = event as CustomEvent<DiscardPileFlashDetail>;
      if (!customEvent.detail) {
        return;
      }
      latestDiscardFlashRef.current = customEvent.detail;
    };

    window.addEventListener('discard-pile-flash', handleDiscardPileFlash as EventListener);

    return () => {
      window.removeEventListener('discard-pile-flash', handleDiscardPileFlash as EventListener);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!topCardRef.current || !topCard || !topCardKey) {
      previousTopCardKeyRef.current = topCardKey;
      setIsTopCardRevealSuppressed(false);
      return;
    }

    if (previousTopCardKeyRef.current === topCardKey) {
      return;
    }

    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    const topCardElement = topCardRef.current;
    const now = performance.now();
    const flashDetail = latestDiscardFlashRef.current;
    const flashEndAt = flashDetail ? flashDetail.startedAt + flashDetail.durationMs : 0;
    const shouldSyncToFlash = Boolean(flashDetail && flashEndAt > now);

    if (shouldSyncToFlash) {
      const revealDelayMs = Math.max(0, flashEndAt - now - DISCARD_CARD_REVEAL_LEAD_MS);
      setIsTopCardRevealSuppressed(true);

      revealTimeoutRef.current = window.setTimeout(() => {
        setIsTopCardRevealSuppressed(false);
        if (typeof topCardElement.animate === 'function') {
          topCardElement.animate(
            [
              { opacity: 0, transform: 'translateY(10px) scale(0.9)', filter: 'brightness(1.18)' },
              { opacity: 0.92, transform: 'translateY(-2px) scale(1.02)', filter: 'brightness(1.08)', offset: 0.6 },
              { opacity: 1, transform: 'translateY(0px) scale(1)', filter: 'brightness(1)' },
            ],
            {
              duration: DISCARD_CARD_REVEAL_DURATION_MS,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }
          );
        }
      }, revealDelayMs);
    } else if (typeof topCardElement.animate === 'function') {
      setIsTopCardRevealSuppressed(false);
      topCardElement.animate(
        [
          { transform: 'translateY(-12px) scale(0.96) rotate(-3deg)', filter: 'brightness(1.12)' },
          { transform: 'translateY(2px) scale(1.01) rotate(1deg)', filter: 'brightness(1.05)' },
          { transform: 'translateY(0px) scale(1) rotate(0deg)', filter: 'brightness(1)' },
        ],
        {
          duration: 380,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }
      );
    }

    previousTopCardKeyRef.current = topCardKey;
  }, [topCard, topCardKey]);

  // Create entries for the viewer (simulate chronological order)
  const entries = discardPile.cards.map((card, index) => ({
    card,
    timestamp: Date.now() - (count - index) * 1000, // Simulate chronological order
    source: 'other' as const,
  }));

  const handleClick = () => {
    if (count > 0) {
      setShowViewer(true);
    }
  };

  return (
    <>
      <div
        data-testid="discard-pile"
        data-discard-pile="desktop"
        onClick={handleClick}
        className={`w-[136px] h-[184px] bg-gray-900 border-2 border-white/10 rounded-lg flex flex-col items-center justify-center relative overflow-hidden transition-all ${
          count > 0 
            ? 'cursor-pointer hover:border-mugen-accent/50 hover:from-red-900/40 hover:to-gray-900' 
            : 'cursor-default'
        }`}
        style={{ perspective: '900px' }}
      >
        {topCard ? (
          <>
            <div
              aria-hidden="true"
              className="absolute left-[8px] right-[8px] bottom-[8px] rounded-md border border-red-950/50 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95"
              style={{
                height: `${Math.max(5, pileThicknessPx)}px`,
                boxShadow: '0 10px 18px rgba(0, 0, 0, 0.45)',
              }}
            />

            {visibleStackCards.map((card, index) => {
              const depth = visibleStackCards.length - 1 - index;
              const lateralOffset = (index % 2 === 0 ? -1 : 1) * Math.min(depth, 3) * 0.55;
              const yOffset = depth * 1.9;
              const rotation = (index % 2 === 0 ? -1 : 1) * Math.min(depth, 2) * 0.8;
              const isTopCard = depth === 0;

              return (
                <div
                  key={`${card.id}-${index}`}
                  ref={isTopCard ? topCardRef : undefined}
                  className="absolute inset-[6px] rounded-md border border-white/15 overflow-hidden"
                  style={{
                    zIndex: 20 + index,
                    transform: `translate3d(${lateralOffset}px, ${yOffset}px, ${depth * -1}px) rotate(${rotation}deg) ${isTopCard && isTopCardRevealSuppressed ? 'scale(0.9)' : 'scale(1)'}`,
                    opacity: isTopCard
                      ? (isTopCardRevealSuppressed ? 0 : 1)
                      : Math.max(0.74, 0.96 - depth * 0.08),
                    transition: isTopCard ? 'opacity 120ms ease, transform 120ms ease' : undefined,
                    boxShadow: isTopCard
                      ? '0 10px 16px rgba(0, 0, 0, 0.5)'
                      : '0 5px 11px rgba(0, 0, 0, 0.35)',
                  }}
                >
                  <CardFront card={card} width={124} height={172} />
                </div>
              );
            })}

            <div className="absolute right-2 top-2 z-40 min-w-[28px] rounded-full bg-black/75 border border-white/20 px-2 py-0.5 text-center text-xs font-bold text-white">
              {count}
            </div>
            <div className="absolute left-2 bottom-2 z-40 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-gray-200">
              Graveyard
            </div>
            {hiddenCardCount > 0 && (
              <div className="absolute right-2 bottom-2 z-40 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-gray-300">
                +{hiddenCardCount}
              </div>
            )}
          </>
        ) : (
          <div className="relative z-10 flex flex-col items-center text-center px-1">
            <Trash2 size={32} className="text-gray-600 mb-2" />
            <span className="text-gray-500 text-2xl font-bold">{count}</span>
            <span className="text-gray-400 text-xs mt-1">Graveyard</span>
          </div>
        )}
      </div>

      {showViewer && (
        <DiscardPileViewer
          entries={entries}
          count={count}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
}

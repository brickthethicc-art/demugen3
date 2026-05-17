import type { CSSProperties } from 'react';
import { MAX_DECK_SIZE } from '@mugen/shared';
import { useGameStore } from '../store/game-store.js';
import { getCardBackStyle } from '../utils/card-back-style.js';

export function MainDeckPile() {
  const mainDeck = useGameStore((state) => state.mainDeck);
  const count = mainDeck.length;
  const deckDepth = Math.max(0, Math.min(18, Math.round((count / Math.max(1, MAX_DECK_SIZE)) * 18)));
  const layerCount = count === 0 ? 1 : Math.max(2, Math.min(6, Math.ceil(deckDepth / 4) + 1));
  const topLayerOffset = layerCount > 1 ? deckDepth / (layerCount - 1) : 0;

  const portalBackStyle: CSSProperties = {
    ...getCardBackStyle(),
    boxShadow: '0 6px 16px rgba(2, 6, 23, 0.65)',
  };

  return (
    <div
      data-deck="main"
      data-testid="main-deck-pile"
      className="relative w-[136px] h-[184px]"
    >
      {Array.from({ length: layerCount }).map((_, layerIndex) => {
        const offset = Math.round(layerIndex * topLayerOffset);
        const isTop = layerIndex === layerCount - 1;

        return (
          <div
            key={`deck-layer-${layerIndex}`}
            className="absolute inset-0 rounded-lg border border-white/15 overflow-hidden transition-all duration-300"
            style={{
              ...portalBackStyle,
              transform: `translate(${-offset * 0.28}px, ${offset * 0.52}px)`,
              opacity: isTop ? 1 : Math.max(0.5, 0.9 - layerIndex * 0.08),
              zIndex: layerIndex + 1,
            }}
          >
            <div className="absolute inset-0 bg-black/5" />
          </div>
        );
      })}

      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/55 shadow-[0_0_14px_rgba(56,189,248,0.35)]">
          <span className="text-white text-2xl font-bold tabular-nums">{count}</span>
        </div>
      </div>

      {count === 0 && (
        <div className="absolute inset-x-0 bottom-2 z-20 text-center text-[10px] font-semibold tracking-wide text-cyan-200/80">
          EMPTY
        </div>
      )}
      {count > 0 && (
        <div className="absolute inset-x-0 bottom-2 z-20 text-center text-[10px] font-semibold tracking-wide text-cyan-200/90">
          MAIN DECK
        </div>
      )}
    </div>
  );
}

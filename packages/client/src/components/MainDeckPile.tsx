import type { CSSProperties } from 'react';
import { MAX_DECK_SIZE } from '@mugen/shared';
import { useGameStore } from '../store/game-store.js';

export function MainDeckPile() {
  const mainDeck = useGameStore((state) => state.mainDeck);
  const count = mainDeck.length;
  const deckDepth = Math.max(0, Math.min(18, Math.round((count / Math.max(1, MAX_DECK_SIZE)) * 18)));
  const layerCount = count === 0 ? 1 : Math.max(2, Math.min(6, Math.ceil(deckDepth / 4) + 1));
  const topLayerOffset = layerCount > 1 ? deckDepth / (layerCount - 1) : 0;

  const portalBackStyle: CSSProperties = {
    background:
      'radial-gradient(circle at 50% 48%, rgba(125, 211, 252, 0.42) 0%, rgba(74, 144, 226, 0.22) 22%, rgba(22, 33, 62, 0.95) 62%, rgba(8, 12, 28, 1) 100%)',
    boxShadow:
      'inset 0 0 0 2px rgba(148, 197, 255, 0.35), inset 0 0 22px rgba(56, 189, 248, 0.24), 0 6px 16px rgba(2, 6, 23, 0.65)',
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
            <div className="absolute inset-[9%] rounded-full border border-sky-300/45" />
            <div className="absolute inset-[22%] rounded-full border border-sky-200/35" />
            <div className="absolute inset-[32%] rounded-full border border-cyan-200/50" />
            <div className="absolute left-1/2 top-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/10 blur-[2px]" />
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

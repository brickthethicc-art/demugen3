import { useEffect, useRef } from 'react';
import type { Card } from '@mugen/shared';
import { isHiddenCardId } from '@mugen/shared';
import { CardFront } from './CardFront.js';
import { getCardBackStyle } from '../utils/card-back-style.js';

interface DiscardPileEntry {
  card: Card;
  timestamp: number;
  source: 'unit_death' | 'sorcery_played' | 'other';
  unitInstance?: any;
}

interface DiscardPileViewerProps {
  entries: DiscardPileEntry[];
  onClose: () => void;
  count: number;
}

export function DiscardPileViewer({ entries, onClose, count }: DiscardPileViewerProps) {
  // Sort by timestamp (newest first) for chronological order
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle wheel events for horizontal scrolling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Convert vertical scroll to horizontal scroll
      scrollContainer.scrollLeft += e.deltaY;
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-mugen-surface border border-white/10 rounded-lg shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="text-xl font-semibold text-white">Graveyard</div>
            <div className="bg-mugen-bg px-3 py-1 rounded-full text-sm text-gray-300">
              {count} cards
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Close
          </button>
        </div>

        {/* Horizontal Scrollable Cards */}
        <div className="p-4">
          {sortedEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-lg">No cards in graveyard</div>
            </div>
          ) : (
            <div ref={scrollContainerRef} className="flex gap-2 overflow-x-auto pb-2">
              {sortedEntries.map((entry) => {
                return (
                  <div
                    key={`${entry.card.id}-${entry.timestamp}`}
                    className="group relative flex-shrink-0 cursor-pointer"
                  >
                    {isHiddenCardId(entry.card.id) ? (
                      <div
                        className="h-[184px] w-[136px] rounded-md border border-white/15 transition-all group-hover:brightness-110"
                        style={getCardBackStyle()}
                      />
                    ) : (
                      <CardFront
                        card={entry.card}
                        width={136}
                        height={184}
                        className="transition-all group-hover:brightness-110"
                      />
                    )}

                    <div className="pointer-events-none absolute bottom-2 left-2 right-2">
                      <div className="rounded bg-black/65 px-2 py-1 text-center text-[10px] text-gray-200">
                        {entry.source === 'unit_death' ? 'Unit Death' :
                          entry.source === 'sorcery_played' ? 'Sorcery Played' : 'Other'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>Scroll horizontally to see all cards</div>
            <div>
              {`Units: ${entries.filter(e => e.card.cardType === 'UNIT').length} | Sorceries: ${entries.filter(e => e.card.cardType === 'SORCERY').length}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

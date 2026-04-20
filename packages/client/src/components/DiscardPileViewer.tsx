import { useEffect, useRef } from 'react';
import type { Card } from '@mugen/shared';

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
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
              {sortedEntries.map((entry) => (
                <div
                  key={`${entry.card.id}-${entry.timestamp}`}
                  className="flex-shrink-0 w-[136px] h-[184px] bg-mugen-bg border border-white/10 rounded-lg p-3 cursor-pointer hover:border-mugen-accent/50 transition-colors relative"
                >
                  {/* Card Type Indicator */}
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${entry.card.cardType === 'UNIT' 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}>
                    {entry.card.cardType === 'UNIT' ? 'U' : 'S'}
                  </div>
                  
                  {/* Card Content - Same as hand styling */}
                  <div className="text-white font-semibold text-sm truncate pr-8">
                    {entry.card.name}
                  </div>
                  <div className="flex flex-col text-xs text-gray-300 mt-1">
                    {entry.card.cardType === 'UNIT' ? (
                      <>
                        <span>HP: {(entry.card as any).hp}</span>
                        <span>ATK: {(entry.card as any).atk}</span>
                        <span>Cost: {entry.card.cost}</span>
                      </>
                    ) : (
                      <span>Cost: {entry.card.cost}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 truncate">
                    {entry.card.cardType === 'UNIT' ? (entry.card as any).ability?.name : (entry.card as any).effect}
                  </div>

                  {/* Graveyard-specific info */}
                  <div className="absolute bottom-2 left-3 right-3">
                    <div className="text-xs text-gray-500 truncate">
                      {entry.source === 'unit_death' ? 'Unit Death' : 
                       entry.source === 'sorcery_played' ? 'Sorcery Played' : 'Other'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>Scroll horizontally to see all cards</div>
            <div>
              Units: {entries.filter(e => e.card.cardType === 'UNIT').length} | 
              Sorceries: {entries.filter(e => e.card.cardType === 'SORCERY').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

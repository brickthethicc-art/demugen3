import { useState } from 'react';
import { useDeckStore } from '../../store/deck-store.js';
import { validateDeck, getDeckStats } from '../../logic/deck-logic.js';
import { saveDeck, loadAllDecks, deleteDeck } from '../../logic/deck-storage.js';
import { MAX_DECK_SIZE } from '@mugen/shared';
import { CardItem } from './CardItem.js';
import { Save, Trash2, FolderOpen, Check, AlertCircle } from 'lucide-react';

export function DeckPanel() {
  const currentDeck = useDeckStore((s) => s.currentDeck);
  const deckName = useDeckStore((s) => s.deckName);
  const activeSlot = useDeckStore((s) => s.activeSlot);
  const setDeckName = useDeckStore((s) => s.setDeckName);
  const setActiveSlot = useDeckStore((s) => s.setActiveSlot);
  const removeCardFromDeck = useDeckStore((s) => s.removeCardFromDeck);
  const loadDeckIntoBuilder = useDeckStore((s) => s.loadDeckIntoBuilder);
  const clearDeck = useDeckStore((s) => s.clearDeck);

  const [showSlots, setShowSlots] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const validation = validateDeck(currentDeck);
  const stats = getDeckStats(currentDeck);

  const handleSave = () => {
    if (!validation.valid) {
      setSaveError('Deck must have exactly 16 cards to save');
      return;
    }
    const name = deckName.trim() || 'Unnamed Deck';
    const slot = activeSlot ?? 0;
    saveDeck(slot, name, currentDeck);
    setDeckName(name);
    setActiveSlot(slot);
    setSaveError(null);
  };

  const handleLoad = (slot: number) => {
    const decks = loadAllDecks();
    const deck = decks[slot];
    if (deck) {
      loadDeckIntoBuilder(deck.name, slot, deck.cards);
    }
    setShowSlots(false);
    setSaveError(null);
  };

  const handleDelete = (slot: number) => {
    deleteDeck(slot);
    if (activeSlot === slot) {
      clearDeck();
    }
    setShowSlots(false);
  };

  const savedDecks = loadAllDecks();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Deck name..."
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          className="w-full px-3 py-2 bg-mugen-bg border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-mugen-accent transition"
        />
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className={`font-mono ${currentDeck.length === MAX_DECK_SIZE ? 'text-mugen-success' : 'text-gray-400'}`}>
          {currentDeck.length}/{MAX_DECK_SIZE}
        </span>
        {stats.totalCards > 0 && (
          <>
            <span className="text-gray-500">Avg: {stats.averageCost.toFixed(1)}</span>
            <span className="text-mugen-accent">{stats.unitCount}U</span>
            <span className="text-mugen-gold">{stats.sorceryCount}S</span>
          </>
        )}
        {validation.valid ? (
          <span className="flex items-center gap-1 text-mugen-success"><Check size={12} /> Valid</span>
        ) : (
          <span className="flex items-center gap-1 text-gray-500"><AlertCircle size={12} /> {currentDeck.length}/{MAX_DECK_SIZE}</span>
        )}
      </div>

      {/* Cost curve */}
      {stats.totalCards > 0 && (
        <div className="flex items-end gap-0.5 h-8 mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((cost) => {
            const count = stats.costCurve[cost] ?? 0;
            const maxCount = Math.max(...Object.values(stats.costCurve), 1);
            const height = count > 0 ? Math.max(20, (count / maxCount) * 100) : 0;
            return (
              <div key={cost} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full bg-mugen-accent/40 rounded-t"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[9px] text-gray-500">{cost}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleSave}
          disabled={!validation.valid}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-mugen-accent hover:bg-mugen-accent/80 disabled:opacity-40 rounded-lg text-xs font-medium transition"
        >
          <Save size={12} /> Save
        </button>
        <button
          onClick={() => setShowSlots(!showSlots)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-mugen-surface border border-white/10 hover:border-mugen-accent/50 rounded-lg text-xs font-medium transition"
        >
          <FolderOpen size={12} /> Load
        </button>
        <button
          onClick={clearDeck}
          className="px-3 py-2 bg-mugen-surface border border-white/10 hover:border-mugen-danger/50 rounded-lg text-xs transition"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {saveError && (
        <p className="text-mugen-danger text-xs mb-2">{saveError}</p>
      )}

      {/* Slot picker */}
      {showSlots && (
        <div className="mb-3 space-y-1">
          {savedDecks.map((deck, i) => (
            <div key={i} className="flex items-center gap-2 bg-mugen-bg rounded-lg px-3 py-2 border border-white/5">
              <span className="text-xs text-gray-500 font-mono w-4">{i + 1}</span>
              {deck ? (
                <>
                  <span className="flex-1 text-sm text-white truncate">{deck.name}</span>
                  <span className="text-xs text-gray-500">{deck.cards.length} cards</span>
                  <button
                    onClick={() => handleLoad(i)}
                    className="text-xs text-mugen-accent hover:text-white transition"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDelete(i)}
                    className="text-xs text-mugen-danger hover:text-white transition"
                  >
                    Del
                  </button>
                </>
              ) : (
                <span className="flex-1 text-sm text-gray-600 italic">Empty</span>
              )}
            </div>
          ))}

          {activeSlot == null && (
            <div className="text-xs text-gray-500 mt-1">
              Saving will use slot {1}. Load a slot first to save to a different slot.
            </div>
          )}
        </div>
      )}

      {/* Deck cards */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
        {currentDeck.map((card, index) => (
          <CardItem
            key={`${card.id}-${index}`}
            card={card}
            onClick={() => removeCardFromDeck(index)}
            mode="remove"
          />
        ))}
        {currentDeck.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">Add cards from the browser</p>
        )}
      </div>
    </div>
  );
}

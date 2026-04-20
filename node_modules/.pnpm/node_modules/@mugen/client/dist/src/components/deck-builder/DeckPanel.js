import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    const [saveError, setSaveError] = useState(null);
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
    const handleLoad = (slot) => {
        const decks = loadAllDecks();
        const deck = decks[slot];
        if (deck) {
            loadDeckIntoBuilder(deck.name, slot, deck.cards);
        }
        setShowSlots(false);
        setSaveError(null);
    };
    const handleDelete = (slot) => {
        deleteDeck(slot);
        if (activeSlot === slot) {
            clearDeck();
        }
        setShowSlots(false);
    };
    const savedDecks = loadAllDecks();
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsx("div", { className: "mb-3", children: _jsx("input", { type: "text", placeholder: "Deck name...", value: deckName, onChange: (e) => setDeckName(e.target.value), className: "w-full px-3 py-2 bg-mugen-bg border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-mugen-accent transition" }) }), _jsxs("div", { className: "flex items-center justify-between mb-3 text-xs", children: [_jsxs("span", { className: `font-mono ${currentDeck.length === MAX_DECK_SIZE ? 'text-mugen-success' : 'text-gray-400'}`, children: [currentDeck.length, "/", MAX_DECK_SIZE] }), stats.totalCards > 0 && (_jsxs(_Fragment, { children: [_jsxs("span", { className: "text-gray-500", children: ["Avg: ", stats.averageCost.toFixed(1)] }), _jsxs("span", { className: "text-mugen-accent", children: [stats.unitCount, "U"] }), _jsxs("span", { className: "text-mugen-gold", children: [stats.sorceryCount, "S"] })] })), validation.valid ? (_jsxs("span", { className: "flex items-center gap-1 text-mugen-success", children: [_jsx(Check, { size: 12 }), " Valid"] })) : (_jsxs("span", { className: "flex items-center gap-1 text-gray-500", children: [_jsx(AlertCircle, { size: 12 }), " ", currentDeck.length, "/", MAX_DECK_SIZE] }))] }), stats.totalCards > 0 && (_jsx("div", { className: "flex items-end gap-0.5 h-8 mb-3", children: [1, 2, 3, 4, 5, 6, 7, 8].map((cost) => {
                    const count = stats.costCurve[cost] ?? 0;
                    const maxCount = Math.max(...Object.values(stats.costCurve), 1);
                    const height = count > 0 ? Math.max(20, (count / maxCount) * 100) : 0;
                    return (_jsxs("div", { className: "flex-1 flex flex-col items-center gap-0.5", children: [_jsx("div", { className: "w-full bg-mugen-accent/40 rounded-t", style: { height: `${height}%` } }), _jsx("span", { className: "text-[9px] text-gray-500", children: cost })] }, cost));
                }) })), _jsxs("div", { className: "flex gap-2 mb-3", children: [_jsxs("button", { onClick: handleSave, disabled: !validation.valid, className: "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-mugen-accent hover:bg-mugen-accent/80 disabled:opacity-40 rounded-lg text-xs font-medium transition", children: [_jsx(Save, { size: 12 }), " Save"] }), _jsxs("button", { onClick: () => setShowSlots(!showSlots), className: "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-mugen-surface border border-white/10 hover:border-mugen-accent/50 rounded-lg text-xs font-medium transition", children: [_jsx(FolderOpen, { size: 12 }), " Load"] }), _jsx("button", { onClick: clearDeck, className: "px-3 py-2 bg-mugen-surface border border-white/10 hover:border-mugen-danger/50 rounded-lg text-xs transition", children: _jsx(Trash2, { size: 12 }) })] }), saveError && (_jsx("p", { className: "text-mugen-danger text-xs mb-2", children: saveError })), showSlots && (_jsxs("div", { className: "mb-3 space-y-1", children: [savedDecks.map((deck, i) => (_jsxs("div", { className: "flex items-center gap-2 bg-mugen-bg rounded-lg px-3 py-2 border border-white/5", children: [_jsx("span", { className: "text-xs text-gray-500 font-mono w-4", children: i + 1 }), deck ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "flex-1 text-sm text-white truncate", children: deck.name }), _jsxs("span", { className: "text-xs text-gray-500", children: [deck.cards.length, " cards"] }), _jsx("button", { onClick: () => handleLoad(i), className: "text-xs text-mugen-accent hover:text-white transition", children: "Load" }), _jsx("button", { onClick: () => handleDelete(i), className: "text-xs text-mugen-danger hover:text-white transition", children: "Del" })] })) : (_jsx("span", { className: "flex-1 text-sm text-gray-600 italic", children: "Empty" }))] }, i))), activeSlot == null && (_jsxs("div", { className: "text-xs text-gray-500 mt-1", children: ["Saving will use slot ", 1, ". Load a slot first to save to a different slot."] }))] })), _jsxs("div", { className: "flex-1 overflow-y-auto space-y-1 pr-1 min-h-0", children: [currentDeck.map((card, index) => (_jsx(CardItem, { card: card, onClick: () => removeCardFromDeck(index), mode: "remove" }, `${card.id}-${index}`))), currentDeck.length === 0 && (_jsx("p", { className: "text-gray-500 text-sm text-center py-8", children: "Add cards from the browser" }))] })] }));
}
//# sourceMappingURL=DeckPanel.js.map
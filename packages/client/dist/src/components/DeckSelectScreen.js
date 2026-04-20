import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useGameStore } from '../store/game-store.js';
import { loadAllDecks } from '../logic/deck-storage.js';
import { getDeckStats } from '../logic/deck-logic.js';
import { ArrowLeft, Layers, Swords, Sparkles } from 'lucide-react';
export function DeckSelectScreen() {
    const setScreen = useGameStore((s) => s.setScreen);
    const setSelectedDeck = useGameStore((s) => s.setSelectedDeck);
    const savedDecks = useMemo(() => {
        const decks = loadAllDecks();
        console.log('=== DEBUG: DeckSelectScreen ===');
        console.log('Loaded decks:', decks);
        console.log('Deck details:', decks.map((d, i) => d ? { slot: i, name: d.name, cardCount: d.cards.length } : { slot: i, name: null, cardCount: 0 }));
        return decks;
    }, []);
    const hasSavedDecks = savedDecks.some((d) => d !== null);
    const handleSelectDeck = (slot) => {
        console.log(`=== DEBUG: handleSelectDeck slot ${slot} ===`);
        const deck = savedDecks[slot];
        console.log('Selected deck:', deck);
        if (!deck) {
            console.log('No deck in slot', slot);
            return;
        }
        console.log('Setting deck with', deck.cards.length, 'cards');
        setSelectedDeck(deck.cards);
        setScreen('lobby');
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-mugen-bg", children: _jsxs("div", { className: "bg-mugen-surface rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-white/5", children: [_jsx("h2", { className: "text-2xl font-bold mb-1 text-center bg-gradient-to-r from-mugen-accent to-mugen-mana bg-clip-text text-transparent", children: "Select a Deck" }), _jsx("p", { className: "text-gray-400 text-center mb-6 text-sm", children: "Choose a deck to enter battle" }), hasSavedDecks ? (_jsx("div", { className: "space-y-2 mb-6", children: savedDecks.map((deck, i) => {
                        if (!deck)
                            return null;
                        const stats = getDeckStats(deck.cards);
                        return (_jsxs("button", { onClick: () => handleSelectDeck(i), className: "w-full flex items-center gap-3 px-4 py-3 bg-mugen-bg rounded-lg border border-white/10 hover:border-mugen-accent/50 hover:bg-mugen-accent/5 transition text-left", children: [_jsx("div", { className: "w-8 h-8 flex items-center justify-center rounded-lg bg-mugen-accent/20 text-mugen-accent font-mono text-sm", children: i + 1 }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-white truncate", children: deck.name }), _jsxs("div", { className: "flex items-center gap-3 text-xs text-gray-400 mt-0.5", children: [_jsxs("span", { children: [stats.totalCards, " cards"] }), _jsxs("span", { className: "flex items-center gap-0.5", children: [_jsx(Swords, { size: 10 }), " ", stats.unitCount, "U"] }), _jsxs("span", { className: "flex items-center gap-0.5", children: [_jsx(Sparkles, { size: 10 }), " ", stats.sorceryCount, "S"] }), _jsxs("span", { children: ["Avg: ", stats.averageCost.toFixed(1)] })] })] })] }, i));
                    }) })) : (_jsxs("div", { className: "text-center py-8 mb-6", children: [_jsx("p", { className: "text-gray-500 mb-2", children: "No saved decks" }), _jsx("p", { className: "text-gray-600 text-sm", children: "Build a deck first to play" })] })), _jsxs("div", { className: "space-y-3", children: [_jsxs("button", { onClick: () => setScreen('deck-builder'), className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-mugen-surface border border-white/10 hover:border-mugen-accent/50 rounded-lg font-medium transition", children: [_jsx(Layers, { size: 16 }), " Build New Deck"] }), _jsxs("button", { onClick: () => setScreen('main-menu'), className: "w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm transition", children: [_jsx(ArrowLeft, { size: 14 }), " Back"] })] })] }) }));
}
//# sourceMappingURL=DeckSelectScreen.js.map
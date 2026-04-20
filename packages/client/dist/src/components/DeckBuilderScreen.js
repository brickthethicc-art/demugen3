import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useGameStore } from '../store/game-store.js';
import { useDeckStore } from '../store/deck-store.js';
import { CardBrowser } from './deck-builder/CardBrowser.js';
import { DeckPanel } from './deck-builder/DeckPanel.js';
import { ArrowLeft } from 'lucide-react';
export function DeckBuilderScreen() {
    const setScreen = useGameStore((s) => s.setScreen);
    const resetDeckBuilder = useDeckStore((s) => s.resetDeckBuilder);
    useEffect(() => {
        return () => {
            resetDeckBuilder();
        };
    }, [resetDeckBuilder]);
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-mugen-bg text-white", children: [_jsxs("div", { className: "flex items-center gap-4 px-6 py-3 border-b border-white/5", children: [_jsxs("button", { onClick: () => setScreen('main-menu'), className: "flex items-center gap-2 text-gray-400 hover:text-white text-sm transition", children: [_jsx(ArrowLeft, { size: 16 }), " Back"] }), _jsx("h1", { className: "text-lg font-bold bg-gradient-to-r from-mugen-accent to-mugen-mana bg-clip-text text-transparent", children: "Deck Builder" })] }), _jsxs("div", { className: "flex-1 flex min-h-0", children: [_jsxs("div", { className: "w-1/2 border-r border-white/5 p-4 flex flex-col min-h-0", children: [_jsx("h2", { className: "text-sm font-semibold text-gray-400 mb-3", children: "Card Browser" }), _jsx(CardBrowser, {})] }), _jsxs("div", { className: "w-1/2 p-4 flex flex-col min-h-0", children: [_jsx("h2", { className: "text-sm font-semibold text-gray-400 mb-3", children: "Your Deck" }), _jsx(DeckPanel, {})] })] })] }));
}
//# sourceMappingURL=DeckBuilderScreen.js.map
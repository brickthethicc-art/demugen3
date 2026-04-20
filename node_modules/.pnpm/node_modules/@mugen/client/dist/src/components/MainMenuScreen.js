import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useGameStore } from '../store/game-store.js';
import { Play, Layers, BookOpen, Bug } from 'lucide-react';
export function MainMenuScreen() {
    const setScreen = useGameStore((s) => s.setScreen);
    const handleCreateTestDeck = () => {
        import('../logic/test-deck.js').then(({ saveTestDeck }) => {
            saveTestDeck();
            console.log('Test deck created! Check the deck selection screen.');
        });
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-mugen-bg", children: _jsxs("div", { className: "bg-mugen-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/5", children: [_jsx("h1", { className: "text-5xl font-bold text-center mb-2 bg-gradient-to-r from-mugen-accent to-mugen-mana bg-clip-text text-transparent", children: "MUGEN" }), _jsx("p", { className: "text-gray-400 text-center mb-10 text-sm", children: "Strategy Card Game" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("button", { onClick: () => setScreen('deck-select'), className: "w-full flex items-center justify-center gap-3 px-4 py-4 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg font-semibold text-lg transition", children: [_jsx(Play, { size: 20 }), " Play"] }), _jsxs("button", { onClick: () => setScreen('deck-builder'), className: "w-full flex items-center justify-center gap-3 px-4 py-3 bg-mugen-surface border border-white/10 hover:border-mugen-accent/50 rounded-lg font-medium transition", children: [_jsx(Layers, { size: 18 }), " Deck Builder"] }), _jsxs("button", { onClick: () => setScreen('card-library'), className: "w-full flex items-center justify-center gap-3 px-4 py-3 bg-mugen-surface border border-white/10 hover:border-mugen-accent/50 rounded-lg font-medium transition", children: [_jsx(BookOpen, { size: 18 }), " Card Library"] }), _jsxs("button", { onClick: handleCreateTestDeck, className: "w-full flex items-center justify-center gap-3 px-4 py-2 bg-mugen-surface border border-red-500/30 hover:border-red-500/50 rounded-lg font-medium transition text-red-400 text-sm", children: [_jsx(Bug, { size: 16 }), " Create Test Deck"] })] })] }) }));
}
//# sourceMappingURL=MainMenuScreen.js.map
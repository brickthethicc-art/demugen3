import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useGameStore } from '../store/game-store.js';
import { Trophy, RotateCcw } from 'lucide-react';
export function GameOverScreen() {
    const gameState = useGameStore((s) => s.gameState);
    const playerId = useGameStore((s) => s.playerId);
    const reset = useGameStore((s) => s.reset);
    if (!gameState)
        return null;
    const winner = gameState.players.find((p) => p.id === gameState.winnerId);
    const isWinner = winner?.id === playerId;
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-mugen-bg", children: _jsxs("div", { className: "bg-mugen-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/5 text-center", children: [_jsx(Trophy, { size: 64, className: `mx-auto mb-4 ${isWinner ? 'text-mugen-gold' : 'text-gray-500'}` }), _jsx("h2", { className: "text-3xl font-bold mb-2", children: isWinner ? 'Victory!' : 'Defeat' }), _jsx("p", { className: "text-gray-400 mb-6", children: winner ? `${winner.name} wins!` : 'Game Over' }), _jsx("div", { className: "space-y-3 mb-8", children: gameState.players.map((p) => (_jsxs("div", { className: `flex items-center justify-between px-4 py-3 rounded-lg border ${p.id === winner?.id
                            ? 'border-mugen-gold/50 bg-mugen-gold/5'
                            : 'border-white/5 bg-mugen-bg'}`, children: [_jsx("span", { className: "font-medium", children: p.name }), _jsx("span", { className: `text-sm ${p.isEliminated ? 'text-mugen-danger' : 'text-mugen-success'}`, children: p.isEliminated ? 'Eliminated' : `${p.life} HP` })] }, p.id))) }), _jsxs("button", { onClick: reset, className: "flex items-center justify-center gap-2 w-full px-4 py-3 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg font-medium transition", children: [_jsx(RotateCcw, { size: 18 }), " Return to Lobby"] })] }) }));
}
//# sourceMappingURL=GameOverScreen.js.map
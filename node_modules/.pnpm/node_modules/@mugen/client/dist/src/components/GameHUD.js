import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useGameStore } from '../store/game-store.js';
import { useGameActions } from '../hooks/useGameActions.js';
import { useCardHover } from '../hooks/useUnitHover.js';
import { TurnPhase } from '@mugen/shared';
import { Heart, Zap, ArrowRight, SkipForward } from 'lucide-react';
const PHASE_LABELS = {
    [TurnPhase.STANDBY]: 'Standby Phase',
    [TurnPhase.MOVE]: 'Move Phase',
    [TurnPhase.ABILITY]: 'Ability Phase',
    [TurnPhase.ATTACK]: 'Attack Phase',
    [TurnPhase.END]: 'End Phase',
};
function HandDisplay() {
    const gameState = useGameStore((s) => s.gameState);
    const playerId = useGameStore((s) => s.playerId);
    const myPlayer = gameState?.players.find((p) => p.id === playerId);
    const { handleMouseEnter, handleMouseLeave } = useCardHover();
    if (!myPlayer || myPlayer.hand.cards.length === 0) {
        return (_jsx("div", { className: "text-gray-500 text-sm italic p-2", children: "No cards in hand" }));
    }
    return (_jsx("div", { className: "flex gap-2 overflow-x-auto pb-2", children: myPlayer.hand.cards.map((card) => (_jsxs("div", { className: "flex-shrink-0 w-[136px] h-[184px] bg-mugen-bg border border-white/10 rounded-lg p-3 cursor-pointer hover:border-mugen-accent/50 transition-colors", onMouseEnter: () => handleMouseEnter(card), onMouseLeave: handleMouseLeave, children: [_jsx("div", { className: "text-white font-semibold text-sm truncate", children: card.name }), _jsx("div", { className: "flex flex-col text-xs text-gray-300 mt-1", children: card.cardType === 'UNIT' ? (_jsxs(_Fragment, { children: [_jsxs("span", { children: ["HP: ", card.hp] }), _jsxs("span", { children: ["ATK: ", card.atk] }), _jsxs("span", { children: ["Cost: ", card.cost] })] })) : (_jsxs("span", { children: ["Cost: ", card.cost] })) }), _jsx("div", { className: "text-xs text-gray-400 mt-1 truncate", children: card.cardType === 'UNIT' ? card.ability?.name : card.effect })] }, card.id))) }));
}
function LifeCounter() {
    const gameState = useGameStore((s) => s.gameState);
    const playerId = useGameStore((s) => s.playerId);
    const myPlayer = gameState?.players.find((p) => p.id === playerId);
    const life = myPlayer?.life ?? 0;
    const maxLife = myPlayer?.maxLife ?? 24;
    const pct = maxLife > 0 ? (life / maxLife) * 100 : 0;
    return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Heart, { size: 20, className: life <= 5 ? 'text-mugen-danger animate-pulse' : 'text-mugen-danger' }), _jsx("div", { className: "flex-1", children: _jsx("div", { className: "h-2 bg-mugen-bg rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all duration-500 ${pct > 50 ? 'bg-mugen-success' : pct > 25 ? 'bg-mugen-gold' : 'bg-mugen-danger'}`, style: { width: `${pct}%` } }) }) }), _jsx("span", { className: "text-sm font-mono font-bold", children: life })] }));
}
function TurnIndicator() {
    const gameState = useGameStore((s) => s.gameState);
    const { isMyTurn } = useGameActions();
    if (!gameState)
        return null;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const phase = PHASE_LABELS[gameState.turnPhase] ?? gameState.turnPhase;
    return (_jsx("div", { className: `rounded-lg px-4 py-2 text-sm font-medium ${isMyTurn ? 'bg-mugen-accent/20 text-mugen-accent border border-mugen-accent/30' : 'bg-mugen-bg text-gray-400 border border-white/5'}`, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Zap, { size: 14 }), _jsx("span", { children: isMyTurn ? 'Your Turn' : `${currentPlayer?.name}'s Turn` }), _jsxs("span", { className: "text-xs opacity-60", children: ["\u2022 ", phase] })] }) }));
}
function PlayerList() {
    const gameState = useGameStore((s) => s.gameState);
    const playerId = useGameStore((s) => s.playerId);
    if (!gameState)
        return null;
    // Map player colors to CSS colors
    const colorMap = {
        red: '#ef4444',
        blue: '#6366f1',
        yellow: '#f59e0b',
        green: '#22c55e',
    };
    // Get player color from their first active unit, or default to blue
    const getPlayerColor = (player) => {
        const firstUnit = player.team.activeUnits[0];
        if (firstUnit && firstUnit.color && colorMap[firstUnit.color]) {
            return colorMap[firstUnit.color];
        }
        return colorMap.blue; // default color
    };
    return (_jsxs("div", { className: "bg-mugen-surface/50 rounded-lg border border-white/10 p-3 mt-2", children: [_jsx("div", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2", children: "Players" }), _jsx("div", { className: "space-y-2", children: gameState.players.map((player) => {
                    const playerColor = getPlayerColor(player);
                    const isCurrentPlayer = player.id === playerId;
                    const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === player.id;
                    return (_jsxs("div", { className: `flex items-center justify-between p-2 rounded border transition-all ${isCurrentTurn
                            ? 'border-mugen-accent/50 bg-mugen-accent/10'
                            : 'border-white/5 bg-mugen-surface/30'}`, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full border-2 border-white/30", style: { backgroundColor: playerColor } }), _jsxs("span", { className: "font-medium text-sm", style: { color: playerColor }, children: [player.name, isCurrentPlayer && _jsx("span", { className: "text-xs text-gray-400 ml-1", children: "(You)" })] }), isCurrentTurn && (_jsx("div", { className: "w-2 h-2 bg-mugen-accent rounded-full animate-pulse" }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Heart, { size: 12, className: "text-mugen-danger" }), _jsx("span", { className: "text-sm font-mono font-bold text-white", children: player.life }), player.isEliminated && (_jsx("span", { className: "text-xs text-red-400 line-through ml-1", children: "Eliminated" }))] })] }, player.id));
                }) })] }));
}
function PhaseControls() {
    const { isMyTurn, sendAdvancePhase, sendEndTurn } = useGameActions();
    const gameState = useGameStore((s) => s.gameState);
    const handLimitModalOpen = useGameStore((s) => s.handLimitModalOpen);
    const standbyModalOpen = useGameStore((s) => s.standbyModalOpen);
    if (!gameState || !isMyTurn)
        return null;
    const controlsDisabled = handLimitModalOpen || standbyModalOpen;
    return (_jsxs("div", { className: "flex gap-2", children: [gameState.turnPhase !== TurnPhase.END && (_jsxs("button", { onClick: sendAdvancePhase, disabled: controlsDisabled, className: `flex items-center gap-1.5 px-4 py-2 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg text-sm font-medium transition ${controlsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`, children: [_jsx(ArrowRight, { size: 14 }), " Next Phase"] })), _jsxs("button", { onClick: sendEndTurn, disabled: controlsDisabled, className: `flex items-center gap-1.5 px-4 py-2 bg-mugen-gold hover:bg-mugen-gold/80 text-black rounded-lg text-sm font-bold transition ${controlsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`, children: [_jsx(SkipForward, { size: 14 }), " End Turn"] })] }));
}
export function GameHUD() {
    const gameState = useGameStore((s) => s.gameState);
    const playerId = useGameStore((s) => s.playerId);
    const error = useGameStore((s) => s.error);
    const clearError = useGameStore((s) => s.clearError);
    if (!gameState)
        return null;
    const opponents = gameState.players.filter((p) => p.id !== playerId);
    return (_jsxs("div", { className: "fixed inset-0 pointer-events-none", children: [_jsx("div", { className: "absolute top-0 left-0 right-0 p-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex flex-col gap-3 pointer-events-auto", children: [_jsx(TurnIndicator, {}), _jsx(PhaseControls, {})] }), _jsx("div", { className: "flex flex-col gap-2 pointer-events-auto", children: gameState.players.map((player, index) => {
                                // Color mapping based on player position (1-4: red-blue)
                                const positionColors = ['#ef4444', '#6366f1', '#22c55e', '#f59e0b']; // red, blue, green, yellow
                                const playerColor = positionColors[index % 4];
                                const isCurrentPlayer = player.id === playerId;
                                const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === player.id;
                                return (_jsxs("div", { className: `bg-mugen-surface border rounded-lg px-3 py-2 text-sm transition-all ${isCurrentTurn
                                        ? 'border-mugen-accent/50 bg-mugen-accent/10'
                                        : 'border-white/5'} ${player.isEliminated ? 'opacity-40 line-through' : ''}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [isCurrentTurn && (_jsx("div", { className: "w-2 h-2 bg-mugen-accent rounded-full animate-pulse" })), _jsxs("div", { className: "font-medium text-xs", style: { color: playerColor }, children: [player.name, isCurrentPlayer && _jsx("span", { className: "text-xs text-gray-400 ml-1", children: "(You)" })] })] }), _jsxs("div", { className: "flex items-center gap-1 text-mugen-danger text-xs", children: [_jsx(Heart, { size: 10 }), " ", player.life] })] }, player.id));
                            }) })] }) }), _jsx("div", { className: "absolute left-0 p-6 pointer-events-auto", style: { right: '50%', maxWidth: 'calc(50% - 48px)', bottom: '-21px' }, children: _jsx("div", { className: "bg-mugen-surface/90 backdrop-blur-sm rounded-xl border border-white/5 px-6 pb-1 pt-[16px] w-full", children: _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2", children: "Hand" }), _jsx(HandDisplay, {})] }) }) }), error && (_jsx("div", { className: "absolute top-16 left-1/2 -translate-x-1/2 pointer-events-auto", children: _jsxs("button", { onClick: clearError, className: "bg-mugen-danger/90 text-white px-4 py-2 rounded-lg text-sm shadow-lg", children: [error, " \u2715"] }) }))] }));
}
//# sourceMappingURL=GameHUD.js.map
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useGameStore } from '../store/game-store.js';
import { useUnitHover } from '../hooks/useUnitHover.js';
import { TurnPhase } from '@mugen/shared';
export function BenchUnits() {
    const benchUnits = useGameStore(state => state.benchUnits);
    const gameState = useGameStore(state => state.gameState);
    const playerId = useGameStore(state => state.playerId);
    const deploymentModeActive = useGameStore(state => state.deploymentModeActive);
    const selectedBenchUnit = useGameStore(state => state.selectedBenchUnit);
    const { handleMouseEnter, handleMouseLeave } = useUnitHover();
    const { enterDeploymentMode, exitDeploymentMode } = useGameStore();
    // Check if it's the player's turn and they can deploy reserves
    const isMyTurn = gameState?.players[gameState.currentPlayerIndex]?.id === playerId;
    const canDeploy = isMyTurn && gameState?.turnPhase !== TurnPhase.STANDBY;
    // Find the current player to check reserve lock
    const currentPlayer = gameState?.players.find(p => p.id === playerId);
    const reserveLocked = currentPlayer?.reserveLockedUntilNextTurn ?? false;
    if (benchUnits.length === 0) {
        return (_jsx("div", { "data-testid": "bench-units-container", className: "w-[583px] bg-gray-900/90 border border-white/10 px-4 py-2", children: _jsx("div", { className: "text-gray-400 text-sm", children: "No bench units" }) }));
    }
    return (_jsx("div", { "data-testid": "bench-units-container", className: "w-[583px] bg-gray-900/90 border border-white/10 px-4 py-2", children: _jsxs("div", { className: "flex flex-row justify-between items-center -mt-[4px]", children: [benchUnits.map((unit) => (_jsxs("div", { "data-testid": "bench-unit", className: `bg-gray-800 border rounded p-3 transition-colors w-[136px] h-[184px] ${canDeploy && !reserveLocked
                        ? 'cursor-pointer hover:bg-gray-700 hover:border-green-500 border-white/20'
                        : 'cursor-not-allowed opacity-50 border-gray-600'}`, onMouseEnter: () => handleMouseEnter(unit), onMouseLeave: handleMouseLeave, onClick: () => {
                        if (canDeploy && !reserveLocked) {
                            // Enter deployment mode - the user will need to click on the board to place the unit
                            enterDeploymentMode(unit);
                        }
                    }, children: [_jsx("div", { className: "text-white font-semibold text-sm truncate", children: unit.name }), _jsxs("div", { className: "flex flex-col text-xs text-gray-300 mt-1", children: [_jsxs("span", { children: ["HP: ", unit.hp] }), _jsxs("span", { children: ["ATK: ", unit.atk] }), _jsxs("span", { children: ["Cost: ", unit.cost] })] }), _jsx("div", { className: "text-xs text-gray-400 mt-1 truncate", children: unit.ability.name })] }, unit.id))), Array.from({ length: Math.max(0, 3 - benchUnits.length) }).map((_, index) => (_jsx("div", { className: "bg-gray-800/30 border border-white/10 rounded p-3 w-[136px] h-[184px]", style: { visibility: 'hidden' }, children: _jsx("div", { className: "text-gray-500 text-sm", children: "Empty Slot" }) }, `empty-${index}`)))] }) }));
}
//# sourceMappingURL=BenchUnits.js.map
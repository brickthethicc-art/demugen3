import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useGameStore } from '../store/game-store.js';
import { useGameActions } from '../hooks/useGameActions.js';
import { TurnPhase } from '@mugen/shared';
import { getValidMoves } from '@mugen/shared/src/engines/board/index.js';
import { getAbilityTargets } from '@mugen/shared/src/engines/ability/index.js';
import { getAttackTargets } from '@mugen/shared/src/engines/combat/index.js';
import { ArrowRight, Sword, Zap } from 'lucide-react';
const CELL_SIZE = 32;
const MENU_WIDTH = 160;
const MENU_OFFSET = 8;
export function UnitActionMenu() {
    const { gameState, selectedUnitId, moveModeActive, menuHiddenDuringMove, validMoves, playerId, abilityModeActive, abilityTargets } = useGameStore((s) => ({
        gameState: s.gameState,
        selectedUnitId: s.selectedUnitId,
        moveModeActive: s.moveModeActive,
        menuHiddenDuringMove: s.menuHiddenDuringMove,
        validMoves: s.validMoves,
        playerId: s.playerId,
        abilityModeActive: s.abilityModeActive,
        abilityTargets: s.abilityTargets,
    }));
    const { isMyTurn } = useGameActions();
    const { enterMoveMode, exitMoveMode, hideMenuDuringMove, showMenuDuringMove, setValidMoves, clearValidMoves, selectUnit, enterAbilityMode, exitAbilityMode, setAbilityTargets, clearAbilityTargets, enterAttackMode, exitAttackMode, setAttackTargets, clearAttackTargets } = useGameStore();
    // Find the selected unit (scoped to local player to avoid card ID collisions across players)
    const selectedUnit = useMemo(() => {
        if (!selectedUnitId || !gameState || !playerId)
            return null;
        const myPlayer = gameState.players.find(p => p.id === playerId);
        return myPlayer?.units.find(u => u.card.id === selectedUnitId) ?? null;
    }, [selectedUnitId, gameState, playerId]);
    // Determine available actions based on phase and unit state
    const isMovePhase = gameState?.turnPhase === TurnPhase.MOVE;
    const hasMoved = selectedUnit?.hasMovedThisTurn;
    const canAttack = gameState?.turnPhase === TurnPhase.ATTACK && !selectedUnit?.hasAttackedThisTurn;
    const canUseAbility = gameState?.turnPhase === TurnPhase.ABILITY && !selectedUnit?.hasUsedAbilityThisTurn;
    // Compute menu position: to the LEFT of the unit's cell
    const unitPos = selectedUnit?.position;
    const menuStyle = unitPos
        ? {
            position: 'absolute',
            left: unitPos.x * CELL_SIZE - MENU_WIDTH - MENU_OFFSET,
            top: unitPos.y * CELL_SIZE,
            width: MENU_WIDTH,
            zIndex: 50,
        }
        : {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 50,
        };
    // Pre-compute whether valid moves exist for disabling the Move button
    const hasValidMoves = useMemo(() => {
        if (!isMovePhase || hasMoved || !unitPos || !gameState || !selectedUnit)
            return false;
        const moves = getValidMoves(gameState.board, unitPos, selectedUnit.card.movement);
        return moves.length > 0;
    }, [isMovePhase, hasMoved, unitPos, gameState, selectedUnit]);
    // Pre-compute valid ability targets for disabling the Ability button
    const validAbilityTargets = useMemo(() => {
        if (!canUseAbility || !gameState || !selectedUnit || !playerId)
            return [];
        const allUnits = gameState.players.flatMap(p => p.units);
        return getAbilityTargets(selectedUnit, allUnits, playerId);
    }, [canUseAbility, gameState, selectedUnit, playerId]);
    const hasAbilityTargets = validAbilityTargets.length > 0;
    // Pre-compute valid attack targets for disabling the Attack button
    const validAttackTargets = useMemo(() => {
        if (!canAttack || !gameState || !selectedUnit || !playerId)
            return [];
        const allUnits = gameState.players.flatMap(p => p.units);
        return getAttackTargets(selectedUnit, allUnits, playerId);
    }, [canAttack, gameState, selectedUnit, playerId]);
    const hasAttackTargets = validAttackTargets.length > 0;
    // Early return after all hooks are called
    if (!selectedUnitId || !gameState || !isMyTurn || !selectedUnit || selectedUnit.ownerId !== playerId || menuHiddenDuringMove) {
        return null;
    }
    const handleMove = () => {
        if (hasMoved || !unitPos)
            return;
        // Reset highlights cleanly before computing (prevents stacking)
        clearValidMoves();
        exitMoveMode();
        const moves = getValidMoves(gameState.board, unitPos, selectedUnit.card.movement);
        if (moves.length > 0) {
            setValidMoves(moves);
            enterMoveMode();
            // Hide the menu to lock player into movement mode
            // Menu will only reappear when move is completed or cancelled
            hideMenuDuringMove();
        }
    };
    const handleAttack = () => {
        if (!selectedUnit || !gameState || !playerId)
            return;
        if (selectedUnit.hasAttackedThisTurn)
            return;
        // Compute valid attack targets
        const allUnits = gameState.players.flatMap(p => p.units);
        const targets = getAttackTargets(selectedUnit, allUnits, playerId);
        if (targets.length === 0)
            return;
        // Enter attack targeting mode
        clearValidMoves();
        exitMoveMode();
        clearAbilityTargets();
        exitAbilityMode();
        setAttackTargets(targets);
        enterAttackMode();
        hideMenuDuringMove();
    };
    const handleAbility = () => {
        if (!selectedUnit || !gameState || !playerId)
            return;
        if (selectedUnit.hasUsedAbilityThisTurn)
            return;
        // Compute valid ability targets
        const allUnits = gameState.players.flatMap(p => p.units);
        const targets = getAbilityTargets(selectedUnit, allUnits, playerId);
        if (targets.length === 0)
            return;
        // Enter ability targeting mode
        clearValidMoves();
        exitMoveMode();
        setAbilityTargets(targets);
        enterAbilityMode();
        hideMenuDuringMove();
    };
    const handleClose = () => {
        selectUnit(null);
        clearValidMoves();
        exitMoveMode();
        exitAbilityMode();
        clearAbilityTargets();
        exitAttackMode();
        clearAttackTargets();
        showMenuDuringMove();
    };
    // Move button is always shown in MOVE phase, but disabled when already moved or no valid moves
    const moveDisabled = hasMoved || !hasValidMoves;
    return (_jsxs("div", { style: menuStyle, className: "bg-mugen-surface border border-white/10 rounded-xl shadow-2xl p-3 pointer-events-auto", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "w-10 h-10 bg-mugen-accent/20 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-sm font-bold", children: selectedUnit.card.name.charAt(0).toUpperCase() }) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-sm", children: selectedUnit.card.name }), _jsxs("div", { className: "text-xs text-gray-400", children: ["HP: ", selectedUnit.currentHp, "/", selectedUnit.card.maxHp] })] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [isMovePhase && (_jsxs("button", { onClick: handleMove, disabled: moveDisabled, className: `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition w-full ${moveDisabled
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-mugen-accent hover:bg-mugen-accent/80 text-white cursor-pointer'}`, children: [_jsx(ArrowRight, { size: 14 }), "Move", hasMoved ? ' (done)' : ''] })), canAttack && (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("button", { onClick: handleAttack, disabled: !hasAttackTargets, className: `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition w-full ${!hasAttackTargets
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-mugen-danger hover:bg-mugen-danger/80 text-white cursor-pointer'}`, children: [_jsx(Sword, { size: 14 }), "Attack"] }), !hasAttackTargets && (_jsx("div", { className: "text-xs text-mugen-danger px-1", children: "No enemies in range" }))] })), canUseAbility && (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("button", { onClick: handleAbility, disabled: !hasAbilityTargets, className: `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition w-full ${!hasAbilityTargets
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-mugen-gold hover:bg-mugen-gold/80 text-black cursor-pointer'}`, children: [_jsx(Zap, { size: 14 }), selectedUnit.card.ability.name] }), _jsx("div", { className: "text-xs text-gray-400 px-1", children: selectedUnit.card.ability.description }), !hasAbilityTargets && (_jsx("div", { className: "text-xs text-mugen-danger px-1", children: "No valid targets in range" }))] })), _jsx("button", { onClick: handleClose, className: "px-3 py-2 bg-mugen-bg hover:bg-mugen-bg/80 text-gray-400 rounded-lg text-sm font-medium transition w-full", children: "Cancel" })] }), moveModeActive && validMoves.length > 0 && (_jsx("div", { className: "mt-2 text-xs text-mugen-accent", children: "Click a highlighted cell to move" })), abilityModeActive && abilityTargets.length > 0 && (_jsx("div", { className: "mt-2 text-xs text-mugen-gold", children: "Click a highlighted unit to use ability" }))] }));
}
//# sourceMappingURL=UnitActionMenu.js.map
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useGameStore } from '../store/game-store.js';
import { CardType } from '@mugen/shared';
import { Coins, Users, Shield, Swords } from 'lucide-react';
export function StartingUnitSelection() {
    const { selectedDeck, startingUnits, setStartingUnits, confirmStartingUnits, isPlayerReady, readyPlayersCount, totalPlayersCount, isWaitingForOthers } = useGameStore();
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    // Filter only unit cards from deck
    const availableUnits = selectedDeck?.filter(card => card.cardType === CardType.UNIT) || [];
    const totalCost = startingUnits.reduce((sum, unit) => sum + unit.cost, 0);
    const isValidSelection = startingUnits.length === 6 && totalCost < 40;
    const toggleUnitSelection = (unit) => {
        const isSelected = startingUnits.some(u => u.id === unit.id);
        if (isSelected) {
            // Remove from selection
            setStartingUnits(startingUnits.filter(u => u.id !== unit.id));
        }
        else if (startingUnits.length < 6) {
            // Add to selection
            setStartingUnits([...startingUnits, unit]);
        }
        // If already have 6, don't add more (could show toast)
    };
    const handleDragStart = (index) => {
        setDraggedIndex(index);
    };
    const handleDragOver = (e, index) => {
        e.preventDefault();
        setDragOverIndex(index);
    };
    const handleDragLeave = () => {
        setDragOverIndex(null);
    };
    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        setDragOverIndex(null);
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }
        // Swap the units
        const newUnits = [...startingUnits];
        const draggedUnit = newUnits[draggedIndex];
        const dropUnit = newUnits[dropIndex];
        if (draggedUnit && dropUnit) {
            // Swap the units
            newUnits[draggedIndex] = dropUnit;
            newUnits[dropIndex] = draggedUnit;
            setStartingUnits(newUnits);
        }
        setDraggedIndex(null);
    };
    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };
    const selectedUnitIds = new Set(startingUnits.map(u => u.id));
    return (_jsx("div", { className: "min-h-screen bg-mugen-bg text-white p-4", children: _jsxs("div", { className: "max-w-5xl mx-auto", children: [_jsx("h1", { className: "text-2xl font-bold mb-6 text-center", children: "Select 6 Starting Units" }), _jsxs("div", { className: "bg-mugen-surface/50 rounded-xl p-4 mb-6 border border-white/10", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { size: 20, className: "text-mugen-accent" }), _jsxs("span", { className: "font-semibold", children: ["Selected: ", startingUnits.length, " / 6"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Coins, { size: 20, className: "text-mugen-gold" }), _jsxs("span", { className: `font-semibold ${totalCost >= 40 ? 'text-mugen-danger' : 'text-mugen-gold'}`, children: ["Total Cost: ", totalCost, " / 40"] })] }), isWaitingForOthers && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-blue-400 rounded-full animate-pulse" }), _jsxs("span", { className: "text-blue-300 font-semibold text-sm", children: ["Waiting: ", readyPlayersCount, "/", totalPlayersCount, " ready"] })] }))] }), !isPlayerReady ? (_jsx("button", { onClick: confirmStartingUnits, disabled: !isValidSelection, className: `px-6 py-2 rounded-lg font-semibold transition-colors ${isValidSelection
                                        ? 'bg-mugen-accent hover:bg-mugen-accent/80 text-white'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`, children: "Confirm Selection" })) : (_jsx("div", { className: "px-4 py-2 bg-green-600/20 border border-green-500/50 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { size: 16, className: "text-green-400" }), _jsxs("span", { className: "text-green-400 font-semibold text-sm", children: ["You're Ready! (", readyPlayersCount, "/", totalPlayersCount, " players ready)"] })] }) }))] }), _jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "grid grid-cols-6 gap-2", children: Array.from({ length: 6 }).map((_, index) => {
                                        const unit = startingUnits[index];
                                        const isEmpty = !unit;
                                        return (_jsx("div", { className: `relative rounded-lg p-2 border text-center transition-all ${isEmpty
                                                ? 'bg-mugen-surface/30 border-dashed border-gray-600/50 flex items-center justify-center'
                                                : isPlayerReady
                                                    ? 'bg-mugen-surface/70 cursor-not-allowed opacity-70'
                                                    : 'bg-mugen-surface/70 cursor-move'} ${index < 3
                                                ? 'border-blue-500/50 ring-1 ring-blue-500/30'
                                                : 'border-orange-500/50 ring-1 ring-orange-500/30'} ${!isEmpty && !isPlayerReady && draggedIndex === index ? 'opacity-50 scale-95' : ''} ${!isEmpty && !isPlayerReady && dragOverIndex === index ? 'scale-105 ring-2 ring-yellow-400' : ''}`, draggable: !isEmpty && !isPlayerReady, onDragStart: () => !isEmpty && !isPlayerReady && handleDragStart(index), onDragOver: (e) => !isPlayerReady && handleDragOver(e, index), onDragLeave: isPlayerReady ? undefined : handleDragLeave, onDrop: (e) => !isPlayerReady && handleDrop(e, index), onDragEnd: isPlayerReady ? undefined : handleDragEnd, children: isEmpty ? (_jsx("div", { className: "text-gray-500 text-2xl", children: "+" })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: `absolute -top-1 -right-1 w-3 h-3 rounded-full text-xs flex items-center justify-center ${index < 3 ? 'bg-blue-500' : 'bg-orange-500'}`, children: _jsx("span", { className: "text-white text-[8px] font-bold", children: index < 3 ? 'A' : 'R' }) }), _jsx("div", { className: "font-semibold text-xs truncate mb-1", children: unit.name }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex justify-center items-center gap-1", children: [_jsx(Shield, { size: 10, className: "text-gray-400" }), _jsx("span", { className: "text-xs text-gray-300", children: unit.hp })] }), _jsxs("div", { className: "flex justify-center items-center gap-1", children: [_jsx(Swords, { size: 10, className: "text-gray-400" }), _jsx("span", { className: "text-xs text-gray-300", children: unit.atk })] })] }), _jsxs("div", { className: "flex justify-center items-center gap-1 text-mugen-gold", children: [_jsx(Coins, { size: 10 }), _jsx("span", { className: "text-xs font-mono", children: unit.cost })] })] })) }, index));
                                    }) }), _jsxs("div", { className: "flex justify-center gap-6 mt-3 text-xs", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-blue-500" }), _jsx("span", { className: "text-gray-400", children: "Active (First 3)" })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-orange-500" }), _jsx("span", { className: "text-gray-400", children: "Reserve (Last 3)" })] })] })] }), totalCost >= 40 && (_jsx("div", { className: "text-mugen-danger text-sm", children: "Cost exceeds limit! Total must be less than 40." })), startingUnits.length > 6 && (_jsx("div", { className: "text-mugen-danger text-sm", children: "Too many units selected! Select exactly 6." }))] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3", children: availableUnits.map((unit) => {
                        const isSelected = selectedUnitIds.has(unit.id);
                        const isLocked = isPlayerReady;
                        return (_jsxs("div", { onClick: () => !isLocked && toggleUnitSelection(unit), className: `relative bg-mugen-surface/50 rounded-lg p-4 border transition-all ${isLocked
                                ? 'border-gray-600/30 opacity-60 cursor-not-allowed'
                                : isSelected
                                    ? 'border-mugen-accent shadow-lg shadow-mugen-accent/20 cursor-pointer'
                                    : 'border-white/10 hover:border-white/30 cursor-pointer'}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h3", { className: "font-semibold text-sm truncate", children: unit.name }), _jsxs("div", { className: "flex items-center gap-1 text-mugen-gold", children: [_jsx(Coins, { size: 14 }), _jsx("span", { className: "text-xs font-mono", children: unit.cost })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs text-gray-400", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Swords, { size: 12 }), _jsx("span", { children: unit.atk })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Shield, { size: 12 }), _jsx("span", { children: unit.hp })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { children: "MOV" }), _jsx("span", { children: unit.movement })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { children: "RNG" }), _jsx("span", { children: unit.range })] })] }), _jsx("div", { className: "mt-2 text-xs text-gray-500", children: _jsx("div", { className: "truncate", children: unit.ability.name }) }), isLocked && (_jsx("div", { className: "absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center", children: _jsx("div", { className: "bg-gray-800/90 rounded-full p-2", children: _jsx("svg", { className: "w-4 h-4 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }) }) }) })), isSelected && !isLocked && (_jsx("div", { className: "mt-2 text-xs text-mugen-accent font-semibold", children: "SELECTED" }))] }, unit.id));
                    }) })] }) }));
}
//# sourceMappingURL=StartingUnitSelection.js.map
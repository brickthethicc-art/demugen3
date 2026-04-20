import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useGameStore } from '../store/game-store.js';
import { CombatModifierType } from '@mugen/shared';
export function HoverPanel() {
    const hoveredCard = useGameStore(state => state.hoveredCard);
    const hoveredUnitInstance = useGameStore(state => state.hoveredUnitInstance);
    if (!hoveredCard) {
        return (_jsx("div", { "data-testid": "hover-panel", className: "fixed left-0 top-1/2 -translate-y-1/2 w-80 bg-gray-900/90 border-r border-white/10 p-6", children: _jsx("div", { className: "text-gray-500 text-sm text-center", children: "Hover over a unit to see details" }) }));
    }
    if (hoveredCard.cardType === 'SORCERY') {
        const sorceryCard = hoveredCard;
        return (_jsx("div", { "data-testid": "hover-panel", className: "fixed left-0 top-1/2 -translate-y-1/2 w-80 bg-gray-900/90 border-r border-white/10 p-6", children: _jsxs("div", { className: "text-white", children: [_jsx("h2", { className: "text-xl font-bold mb-4 text-blue-400", children: sorceryCard.name }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Type:" }), _jsx("span", { className: "font-semibold text-blue-400", children: "Sorcery" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Cost:" }), _jsx("span", { className: "font-semibold text-yellow-400", children: sorceryCard.cost })] })] }), _jsxs("div", { className: "mt-4 pt-4 border-t border-white/20", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-400 mb-2", children: "Effect" }), _jsx("div", { className: "bg-gray-800 rounded p-3", children: _jsx("div", { className: "text-sm text-gray-300", children: sorceryCard.effect }) })] }), _jsx("div", { className: "mt-4 pt-4 border-t border-white/20", children: _jsxs("div", { className: "text-xs text-gray-500", children: ["Card ID: ", sorceryCard.id] }) })] }) }));
    }
    const unitCard = hoveredCard;
    // Use live instance data when available (board units), otherwise fall back to card data
    const currentHp = hoveredUnitInstance ? hoveredUnitInstance.currentHp : unitCard.hp;
    const maxHp = unitCard.maxHp;
    const modifiers = hoveredUnitInstance ? hoveredUnitInstance.combatModifiers : [];
    // Calculate effective ATK with buffs
    const atkBuffCount = modifiers.filter(m => m.type === CombatModifierType.ATK_BUFF).length;
    const baseAtk = unitCard.atk;
    const effectiveAtk = baseAtk + atkBuffCount; // +1 ATK per buff
    const hasAtkBuff = atkBuffCount > 0;
    // Check for active modifiers
    const hasNoCounter = modifiers.some(m => m.type === CombatModifierType.NO_COUNTERATTACK);
    return (_jsx("div", { "data-testid": "hover-panel", className: "fixed left-0 top-1/2 -translate-y-1/2 w-80 bg-gray-900/90 border-r border-white/10 p-6", children: _jsxs("div", { className: "text-white", children: [_jsx("h2", { className: "text-xl font-bold mb-4 text-red-400", children: unitCard.name }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "HP:" }), _jsxs("span", { className: `font-semibold ${currentHp < maxHp ? 'text-red-400' : ''}`, children: [currentHp, " / ", maxHp] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "ATK:" }), _jsxs("span", { className: `font-semibold ${hasAtkBuff ? 'text-green-400' : ''}`, children: [effectiveAtk, hasAtkBuff && ` (+${atkBuffCount})`] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Movement:" }), _jsx("span", { className: "font-semibold", children: unitCard.movement })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-400", children: "Range:" }), _jsx("span", { className: "font-semibold", children: unitCard.range })] })] }), modifiers.length > 0 && (_jsxs("div", { className: "mt-4 pt-4 border-t border-white/20", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-400 mb-2", children: "Active Effects" }), _jsxs("div", { className: "space-y-1", children: [hasAtkBuff && (_jsxs("div", { className: "text-xs text-green-400 bg-green-900/30 rounded px-2 py-1", children: ["ATK Buff (+", atkBuffCount, ")"] })), hasNoCounter && (_jsx("div", { className: "text-xs text-purple-400 bg-purple-900/30 rounded px-2 py-1", children: "No Counterattack" }))] })] })), _jsxs("div", { className: "mt-4 pt-4 border-t border-white/20", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-400 mb-2", children: "Ability" }), _jsxs("div", { className: "bg-gray-800 rounded p-3", children: [_jsx("div", { className: "font-semibold text-blue-400 mb-1", children: unitCard.ability.name }), _jsx("div", { className: "text-xs text-gray-300 mb-2", children: unitCard.ability.description }), _jsx("div", { className: "text-xs text-green-400", children: "Free \u2014 once per turn" })] })] }), _jsx("div", { className: "mt-4 pt-4 border-t border-white/20", children: _jsxs("div", { className: "text-xs text-gray-500", children: ["Card ID: ", unitCard.id] }) })] }) }));
}
//# sourceMappingURL=HoverPanel.js.map
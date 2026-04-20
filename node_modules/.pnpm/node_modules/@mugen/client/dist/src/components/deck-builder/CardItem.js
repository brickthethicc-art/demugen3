import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { CardType } from '@mugen/shared';
import { Heart, Sword, Plus, Minus } from 'lucide-react';
import { CardTooltip } from './CardTooltip.js';
export function CardItem({ card, onClick, mode, disabled }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const isUnit = card.cardType === CardType.UNIT;
    return (_jsxs("div", { className: "relative", onMouseEnter: () => setShowTooltip(true), onMouseLeave: () => setShowTooltip(false), children: [showTooltip && _jsx(CardTooltip, { card: card }), _jsxs("button", { onClick: onClick, disabled: disabled, className: `w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition text-left text-sm ${disabled
                    ? 'opacity-40 cursor-not-allowed border-white/5 bg-mugen-bg'
                    : mode === 'add'
                        ? 'border-white/10 bg-mugen-bg hover:border-mugen-accent/50 hover:bg-mugen-accent/5'
                        : 'border-white/10 bg-mugen-bg hover:border-mugen-danger/50 hover:bg-mugen-danger/5'}`, children: [_jsx("span", { className: "w-6 h-6 flex items-center justify-center rounded-md bg-mugen-mana/20 text-mugen-mana text-xs font-mono shrink-0", children: card.cost }), _jsx("span", { className: "flex-1 truncate font-medium text-white", children: card.name }), isUnit && (_jsxs("span", { className: "flex items-center gap-1.5 text-xs text-gray-400 shrink-0", children: [_jsxs("span", { className: "flex items-center gap-0.5 text-red-400", children: [_jsx(Heart, { size: 10 }), card.hp] }), _jsxs("span", { className: "flex items-center gap-0.5 text-orange-400", children: [_jsx(Sword, { size: 10 }), card.atk] })] })), _jsx("span", { className: `text-xs px-1.5 py-0.5 rounded ${isUnit ? 'bg-mugen-accent/20 text-mugen-accent' : 'bg-mugen-gold/20 text-mugen-gold'} shrink-0`, children: isUnit ? 'U' : 'S' }), _jsx("span", { className: `shrink-0 ${mode === 'add' ? 'text-mugen-success' : 'text-mugen-danger'}`, children: mode === 'add' ? _jsx(Plus, { size: 14 }) : _jsx(Minus, { size: 14 }) })] })] }));
}
//# sourceMappingURL=CardItem.js.map
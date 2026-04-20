import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
export function DiscardPileViewer({ entries, onClose, count }) {
    // Sort by timestamp (newest first) for chronological order
    const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    const scrollContainerRef = useRef(null);
    // Close on click outside
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    // Handle wheel events for horizontal scrolling
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer)
            return;
        const handleWheel = (e) => {
            e.preventDefault();
            // Convert vertical scroll to horizontal scroll
            scrollContainer.scrollLeft += e.deltaY;
        };
        scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            scrollContainer.removeEventListener('wheel', handleWheel);
        };
    }, []);
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", onClick: handleBackdropClick, children: _jsxs("div", { className: "bg-mugen-surface border border-white/10 rounded-lg shadow-xl max-w-4xl w-full mx-4 overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-white/10", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "text-xl font-semibold text-white", children: "Graveyard" }), _jsxs("div", { className: "bg-mugen-bg px-3 py-1 rounded-full text-sm text-gray-300", children: [count, " cards"] })] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-white transition-colors text-sm", children: "Close" })] }), _jsx("div", { className: "p-4", children: sortedEntries.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-400", children: _jsx("div", { className: "text-lg", children: "No cards in graveyard" }) })) : (_jsx("div", { ref: scrollContainerRef, className: "flex gap-2 overflow-x-auto pb-2", children: sortedEntries.map((entry) => (_jsxs("div", { className: "flex-shrink-0 w-[136px] h-[184px] bg-mugen-bg border border-white/10 rounded-lg p-3 cursor-pointer hover:border-mugen-accent/50 transition-colors relative", children: [_jsx("div", { className: `absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${entry.card.cardType === 'UNIT'
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`, children: entry.card.cardType === 'UNIT' ? 'U' : 'S' }), _jsx("div", { className: "text-white font-semibold text-sm truncate pr-8", children: entry.card.name }), _jsx("div", { className: "flex flex-col text-xs text-gray-300 mt-1", children: entry.card.cardType === 'UNIT' ? (_jsxs(_Fragment, { children: [_jsxs("span", { children: ["HP: ", entry.card.hp] }), _jsxs("span", { children: ["ATK: ", entry.card.atk] }), _jsxs("span", { children: ["Cost: ", entry.card.cost] })] })) : (_jsxs("span", { children: ["Cost: ", entry.card.cost] })) }), _jsx("div", { className: "text-xs text-gray-400 mt-1 truncate", children: entry.card.cardType === 'UNIT' ? entry.card.ability?.name : entry.card.effect }), _jsx("div", { className: "absolute bottom-2 left-3 right-3", children: _jsx("div", { className: "text-xs text-gray-500 truncate", children: entry.source === 'unit_death' ? 'Unit Death' :
                                            entry.source === 'sorcery_played' ? 'Sorcery Played' : 'Other' }) })] }, `${entry.card.id}-${entry.timestamp}`))) })) }), _jsx("div", { className: "p-4 border-t border-white/10", children: _jsxs("div", { className: "flex items-center justify-between text-sm text-gray-400", children: [_jsx("div", { children: "Scroll horizontally to see all cards" }), _jsxs("div", { children: ["Units: ", entries.filter(e => e.card.cardType === 'UNIT').length, " | Sorceries: ", entries.filter(e => e.card.cardType === 'SORCERY').length] })] }) })] }) }));
}
//# sourceMappingURL=DiscardPileViewer.js.map
import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/game-store.js';
import { useCardHover } from '../hooks/useUnitHover.js';
import { sendDiscardCard } from '../network/socket-client.js';
import { MAX_HAND_SIZE } from '@mugen/shared';
const NOTIFICATION_DURATION_MS = 1300;
export function HandLimitModal() {
    const gameState = useGameStore((s) => s.gameState);
    const playerId = useGameStore((s) => s.playerId);
    const handLimitNotification = useGameStore((s) => s.handLimitNotification);
    const handLimitModalOpen = useGameStore((s) => s.handLimitModalOpen);
    const openHandLimitModal = useGameStore((s) => s.openHandLimitModal);
    const closeHandLimitModal = useGameStore((s) => s.closeHandLimitModal);
    const [notifVisible, setNotifVisible] = useState(false);
    const [notifExiting, setNotifExiting] = useState(false);
    const notifTimerRef = useRef(null);
    const [discarding, setDiscarding] = useState(false);
    const myPlayer = gameState?.players.find((p) => p.id === playerId);
    const handCards = myPlayer?.hand.cards ?? [];
    const handExceeded = handCards.length > MAX_HAND_SIZE;
    const { handleMouseEnter, handleMouseLeave } = useCardHover();
    // Notification lifecycle: show → animate out → open modal
    useEffect(() => {
        if (handLimitNotification && !handLimitModalOpen) {
            setNotifVisible(true);
            setNotifExiting(false);
            notifTimerRef.current = setTimeout(() => {
                setNotifExiting(true);
                // After exit animation completes, open modal
                setTimeout(() => {
                    setNotifVisible(false);
                    setNotifExiting(false);
                    openHandLimitModal();
                }, 400);
            }, NOTIFICATION_DURATION_MS);
        }
        return () => {
            if (notifTimerRef.current) {
                clearTimeout(notifTimerRef.current);
                notifTimerRef.current = null;
            }
        };
    }, [handLimitNotification, handLimitModalOpen, openHandLimitModal]);
    // Re-check: if modal is open but hand is within limit, close
    useEffect(() => {
        if (handLimitModalOpen && !handExceeded) {
            closeHandLimitModal();
        }
    }, [handLimitModalOpen, handExceeded, closeHandLimitModal]);
    const handleDiscard = useCallback((cardId) => {
        if (discarding)
            return;
        setDiscarding(true);
        sendDiscardCard(cardId);
        // The server will broadcast updated game_state,
        // which triggers re-check in the effect above.
        // Reset discard lock after a short guard window.
        setTimeout(() => setDiscarding(false), 300);
    }, [discarding]);
    return (_jsxs(_Fragment, { children: [notifVisible && (_jsx("div", { className: `fixed top-1/3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-400 ${notifExiting
                    ? 'opacity-0 -translate-y-12 scale-95'
                    : 'opacity-100 translate-y-0 scale-100'}`, children: _jsxs("div", { className: "bg-mugen-danger/95 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold backdrop-blur-sm border border-red-400/30", children: ["Player hand size exceeded maximum limit of ", MAX_HAND_SIZE] }) })), handLimitModalOpen && handExceeded && (_jsxs("div", { className: "fixed inset-0 z-[9998] flex items-center justify-center", onClick: (e) => e.stopPropagation(), onPointerDown: (e) => e.stopPropagation(), children: [_jsx("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-sm" }), _jsxs("div", { className: "relative z-10 bg-mugen-surface border border-white/10 rounded-2xl shadow-2xl p-6 max-w-[720px] w-full mx-4", children: [_jsx("h2", { className: "text-lg font-bold text-white text-center mb-1", children: "Hand Limit Exceeded" }), _jsxs("p", { className: "text-gray-400 text-sm text-center mb-5", children: ["Please discard a card to continue (", handCards.length, "/", MAX_HAND_SIZE, ")"] }), _jsx("div", { className: "flex flex-wrap gap-3 justify-center", children: handCards.map((card) => (_jsxs("button", { disabled: discarding, onClick: () => handleDiscard(card.id), onMouseEnter: () => handleMouseEnter(card), onMouseLeave: handleMouseLeave, className: `flex-shrink-0 w-[136px] h-[184px] bg-mugen-bg border rounded-lg p-3 text-left transition-all ${discarding
                                        ? 'border-white/5 opacity-50 cursor-not-allowed'
                                        : 'border-white/10 cursor-pointer hover:border-mugen-danger hover:shadow-lg hover:shadow-red-500/20 hover:scale-105'}`, children: [_jsx("div", { className: "text-white font-semibold text-sm truncate", children: card.name }), _jsx("div", { className: "flex flex-col text-xs text-gray-300 mt-1", children: card.cardType === 'UNIT' ? (_jsxs(_Fragment, { children: [_jsxs("span", { children: ["HP: ", card.hp] }), _jsxs("span", { children: ["ATK: ", card.atk] }), _jsxs("span", { children: ["Cost: ", card.cost] })] })) : (_jsxs("span", { children: ["Cost: ", card.cost] })) }), _jsx("div", { className: "text-xs text-gray-400 mt-1 truncate", children: card.cardType === 'UNIT' ? card.ability?.name : card.effect }), _jsx("div", { className: "mt-auto pt-2 text-center", children: _jsx("span", { className: "text-xs text-mugen-danger font-medium opacity-0 group-hover:opacity-100 transition-opacity", children: "Discard" }) })] }, card.id))) })] })] }))] }));
}
//# sourceMappingURL=HandLimitModal.js.map
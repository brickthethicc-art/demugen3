import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/game-store.js';
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
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const handCards = myPlayer?.hand.cards ?? [];
  const handExceeded = handCards.length > MAX_HAND_SIZE;
  const isMyTurn =
    !!gameState &&
    !!playerId &&
    gameState.players[gameState.currentPlayerIndex]?.id === playerId;

  const shouldPromptDiscard = handLimitModalOpen && isMyTurn && handExceeded;

  // Notification lifecycle: show while discard mode is active
  useEffect(() => {
    if (handLimitNotification && !handLimitModalOpen && isMyTurn && handExceeded) {
      openHandLimitModal();
      setNotifVisible(true);
      setNotifExiting(false);

      notifTimerRef.current = setTimeout(() => {
        setNotifExiting(true);
        setTimeout(() => {
          setNotifVisible(false);
          setNotifExiting(false);
        }, 400);
      }, NOTIFICATION_DURATION_MS);
    } else if (!shouldPromptDiscard) {
      setNotifVisible(false);
      setNotifExiting(false);
    }

    return () => {
      if (notifTimerRef.current) {
        clearTimeout(notifTimerRef.current);
        notifTimerRef.current = null;
      }
    };
  }, [handLimitNotification, handLimitModalOpen, isMyTurn, handExceeded, shouldPromptDiscard, openHandLimitModal]);

  // Re-check: close discard mode when no longer required
  useEffect(() => {
    if (handLimitModalOpen && (!handExceeded || !isMyTurn)) {
      closeHandLimitModal();
    }
  }, [handLimitModalOpen, handExceeded, isMyTurn, closeHandLimitModal]);

  // Failsafe: always enforce discard modal when current-turn hand exceeds limit.
  useEffect(() => {
    if (isMyTurn && handExceeded && !handLimitModalOpen && !handLimitNotification) {
      openHandLimitModal();
    }
  }, [isMyTurn, handExceeded, handLimitModalOpen, handLimitNotification, openHandLimitModal]);

  return (
    <>
      {/* Notification toast */}
      {notifVisible && shouldPromptDiscard && (
        <div
          className={`fixed top-1/3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-400 ${
            notifExiting
              ? 'opacity-0 -translate-y-12 scale-95'
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <div className="bg-mugen-danger/95 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold backdrop-blur-sm border border-red-400/30">
            Select a card from your hand to discard ({handCards.length}/{MAX_HAND_SIZE})
          </div>
        </div>
      )}
    </>
  );
}

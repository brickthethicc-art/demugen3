import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/game-store.js';
import { RESERVE_UNIT_COUNT, CardType } from '@mugen/shared';
import type { UnitCard } from '@mugen/shared';

const NOTIFICATION_DURATION_MS = 1300;

export function SummonToBenchModal() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const summonModalOpen = useGameStore((s) => s.summonModalOpen);
  const closeSummonModal = useGameStore((s) => s.closeSummonModal);
  const isMyTurn = !!gameState && gameState.players[gameState.currentPlayerIndex]?.id === playerId;

  const [notifVisible, setNotifVisible] = useState(false);
  const [notifExiting, setNotifExiting] = useState(false);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const handCards = myPlayer?.hand.cards ?? [];
  const benchSlots = myPlayer?.team.reserveUnits.length ?? 0;
  const openSlots = RESERVE_UNIT_COUNT - benchSlots;
  const playerLife = myPlayer?.life ?? 0;

  // Filter to summonable unit cards the player can afford
  const summonableCards = handCards.filter(
    (c): c is UnitCard => c.cardType === CardType.UNIT && c.cost <= playerLife
  );

  const canPromptSummon = summonModalOpen && isMyTurn && openSlots > 0 && summonableCards.length > 0;

  // Toast lifecycle while summon mode is active
  useEffect(() => {
    if (canPromptSummon) {
      setNotifVisible(true);
      setNotifExiting(false);

      notifTimerRef.current = setTimeout(() => {
        setNotifExiting(true);
        setTimeout(() => {
          setNotifVisible(false);
          setNotifExiting(false);
        }, 400);
      }, NOTIFICATION_DURATION_MS);
    } else {
      setNotifVisible(false);
      setNotifExiting(false);
    }

    return () => {
      if (notifTimerRef.current) {
        clearTimeout(notifTimerRef.current);
        notifTimerRef.current = null;
      }
    };
  }, [canPromptSummon]);

  // Clear summon mode when no longer applicable
  useEffect(() => {
    if (summonModalOpen && !canPromptSummon) {
      closeSummonModal();
    }
  }, [summonModalOpen, canPromptSummon, closeSummonModal]);

  return (
    <>
      {/* Notification toast */}
      {notifVisible && (
        <div
          className={`fixed top-1/3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-400 ${
            notifExiting
              ? 'opacity-0 -translate-y-12 scale-95'
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <div className="bg-mugen-gold/95 text-black px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold backdrop-blur-sm border border-yellow-400/30">
            Select a unit from your hand to place on bench
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/game-store.js';
import { useGameActions } from '../hooks/useGameActions.js';
import { useCardHover } from '../hooks/useUnitHover.js';
import { RESERVE_UNIT_COUNT, CardType } from '@mugen/shared';
import type { UnitCard } from '@mugen/shared';

const NOTIFICATION_DURATION_MS = 1300;

export function SummonToBenchModal() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const summonModalOpen = useGameStore((s) => s.summonModalOpen);
  const closeSummonModal = useGameStore((s) => s.closeSummonModal);
  const skipSummonModal = useGameStore((s) => s.skipSummonModal);
  const { sendSummonToBench, isMyTurn } = useGameActions();
  const { handleMouseEnter, handleMouseLeave } = useCardHover();

  const [notifVisible, setNotifVisible] = useState(false);
  const [notifExiting, setNotifExiting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [summoning, setSummoning] = useState(false);

  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const handCards = myPlayer?.hand.cards ?? [];
  const benchSlots = myPlayer?.team.reserveUnits.length ?? 0;
  const openSlots = RESERVE_UNIT_COUNT - benchSlots;
  const playerLife = myPlayer?.life ?? 0;

  // Filter to summonable unit cards the player can afford
  const summonableCards = handCards.filter(
    (c): c is UnitCard => c.cardType === CardType.UNIT && c.cost <= playerLife
  );

  // Notification → modal lifecycle
  useEffect(() => {
    if (summonModalOpen && isMyTurn && openSlots > 0) {
      // Show notification first, then modal
      setNotifVisible(true);
      setNotifExiting(false);

      notifTimerRef.current = setTimeout(() => {
        setNotifExiting(true);
        setTimeout(() => {
          setNotifVisible(false);
          setNotifExiting(false);
          setShowModal(true);
        }, 400);
      }, NOTIFICATION_DURATION_MS);
    } else {
      setShowModal(false);
      setNotifVisible(false);
    }

    return () => {
      if (notifTimerRef.current) {
        clearTimeout(notifTimerRef.current);
        notifTimerRef.current = null;
      }
    };
  }, [summonModalOpen, isMyTurn, openSlots]);

  // Close modal when no longer applicable
  useEffect(() => {
    if (showModal && (openSlots <= 0 || summonableCards.length === 0)) {
      setShowModal(false);
      closeSummonModal();
    }
  }, [showModal, openSlots, summonableCards.length, closeSummonModal]);

  const handleSummon = useCallback(
    (cardId: string) => {
      if (summoning) return;
      setSummoning(true);
      sendSummonToBench(cardId);
      // Server will broadcast updated game_state which triggers re-evaluation
      setTimeout(() => setSummoning(false), 300);
    },
    [summoning, sendSummonToBench]
  );

  const handleSkip = useCallback(() => {
    setShowModal(false);
    skipSummonModal();
  }, [skipSummonModal]);

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
            You may summon a unit from your hand to the bench
          </div>
        </div>
      )}

      {/* Summon modal overlay */}
      {showModal && summonModalOpen && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal content */}
          <div className="relative z-10 bg-mugen-surface border border-white/10 rounded-2xl shadow-2xl p-6 max-w-[720px] w-full mx-4">
            <h2 className="text-lg font-bold text-white text-center mb-1">
              Summon to Bench
            </h2>
            <p className="text-gray-400 text-sm text-center mb-1">
              Select a unit from your hand to place on the bench ({openSlots} slot{openSlots !== 1 ? 's' : ''} available)
            </p>
            <p className="text-gray-500 text-xs text-center mb-5">
              Summoning costs Life Points (LP: {playerLife})
            </p>

            {summonableCards.length === 0 ? (
              <div className="text-center text-gray-400 text-sm mb-4">
                No summonable units in hand (insufficient LP or no unit cards).
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center mb-4">
                {handCards.map((card) => {
                  const isUnit = card.cardType === CardType.UNIT;
                  const unitCard = isUnit ? (card as UnitCard) : null;
                  const canAfford = isUnit && unitCard!.cost <= playerLife;
                  const isEnabled = isUnit && canAfford && !summoning;

                  return (
                    <button
                      key={card.id}
                      disabled={!isEnabled}
                      onClick={() => isEnabled && handleSummon(card.id)}
                      onMouseEnter={() => handleMouseEnter(card)}
                      onMouseLeave={handleMouseLeave}
                      className={`flex-shrink-0 w-[136px] h-[184px] bg-mugen-bg border rounded-lg p-3 text-left transition-all ${
                        !isEnabled
                          ? 'border-white/5 opacity-40 cursor-not-allowed'
                          : 'border-white/10 cursor-pointer hover:border-mugen-gold hover:shadow-lg hover:shadow-yellow-500/20 hover:scale-105'
                      }`}
                    >
                      <div className="text-white font-semibold text-sm truncate">
                        {card.name}
                      </div>
                      <div className="flex flex-col text-xs text-gray-300 mt-1">
                        {isUnit && unitCard ? (
                          <>
                            <span>HP: {unitCard.hp}</span>
                            <span>ATK: {unitCard.atk}</span>
                          </>
                        ) : (
                          <span className="text-gray-500 italic">Sorcery</span>
                        )}
                      </div>
                      {isUnit && unitCard && (
                        <div className={`mt-2 text-xs font-bold ${
                          canAfford ? 'text-mugen-gold' : 'text-mugen-danger'
                        }`}>
                          LP Cost: {unitCard.cost}
                          {!canAfford && (
                            <span className="block text-mugen-danger text-[10px] font-normal">
                              Insufficient LP
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1 truncate">
                        {isUnit && unitCard ? unitCard.ability?.name : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleSkip}
                className="px-6 py-2 bg-mugen-bg hover:bg-mugen-bg/80 text-gray-400 rounded-lg text-sm font-medium transition border border-white/10 hover:border-white/20"
              >
                Skip Summoning
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

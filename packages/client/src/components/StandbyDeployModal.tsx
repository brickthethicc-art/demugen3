import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/game-store.js';
import { TurnPhase } from '@mugen/shared';

const NOTIFICATION_DURATION_MS = 1300;

export function StandbyDeployModal() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const standbyModalNotification = useGameStore((s) => s.standbyModalNotification);
  const setCanSelectBenchUnits = useGameStore((s) => s.setCanSelectBenchUnits);

  const [notifVisible, setNotifVisible] = useState(false);
  const [notifExiting, setNotifExiting] = useState(false);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const activeUnitCount = myPlayer?.units.filter(u => 
    u.position !== null && 
    u.position!.x >= 0 && 
    u.position!.x < (gameState?.board.width || 0) && 
    u.position!.y >= 0 && 
    u.position!.y < (gameState?.board.height || 0)
  ).length ?? 0;
  const benchUnits = myPlayer?.team.reserveUnits ?? [];
  const needsDeployment = activeUnitCount < 3 && benchUnits.length > 0;

  // Debug logging for modal rendering conditions
  const currentPlayerId = gameState?.players[gameState.currentPlayerIndex]?.id;
  const isMyTurn = currentPlayerId === playerId;
  const isStandbyPhase = gameState?.turnPhase === TurnPhase.STANDBY;
  
  console.log('=== STANDBY NOTIFICATION CHECK ===');
  console.log('currentPlayerId:', currentPlayerId);
  console.log('playerId:', playerId);
  console.log('isMyTurn:', isMyTurn);
  console.log('standbyModalNotification:', standbyModalNotification);
  console.log('isStandbyPhase:', isStandbyPhase);
  console.log('needsDeployment:', needsDeployment);
  console.log('=====================================');

  // Notification lifecycle: show -> animate out -> enable bench interaction
  useEffect(() => {
    if (standbyModalNotification && isMyTurn && isStandbyPhase && needsDeployment) {
      setNotifVisible(true);
      setNotifExiting(false);

      notifTimerRef.current = setTimeout(() => {
        setNotifExiting(true);
        // After exit animation completes, enable bench unit selection
        setTimeout(() => {
          setNotifVisible(false);
          setNotifExiting(false);
          setCanSelectBenchUnits(true); // Enable bench unit selection after notification
        }, 400);
      }, NOTIFICATION_DURATION_MS);
    }

    return () => {
      if (notifTimerRef.current) {
        clearTimeout(notifTimerRef.current);
        notifTimerRef.current = null;
      }
    };
  }, [standbyModalNotification, isMyTurn, isStandbyPhase, needsDeployment, setCanSelectBenchUnits]);

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
          <div className="bg-mugen-accent/95 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-semibold backdrop-blur-sm border border-mugen-accent/30">
            Advance a bench unit to the board
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect } from 'react';
import { useGameStore } from '../store/game-store.js';
import { TurnPhase } from '@mugen/shared';

export function StandbyDeployModal() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const standbyModalNotification = useGameStore((s) => s.standbyModalNotification);
  const setCanSelectBenchUnits = useGameStore((s) => s.setCanSelectBenchUnits);

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

  // Enable bench interaction via inline UI cues instead of a blocking popup
  useEffect(() => {
    if (standbyModalNotification && isMyTurn && isStandbyPhase && needsDeployment) {
      setCanSelectBenchUnits(true);
    }
  }, [standbyModalNotification, isMyTurn, isStandbyPhase, needsDeployment, setCanSelectBenchUnits]);

  return null;
}

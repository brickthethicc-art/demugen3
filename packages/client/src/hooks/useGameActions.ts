import { useCallback } from 'react';
import { IntentType } from '@mugen/shared';
import type { Position } from '@mugen/shared';
import { sendIntent } from '../network/socket-client.js';
import { useGameStore } from '../store/game-store.js';

export function useGameActions() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);

  const isMyTurn = gameState
    ? gameState.players[gameState.currentPlayerIndex]?.id === playerId
    : false;

  const sendMove = useCallback(
    (unitId: string, target: Position) => {
      if (!isMyTurn) return;
      sendIntent({ type: IntentType.MOVE_UNIT, unitId, target });
    },
    [isMyTurn]
  );

  const sendAbility = useCallback(
    (unitId: string, targetId?: string) => {
      if (!isMyTurn) return;
      sendIntent({ type: IntentType.USE_ABILITY, unitId, targetId });
    },
    [isMyTurn]
  );

  const sendAttack = useCallback(
    (attackerId: string, defenderId: string) => {
      if (!isMyTurn) return;
      sendIntent({ type: IntentType.ATTACK, attackerId, defenderId });
    },
    [isMyTurn]
  );

  const sendAdvancePhase = useCallback(() => {
    if (!isMyTurn) return;
    sendIntent({ type: IntentType.ADVANCE_PHASE });
  }, [isMyTurn]);

  const sendEndTurn = useCallback(() => {
    if (!isMyTurn) return;
    sendIntent({ type: IntentType.END_TURN });
  }, [isMyTurn]);

  const sendDeployReserve = useCallback(
    (unitId: string, position: Position) => {
      if (!isMyTurn) return;
      sendIntent({ type: IntentType.DEPLOY_RESERVE, unitId, position });
    },
    [isMyTurn]
  );

  return {
    isMyTurn,
    sendMove,
    sendAbility,
    sendAttack,
    sendAdvancePhase,
    sendEndTurn,
    sendDeployReserve,
  };
}

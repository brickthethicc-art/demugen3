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
    (unitId: string, targetId?: string, targetOwnerId?: string) => {
      if (!isMyTurn) return;
      sendIntent({ type: IntentType.USE_ABILITY, unitId, targetId, targetOwnerId });
    },
    [isMyTurn]
  );

  const sendAttack = useCallback(
    (attackerId: string, defenderId: string, defenderOwnerId: string) => {
      if (!isMyTurn) return;
      sendIntent({ type: IntentType.ATTACK, attackerId, defenderId, defenderOwnerId });
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

  const sendSummonToBench = useCallback(
    (cardId: string) => {
      if (!isMyTurn) return;
      sendIntent({ type: IntentType.SUMMON_TO_BENCH, cardId } as any);
    },
    [isMyTurn]
  );

  const sendPlaySorcery = useCallback(
    (cardId: string, targetUnitId?: string, targetOwnerId?: string, targetUnitId2?: string, targetOwnerId2?: string) => {
      if (!isMyTurn) return;
      sendIntent({ type: IntentType.PLAY_SORCERY, cardId, targetUnitId, targetOwnerId, targetUnitId2, targetOwnerId2 } as any);
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
    sendSummonToBench,
    sendPlaySorcery,
  };
}

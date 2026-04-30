import { useCallback } from 'react';
import { IntentType } from '@mugen/shared';
import type { Position } from '@mugen/shared';
import { sendIntent } from '../network/socket-client.js';
import { useGameStore } from '../store/game-store.js';

export function useGameActions() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const isSpectating = useGameStore((s) => s.isSpectating);

  const isMyTurn = gameState
    ? gameState.players[gameState.currentPlayerIndex]?.id === playerId
    : false;

  const currentPlayer = gameState?.players.find((player) => player.id === playerId);
  const isEliminated = currentPlayer?.isEliminated ?? false;
  const canAct = isMyTurn && !isSpectating && !isEliminated;

  const sendMove = useCallback(
    (unitId: string, target: Position) => {
      if (!canAct) return;
      sendIntent({ type: IntentType.MOVE_UNIT, unitId, target });
    },
    [canAct]
  );

  const sendAbility = useCallback(
    (unitId: string, targetId?: string, targetOwnerId?: string) => {
      if (!canAct) return;
      sendIntent({ type: IntentType.USE_ABILITY, unitId, targetId, targetOwnerId });
    },
    [canAct]
  );

  const sendAttack = useCallback(
    (attackerId: string, defenderId: string, defenderOwnerId: string) => {
      if (!canAct) return;
      sendIntent({ type: IntentType.ATTACK, attackerId, defenderId, defenderOwnerId });
    },
    [canAct]
  );

  const sendAdvancePhase = useCallback(() => {
    if (!canAct) return;
    sendIntent({ type: IntentType.ADVANCE_PHASE });
  }, [canAct]);

  const sendEndTurn = useCallback(() => {
    if (!canAct) return;
    sendIntent({ type: IntentType.END_TURN });
  }, [canAct]);

  const sendDeployReserve = useCallback(
    (unitId: string, position: Position) => {
      if (!canAct) return;
      sendIntent({ type: IntentType.DEPLOY_RESERVE, unitId, position });
    },
    [canAct]
  );

  const sendSummonToBench = useCallback(
    (cardId: string) => {
      if (!canAct) return;
      sendIntent({ type: IntentType.SUMMON_TO_BENCH, cardId } as any);
    },
    [canAct]
  );

  const sendPlaySorcery = useCallback(
    (cardId: string, targetUnitId?: string, targetOwnerId?: string, targetUnitId2?: string, targetOwnerId2?: string) => {
      if (!canAct) return;
      sendIntent({ type: IntentType.PLAY_SORCERY, cardId, targetUnitId, targetOwnerId, targetUnitId2, targetOwnerId2 } as any);
    },
    [canAct]
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

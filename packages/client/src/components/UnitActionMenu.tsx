import { useEffect } from 'react';
import { useGameStore } from '../store/game-store.js';
import { useGameActions } from '../hooks/useGameActions.js';
import { TurnPhase } from '@mugen/shared';
import { getValidMoves } from '@mugen/shared/src/engines/board/index.js';
import { ArrowRight, Sword, Zap } from 'lucide-react';

export function UnitActionMenu() {
  const { gameState, selectedUnitId, validMoves, playerId } = useGameStore((s) => ({
    gameState: s.gameState,
    selectedUnitId: s.selectedUnitId,
    validMoves: s.validMoves,
    playerId: s.playerId,
  }));
  const { isMyTurn } = useGameActions();
  const { setValidMoves, clearValidMoves, selectUnit } = useGameStore();

  // Calculate valid moves when a unit is selected
  useEffect(() => {
    if (!selectedUnitId || !gameState || !isMyTurn) {
      clearValidMoves();
      return;
    }

    // Find the selected unit
    const selectedUnit = gameState.players
      .flatMap(p => p.units)
      .find(u => u.card.id === selectedUnitId);

    if (!selectedUnit || !selectedUnit.position || selectedUnit.ownerId !== playerId) {
      clearValidMoves();
      return;
    }

    // Calculate valid moves based on current phase
    if (gameState.turnPhase === TurnPhase.MOVE && !selectedUnit.hasMovedThisTurn) {
      const moves = getValidMoves(gameState.board, selectedUnit.position, selectedUnit.card.movement);
      setValidMoves(moves);
    } else {
      clearValidMoves();
    }
  }, [selectedUnitId, gameState, isMyTurn, playerId, setValidMoves, clearValidMoves]);

  if (!selectedUnitId || !gameState || !isMyTurn) {
    return null;
  }

  // Find the selected unit
  const selectedUnit = gameState.players
    .flatMap(p => p.units)
    .find(u => u.card.id === selectedUnitId);

  if (!selectedUnit || selectedUnit.ownerId !== playerId) {
    return null;
  }

  const handleMove = () => {
    // Wait for player to click a valid move position
    // The move will be handled by GameScene's handleCellClick
  };

  const handleAttack = () => {
    // TODO: Implement attack targeting
    console.log('Attack action for unit:', selectedUnitId);
  };

  const handleAbility = () => {
    // TODO: Implement ability targeting
    console.log('Ability action for unit:', selectedUnitId);
  };

  const handleClose = () => {
    selectUnit(null);
    clearValidMoves();
  };

  // Determine available actions based on phase and unit state
  const canMove = gameState.turnPhase === TurnPhase.MOVE && !selectedUnit.hasMovedThisTurn;
  const canAttack = gameState.turnPhase === TurnPhase.ATTACK && !selectedUnit.hasAttackedThisTurn;
  const canUseAbility = gameState.turnPhase === TurnPhase.ABILITY && !selectedUnit.hasUsedAbilityThisTurn;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-mugen-surface border border-white/10 rounded-xl shadow-2xl p-4 z-50">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-mugen-accent/20 rounded-lg flex items-center justify-center">
          <span className="text-sm font-bold">{selectedUnit.card.name.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <div className="font-medium">{selectedUnit.card.name}</div>
          <div className="text-xs text-gray-400">HP: {selectedUnit.currentHp}/{selectedUnit.card.maxHp}</div>
        </div>
      </div>

      <div className="flex gap-2">
        {canMove && (
          <button
            onClick={handleMove}
            className="flex items-center gap-2 px-3 py-2 bg-mugen-accent hover:bg-mugen-accent/80 text-white rounded-lg text-sm font-medium transition"
          >
            <ArrowRight size={14} />
            Move
          </button>
        )}

        {canAttack && (
          <button
            onClick={handleAttack}
            className="flex items-center gap-2 px-3 py-2 bg-mugen-danger hover:bg-mugen-danger/80 text-white rounded-lg text-sm font-medium transition"
          >
            <Sword size={14} />
            Attack
          </button>
        )}

        {canUseAbility && (
          <button
            onClick={handleAbility}
            className="flex items-center gap-2 px-3 py-2 bg-mugen-gold hover:bg-mugen-gold/80 text-black rounded-lg text-sm font-medium transition"
          >
            <Zap size={14} />
            Ability
          </button>
        )}

        <button
          onClick={handleClose}
          className="px-3 py-2 bg-mugen-bg hover:bg-mugen-bg/80 text-gray-400 rounded-lg text-sm font-medium transition"
        >
          Cancel
        </button>
      </div>

      {validMoves.length > 0 && (
        <div className="mt-3 text-xs text-gray-400">
          Click a highlighted cell to move
        </div>
      )}
    </div>
  );
}

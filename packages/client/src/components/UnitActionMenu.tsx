import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../store/game-store.js';
import { useGameActions } from '../hooks/useGameActions.js';
import { TurnPhase } from '@mugen/shared';
import type { AbilityDefinition, UnitCard } from '@mugen/shared';
import { getValidMoves } from '@mugen/shared/src/engines/board/index.js';
import { getAbilityTargets, isSelfTargetAbility } from '@mugen/shared/src/engines/ability/index.js';
import { getAttackTargets } from '@mugen/shared/src/engines/combat/index.js';
import { ArrowRight, Sword, Zap } from 'lucide-react';

function getUnitAbilities(card: UnitCard): AbilityDefinition[] {
  return card.abilities && card.abilities.length > 0 ? card.abilities : [card.ability];
}

const CELL_SIZE = 23.4;
const MENU_WIDTH = 160;
const MENU_OFFSET = 8;

export function UnitActionMenu() {
  const { gameState, selectedUnitId, moveModeActive, menuHiddenDuringMove, validMoves, playerId, abilityModeActive, abilityTargets, isSpectating } = useGameStore((s) => ({
    gameState: s.gameState,
    selectedUnitId: s.selectedUnitId,
    moveModeActive: s.moveModeActive,
    menuHiddenDuringMove: s.menuHiddenDuringMove,
    validMoves: s.validMoves,
    playerId: s.playerId,
    abilityModeActive: s.abilityModeActive,
    abilityTargets: s.abilityTargets,
    isSpectating: s.isSpectating,
  }));
  const { sendAbility } = useGameActions();
  const { isMyTurn } = useGameActions();
  const { enterMoveMode, exitMoveMode, hideMenuDuringMove, showMenuDuringMove, setValidMoves, clearValidMoves, selectUnit, enterAbilityMode, exitAbilityMode, setAbilityTargets, clearAbilityTargets, setSelectedAbilityId, enterAttackMode, exitAttackMode, setAttackTargets, clearAttackTargets } = useGameStore();

  // Find the selected unit (scoped to local player to avoid card ID collisions across players)
  const selectedUnit = useMemo(() => {
    if (!selectedUnitId || !gameState || !playerId) return null;
    const myPlayer = gameState.players.find(p => p.id === playerId);
    return myPlayer?.units.find(u => u.card.id === selectedUnitId) ?? null;
  }, [selectedUnitId, gameState, playerId]);

  // Check if player is eliminated or spectating
  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const isEliminated = currentPlayer?.isEliminated ?? false;

  // Determine available actions based on phase and unit state
  const isMovePhase = gameState?.turnPhase === TurnPhase.MOVE;
  const hasMoved = selectedUnit?.hasMovedThisTurn;
  const canAttack = gameState?.turnPhase === TurnPhase.ATTACK && !selectedUnit?.hasAttackedThisTurn;
  const canUseAbility = gameState?.turnPhase === TurnPhase.ABILITY && !selectedUnit?.hasUsedAbilityThisTurn;

  // Track the GameBoard root's viewport rect so the menu (portaled to body) can be
  // positioned relative to the board while rendering above all other UI layers.
  const [boardRect, setBoardRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    const update = () => {
      const el = document.querySelector('[data-game-board-root="true"]') as HTMLElement | null;
      setBoardRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const interval = window.setInterval(update, 250);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.clearInterval(interval);
    };
  }, [selectedUnitId]);

  // Compute menu position: to the LEFT of the unit's cell, in viewport coordinates.
  const unitPos = selectedUnit?.position;
  const MENU_Z_INDEX = 12000;
  const menuStyle: React.CSSProperties = unitPos && boardRect
    ? {
        position: 'fixed',
        left: boardRect.left + unitPos.x * CELL_SIZE - MENU_WIDTH - MENU_OFFSET,
        top: boardRect.top + unitPos.y * CELL_SIZE,
        width: MENU_WIDTH,
        zIndex: MENU_Z_INDEX,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: MENU_Z_INDEX,
      };

  // Pre-compute whether valid moves exist for disabling the Move button
  const hasValidMoves = useMemo(() => {
    if (!isMovePhase || hasMoved || !unitPos || !gameState || !selectedUnit) return false;
    const moves = getValidMoves(gameState.board, unitPos, selectedUnit.card.movement, gameState.walls);
    return moves.length > 0;
  }, [isMovePhase, hasMoved, unitPos, gameState, selectedUnit]);

  // Resolve the unit's abilities (multi-ability support with single-ability fallback).
  const unitAbilities: AbilityDefinition[] = useMemo(
    () => (selectedUnit ? getUnitAbilities(selectedUnit.card) : []),
    [selectedUnit]
  );

  // Pre-compute valid targets per ability so each button can be independently
  // disabled when no targets exist or the ability is on cooldown.
  const abilityViews = useMemo(() => {
    if (!canUseAbility || !gameState || !selectedUnit || !playerId) {
      return [] as Array<{
        ability: AbilityDefinition;
        targets: ReturnType<typeof getAbilityTargets>;
        isSelfTarget: boolean;
        cooldown: number;
      }>;
    }
    const allUnits = gameState.players.flatMap((p) => p.units);
    return unitAbilities.map((ability) => {
      const isSelf = isSelfTargetAbility(ability.abilityType, ability.description);
      const targets = getAbilityTargets(selectedUnit, allUnits, playerId, gameState.walls, ability);
      const cooldown = selectedUnit.abilityCooldowns?.[ability.id] ?? 0;
      return { ability, targets, isSelfTarget: isSelf, cooldown };
    });
  }, [canUseAbility, gameState, selectedUnit, playerId, unitAbilities]);

  // Pre-compute valid attack targets for disabling the Attack button
  const validAttackTargets = useMemo(() => {
    if (!canAttack || !gameState || !selectedUnit || !playerId) return [];
    const allUnits = gameState.players.flatMap(p => p.units);
    return getAttackTargets(selectedUnit, allUnits, playerId, gameState.walls);
  }, [canAttack, gameState, selectedUnit, playerId]);
  const hasAttackTargets = validAttackTargets.length > 0;

  // Early return after all hooks are called
  if (!selectedUnitId || !gameState || !isMyTurn || !selectedUnit || selectedUnit.ownerId !== playerId || menuHiddenDuringMove || isEliminated || isSpectating) {
    return null;
  }

  const handleMove = () => {
    if (hasMoved || !unitPos) return;

    // Reset highlights cleanly before computing (prevents stacking)
    clearValidMoves();
    exitMoveMode();

    const moves = getValidMoves(gameState!.board, unitPos, selectedUnit!.card.movement, gameState!.walls);
    if (moves.length > 0) {
      setValidMoves(moves);
      enterMoveMode();
      
      // Hide the menu to lock player into movement mode
      // Menu will only reappear when move is completed or cancelled
      hideMenuDuringMove();
    }
  };

  const handleAttack = () => {
    if (!selectedUnit || !gameState || !playerId) return;
    if (selectedUnit.hasAttackedThisTurn) return;

    // Compute valid attack targets
    const allUnits = gameState.players.flatMap(p => p.units);
    const targets = getAttackTargets(selectedUnit, allUnits, playerId, gameState.walls);

    if (targets.length === 0) return;

    // Enter attack targeting mode
    clearValidMoves();
    exitMoveMode();
    clearAbilityTargets();
    exitAbilityMode();
    setAttackTargets(targets);
    enterAttackMode();
    hideMenuDuringMove();
  };

  const handleAbility = (
    ability: AbilityDefinition,
    targets: ReturnType<typeof getAbilityTargets>,
    isSelfTarget: boolean,
  ) => {
    if (!selectedUnit || !gameState || !playerId) return;
    if (selectedUnit.hasUsedAbilityThisTurn) return;

    // Self-target abilities activate directly without entering targeting mode.
    if (isSelfTarget) {
      sendAbility(selectedUnit.card.id, ability.id, undefined, undefined);
      selectUnit(null);
      clearValidMoves();
      exitMoveMode();
      hideMenuDuringMove();
      return;
    }

    if (targets.length === 0) return;

    // Enter ability targeting mode for the chosen ability.
    clearValidMoves();
    exitMoveMode();
    setSelectedAbilityId(ability.id);
    setAbilityTargets(targets);
    enterAbilityMode();
    hideMenuDuringMove();
  };

  const handleClose = () => {
    selectUnit(null);
    clearValidMoves();
    exitMoveMode();
    exitAbilityMode();
    clearAbilityTargets();
    exitAttackMode();
    clearAttackTargets();
    showMenuDuringMove();
  };

  // Move button is always shown in MOVE phase, but disabled when already moved or no valid moves
  const moveDisabled = hasMoved || !hasValidMoves;

  return createPortal(
    <div
      style={menuStyle}
      className="bg-mugen-surface border border-white/10 rounded-xl shadow-2xl p-3 pointer-events-auto"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-mugen-accent/20 rounded-lg flex items-center justify-center">
          <span className="text-sm font-bold">{selectedUnit.card.name.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <div className="font-medium text-sm">{selectedUnit.card.name}</div>
          <div className="text-xs text-gray-400">HP: {selectedUnit.currentHp}/{selectedUnit.card.maxHp}</div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {isMovePhase && (
          <button
            onClick={handleMove}
            disabled={moveDisabled}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition w-full ${
              moveDisabled
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-mugen-accent hover:bg-mugen-accent/80 text-white cursor-pointer'
            }`}
          >
            <ArrowRight size={14} />
            Move{hasMoved ? ' (done)' : ''}
          </button>
        )}

        {canAttack && (
          <div className="flex flex-col gap-1">
            <button
              onClick={handleAttack}
              disabled={!hasAttackTargets}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition w-full ${
                !hasAttackTargets
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-mugen-danger hover:bg-mugen-danger/80 text-white cursor-pointer'
              }`}
            >
              <Sword size={14} />
              Attack
            </button>
            {!hasAttackTargets && (
              <div className="text-xs text-mugen-danger px-1">No enemies in range</div>
            )}
          </div>
        )}

        {canUseAbility && abilityViews.map(({ ability, targets, isSelfTarget, cooldown }) => {
          const onCooldown = cooldown > 0;
          const noTargets = !isSelfTarget && targets.length === 0;
          const disabled = onCooldown || noTargets;
          return (
            <div key={ability.id} className="flex flex-col gap-1">
              <button
                onClick={() => handleAbility(ability, targets, isSelfTarget)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition w-full ${
                  disabled
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-mugen-gold hover:bg-mugen-gold/80 text-black cursor-pointer'
                }`}
              >
                <Zap size={14} />
                <span className="flex-1 text-left">{ability.name}</span>
                {onCooldown && (
                  <span className="text-[10px] font-bold bg-black/40 text-white rounded px-1.5 py-0.5">
                    {cooldown}t
                  </span>
                )}
              </button>
              {onCooldown && (
                <div className="text-xs text-mugen-danger px-1">
                  On cooldown ({cooldown} {cooldown === 1 ? 'turn' : 'turns'})
                </div>
              )}
              {!onCooldown && noTargets && (
                <div className="text-xs text-mugen-danger px-1">No valid targets in range</div>
              )}
            </div>
          );
        })}

        <button
          onClick={handleClose}
          className="px-3 py-2 bg-mugen-bg hover:bg-mugen-bg/80 text-gray-400 rounded-lg text-sm font-medium transition w-full"
        >
          Cancel
        </button>
      </div>

      {moveModeActive && validMoves.length > 0 && (
        <div className="mt-2 text-xs text-mugen-accent">
          Click a highlighted cell to move
        </div>
      )}
      {abilityModeActive && abilityTargets.length > 0 && (
        <div className="mt-2 text-xs text-mugen-gold">
          Click a highlighted unit to use ability
        </div>
      )}
    </div>,
    document.body,
  );
}

import { useEffect, useMemo, useState } from 'react';
import { CardType, TurnPhase } from '@mugen/shared';
import type { UnitCard } from '@mugen/shared';
import { GameBoard } from '../GameBoard.js';
import { useGameStore } from '../../store/game-store.js';

const BOARD_SIZE_PX = 736;

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="inline-flex min-w-0 items-center gap-1 rounded border border-white/10 bg-black/20 px-1.5 py-1 text-[11px] leading-none">
      <span className="text-[9px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className="truncate font-semibold text-white">{value}</span>
    </div>
  );
}

function CompactUnitStats({ unit, hp }: { unit: UnitCard; hp: number }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatChip label="NAME" value={unit.name} />
        <StatChip label="HP" value={hp} />
        <StatChip label="ATK" value={unit.atk} />
        <StatChip label="COST" value={unit.cost} />
        <StatChip label="MOVEMENT" value={unit.movement} />
        <StatChip label="RANGE" value={unit.range} />
      </div>
      <div className="mt-1.5 border-t border-white/10 pt-1.5 text-[10px] italic font-serif leading-snug text-blue-200/90">
        ABILITY - {unit.ability.description}
      </div>
    </>
  );
}

export function MobileGameScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const hoveredCard = useGameStore((s) => s.hoveredCard);
  const hoveredUnitInstance = useGameStore((s) => s.hoveredUnitInstance);
  const benchUnits = useGameStore((s) => s.benchUnits);
  const canSelectBenchUnits = useGameStore((s) => s.canSelectBenchUnits);
  const isSpectating = useGameStore((s) => s.isSpectating);
  const enterDeploymentMode = useGameStore((s) => s.enterDeploymentMode);

  const [selectedBenchUnit, setSelectedBenchUnit] = useState<UnitCard | null>(null);
  const [boardScale, setBoardScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const availableWidth = Math.max(320, window.innerWidth - 12);
      const scaled = Math.min(1, availableWidth / BOARD_SIZE_PX);
      setBoardScale(Math.max(0.44, scaled));
    };

    updateScale();
    window.addEventListener('resize', updateScale);

    return () => {
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  useEffect(() => {
    if (!selectedBenchUnit) return;

    const unitStillInBench = benchUnits.some((unit) => unit.id === selectedBenchUnit.id);
    if (!unitStillInBench) {
      setSelectedBenchUnit(null);
    }
  }, [benchUnits, selectedBenchUnit]);

  const currentPlayer = gameState?.players.find((p) => p.id === playerId);
  const reserveLocked = currentPlayer?.reserveLockedUntilNextTurn ?? false;
  const isEliminated = currentPlayer?.isEliminated ?? false;
  const isMyTurn = gameState?.players[gameState.currentPlayerIndex]?.id === playerId;
  const isStandby = gameState?.turnPhase === TurnPhase.STANDBY;

  const activeUnitCount =
    currentPlayer?.units.filter(
      (unit) =>
        unit.position !== null &&
        unit.position.x >= 0 &&
        unit.position.x < (gameState?.board.width ?? 0) &&
        unit.position.y >= 0 &&
        unit.position.y < (gameState?.board.height ?? 0)
    ).length ?? 0;

  const canDeploy =
    !!isMyTurn &&
    !!isStandby &&
    activeUnitCount < 3 &&
    canSelectBenchUnits &&
    !reserveLocked &&
    !isEliminated &&
    !isSpectating;

  const activeUnit = useMemo(() => {
    if (!hoveredCard || hoveredCard.cardType !== CardType.UNIT) {
      return null;
    }

    return hoveredCard as UnitCard;
  }, [hoveredCard]);

  const activeUnitHp = hoveredUnitInstance?.currentHp ?? activeUnit?.hp ?? 0;

  const benchSlots: Array<UnitCard | null> = [
    benchUnits[0] ?? null,
    benchUnits[1] ?? null,
    benchUnits[2] ?? null,
  ];

  return (
    <div className="min-h-screen bg-mugen-bg px-1.5 py-2 text-white">
      <div className="mx-auto w-full max-w-[460px] space-y-2 overflow-x-hidden">
        <div
          className="mx-auto overflow-hidden rounded-xl border border-white/10"
          style={{
            width: BOARD_SIZE_PX * boardScale,
            height: BOARD_SIZE_PX * boardScale,
            maxWidth: '100%',
          }}
        >
          <div
            style={{
              width: BOARD_SIZE_PX,
              height: BOARD_SIZE_PX,
              transform: `scale(${boardScale})`,
              transformOrigin: 'top left',
            }}
          >
            <GameBoard />
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-gray-900/85 px-2 py-1.5">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Active Unit</div>
          {activeUnit ? (
            <CompactUnitStats unit={activeUnit} hp={activeUnitHp} />
          ) : (
            <div className="text-[11px] text-gray-400">Tap a board unit to view compact stats.</div>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-gray-900/90 px-1.5 py-1.5">
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-gray-400">
            <span>Reserve Bench</span>
            <span>{benchUnits.length}/3</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {benchSlots.map((unit, index) => {
              if (!unit) {
                return (
                  <div
                    key={`empty-slot-${index}`}
                    className="flex h-[108px] items-center justify-center rounded-md border border-dashed border-white/10 bg-gray-800/25 text-[10px] text-gray-600"
                  >
                    Empty
                  </div>
                );
              }

              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedBenchUnit(unit)}
                  className={`h-[108px] min-w-0 rounded-md border px-1.5 py-1 text-left transition-all active:scale-[0.98] ${
                    canDeploy
                      ? 'border-green-500/50 bg-gray-800/95 shadow-[0_0_6px_rgba(34,197,94,0.35)]'
                      : 'border-white/15 bg-gray-800/70'
                  }`}
                >
                  <div className="truncate text-[11px] font-semibold text-white">{unit.name}</div>
                  <div className="mt-0.5 text-[10px] text-gray-300">HP: {unit.hp}</div>
                  <div className="text-[10px] text-gray-300">Cost: {unit.cost}</div>
                  <div className="mt-1 overflow-hidden text-[10px] leading-tight text-gray-400">ABILITY: {unit.ability.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedBenchUnit && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/70 p-2" onClick={() => setSelectedBenchUnit(null)}>
          <div
            className="w-full max-w-[560px] rounded-xl border border-white/10 bg-mugen-surface p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 text-sm font-semibold text-white">Bench Unit</div>

            <CompactUnitStats unit={selectedBenchUnit} hp={selectedBenchUnit.hp} />

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedBenchUnit(null)}
                className="rounded-md border border-white/10 bg-mugen-bg px-3 py-1.5 text-xs text-gray-300"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!canDeploy}
                onClick={() => {
                  if (canDeploy) {
                    enterDeploymentMode(selectedBenchUnit);
                    setSelectedBenchUnit(null);
                  }
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  canDeploy
                    ? 'bg-mugen-success text-black'
                    : 'cursor-not-allowed bg-gray-700 text-gray-500'
                }`}
              >
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useGameStore } from '../store/game-store.js';
import { useUnitHover } from '../hooks/useUnitHover.js';
import { TurnPhase } from '@mugen/shared';
import type { UnitCard } from '@mugen/shared';

export function BenchUnits() {
  const benchUnits = useGameStore(state => state.benchUnits);
  const gameState = useGameStore(state => state.gameState);
  const playerId = useGameStore(state => state.playerId);
  const { handleMouseEnter, handleMouseLeave } = useUnitHover();
  const { enterDeploymentMode } = useGameStore();
  const canSelectBenchUnits = useGameStore(state => state.canSelectBenchUnits);
  const isSpectating = useGameStore(state => state.isSpectating);
  
  // Check if it's the player's turn and they can deploy reserves
  const isMyTurn = gameState?.players[gameState.currentPlayerIndex]?.id === playerId;
  const isStandby = gameState?.turnPhase === TurnPhase.STANDBY;
  
  // Find the current player to check reserve lock and active unit count
  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const reserveLocked = currentPlayer?.reserveLockedUntilNextTurn ?? false;
  const isEliminated = currentPlayer?.isEliminated ?? false;
  const activeUnitCount = currentPlayer?.units.filter(u => 
    u.position !== null && 
    u.position!.x >= 0 && 
    u.position!.x < (gameState?.board.width || 0) && 
    u.position!.y >= 0 && 
    u.position!.y < (gameState?.board.height || 0)
  ).length ?? 0;
  
  // CORRECTED BEHAVIOR: Bench units are clickable when notification has disappeared
  // AND all other conditions are met (turn ownership, standby phase, active units < 3, etc.)
  const canDeploy = isMyTurn && 
                     isStandby && 
                     activeUnitCount < 3 && 
                     canSelectBenchUnits && 
                     !reserveLocked &&
                     !isEliminated &&
                     !isSpectating;
  
  // Debug logging for bench unit interaction
  console.log('=== BENCH UNIT INTERACTION CHECK ===');
  console.log('playerId:', playerId);
  console.log('isMyTurn:', isMyTurn);
  console.log('isStandby:', isStandby);
  console.log('activeUnitCount:', activeUnitCount);
  console.log('canSelectBenchUnits:', canSelectBenchUnits);
  console.log('reserveLocked:', reserveLocked);
  console.log('canDeploy:', canDeploy);
  console.log('=====================================');

  if (benchUnits.length === 0) {
    return (
      <div 
        data-testid="bench-units-container"
        className="w-[583px] bg-gray-900/90 border border-white/10 px-4 py-2"
      >
        <div className="text-gray-400 text-sm">No bench units</div>
      </div>
    );
  }

  return (
    <div 
      data-testid="bench-units-container"
      className="w-[583px] bg-gray-900/90 border border-white/10 px-4 py-2"
    >
      <div className="flex flex-row justify-between items-center -mt-[4px]">
        {benchUnits.map((unit: UnitCard) => (
          <div
            key={unit.id}
            data-testid="bench-unit"
            className={`bg-gray-800 border rounded p-3 transition-colors w-[136px] h-[184px] ${
              canDeploy && !reserveLocked
                ? 'cursor-pointer hover:bg-gray-700 hover:border-green-500 border-white/20'
                : 'cursor-not-allowed opacity-50 border-gray-600'
            } ${
              canDeploy && !reserveLocked
                ? 'animate-pulse ring-2 ring-white/70 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                : ''
            }`}
            onMouseEnter={() => handleMouseEnter(unit)}
            onMouseLeave={handleMouseLeave}
            onClick={() => {
              // CORRECTED BEHAVIOR: Bench units are clickable after notification disappears
              // when all conditions are met (turn ownership, standby phase, active units < 3, etc.)
              if (!canDeploy) {
                console.log('Bench unit click blocked: conditions not met');
                return;
              }
              
              // Enter deployment mode - the user will need to click on the board to place the unit
              console.log('Bench unit click allowed: entering deployment mode for', unit.name);
              enterDeploymentMode(unit);
            }}
          >
            <div className="text-white font-semibold text-sm truncate">{unit.name}</div>
            <div className="flex flex-col text-xs text-gray-300 mt-1">
              <span>HP: {unit.hp}</span>
              <span>ATK: {unit.atk}</span>
              <span>Cost: {unit.cost}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1 truncate">
              {unit.ability.name}
            </div>
          </div>
        ))}
        {/* Empty slots to maintain 3-slot layout */}
        {Array.from({ length: Math.max(0, 3 - benchUnits.length) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="bg-gray-800/30 border border-white/10 rounded p-3 w-[136px] h-[184px]"
            style={{ visibility: 'hidden' }}
          >
            <div className="text-gray-500 text-sm">Empty Slot</div>
          </div>
        ))}
      </div>
    </div>
  );
}

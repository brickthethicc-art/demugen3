import { useGameStore } from '../store/game-store.js';
import { useUnitHover } from '../hooks/useUnitHover.js';
import type { UnitCard } from '@mugen/shared';

export function BenchUnits() {
  const benchUnits = useGameStore(state => state.benchUnits);
  const { handleMouseEnter, handleMouseLeave } = useUnitHover();

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
            className="bg-gray-800 border border-white/20 rounded p-3 cursor-pointer hover:bg-gray-700 hover:border-red-500 transition-colors w-[136px] h-[184px]"
            onMouseEnter={() => handleMouseEnter(unit)}
            onMouseLeave={handleMouseLeave}
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

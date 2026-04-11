import { useGameStore } from '../store/game-store.js';
import { CardType } from '@mugen/shared';
import type { UnitCard } from '@mugen/shared';
import { Coins, Users, Shield, Swords } from 'lucide-react';

export function StartingUnitSelection() {
  const { selectedDeck, startingUnits, setStartingUnits, confirmStartingUnits } = useGameStore();

  // Filter only unit cards from deck
  const availableUnits = selectedDeck?.filter(card => card.cardType === CardType.UNIT) as UnitCard[] || [];

  const totalCost = startingUnits.reduce((sum, unit) => sum + unit.cost, 0);
  const isValidSelection = startingUnits.length === 6 && totalCost < 40;

  const toggleUnitSelection = (unit: UnitCard) => {
    const isSelected = startingUnits.some(u => u.id === unit.id);
    
    if (isSelected) {
      // Remove from selection
      setStartingUnits(startingUnits.filter(u => u.id !== unit.id));
    } else if (startingUnits.length < 6) {
      // Add to selection
      setStartingUnits([...startingUnits, unit]);
    }
    // If already have 6, don't add more (could show toast)
  };

  const selectedUnitIds = new Set(startingUnits.map(u => u.id));

  return (
    <div className="min-h-screen bg-mugen-bg text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Select 6 Starting Units</h1>
        
        {/* Selection Status */}
        <div className="bg-mugen-surface/50 rounded-xl p-6 mb-8 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-mugen-accent" />
                <span className="font-semibold">Selected: {startingUnits.length} / 6</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins size={20} className="text-mugen-gold" />
                <span className={`font-semibold ${totalCost >= 40 ? 'text-mugen-danger' : 'text-mugen-gold'}`}>
                  Total Cost: {totalCost} / 40
                </span>
              </div>
            </div>
            <button
              onClick={confirmStartingUnits}
              disabled={!isValidSelection}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                isValidSelection
                  ? 'bg-mugen-accent hover:bg-mugen-accent/80 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Confirm Selection
            </button>
          </div>
          
          {totalCost >= 40 && (
            <div className="text-mugen-danger text-sm">
              Cost exceeds limit! Total must be less than 40.
            </div>
          )}
          
          {startingUnits.length > 6 && (
            <div className="text-mugen-danger text-sm">
              Too many units selected! Select exactly 6.
            </div>
          )}
        </div>

        {/* Available Units */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availableUnits.map((unit) => {
            const isSelected = selectedUnitIds.has(unit.id);
            
            return (
              <div
                key={unit.id}
                onClick={() => toggleUnitSelection(unit)}
                className={`bg-mugen-surface/50 rounded-lg p-4 border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-mugen-accent shadow-lg shadow-mugen-accent/20'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm truncate">{unit.name}</h3>
                  <div className="flex items-center gap-1 text-mugen-gold">
                    <Coins size={14} />
                    <span className="text-xs font-mono">{unit.cost}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Swords size={12} />
                    <span>{unit.atk}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield size={12} />
                    <span>{unit.hp}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>MOV</span>
                    <span>{unit.movement}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>RNG</span>
                    <span>{unit.range}</span>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  <div className="truncate">{unit.ability.name}</div>
                </div>
                
                {isSelected && (
                  <div className="mt-2 text-xs text-mugen-accent font-semibold">
                    SELECTED
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Units Preview */}
        {startingUnits.length > 0 && (
          <div className="mt-8 bg-mugen-surface/30 rounded-xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold mb-4">Your Starting Units</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {startingUnits.map((unit, index) => (
                <div key={unit.id} className="text-center">
                  <div className="bg-mugen-surface/50 rounded-lg p-3 border border-mugen-accent/50">
                    <div className="font-semibold text-sm truncate">{unit.name}</div>
                    <div className="text-xs text-mugen-gold font-mono mt-1">{unit.cost} LP</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {index < 3 ? 'Active' : 'Reserve'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

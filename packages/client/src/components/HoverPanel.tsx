import { useGameStore } from '../store/game-store.js';
import type { UnitCard } from '@mugen/shared';

export function HoverPanel() {
  const hoveredCard = useGameStore(state => state.hoveredCard);

  if (!hoveredCard) {
    return (
      <div 
        data-testid="hover-panel"
        className="fixed left-0 top-1/2 -translate-y-1/2 w-80 bg-gray-900/90 border-r border-white/10 p-6"
      >
        <div className="text-gray-500 text-sm text-center">Hover over a unit to see details</div>
      </div>
    );
  }

  // Only show unit details for unit cards
  if (hoveredCard.cardType !== 'UNIT') {
    return (
      <div 
        data-testid="hover-panel"
        className="fixed left-0 top-1/2 -translate-y-1/2 w-80 bg-gray-900/90 border-r border-white/10 p-6"
      >
        <div className="text-gray-500 text-sm text-center">Non-unit cards not supported in hover panel</div>
      </div>
    );
  }

  const unitCard = hoveredCard as UnitCard;

  return (
    <div 
      data-testid="hover-panel"
      className="fixed left-0 top-1/2 -translate-y-1/2 w-80 bg-gray-900/90 border-r border-white/10 p-6"
    >
      <div className="text-white">
        <h2 className="text-xl font-bold mb-4 text-red-400">{unitCard.name}</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">HP:</span>
            <span className="font-semibold">{unitCard.hp}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">ATK:</span>
            <span className="font-semibold">{unitCard.atk}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Movement:</span>
            <span className="font-semibold">{unitCard.movement}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Range:</span>
            <span className="font-semibold">{unitCard.range}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Cost:</span>
            <span className="font-semibold text-yellow-400">{unitCard.cost}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/20">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Ability</h3>
          <div className="bg-gray-800 rounded p-3">
            <div className="font-semibold text-blue-400 mb-1">{unitCard.ability.name}</div>
            <div className="text-xs text-gray-300 mb-2">{unitCard.ability.description}</div>
            <div className="text-xs text-yellow-400">Cost: {unitCard.ability.cost}</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-xs text-gray-500">
            Card ID: {unitCard.id}
          </div>
        </div>
      </div>
    </div>
  );
}

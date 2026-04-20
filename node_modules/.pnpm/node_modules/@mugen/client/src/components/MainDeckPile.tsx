import { useGameStore } from '../store/game-store.js';
import { useEffect, useRef } from 'react';

export function MainDeckPile() {
  const mainDeck = useGameStore(state => state.mainDeck);
  const gameState = useGameStore(state => state.gameState);
  const playerId = useGameStore(state => state.playerId);
  const count = mainDeck.length;

  // Debug logging
  console.log('MainDeckPile: gameState phase:', gameState?.phase);
  console.log('MainDeckPile: playerId:', playerId);
  console.log('MainDeckPile: mainDeck data:', mainDeck);
  console.log('MainDeckPile: count:', count);

  // Track changes over time
  useEffect(() => {
    console.log('MainDeckPile: useEffect triggered, count changed to:', count);
  }, [count]);

  // Force re-render test
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log('MainDeckPile: Render #', renderCount.current, 'with count:', count);

  return (
    <div
      data-testid="main-deck-pile"
      className="w-[136px] h-[184px] bg-gray-800 border-2 border-white/20 rounded-lg flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Stacked card effect */}
      {count > 0 && (
        <>
          <div className="absolute inset-1 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded border border-indigo-700/40" />
          <div className="absolute inset-1 translate-x-0.5 translate-y-0.5 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded border border-indigo-700/30 -z-10" />
        </>
      )}
      <div className="relative z-10 flex flex-col items-center">
        <span className="text-white text-2xl font-bold">{count}</span>
        <span className="text-gray-400 text-xs mt-1">Deck</span>
        {count === 0 && (
          <div className="text-red-400 text-xs mt-1">NO CARDS</div>
        )}
        {gameState && (
          <div className="text-green-400 text-xs mt-1">
            Phase: {gameState.phase}
          </div>
        )}
      </div>
    </div>
  );
}

import { useGameStore } from '../store/game-store.js';

export function DiscardPile() {
  const discardPile = useGameStore(state => state.discardPile);
  const count = discardPile.length;
  const topCard = count > 0 ? discardPile[count - 1] : null;

  return (
    <div
      data-testid="discard-pile"
      className="w-[136px] h-[184px] bg-gray-900 border-2 border-white/10 rounded-lg flex flex-col items-center justify-center relative overflow-hidden"
    >
      {topCard && (
        <div className="absolute inset-1 bg-gradient-to-br from-red-900/60 to-gray-900 rounded border border-red-700/30" />
      )}
      <div className="relative z-10 flex flex-col items-center text-center px-1">
        {topCard ? (
          <>
            <span className="text-white text-xs font-semibold truncate w-full">{topCard.name}</span>
            <span className="text-gray-300 text-2xl font-bold mt-1">{count}</span>
          </>
        ) : (
          <span className="text-gray-500 text-2xl font-bold">{count}</span>
        )}
        <span className="text-gray-400 text-xs mt-1">Discard</span>
      </div>
    </div>
  );
}

import { Trophy, LogOut } from 'lucide-react';
import { useGameStore } from '../store/game-store.js';

export function VictoryModal() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const setScreen = useGameStore((s) => s.setScreen);
  const reset = useGameStore((s) => s.reset);

  if (!gameState || gameState.phase !== 'ENDED') {
    return null;
  }

  const isWinner = gameState.winnerId === playerId;
  if (!isWinner) {
    return null;
  }

  const handleReturnToMainMenu = () => {
    reset();
    setScreen('main-menu');
  };

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/75">
      <div className="w-full max-w-md rounded-2xl border border-mugen-gold/30 bg-mugen-surface p-8 text-center shadow-2xl">
        <Trophy size={64} className="mx-auto mb-4 text-mugen-gold" />
        <h2 className="mb-3 text-3xl font-bold text-mugen-gold">Victory! You Won!</h2>
        <p className="mb-8 text-gray-300">You are the last player standing.</p>

        <button
          onClick={handleReturnToMainMenu}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-mugen-accent px-4 py-3 font-medium transition hover:bg-mugen-accent/80"
        >
          <LogOut size={18} /> Return to Main Menu
        </button>
      </div>
    </div>
  );
}

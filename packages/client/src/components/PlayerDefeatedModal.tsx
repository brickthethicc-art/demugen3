import { useEffect, useState } from 'react';
import { useGameStore } from '../store/game-store.js';
import { LogOut, Eye } from 'lucide-react';

export function PlayerDefeatedModal() {
  const gameState = useGameStore((s) => s.gameState);
  const playerDefeatedModalOpen = useGameStore((s) => s.playerDefeatedModalOpen);
  const closePlayerDefeatedModal = useGameStore((s) => s.closePlayerDefeatedModal);
  const setSpectating = useGameStore((s) => s.setSpectating);
  const setScreen = useGameStore((s) => s.setScreen);
  const reset = useGameStore((s) => s.reset);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!playerDefeatedModalOpen) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [playerDefeatedModalOpen]);

  // CRITICAL: Only render modal if explicitly opened via store state
  if (!gameState || !playerDefeatedModalOpen || !visible) return null;

  const alivePlayers = gameState.players.filter((p) => !p.isEliminated);
  const canSpectate = alivePlayers.length >= 1;

  const handleLeaveGame = () => {
    closePlayerDefeatedModal();
    reset();
    setScreen('main-menu');
  };

  const handleSpectate = () => {
    closePlayerDefeatedModal();
    setSpectating(true);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-mugen-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/5 text-center">
        <h2 className="text-3xl font-bold mb-4 text-mugen-danger">You have lost</h2>
        <p className="text-gray-400 mb-8">
          Your life points have reached 0.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleLeaveGame}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg font-medium transition"
          >
            <LogOut size={18} /> Return to Main Menu
          </button>

          {canSpectate && (
            <button
              onClick={handleSpectate}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-mugen-bg hover:bg-mugen-bg/80 border border-white/10 rounded-lg font-medium transition"
            >
              <Eye size={18} /> Spectate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

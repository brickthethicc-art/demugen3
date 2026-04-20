import { useGameStore } from '../store/game-store.js';
import { Trophy, RotateCcw } from 'lucide-react';

export function GameOverScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const reset = useGameStore((s) => s.reset);

  if (!gameState) return null;

  const winner = gameState.players.find((p) => p.id === gameState.winnerId);
  const isWinner = winner?.id === playerId;

  return (
    <div className="min-h-screen flex items-center justify-center bg-mugen-bg">
      <div className="bg-mugen-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/5 text-center">
        <Trophy
          size={64}
          className={`mx-auto mb-4 ${isWinner ? 'text-mugen-gold' : 'text-gray-500'}`}
        />
        <h2 className="text-3xl font-bold mb-2">
          {isWinner ? 'Victory!' : 'Defeat'}
        </h2>
        <p className="text-gray-400 mb-6">
          {winner ? `${winner.name} wins!` : 'Game Over'}
        </p>

        <div className="space-y-3 mb-8">
          {gameState.players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                p.id === winner?.id
                  ? 'border-mugen-gold/50 bg-mugen-gold/5'
                  : 'border-white/5 bg-mugen-bg'
              }`}
            >
              <span className="font-medium">{p.name}</span>
              <span className={`text-sm ${p.isEliminated ? 'text-mugen-danger' : 'text-mugen-success'}`}>
                {p.isEliminated ? 'Eliminated' : `${p.life} HP`}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg font-medium transition"
        >
          <RotateCcw size={18} /> Return to Lobby
        </button>
      </div>
    </div>
  );
}

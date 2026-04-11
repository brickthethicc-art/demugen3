import { useGameStore } from '../store/game-store.js';
import { useGameActions } from '../hooks/useGameActions.js';
import { TurnPhase } from '@mugen/shared';
import { Heart, Zap, ArrowRight, SkipForward } from 'lucide-react';

const PHASE_LABELS: Record<string, string> = {
  [TurnPhase.MOVE]: 'Move Phase',
  [TurnPhase.ABILITY]: 'Ability Phase',
  [TurnPhase.ATTACK]: 'Attack Phase',
  [TurnPhase.END]: 'End Phase',
};


function HandDisplay() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const myPlayer = gameState?.players.find((p) => p.id === playerId);

  if (!myPlayer || myPlayer.hand.cards.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic p-2">No cards in hand</div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {myPlayer.hand.cards.map((card) => (
        <div
          key={card.id}
          className="flex-shrink-0 w-36 bg-mugen-bg border border-white/10 rounded-lg p-3"
        >
          <div className="font-medium text-xs truncate">{card.name}</div>
          <div className="text-xs text-gray-400 mt-1">Cost: {card.cost}</div>
        </div>
      ))}
    </div>
  );
}

function LifeCounter() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const life = myPlayer?.life ?? 0;
  const maxLife = myPlayer?.maxLife ?? 24;
  const pct = maxLife > 0 ? (life / maxLife) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <Heart size={20} className={life <= 5 ? 'text-mugen-danger animate-pulse' : 'text-mugen-danger'} />
      <div className="flex-1">
        <div className="h-2 bg-mugen-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct > 50 ? 'bg-mugen-success' : pct > 25 ? 'bg-mugen-gold' : 'bg-mugen-danger'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-mono font-bold">{life}</span>
    </div>
  );
}

function TurnIndicator() {
  const gameState = useGameStore((s) => s.gameState);
  const { isMyTurn } = useGameActions();

  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const phase = PHASE_LABELS[gameState.turnPhase] ?? gameState.turnPhase;

  return (
    <div className={`rounded-lg px-4 py-2 text-sm font-medium ${
      isMyTurn ? 'bg-mugen-accent/20 text-mugen-accent border border-mugen-accent/30' : 'bg-mugen-bg text-gray-400 border border-white/5'
    }`}>
      <div className="flex items-center gap-2">
        <Zap size={14} />
        <span>{isMyTurn ? 'Your Turn' : `${currentPlayer?.name}'s Turn`}</span>
        <span className="text-xs opacity-60">• {phase}</span>
      </div>
    </div>
  );
}

function PhaseControls() {
  const { isMyTurn, sendAdvancePhase, sendEndTurn } = useGameActions();
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState || !isMyTurn) return null;

  return (
    <div className="flex gap-2">
      {gameState.turnPhase !== TurnPhase.END && (
        <button
          onClick={sendAdvancePhase}
          className="flex items-center gap-1.5 px-4 py-2 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg text-sm font-medium transition"
        >
          <ArrowRight size={14} /> Next Phase
        </button>
      )}
      <button
        onClick={sendEndTurn}
        className="flex items-center gap-1.5 px-4 py-2 bg-mugen-gold hover:bg-mugen-gold/80 text-black rounded-lg text-sm font-bold transition"
      >
        <SkipForward size={14} /> End Turn
      </button>
    </div>
  );
}

export function GameHUD() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const error = useGameStore((s) => s.error);
  const clearError = useGameStore((s) => s.clearError);

  if (!gameState) return null;

  const opponents = gameState.players.filter((p) => p.id !== playerId);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Top bar: turn indicator + opponent info */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-3">
            <TurnIndicator />
            <div className="flex items-center gap-4">
              <div className="w-48">
                <LifeCounter />
              </div>
              <PhaseControls />
            </div>
          </div>
          <div className="flex gap-2">
            {opponents.map((p) => (
              <div
                key={p.id}
                className={`bg-mugen-surface border border-white/5 rounded-lg px-3 py-2 text-sm ${
                  p.isEliminated ? 'opacity-40 line-through' : ''
                }`}
              >
                <div className="font-medium">{p.name}</div>
                <div className="flex items-center gap-1 text-mugen-danger text-xs">
                  <Heart size={10} /> {p.life}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      
      
      {/* Bottom: hand only */}
      <div className="absolute left-0 p-6 pointer-events-auto" style={{ right: '50%', maxWidth: 'calc(50% - 128px)', bottom: '-12px' }}>
        <div className="bg-mugen-surface/90 backdrop-blur-sm rounded-xl border border-white/5 px-6 pb-6 pt-[101px] w-full">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Hand</h3>
            <HandDisplay />
          </div>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={clearError}
            className="bg-mugen-danger/90 text-white px-4 py-2 rounded-lg text-sm shadow-lg"
          >
            {error} ✕
          </button>
        </div>
      )}
    </div>
  );
}

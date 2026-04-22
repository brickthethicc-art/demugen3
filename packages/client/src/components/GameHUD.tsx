import { useGameStore } from '../store/game-store.js';
import { useGameActions } from '../hooks/useGameActions.js';
import { useCardHover } from '../hooks/useUnitHover.js';
import { TurnPhase } from '@mugen/shared';
import { Heart, Zap, ArrowRight, SkipForward } from 'lucide-react';

const PHASE_LABELS: Record<string, string> = {
  [TurnPhase.STANDBY]: 'Standby Phase',
  [TurnPhase.MOVE]: 'Move Phase',
  [TurnPhase.ABILITY]: 'Ability Phase',
  [TurnPhase.ATTACK]: 'Attack Phase',
  [TurnPhase.END]: 'End Phase',
};


function HandDisplay() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const { handleMouseEnter, handleMouseLeave } = useCardHover();

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
          className="flex-shrink-0 w-[136px] h-[184px] bg-mugen-bg border border-white/10 rounded-lg p-3 cursor-pointer hover:border-mugen-accent/50 transition-colors"
          onMouseEnter={() => handleMouseEnter(card)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="text-white font-semibold text-sm truncate">{card.name}</div>
          <div className="flex flex-col text-xs text-gray-300 mt-1">
            {card.cardType === 'UNIT' ? (
              <>
                <span>HP: {card.hp}</span>
                <span>ATK: {card.atk}</span>
                <span>Cost: {card.cost}</span>
              </>
            ) : (
              <span>Cost: {card.cost}</span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1 truncate">
            {card.cardType === 'UNIT' ? card.ability?.name : card.effect}
          </div>
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

function PlayerList() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);

  if (!gameState) return null;

  // Map player colors to CSS colors
  const colorMap: Record<string, string> = {
    red: '#ef4444',
    blue: '#6366f1', 
    yellow: '#f59e0b',
    green: '#22c55e',
  };

  // Get player color from their first active unit, or default to blue
  const getPlayerColor = (player: any) => {
    const firstUnit = player.team.activeUnits[0];
    if (firstUnit && firstUnit.color && colorMap[firstUnit.color]) {
      return colorMap[firstUnit.color];
    }
    return colorMap.blue; // default color
  };

  return (
    <div className="bg-mugen-surface/50 rounded-lg border border-white/10 p-3 mt-2">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Players</div>
      <div className="space-y-2">
        {gameState.players.map((player) => {
          const playerColor = getPlayerColor(player);
          const isCurrentPlayer = player.id === playerId;
          const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === player.id;
          
          return (
            <div 
              key={player.id}
              className={`flex items-center justify-between p-2 rounded border transition-all ${
                isCurrentTurn 
                  ? 'border-mugen-accent/50 bg-mugen-accent/10' 
                  : 'border-white/5 bg-mugen-surface/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full border-2 border-white/30"
                  style={{ backgroundColor: playerColor }}
                />
                <span 
                  className="font-medium text-sm"
                  style={{ color: playerColor }}
                >
                  {player.name}
                  {isCurrentPlayer && <span className="text-xs text-gray-400 ml-1">(You)</span>}
                </span>
                {isCurrentTurn && (
                  <div className="w-2 h-2 bg-mugen-accent rounded-full animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <Heart size={12} className="text-mugen-danger" />
                <span className="text-sm font-mono font-bold text-white">{player.life}</span>
                {player.isEliminated && (
                  <span className="text-xs text-red-400 line-through ml-1">Eliminated</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseControls() {
  const { isMyTurn, sendAdvancePhase, sendEndTurn } = useGameActions();
  const gameState = useGameStore((s) => s.gameState);
  const handLimitModalOpen = useGameStore((s) => s.handLimitModalOpen);
  const standbyModalOpen = useGameStore((s) => s.standbyModalOpen);

  if (!gameState || !isMyTurn) return null;
  const controlsDisabled = handLimitModalOpen || standbyModalOpen;

  return (
    <div className="flex gap-2">
      {gameState.turnPhase !== TurnPhase.END && (
        <button
          onClick={sendAdvancePhase}
          disabled={controlsDisabled}
          className={`flex items-center gap-1.5 px-4 py-2 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg text-sm font-medium transition ${controlsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <ArrowRight size={14} /> Next Phase
        </button>
      )}
      <button
        onClick={sendEndTurn}
        disabled={controlsDisabled}
        className={`flex items-center gap-1.5 px-4 py-2 bg-mugen-gold hover:bg-mugen-gold/80 text-black rounded-lg text-sm font-bold transition ${controlsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
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
      <div className="absolute top-0 left-0 right-0 p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-3 pointer-events-auto">
            <TurnIndicator />
            <PhaseControls />
          </div>
          <div className="flex flex-col gap-2 pointer-events-auto">
            {gameState.players.map((player, index) => {
              // Color mapping based on player position (1-4: red-blue)
              const positionColors = ['#ef4444', '#6366f1', '#22c55e', '#f59e0b']; // red, blue, green, yellow
              const playerColor = positionColors[index % 4];
              const isCurrentPlayer = player.id === playerId;
              const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === player.id;
              
              return (
                <div
                  key={player.id}
                  className={`bg-mugen-surface border rounded-lg px-3 py-2 text-sm transition-all ${
                    isCurrentTurn 
                      ? 'border-mugen-accent/50 bg-mugen-accent/10' 
                      : 'border-white/5'
                  } ${
                    player.isEliminated ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isCurrentTurn && (
                      <div className="w-2 h-2 bg-mugen-accent rounded-full animate-pulse" />
                    )}
                    <div 
                      className="font-medium text-xs"
                      style={{ color: playerColor }}
                    >
                      {player.name}
                      {isCurrentPlayer && <span className="text-xs text-gray-400 ml-1">(You)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-mugen-danger text-xs">
                    <Heart size={10} /> {player.life}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      
      
      {/* Bottom: standby phase + hand */}
      <div className="absolute left-0 p-6 pointer-events-auto" style={{ right: '50%', maxWidth: 'calc(50% - 48px)', bottom: '-21px' }}>
        <div className="bg-mugen-surface/90 backdrop-blur-sm rounded-xl border border-white/5 px-6 pb-1 pt-[16px] w-full">
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

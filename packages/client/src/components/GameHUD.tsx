import { useRef, useEffect } from 'react';
import { useGameStore } from '../store/game-store.js';
import { useGameActions } from '../hooks/useGameActions.js';
import { useCardHover } from '../hooks/useUnitHover.js';
import type { GameState } from '@mugen/shared';
import { TurnPhase, CardType, MAX_HAND_SIZE } from '@mugen/shared';
import { Heart, Zap, ArrowRight, SkipForward, X } from 'lucide-react';

const HAND_SLOT_COUNT = MAX_HAND_SIZE;
const HAND_CARD_GAP_REM = 0.5;
const HAND_CARD_MAX_WIDTH_PX = 136;
const HAND_ROW_MAX_WIDTH_PX = HAND_SLOT_COUNT * HAND_CARD_MAX_WIDTH_PX + (HAND_SLOT_COUNT - 1) * 8;
const HAND_PANEL_HORIZONTAL_PADDING_PX = 48;
const HAND_PANEL_MAX_WIDTH_PX = HAND_ROW_MAX_WIDTH_PX + HAND_PANEL_HORIZONTAL_PADDING_PX;
const HAND_CARD_WIDTH = `calc((100% - ${(HAND_SLOT_COUNT - 1) * HAND_CARD_GAP_REM}rem) / ${HAND_SLOT_COUNT})`;

const PHASE_LABELS: Record<string, string> = {
  [TurnPhase.STANDBY]: 'Standby Phase',
  [TurnPhase.MOVE]: 'Move Phase',
  [TurnPhase.ABILITY]: 'Ability Phase',
  [TurnPhase.ATTACK]: 'Attack Phase',
  [TurnPhase.END]: 'End Phase',
};

// Sorcery cards that require a target unit
const SORCERY_CARDS_REQUIRING_TARGET = new Set([
  's01', // Quick Strike
  's02', // Minor Heal
  's04', // Fireball
  's05', // Mend Wounds
  's06', // Haste
  's07', // Weaken
  's08', // Chain Lightning
  's11', // Displacement
  's12', // Meteor Strike
  's13', // Full Restore
  's14', // Battle Rage
  's15', // Paralyze
  's18', // Dimensional Swap
  's20', // Resurrection
  's22', // Soul Drain
]);

function requiresTarget(cardId: string): boolean {
  return SORCERY_CARDS_REQUIRING_TARGET.has(cardId);
}

function getMinimumSorceryTargetCount(cardId: string): number {
  if (!requiresTarget(cardId)) return 0;
  return cardId === 's18' ? 2 : 1;
}

function getValidSorceryTargetCount(cardId: string, gameState: GameState, playerId: string): number {
  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  if (!currentPlayer) return 0;

  const nonTargetCards = new Set(['s03', 's09', 's10', 's16', 's17', 's19', 's21']);
  if (nonTargetCards.has(cardId)) return 0;

  let count = 0;

  for (const player of gameState.players) {
    for (const unit of player.units) {
      if (!unit.position) continue;

      const isFriendly = player.id === playerId;
      const isEnemy = !isFriendly;

      if (['s01', 's04', 's08', 's12', 's22', 's07', 's15'].includes(cardId) && isEnemy) {
        count += 1;
      } else if (['s02', 's05', 's06', 's11', 's13', 's14', 's20'].includes(cardId) && isFriendly) {
        count += 1;
      } else if (cardId === 's18') {
        count += 1;
      }
    }
  }

  return count;
}

function HandDisplay() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const { handleMouseEnter, handleMouseLeave } = useCardHover();
  const { isMyTurn, sendPlaySorcery } = useGameActions();
  const setError = useGameStore((s) => s.setError);
  const sorceryModeActive = useGameStore((s) => s.sorceryModeActive);
  const selectedSorceryCard = useGameStore((s) => s.selectedSorceryCard);
  const { enterSorceryMode, exitSorceryMode } = useGameStore();
  const handCards = myPlayer?.hand.cards ?? [];
  const handSlots = Array.from({ length: HAND_SLOT_COUNT }, (_, i) => handCards[i] ?? null);

  const handleCardClick = (card: any) => {
    // Only sorcery cards are clickable for playing
    if (card.cardType !== CardType.SORCERY) {
      return;
    }

    // Phase check: ONLY allow during Ability Phase
    if (gameState?.turnPhase !== TurnPhase.ABILITY) {
      setError(`Sorcery cards can only be played during Ability Phase (current: ${gameState?.turnPhase})`);
      return;
    }

    // Turn check
    if (!isMyTurn) {
      setError('Not your turn');
      return;
    }

    // Check if sorcery requires a target
    if (requiresTarget(card.id)) {
      if (!gameState || !playerId) {
        setError('Game state unavailable for sorcery targeting');
        return;
      }

      const validTargetCount = getValidSorceryTargetCount(card.id, gameState, playerId);
      const minimumTargetCount = getMinimumSorceryTargetCount(card.id);
      if (validTargetCount < minimumTargetCount) {
        if (card.id === 's18') {
          setError(`${card.name} requires at least two valid units on the board`);
        } else {
          setError(`No valid targets available for ${card.name}`);
        }
        return;
      }

      // Enter targeting mode
      enterSorceryMode(card, true);
      if (card.id === 's18') {
        setError(`Select first target for ${card.name}`);
      } else {
        setError(`Select a target for ${card.name}`);
      }
    } else {
      if (sorceryModeActive) {
        exitSorceryMode();
      }

      // Play immediately without target
      setError(null);
      sendPlaySorcery(card.id);
    }
  };

  const handleCancelSorcery = () => {
    exitSorceryMode();
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {sorceryModeActive && selectedSorceryCard && (
        <div className="bg-mugen-gold/20 border border-mugen-gold rounded-lg px-3 py-2 flex items-center justify-between">
          <span className="text-sm text-mugen-gold font-medium">
            Select target for {selectedSorceryCard.name}
          </span>
          <button
            onClick={handleCancelSorcery}
            className="text-mugen-gold hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="flex w-full gap-2 pb-2">
        {handSlots.map((card, index) => {
          if (!card) {
            return (
              <div
                key={`empty-slot-${index}`}
                className="h-[184px] rounded-lg border border-dashed border-white/10 bg-mugen-bg/40"
                style={{ width: HAND_CARD_WIDTH, maxWidth: '136px' }}
              />
            );
          }

          return (
            <div
              key={card.id}
              className={`h-[184px] bg-mugen-bg border border-white/10 rounded-lg p-3 transition-colors ${
                card.cardType === CardType.SORCERY && gameState?.turnPhase === TurnPhase.ABILITY && isMyTurn
                  ? 'cursor-pointer hover:border-mugen-accent/50'
                  : 'cursor-not-allowed opacity-60'
              }`}
              style={{ width: HAND_CARD_WIDTH, maxWidth: '136px' }}
              onMouseEnter={() => handleMouseEnter(card)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleCardClick(card)}
            >
              <div className="text-white font-semibold text-sm truncate">{card.name}</div>
              <div className="flex flex-col text-xs text-gray-300 mt-1">
                {card.cardType === CardType.UNIT ? (
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
                {card.cardType === CardType.UNIT ? card.ability?.name : card.effect}
              </div>
            </div>
          );
        })}
      </div>
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

function GameLog() {
  const gameLogs = useGameStore((s) => s.gameLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameLogs.length]);

  return (
    <div className="bg-mugen-surface/80 backdrop-blur-sm rounded-lg border border-white/10 p-2 w-[440px]">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Game Log</div>
      <div
        ref={scrollRef}
        className="overflow-y-auto max-h-[78px] space-y-0.5"
        style={{ scrollbarWidth: 'thin' }}
      >
        {gameLogs.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No events yet</div>
        ) : (
          gameLogs.map((message, i) => (
            <div key={i} className="text-xs text-gray-300 leading-tight break-words">
              {message}
            </div>
          ))
        )}
      </div>
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
            <GameLog />
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
      <div
        className="absolute left-0 p-6 pointer-events-auto"
        style={{
          bottom: '-21px',
          width: `min(calc(50% - 48px), ${HAND_PANEL_MAX_WIDTH_PX}px)`,
        }}
      >
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

import { GameBoard } from './GameBoard.js';
import { GameHUD } from './GameHUD.js';
import { BenchUnits } from './BenchUnits.js';
import { HoverPanel } from './HoverPanel.js';
import { MainDeckPile } from './MainDeckPile.js';
import { DiscardPile } from './DiscardPile.js';
import { HandLimitModal } from './HandLimitModal.js';
import { StandbyDeployModal } from './StandbyDeployModal.js';
import { SummonToBenchModal } from './SummonToBenchModal.js';
import { PlayerDefeatedModal } from './PlayerDefeatedModal.js';
import { MobileGameScreen } from './mobile/MobileGameScreen.js';
import { useGameStore } from '../store/game-store.js';

export function GameScreen() {
  console.log('GAME SCREEN COMPONENT LOADED');

  const gameState = useGameStore((s) => s.gameState);
  const mobileUiMode = useGameStore((s) => s.mobileUiMode);

  console.log('GAME SCREEN - gameState exists:', !!gameState);
  console.log('GAME SCREEN - gameState phase:', gameState?.phase);

  // FAILSAFE: If gameState is null, show a loading/error screen instead of blank
  if (!gameState) {
    console.error('GAME SCREEN - CRITICAL: gameState is null!');
    return (
      <div className="min-h-screen bg-mugen-bg flex items-center justify-center">
        <div className="bg-yellow-900/50 rounded-2xl p-8 w-full max-w-md border border-yellow-500">
          <h1 className="text-2xl font-bold text-center mb-4 text-white">Loading Game...</h1>
          <p className="text-gray-300 text-center mb-4">Waiting for game state from server</p>
          <p className="text-gray-400 text-sm text-center">If this persists, the connection may have been lost</p>
        </div>
      </div>
    );
  }

  // Wrap in try-catch to prevent silent crashes
  try {
    if (mobileUiMode) {
      return (
        <>
          <MobileGameScreen />
          <HandLimitModal />
          <StandbyDeployModal />
          <SummonToBenchModal />
          <PlayerDefeatedModal />
        </>
      );
    }

    return (
      <div data-testid="game-screen" className="min-h-screen bg-mugen-bg flex">
        <HoverPanel />
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-start justify-end pt-8 pr-32 w-full">
            <GameBoard />
          </div>
          <div className="flex justify-center pr-32 w-full items-start relative">
            {/* Hand section placeholder (left side) */}
            <div className="flex-1" />

            {/* Deck & Discard piles (locked in place) */}
            <div className="absolute flex flex-col gap-2 -mt-[181px]" style={{ right: '875px' }}>
              <DiscardPile />
              <MainDeckPile />
            </div>

            {/* Bench (centered) */}
            <div className="absolute" style={{ right: '203px', top: '5px' }}>
              <BenchUnits />
            </div>
          </div>
        </div>
        <GameHUD />
        <HandLimitModal />
        <StandbyDeployModal />
        <SummonToBenchModal />
        <PlayerDefeatedModal />
      </div>
    );
  } catch (error) {
    console.error('GAME SCREEN RENDER ERROR:', error);
    return (
      <div className="min-h-screen bg-mugen-bg flex items-center justify-center">
        <div className="bg-red-900/50 rounded-2xl p-8 border border-red-500">
          <h1 className="text-2xl font-bold text-white mb-4">Game Screen Error</h1>
          <p className="text-gray-300">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}

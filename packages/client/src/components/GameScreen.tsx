import { GameBoard } from './GameBoard.js';
import { COMBINED_UI_GROUP_SHIFT_UP_PX, GameHUD } from './GameHUD.js';
import { HoverPanel } from './HoverPanel.js';
import { HandLimitModal } from './HandLimitModal.js';
import { StandbyDeployModal } from './StandbyDeployModal.js';
import { SummonToBenchModal } from './SummonToBenchModal.js';
import { PlayerDefeatedModal } from './PlayerDefeatedModal.js';
import { VictoryModal } from './VictoryModal.js';
import { MobileGameScreen } from './mobile/MobileGameScreen.js';
import { useGameStore } from '../store/game-store.js';
import wallpaperImage from '../../../../wallpaper.avif';

const BASE_BOARD_SECTION_SHIFT_DOWN_PX = 60;
const BOARD_SECTION_SHIFT_DOWN_PX = BASE_BOARD_SECTION_SHIFT_DOWN_PX - COMBINED_UI_GROUP_SHIFT_UP_PX;
const GAME_BACKGROUND_STYLE = {
  backgroundImage: `url(${wallpaperImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundColor: '#050507',
} as const;

export function GameScreen() {
  console.log('GAME SCREEN COMPONENT LOADED');

  const gameState = useGameStore((s) => s.gameState);
  const mobileUiMode = useGameStore((s) => s.mobileUiMode);
  const isSpectating = useGameStore((s) => s.isSpectating);

  console.log('GAME SCREEN - gameState exists:', !!gameState);
  console.log('GAME SCREEN - gameState phase:', gameState?.phase);

  // FAILSAFE: If gameState is null, show a loading/error screen instead of blank
  if (!gameState) {
    console.error('GAME SCREEN - CRITICAL: gameState is null!');
    return (
      <div className="min-h-screen flex items-center justify-center" style={GAME_BACKGROUND_STYLE}>
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
          <VictoryModal />
        </>
      );
    }

    return (
      <div data-testid="game-screen" className="relative min-h-screen overflow-hidden" style={GAME_BACKGROUND_STYLE}>
        <div
          className="absolute inset-0 z-0 flex items-center justify-center"
          style={{ transform: `translateY(${BOARD_SECTION_SHIFT_DOWN_PX}px)` }}
        >
          <GameBoard />
        </div>
        <HoverPanel />
        <GameHUD combinedGroupShiftUpPx={COMBINED_UI_GROUP_SHIFT_UP_PX} />
        <HandLimitModal />
        <StandbyDeployModal />
        <SummonToBenchModal />
        <PlayerDefeatedModal />
        <VictoryModal />
        {isSpectating && (
          <div className="fixed top-4 left-1/2 z-[11000] -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-200">
            Spectating
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('GAME SCREEN RENDER ERROR:', error);
    return (
      <div className="min-h-screen flex items-center justify-center" style={GAME_BACKGROUND_STYLE}>
        <div className="bg-red-900/50 rounded-2xl p-8 border border-red-500">
          <h1 className="text-2xl font-bold text-white mb-4">Game Screen Error</h1>
          <p className="text-gray-300">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}

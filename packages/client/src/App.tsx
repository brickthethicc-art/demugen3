import { useEffect } from 'react';
import { useGameStore } from './store/game-store.js';
import { MainMenuScreen } from './components/MainMenuScreen.js';
import { DeckBuilderScreen } from './components/DeckBuilderScreen.js';
import { CardLibraryScreen } from './components/CardLibraryScreen.js';
import { DeckSelectScreen } from './components/DeckSelectScreen.js';
import { LobbyScreen } from './components/LobbyScreen.js';
import { GameScreen } from './components/GameScreen.js';
import { GameOverScreen } from './components/GameOverScreen.js';
import { StartingUnitSelection } from './components/StartingUnitSelection.js';
import { GamePhase } from '@mugen/shared';

export function App() {
  const screen = useGameStore((s) => s.screen);
  const gameState = useGameStore((s) => s.gameState);
  const setScreen = useGameStore((s) => s.setScreen);

  useEffect(() => {
    if (!gameState) {
      return;
    }
    if (gameState.phase === GamePhase.ENDED) {
      setScreen('game');
    } else if (gameState.phase === GamePhase.PRE_GAME) {
      setScreen('pregame');
    } else if (gameState.phase === GamePhase.IN_PROGRESS) {
      setScreen('game');
    }
  }, [gameState, setScreen]);

  // FAILSAFE: If gameState exists but screen is still main-menu, force it to game
  useEffect(() => {
    if (gameState && gameState.phase === GamePhase.IN_PROGRESS && screen === 'main-menu') {
      setScreen('game');
    }
  }, [gameState, screen, setScreen]);

  // FAILSAFE: Ensure screen is never null/undefined
  useEffect(() => {
    if (!screen) {
      setScreen('main-menu');
      return;
    }
    
    if (screen === 'main-menu' && gameState) {
      if (gameState.phase === GamePhase.IN_PROGRESS) {
        setScreen('game');
      } else if (gameState.phase === GamePhase.PRE_GAME) {
        setScreen('pregame');
      }
    }
  }, [screen, gameState, setScreen]);

  let renderedScreen;
  switch (screen) {
    case 'main-menu':
      renderedScreen = <MainMenuScreen />;
      break;
    case 'deck-builder':
      renderedScreen = <DeckBuilderScreen />;
      break;
    case 'card-library':
      renderedScreen = <CardLibraryScreen />;
      break;
    case 'deck-select':
      renderedScreen = <DeckSelectScreen />;
      break;
    case 'lobby':
      renderedScreen = <LobbyScreen />;
      break;
    case 'pregame':
      renderedScreen = <StartingUnitSelection />;
      break;
    case 'game':
      renderedScreen = <GameScreen />;
      break;
    case 'gameover':
      renderedScreen = <GameOverScreen />;
      break;
    default:
      renderedScreen = <MainMenuScreen />;
  }

  // FALLBACK: If renderedScreen is somehow null/undefined, show error
  if (!renderedScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mugen-bg">
        <div className="bg-red-900/50 rounded-2xl p-8 w-full max-w-md border border-red-500">
          <h1 className="text-2xl font-bold text-center mb-4 text-white">Game Failed to Load</h1>
          <p className="text-gray-300 text-center mb-4">Screen: {screen || 'null'}</p>
          <p className="text-gray-300 text-center mb-4">Game State Phase: {gameState?.phase || 'null'}</p>
          <button
            onClick={() => setScreen('main-menu')}
            className="w-full px-4 py-2 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg font-semibold transition"
          >
            Return to Main Menu
          </button>
        </div>
      </div>
    );
  }

  return renderedScreen;
}

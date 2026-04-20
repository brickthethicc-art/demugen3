import { jsx as _jsx } from "react/jsx-runtime";
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
        if (!gameState)
            return;
        if (gameState.phase === GamePhase.ENDED) {
            setScreen('gameover');
        }
        else if (gameState.phase === GamePhase.PRE_GAME) {
            setScreen('pregame');
        }
        else if (gameState.phase === GamePhase.IN_PROGRESS) {
            setScreen('game');
        }
    }, [gameState, setScreen]);
    switch (screen) {
        case 'main-menu':
            return _jsx(MainMenuScreen, {});
        case 'deck-builder':
            return _jsx(DeckBuilderScreen, {});
        case 'card-library':
            return _jsx(CardLibraryScreen, {});
        case 'deck-select':
            return _jsx(DeckSelectScreen, {});
        case 'lobby':
            return _jsx(LobbyScreen, {});
        case 'pregame':
            return _jsx(StartingUnitSelection, {});
        case 'game':
            return _jsx(GameScreen, {});
        case 'gameover':
            return _jsx(GameOverScreen, {});
        default:
            return _jsx(MainMenuScreen, {});
    }
}
//# sourceMappingURL=App.js.map
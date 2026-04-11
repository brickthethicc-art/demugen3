import { useGameStore } from '../store/game-store.js';
import { Play, Layers, BookOpen, Bug } from 'lucide-react';

export function MainMenuScreen() {
  const setScreen = useGameStore((s) => s.setScreen);

  const handleCreateTestDeck = () => {
    import('../logic/test-deck.js').then(({ saveTestDeck }) => {
      saveTestDeck();
      console.log('Test deck created! Check the deck selection screen.');
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mugen-bg">
      <div className="bg-mugen-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/5">
        <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-mugen-accent to-mugen-mana bg-clip-text text-transparent">
          MUGEN
        </h1>
        <p className="text-gray-400 text-center mb-10 text-sm">Strategy Card Game</p>

        <div className="space-y-4">
          <button
            onClick={() => setScreen('deck-select')}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg font-semibold text-lg transition"
          >
            <Play size={20} /> Play
          </button>

          <button
            onClick={() => setScreen('deck-builder')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-mugen-surface border border-white/10 hover:border-mugen-accent/50 rounded-lg font-medium transition"
          >
            <Layers size={18} /> Deck Builder
          </button>

          <button
            onClick={() => setScreen('card-library')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-mugen-surface border border-white/10 hover:border-mugen-accent/50 rounded-lg font-medium transition"
          >
            <BookOpen size={18} /> Card Library
          </button>

          <button
            onClick={handleCreateTestDeck}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-mugen-surface border border-red-500/30 hover:border-red-500/50 rounded-lg font-medium transition text-red-400 text-sm"
          >
            <Bug size={16} /> Create Test Deck
          </button>
        </div>
      </div>
    </div>
  );
}

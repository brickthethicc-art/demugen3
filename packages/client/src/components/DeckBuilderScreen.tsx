import { useEffect, useState } from 'react';
import { useGameStore } from '../store/game-store.js';
import { useDeckStore } from '../store/deck-store.js';
import { CardBrowser } from './deck-builder/CardBrowser.js';
import { DeckPanel } from './deck-builder/DeckPanel.js';
import { ArrowLeft } from 'lucide-react';

export function DeckBuilderScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const resetDeckBuilder = useDeckStore((s) => s.resetDeckBuilder);
  const [activeMobilePanel, setActiveMobilePanel] = useState<'browser' | 'deck'>('browser');

  useEffect(() => {
    return () => {
      resetDeckBuilder();
    };
  }, [resetDeckBuilder]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-mugen-bg text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2.5 sm:px-6 sm:py-3">
        <button
          onClick={() => setScreen('main-menu')}
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-gray-300 transition hover:text-white"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-base font-bold bg-gradient-to-r from-mugen-accent to-mugen-mana bg-clip-text text-transparent sm:text-lg">
          Deck Builder
        </h1>
        <div className="w-[60px]" />
      </div>

      <div className="flex-1 min-h-0 p-2 sm:p-4">
        <div className="flex h-full min-h-0 flex-col rounded-xl border border-white/10 bg-black/25 md:flex-row md:overflow-hidden">
          <div className="flex gap-1 border-b border-white/10 p-1 md:hidden">
            <button
              type="button"
              onClick={() => setActiveMobilePanel('browser')}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition ${
                activeMobilePanel === 'browser'
                  ? 'bg-cyan-400/20 text-cyan-100 border border-cyan-300/35'
                  : 'border border-white/10 bg-white/5 text-gray-300'
              }`}
            >
              Card Browser
            </button>
            <button
              type="button"
              onClick={() => setActiveMobilePanel('deck')}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition ${
                activeMobilePanel === 'deck'
                  ? 'bg-cyan-400/20 text-cyan-100 border border-cyan-300/35'
                  : 'border border-white/10 bg-white/5 text-gray-300'
              }`}
            >
              Your Deck
            </button>
          </div>

          <div className={`min-h-0 flex-1 flex-col border-white/5 p-2 sm:p-3 md:flex md:border-r md:p-4 ${activeMobilePanel === 'browser' ? 'flex' : 'hidden md:flex'}`}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 sm:mb-3 sm:text-sm">Card Browser</h2>
            <CardBrowser />
          </div>

          <div className={`min-h-0 flex-1 flex-col p-2 sm:p-3 md:flex md:p-4 ${activeMobilePanel === 'deck' ? 'flex' : 'hidden md:flex'}`}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 sm:mb-3 sm:text-sm">Your Deck</h2>
            <DeckPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

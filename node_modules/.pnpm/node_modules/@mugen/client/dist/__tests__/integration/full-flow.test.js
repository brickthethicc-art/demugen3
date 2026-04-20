import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from '../../src/App.js';
import { useGameStore } from '../../src/store/game-store.js';
import { useDeckStore } from '../../src/store/deck-store.js';
import { saveDeck, loadDeck, deleteDeck } from '../../src/logic/deck-storage.js';
import { ALL_CARDS } from '../../src/data/cards.js';
const makeDeck16 = () => ALL_CARDS.slice(0, 16);
describe('Integration: Full Navigation Flow', () => {
    beforeEach(() => {
        useGameStore.getState().reset();
        useDeckStore.getState().resetDeckBuilder();
        localStorage.clear();
    });
    it('starts at main menu', () => {
        render(_jsx(App, {}));
        expect(screen.getByText('MUGEN')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });
    it('navigates Main Menu → Deck Select → Main Menu', () => {
        render(_jsx(App, {}));
        // Go to deck select
        fireEvent.click(screen.getByRole('button', { name: /play/i }));
        expect(screen.getByText(/select a deck/i)).toBeInTheDocument();
        // Go back
        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(screen.getByText('MUGEN')).toBeInTheDocument();
    });
    it('navigates Main Menu → Deck Builder → Main Menu', () => {
        render(_jsx(App, {}));
        fireEvent.click(screen.getByRole('button', { name: /deck builder/i }));
        expect(screen.getByText(/deck builder/i)).toBeInTheDocument();
        expect(screen.getByText(/card browser/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(screen.getByText('MUGEN')).toBeInTheDocument();
    });
    it('navigates Main Menu → Card Library → Main Menu', () => {
        render(_jsx(App, {}));
        fireEvent.click(screen.getByRole('button', { name: /card library/i }));
        expect(screen.getByText(/card library/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(screen.getByText('MUGEN')).toBeInTheDocument();
    });
    it('Deck Select → Build New Deck → navigates to deck builder', () => {
        render(_jsx(App, {}));
        // Go to deck select
        fireEvent.click(screen.getByRole('button', { name: /play/i }));
        expect(screen.getByText(/no saved decks/i)).toBeInTheDocument();
        // Build new deck
        fireEvent.click(screen.getByRole('button', { name: /build new deck/i }));
        expect(screen.getByText(/card browser/i)).toBeInTheDocument();
    });
    it('saved deck appears in Deck Select after saving via storage', () => {
        saveDeck(0, 'Test Deck', makeDeck16());
        render(_jsx(App, {}));
        fireEvent.click(screen.getByRole('button', { name: /play/i }));
        expect(screen.getByText('Test Deck')).toBeInTheDocument();
    });
    it('selecting a saved deck navigates to lobby', () => {
        saveDeck(0, 'Battle Deck', makeDeck16());
        render(_jsx(App, {}));
        fireEvent.click(screen.getByRole('button', { name: /play/i }));
        fireEvent.click(screen.getByText('Battle Deck'));
        // Should now be in lobby
        expect(useGameStore.getState().screen).toBe('lobby');
        expect(useGameStore.getState().selectedDeck).toEqual(makeDeck16());
    });
    it('rapid navigation does not break state', () => {
        render(_jsx(App, {}));
        // Rapidly navigate through screens
        fireEvent.click(screen.getByRole('button', { name: /play/i }));
        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        fireEvent.click(screen.getByRole('button', { name: /deck builder/i }));
        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        fireEvent.click(screen.getByRole('button', { name: /card library/i }));
        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        // Should still be at main menu
        expect(screen.getByText('MUGEN')).toBeInTheDocument();
        expect(useGameStore.getState().screen).toBe('main-menu');
    });
    it('deck persistence survives localStorage round-trip', () => {
        const deck = makeDeck16();
        saveDeck(2, 'Persistent', deck);
        // Simulate reload by reading from fresh
        const loaded = loadDeck(2);
        expect(loaded).not.toBeNull();
        expect(loaded.name).toBe('Persistent');
        expect(loaded.cards).toEqual(deck);
    });
    it('deleting all decks shows empty state in Deck Select', () => {
        saveDeck(0, 'D1', makeDeck16());
        saveDeck(1, 'D2', makeDeck16());
        deleteDeck(0);
        deleteDeck(1);
        render(_jsx(App, {}));
        fireEvent.click(screen.getByRole('button', { name: /play/i }));
        expect(screen.getByText(/no saved decks/i)).toBeInTheDocument();
    });
});
//# sourceMappingURL=full-flow.test.js.map
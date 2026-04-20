import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeckSelectScreen } from '../../src/components/DeckSelectScreen.js';
import { useGameStore } from '../../src/store/game-store.js';
import { saveDeck } from '../../src/logic/deck-storage.js';
import { ALL_CARDS } from '../../src/data/cards.js';
const makeDeck16 = () => ALL_CARDS.slice(0, 16);
describe('DeckSelectScreen', () => {
    beforeEach(() => {
        useGameStore.getState().reset();
        localStorage.clear();
    });
    it('renders the title', () => {
        render(_jsx(DeckSelectScreen, {}));
        expect(screen.getByText(/select a deck/i)).toBeInTheDocument();
    });
    it('renders back button', () => {
        render(_jsx(DeckSelectScreen, {}));
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
    it('back button navigates to main-menu', () => {
        render(_jsx(DeckSelectScreen, {}));
        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(useGameStore.getState().screen).toBe('main-menu');
    });
    it('renders Build New Deck button', () => {
        render(_jsx(DeckSelectScreen, {}));
        expect(screen.getByRole('button', { name: /build new deck/i })).toBeInTheDocument();
    });
    it('Build New Deck navigates to deck-builder', () => {
        render(_jsx(DeckSelectScreen, {}));
        fireEvent.click(screen.getByRole('button', { name: /build new deck/i }));
        expect(useGameStore.getState().screen).toBe('deck-builder');
    });
    it('shows empty state when no decks saved', () => {
        render(_jsx(DeckSelectScreen, {}));
        expect(screen.getByText(/no saved decks/i)).toBeInTheDocument();
    });
    it('shows saved deck slots', () => {
        saveDeck(0, 'Aggro Rush', makeDeck16());
        saveDeck(2, 'Control', makeDeck16());
        render(_jsx(DeckSelectScreen, {}));
        expect(screen.getByText('Aggro Rush')).toBeInTheDocument();
        expect(screen.getByText('Control')).toBeInTheDocument();
    });
    it('selecting a deck sets selectedDeck and navigates to lobby', () => {
        const deck = makeDeck16();
        saveDeck(0, 'My Deck', deck);
        render(_jsx(DeckSelectScreen, {}));
        fireEvent.click(screen.getByText('My Deck'));
        expect(useGameStore.getState().selectedDeck).toEqual(deck);
        expect(useGameStore.getState().screen).toBe('lobby');
    });
});
//# sourceMappingURL=DeckSelectScreen.test.js.map
import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CardLibraryScreen } from '../../src/components/CardLibraryScreen.js';
import { useGameStore } from '../../src/store/game-store.js';
import { ALL_CARDS, ALL_UNITS, ALL_SORCERIES } from '../../src/data/cards.js';
describe('CardLibraryScreen', () => {
    beforeEach(() => {
        useGameStore.getState().reset();
    });
    it('renders the title', () => {
        render(_jsx(CardLibraryScreen, {}));
        expect(screen.getByText(/card library/i)).toBeInTheDocument();
    });
    it('renders back button', () => {
        render(_jsx(CardLibraryScreen, {}));
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
    it('back button navigates to main-menu', () => {
        render(_jsx(CardLibraryScreen, {}));
        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(useGameStore.getState().screen).toBe('main-menu');
    });
    it('shows total card count', () => {
        render(_jsx(CardLibraryScreen, {}));
        expect(screen.getByText(new RegExp(`${ALL_CARDS.length} cards`))).toBeInTheDocument();
    });
    it('renders search input', () => {
        render(_jsx(CardLibraryScreen, {}));
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
    it('renders view mode toggle buttons', () => {
        render(_jsx(CardLibraryScreen, {}));
        expect(screen.getByRole('button', { name: /grid/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
    });
    it('displays card names', () => {
        render(_jsx(CardLibraryScreen, {}));
        // Check first unit and first sorcery are visible
        expect(screen.getByText(ALL_UNITS[0].name)).toBeInTheDocument();
        expect(screen.getByText(ALL_SORCERIES[0].name)).toBeInTheDocument();
    });
    it('search filters cards by name', () => {
        render(_jsx(CardLibraryScreen, {}));
        const search = screen.getByPlaceholderText(/search/i);
        fireEvent.change(search, { target: { value: 'Phoenix' } });
        expect(screen.getByText(/Phoenix Sage/)).toBeInTheDocument();
        expect(screen.queryByText('Scout Wisp')).not.toBeInTheDocument();
    });
    it('shows card detail when a card is clicked', () => {
        render(_jsx(CardLibraryScreen, {}));
        fireEvent.click(screen.getByText(ALL_UNITS[0].name));
        // Should show the ability name in detail
        expect(screen.getByText(ALL_UNITS[0].ability.name)).toBeInTheDocument();
    });
});
//# sourceMappingURL=CardLibraryScreen.test.js.map
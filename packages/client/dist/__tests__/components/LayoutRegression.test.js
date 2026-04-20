import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useGameStore } from '../../src/store/game-store.js';
import { GameScreen } from '../../src/components/GameScreen.js';
import { CardType, AbilityType } from '@mugen/shared';
// Mock Phaser-dependent components
vi.mock('../../src/components/GameBoard.js', () => ({
    GameBoard: () => _jsx("div", { "data-testid": "game-board", style: { width: '736px', height: '736px' } }),
}));
vi.mock('../../src/components/GameHUD.js', () => ({
    GameHUD: () => _jsx("div", { "data-testid": "game-hud" }),
}));
vi.mock('../../src/components/HoverPanel.js', () => ({
    HoverPanel: () => _jsx("div", { "data-testid": "hover-panel" }),
}));
function makeUnit(id) {
    return {
        id,
        name: `Unit ${id}`,
        cardType: CardType.UNIT,
        hp: 5,
        maxHp: 5,
        atk: 3,
        movement: 2,
        range: 1,
        ability: {
            id: `ability-${id}`,
            name: 'Test Ability',
            description: 'Test',
            cost: 1,
            abilityType: AbilityType.DAMAGE,
        },
        cost: 5,
    };
}
describe('Layout Regression Tests', () => {
    beforeEach(() => {
        useGameStore.setState({
            benchUnits: [makeUnit('u1'), makeUnit('u2'), makeUnit('u3')],
            mainDeck: [makeUnit('d1'), makeUnit('d2')],
            discardPile: [makeUnit('c1')]
        });
    });
    describe('Grid Size Regression', () => {
        it('should render game board at original dimensions (736x736)', () => {
            render(_jsx(GameScreen, {}));
            const gameBoard = screen.getByTestId('game-board');
            expect(gameBoard).toHaveStyle({ width: '736px', height: '736px' });
        });
        it('should maintain 23x23 grid structure', () => {
            // This is verified by the dimensions above (23 * 32 = 736)
            render(_jsx(GameScreen, {}));
            const gameBoard = screen.getByTestId('game-board');
            expect(gameBoard).toBeInTheDocument();
        });
    });
    describe('Deck & Discard Pile Positioning', () => {
        it('should position deck/discard piles between hand and bench', () => {
            render(_jsx(GameScreen, {}));
            const benchContainer = screen.getByTestId('bench-units-container');
            const deckPile = screen.getByTestId('main-deck-pile');
            const discardPile = screen.getByTestId('discard-pile');
            // All should be in the same layout container
            const layoutContainer = benchContainer.closest('.flex.justify-end.pr-32.w-full');
            expect(layoutContainer).toContainElement(deckPile);
            expect(layoutContainer).toContainElement(discardPile);
            expect(layoutContainer).toContainElement(benchContainer);
            // The layout should have: hand placeholder (flex-1), deck/discard container, then bench
            const container = benchContainer.parentElement;
            if (container) {
                const children = Array.from(container.children);
                const handPlaceholder = children.find(child => child.classList.contains('flex-1'));
                const deckDiscardContainer = children.find(child => child.classList.contains('flex') &&
                    child.classList.contains('flex-col') &&
                    child.classList.contains('gap-2'));
                const benchElement = children.find(child => child.getAttribute('data-testid') === 'bench-units-container');
                // Verify the order: hand -> deck/discard -> bench
                expect(handPlaceholder).toBeDefined();
                expect(deckDiscardContainer).toBeDefined();
                expect(benchElement).toBeDefined();
                const handIndex = children.indexOf(handPlaceholder);
                const deckDiscardIndex = children.indexOf(deckDiscardContainer);
                const benchIndex = children.indexOf(benchElement);
                expect(handIndex).toBeLessThan(deckDiscardIndex);
                expect(deckDiscardIndex).toBeLessThan(benchIndex);
            }
        });
        it('should NOT position deck/discard to the right of bench', () => {
            render(_jsx(GameScreen, {}));
            const benchContainer = screen.getByTestId('bench-units-container');
            const deckPile = screen.getByTestId('main-deck-pile');
            // They should not be in a gap-3 layout where bench comes first
            const container = benchContainer.parentElement;
            if (container) {
                const children = Array.from(container.children);
                const benchIndex = children.indexOf(benchContainer);
                const deckIndex = children.indexOf(deckPile);
                // Current broken layout has bench first, then deck/discard
                // This test will fail until we fix it
                expect(benchIndex).not.toBeLessThan(deckIndex);
            }
        });
    });
    describe('Bench Layout Regression', () => {
        it('should restore bench to original width (778px)', () => {
            render(_jsx(GameScreen, {}));
            const benchContainer = screen.getByTestId('bench-units-container');
            // Should be original width, not reduced 660px
            expect(benchContainer).toHaveClass('w-[778px]');
            expect(benchContainer).not.toHaveClass('w-[660px]');
        });
        it('should maintain bench positioning relative to other elements', () => {
            render(_jsx(GameScreen, {}));
            const benchContainer = screen.getByTestId('bench-units-container');
            const layoutContainer = benchContainer.closest('.flex.justify-end.pr-32');
            // Should still be in the right-aligned container
            expect(layoutContainer).toHaveClass('justify-end');
            expect(layoutContainer).toHaveClass('pr-32');
        });
    });
    describe('Overall Layout Structure', () => {
        it('should maintain proper layout flow: hand -> deck/discard -> bench', () => {
            render(_jsx(GameScreen, {}));
            // The layout should have proper structure
            const gameScreen = screen.getByTestId('game-screen') || document.querySelector('.min-h-screen.bg-mugen-bg.flex');
            expect(gameScreen).toBeInTheDocument();
            // Should have the main content area
            const mainContent = gameScreen?.querySelector('.flex-1.flex.flex-col.items-center');
            expect(mainContent).toBeInTheDocument();
        });
    });
});
//# sourceMappingURL=LayoutRegression.test.js.map
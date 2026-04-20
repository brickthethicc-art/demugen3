import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/store/game-store.js';
describe('Navigation Store', () => {
    beforeEach(() => {
        useGameStore.getState().reset();
    });
    describe('initial state', () => {
        it('defaults screen to main-menu', () => {
            expect(useGameStore.getState().screen).toBe('main-menu');
        });
    });
    describe('setScreen', () => {
        it('navigates to deck-builder', () => {
            useGameStore.getState().setScreen('deck-builder');
            expect(useGameStore.getState().screen).toBe('deck-builder');
        });
        it('navigates to card-library', () => {
            useGameStore.getState().setScreen('card-library');
            expect(useGameStore.getState().screen).toBe('card-library');
        });
        it('navigates to deck-select', () => {
            useGameStore.getState().setScreen('deck-select');
            expect(useGameStore.getState().screen).toBe('deck-select');
        });
        it('navigates to lobby', () => {
            useGameStore.getState().setScreen('lobby');
            expect(useGameStore.getState().screen).toBe('lobby');
        });
        it('navigates to main-menu from another screen', () => {
            useGameStore.getState().setScreen('deck-builder');
            useGameStore.getState().setScreen('main-menu');
            expect(useGameStore.getState().screen).toBe('main-menu');
        });
    });
    describe('reset', () => {
        it('returns to main-menu after reset', () => {
            useGameStore.getState().setScreen('deck-builder');
            useGameStore.getState().reset();
            expect(useGameStore.getState().screen).toBe('main-menu');
        });
    });
    describe('rapid navigation', () => {
        it('handles rapid screen changes correctly', () => {
            useGameStore.getState().setScreen('deck-builder');
            useGameStore.getState().setScreen('card-library');
            useGameStore.getState().setScreen('main-menu');
            useGameStore.getState().setScreen('deck-select');
            expect(useGameStore.getState().screen).toBe('deck-select');
        });
    });
});
//# sourceMappingURL=navigation-store.test.js.map
import { describe, it, expect, beforeEach } from 'vitest';
import { saveDeck, loadDeck, loadAllDecks, deleteDeck, MAX_DECK_SLOTS, } from '../../src/logic/deck-storage.js';
import { ALL_CARDS } from '../../src/data/cards.js';
const makeDeck16 = () => ALL_CARDS.slice(0, 16);
describe('Deck Storage', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    describe('saveDeck', () => {
        it('saves a deck to a slot', () => {
            saveDeck(0, 'My Deck', makeDeck16());
            const loaded = loadDeck(0);
            expect(loaded).not.toBeNull();
            expect(loaded.name).toBe('My Deck');
            expect(loaded.cards.length).toBe(16);
        });
        it('throws for invalid slot number', () => {
            expect(() => saveDeck(-1, 'Bad', makeDeck16())).toThrow();
            expect(() => saveDeck(MAX_DECK_SLOTS, 'Bad', makeDeck16())).toThrow();
        });
        it('overwrites existing deck in same slot', () => {
            saveDeck(0, 'First', makeDeck16());
            saveDeck(0, 'Second', makeDeck16());
            const loaded = loadDeck(0);
            expect(loaded.name).toBe('Second');
        });
        it('saves to different slots independently', () => {
            saveDeck(0, 'Deck A', makeDeck16());
            saveDeck(1, 'Deck B', makeDeck16());
            expect(loadDeck(0).name).toBe('Deck A');
            expect(loadDeck(1).name).toBe('Deck B');
        });
        it('includes a savedAt timestamp', () => {
            const before = Date.now();
            saveDeck(0, 'Timed', makeDeck16());
            const after = Date.now();
            const loaded = loadDeck(0);
            expect(loaded.savedAt).toBeGreaterThanOrEqual(before);
            expect(loaded.savedAt).toBeLessThanOrEqual(after);
        });
    });
    describe('loadDeck', () => {
        it('returns null for empty slot', () => {
            expect(loadDeck(0)).toBeNull();
        });
        it('returns null for slot with no saved data', () => {
            expect(loadDeck(4)).toBeNull();
        });
    });
    describe('loadAllDecks', () => {
        it('returns array of MAX_DECK_SLOTS length', () => {
            const all = loadAllDecks();
            expect(all.length).toBe(MAX_DECK_SLOTS);
        });
        it('returns null for unused slots', () => {
            const all = loadAllDecks();
            all.forEach((d) => expect(d).toBeNull());
        });
        it('returns saved decks in correct slots', () => {
            saveDeck(2, 'Slot 2', makeDeck16());
            const all = loadAllDecks();
            expect(all[0]).toBeNull();
            expect(all[1]).toBeNull();
            expect(all[2]).not.toBeNull();
            expect(all[2].name).toBe('Slot 2');
        });
    });
    describe('deleteDeck', () => {
        it('removes a deck from a slot', () => {
            saveDeck(0, 'Delete Me', makeDeck16());
            deleteDeck(0);
            expect(loadDeck(0)).toBeNull();
        });
        it('does not affect other slots', () => {
            saveDeck(0, 'Keep', makeDeck16());
            saveDeck(1, 'Delete', makeDeck16());
            deleteDeck(1);
            expect(loadDeck(0).name).toBe('Keep');
            expect(loadDeck(1)).toBeNull();
        });
        it('is safe to call on empty slot', () => {
            expect(() => deleteDeck(0)).not.toThrow();
        });
    });
});
//# sourceMappingURL=deck-storage.test.js.map
import type { Card } from '@mugen/shared';
export declare const STORAGE_KEY = "mugen-saved-decks";
export declare const MAX_DECK_SLOTS = 5;
export interface SavedDeck {
    name: string;
    cards: Card[];
    savedAt: number;
}
export declare function saveDeck(slot: number, name: string, cards: Card[]): void;
export declare function loadDeck(slot: number): SavedDeck | null;
export declare function loadAllDecks(): (SavedDeck | null)[];
export declare function deleteDeck(slot: number): void;
//# sourceMappingURL=deck-storage.d.ts.map
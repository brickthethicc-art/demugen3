import type { Card } from '@mugen/shared';
import type { CardType, AbilityType } from '@mugen/shared';
export interface DeckStore {
    currentDeck: Card[];
    deckName: string;
    activeSlot: number | null;
    searchQuery: string;
    typeFilter: CardType | null;
    costFilter: number | null;
    abilityFilter: AbilityType | null;
    addCardToDeck: (card: Card) => void;
    removeCardFromDeck: (index: number) => void;
    setDeckName: (name: string) => void;
    setActiveSlot: (slot: number | null) => void;
    loadDeckIntoBuilder: (name: string, slot: number, cards: Card[]) => void;
    clearDeck: () => void;
    setSearchQuery: (query: string) => void;
    setTypeFilter: (type: CardType | null) => void;
    setCostFilter: (cost: number | null) => void;
    setAbilityFilter: (type: AbilityType | null) => void;
    clearFilters: () => void;
    resetDeckBuilder: () => void;
}
export declare const useDeckStore: import("zustand").UseBoundStore<import("zustand").StoreApi<DeckStore>>;
//# sourceMappingURL=deck-store.d.ts.map
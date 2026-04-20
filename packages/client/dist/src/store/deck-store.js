import { create } from 'zustand';
import { MAX_DECK_SIZE } from '@mugen/shared';
const initialState = {
    currentDeck: [],
    deckName: '',
    activeSlot: null,
    searchQuery: '',
    typeFilter: null,
    costFilter: null,
    abilityFilter: null,
};
export const useDeckStore = create((set, get) => ({
    ...initialState,
    addCardToDeck: (card) => {
        const { currentDeck } = get();
        if (currentDeck.length >= MAX_DECK_SIZE)
            return;
        set({ currentDeck: [...currentDeck, card] });
    },
    removeCardFromDeck: (index) => {
        const { currentDeck } = get();
        if (index < 0 || index >= currentDeck.length)
            return;
        set({ currentDeck: currentDeck.filter((_, i) => i !== index) });
    },
    setDeckName: (name) => set({ deckName: name }),
    setActiveSlot: (slot) => set({ activeSlot: slot }),
    loadDeckIntoBuilder: (name, slot, cards) => set({ deckName: name, activeSlot: slot, currentDeck: [...cards] }),
    clearDeck: () => set({ currentDeck: [], deckName: '', activeSlot: null }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setTypeFilter: (type) => set({ typeFilter: type }),
    setCostFilter: (cost) => set({ costFilter: cost }),
    setAbilityFilter: (type) => set({ abilityFilter: type }),
    clearFilters: () => set({ searchQuery: '', typeFilter: null, costFilter: null, abilityFilter: null }),
    resetDeckBuilder: () => set(initialState),
}));
//# sourceMappingURL=deck-store.js.map
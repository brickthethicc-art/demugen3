import { create } from 'zustand';
import type { Card } from '@mugen/shared';
import type { CardType, AbilityType } from '@mugen/shared';
import { MAX_DECK_SIZE } from '@mugen/shared';

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

const initialState = {
  currentDeck: [] as Card[],
  deckName: '',
  activeSlot: null as number | null,
  searchQuery: '',
  typeFilter: null as CardType | null,
  costFilter: null as number | null,
  abilityFilter: null as AbilityType | null,
};

export const useDeckStore = create<DeckStore>((set, get) => ({
  ...initialState,

  addCardToDeck: (card) => {
    const { currentDeck } = get();
    if (currentDeck.length >= MAX_DECK_SIZE) return;
    set({ currentDeck: [...currentDeck, card] });
  },

  removeCardFromDeck: (index) => {
    const { currentDeck } = get();
    if (index < 0 || index >= currentDeck.length) return;
    set({ currentDeck: currentDeck.filter((_, i) => i !== index) });
  },

  setDeckName: (name) => set({ deckName: name }),
  setActiveSlot: (slot) => set({ activeSlot: slot }),

  loadDeckIntoBuilder: (name, slot, cards) =>
    set({ deckName: name, activeSlot: slot, currentDeck: [...cards] }),

  clearDeck: () => set({ currentDeck: [], deckName: '', activeSlot: null }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setCostFilter: (cost) => set({ costFilter: cost }),
  setAbilityFilter: (type) => set({ abilityFilter: type }),

  clearFilters: () =>
    set({ searchQuery: '', typeFilter: null, costFilter: null, abilityFilter: null }),

  resetDeckBuilder: () => set(initialState),
}));

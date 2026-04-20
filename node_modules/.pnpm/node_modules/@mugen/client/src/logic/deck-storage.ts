import type { Card } from '@mugen/shared';

export const STORAGE_KEY = 'mugen-saved-decks';
export const MAX_DECK_SLOTS = 5;

export interface SavedDeck {
  name: string;
  cards: Card[];
  savedAt: number;
}

interface StorageData {
  slots: (SavedDeck | null)[];
}

function readStorage(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { slots: new Array(MAX_DECK_SLOTS).fill(null) };
    const parsed = JSON.parse(raw) as StorageData;
    while (parsed.slots.length < MAX_DECK_SLOTS) {
      parsed.slots.push(null);
    }
    return parsed;
  } catch {
    return { slots: new Array(MAX_DECK_SLOTS).fill(null) };
  }
}

function writeStorage(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveDeck(slot: number, name: string, cards: Card[]): void {
  if (slot < 0 || slot >= MAX_DECK_SLOTS) {
    throw new Error(`Invalid slot ${slot}. Must be 0–${MAX_DECK_SLOTS - 1}`);
  }
  const data = readStorage();
  data.slots[slot] = { name, cards, savedAt: Date.now() };
  writeStorage(data);
}

export function loadDeck(slot: number): SavedDeck | null {
  if (slot < 0 || slot >= MAX_DECK_SLOTS) return null;
  const data = readStorage();
  return data.slots[slot] ?? null;
}

export function loadAllDecks(): (SavedDeck | null)[] {
  return readStorage().slots;
}

export function deleteDeck(slot: number): void {
  if (slot < 0 || slot >= MAX_DECK_SLOTS) return;
  const data = readStorage();
  data.slots[slot] = null;
  writeStorage(data);
}

import type { Card } from '@mugen/shared';
import { CardType, AbilityType } from '@mugen/shared';
export interface CardFilters {
    cardType?: CardType;
    cost?: number;
    abilityType?: AbilityType;
    search?: string;
}
export interface DeckStats {
    totalCards: number;
    averageCost: number;
    unitCount: number;
    sorceryCount: number;
    costCurve: Record<number, number>;
}
export interface DeckValidation {
    valid: boolean;
    errors: string[];
}
export declare function validateDeck(cards: Card[]): DeckValidation;
export declare function canAddCard(deckCards: Card[]): boolean;
export declare function filterCards(cards: Card[], filters: CardFilters): Card[];
export declare function getDeckStats(cards: Card[]): DeckStats;
//# sourceMappingURL=deck-logic.d.ts.map
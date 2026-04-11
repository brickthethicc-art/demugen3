import { useMemo } from 'react';
import { useDeckStore } from '../../store/deck-store.js';
import { ALL_CARDS } from '../../data/cards.js';
import { filterCards, canAddCard } from '../../logic/deck-logic.js';
import { CardItem } from './CardItem.js';
import { CardType, AbilityType } from '@mugen/shared';
import { Search, X } from 'lucide-react';

export function CardBrowser() {
  const currentDeck = useDeckStore((s) => s.currentDeck);
  const searchQuery = useDeckStore((s) => s.searchQuery);
  const typeFilter = useDeckStore((s) => s.typeFilter);
  const costFilter = useDeckStore((s) => s.costFilter);
  const abilityFilter = useDeckStore((s) => s.abilityFilter);
  const setSearchQuery = useDeckStore((s) => s.setSearchQuery);
  const setTypeFilter = useDeckStore((s) => s.setTypeFilter);
  const setCostFilter = useDeckStore((s) => s.setCostFilter);
  const setAbilityFilter = useDeckStore((s) => s.setAbilityFilter);
  const clearFilters = useDeckStore((s) => s.clearFilters);
  const addCardToDeck = useDeckStore((s) => s.addCardToDeck);

  const deckFull = !canAddCard(currentDeck);

  const filteredCards = useMemo(
    () =>
      filterCards(ALL_CARDS, {
        cardType: typeFilter ?? undefined,
        cost: costFilter ?? undefined,
        abilityType: abilityFilter ?? undefined,
        search: searchQuery || undefined,
      }),
    [typeFilter, costFilter, abilityFilter, searchQuery]
  );

  const hasFilters = searchQuery || typeFilter || costFilter != null || abilityFilter;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search cards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-mugen-bg border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-mugen-accent transition"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <select
          value={typeFilter ?? ''}
          onChange={(e) => setTypeFilter(e.target.value ? (e.target.value as CardType) : null)}
          className="px-2 py-1 bg-mugen-bg border border-white/10 rounded-md text-xs text-white focus:outline-none focus:border-mugen-accent"
        >
          <option value="">All Types</option>
          <option value={CardType.UNIT}>Unit</option>
          <option value={CardType.SORCERY}>Sorcery</option>
        </select>

        <select
          value={costFilter ?? ''}
          onChange={(e) => setCostFilter(e.target.value ? Number(e.target.value) : null)}
          className="px-2 py-1 bg-mugen-bg border border-white/10 rounded-md text-xs text-white focus:outline-none focus:border-mugen-accent"
        >
          <option value="">All Costs</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>{n} Cost</option>
          ))}
        </select>

        <select
          value={abilityFilter ?? ''}
          onChange={(e) => setAbilityFilter(e.target.value ? (e.target.value as AbilityType) : null)}
          className="px-2 py-1 bg-mugen-bg border border-white/10 rounded-md text-xs text-white focus:outline-none focus:border-mugen-accent"
        >
          <option value="">All Abilities</option>
          <option value={AbilityType.DAMAGE}>Damage</option>
          <option value={AbilityType.HEAL}>Heal</option>
          <option value={AbilityType.BUFF}>Buff</option>
          <option value={AbilityType.MODIFIER}>Modifier</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-2">{filteredCards.length} cards</p>

      {/* Card List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
        {filteredCards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onClick={() => addCardToDeck(card)}
            mode="add"
            disabled={deckFull}
          />
        ))}
        {filteredCards.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">No cards match filters</p>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useGameStore } from '../store/game-store.js';
import { ALL_CARDS } from '../data/cards.js';
import { filterCards } from '../logic/deck-logic.js';
import type { Card } from '@mugen/shared';
import { CardType, AbilityType } from '@mugen/shared';
import { ArrowLeft, Grid3x3, List, Search, X, Heart, Sword, Move, Target, Sparkles, Zap } from 'lucide-react';

export function CardLibraryScreen() {
  const setScreen = useGameStore((s) => s.setScreen);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CardType | null>(null);
  const [costFilter, setCostFilter] = useState<number | null>(null);
  const [abilityFilter, setAbilityFilter] = useState<AbilityType | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

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

  const clearAllFilters = () => {
    setSearchQuery('');
    setTypeFilter(null);
    setCostFilter(null);
    setAbilityFilter(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-mugen-bg text-white">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-white/5">
        <button
          onClick={() => setScreen('main-menu')}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-mugen-accent to-mugen-mana bg-clip-text text-transparent">
          Card Library
        </h1>
        <span className="ml-auto text-xs text-gray-500">{filteredCards.length} cards</span>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Grid"
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-mugen-accent/20 text-mugen-accent' : 'text-gray-500 hover:text-white'} transition`}
          >
            <Grid3x3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            aria-label="List"
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-mugen-accent/20 text-mugen-accent' : 'text-gray-500 hover:text-white'} transition`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-mugen-bg border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-mugen-accent transition"
          />
        </div>

        <select
          value={typeFilter ?? ''}
          onChange={(e) => setTypeFilter(e.target.value ? (e.target.value as CardType) : null)}
          className="px-2 py-1.5 bg-mugen-bg border border-white/10 rounded-md text-xs text-white focus:outline-none focus:border-mugen-accent"
        >
          <option value="">All Types</option>
          <option value={CardType.UNIT}>Unit</option>
          <option value={CardType.SORCERY}>Sorcery</option>
        </select>

        <select
          value={costFilter ?? ''}
          onChange={(e) => setCostFilter(e.target.value ? Number(e.target.value) : null)}
          className="px-2 py-1.5 bg-mugen-bg border border-white/10 rounded-md text-xs text-white focus:outline-none focus:border-mugen-accent"
        >
          <option value="">All Costs</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>{n} Cost</option>
          ))}
        </select>

        <select
          value={abilityFilter ?? ''}
          onChange={(e) => setAbilityFilter(e.target.value ? (e.target.value as AbilityType) : null)}
          className="px-2 py-1.5 bg-mugen-bg border border-white/10 rounded-md text-xs text-white focus:outline-none focus:border-mugen-accent"
        >
          <option value="">All Abilities</option>
          <option value={AbilityType.DAMAGE}>Damage</option>
          <option value={AbilityType.HEAL}>Heal</option>
          <option value={AbilityType.BUFF}>Buff</option>
          <option value={AbilityType.MODIFIER}>Modifier</option>
        </select>

        {hasFilters && (
          <button onClick={clearAllFilters} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedCard && (
          <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />
        )}

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredCards.map((card) => (
              <CardGridItem key={card.id} card={card} onClick={() => setSelectedCard(card)} />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCards.map((card) => (
              <CardListItem key={card.id} card={card} onClick={() => setSelectedCard(card)} />
            ))}
          </div>
        )}

        {filteredCards.length === 0 && (
          <p className="text-gray-500 text-center py-12">No cards match your filters</p>
        )}
      </div>
    </div>
  );
}

function CardGridItem({ card, onClick }: { card: Card; onClick: () => void }) {
  const isUnit = card.cardType === CardType.UNIT;
  return (
    <button
      onClick={onClick}
      className="bg-mugen-surface border border-white/5 rounded-xl p-3 hover:border-mugen-accent/50 transition text-left w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs px-1.5 py-0.5 rounded bg-mugen-mana/20 text-mugen-mana font-mono">{card.cost}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isUnit ? 'bg-mugen-accent/20 text-mugen-accent' : 'bg-mugen-gold/20 text-mugen-gold'}`}>
          {card.cardType}
        </span>
      </div>
      <p className="text-sm font-medium text-white truncate">{card.name}</p>
      {isUnit && (
        <div className="flex gap-2 mt-1.5 text-[10px] text-gray-400">
          <span className="text-red-400">{card.hp}HP</span>
          <span className="text-orange-400">{card.atk}ATK</span>
        </div>
      )}
    </button>
  );
}

function CardListItem({ card, onClick }: { card: Card; onClick: () => void }) {
  const isUnit = card.cardType === CardType.UNIT;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 bg-mugen-surface hover:border-mugen-accent/50 transition text-left text-sm"
    >
      <span className="w-6 h-6 flex items-center justify-center rounded-md bg-mugen-mana/20 text-mugen-mana text-xs font-mono shrink-0">{card.cost}</span>
      <span className="flex-1 truncate font-medium text-white">{card.name}</span>
      {isUnit && (
        <span className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
          <span className="text-red-400">{card.hp}HP</span>
          <span className="text-orange-400">{card.atk}ATK</span>
        </span>
      )}
      <span className={`text-xs px-1.5 py-0.5 rounded ${isUnit ? 'bg-mugen-accent/20 text-mugen-accent' : 'bg-mugen-gold/20 text-mugen-gold'} shrink-0`}>
        {isUnit ? 'U' : 'S'}
      </span>
    </button>
  );
}

function CardDetail({ card, onClose }: { card: Card; onClose: () => void }) {
  const isUnit = card.cardType === CardType.UNIT;
  return (
    <div className="mb-6 bg-mugen-surface border border-white/10 rounded-xl p-5 relative">
      <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white transition">
        <X size={16} />
      </button>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg px-2 py-1 rounded-lg bg-mugen-mana/20 text-mugen-mana font-mono">{card.cost}</span>
        <div>
          <h3 className="text-lg font-bold text-white">{card.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isUnit ? 'bg-mugen-accent/20 text-mugen-accent' : 'bg-mugen-gold/20 text-mugen-gold'}`}>
            {card.cardType}
          </span>
        </div>
      </div>

      {isUnit && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-sm text-red-400"><Heart size={14} /> {card.hp} HP</div>
            <div className="flex items-center gap-1.5 text-sm text-orange-400"><Sword size={14} /> {card.atk} ATK</div>
            <div className="flex items-center gap-1.5 text-sm text-green-400"><Move size={14} /> {card.movement} MOV</div>
            <div className="flex items-center gap-1.5 text-sm text-blue-400"><Target size={14} /> {card.range} RNG</div>
          </div>
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-mugen-gold" />
              <span className="font-medium text-white text-sm">{card.ability.name}</span>
              <span className="text-xs text-mugen-mana font-mono ml-auto">Cost: {card.ability.cost}</span>
            </div>
            <p className="text-sm text-gray-400">{card.ability.description}</p>
            <span className="text-xs text-gray-500 mt-1 inline-block">Type: {card.ability.abilityType}</span>
          </div>
        </>
      )}

      {!isUnit && (
        <div className="border-t border-white/5 pt-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-mugen-gold" />
            <span className="font-medium text-white text-sm">Effect</span>
          </div>
          <p className="text-sm text-gray-400">{card.effect}</p>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import type { Card } from '@mugen/shared';
import { CardType } from '@mugen/shared';
import { Heart, Sword, Plus, Minus } from 'lucide-react';
import { CardTooltip } from './CardTooltip.js';

interface CardItemProps {
  card: Card;
  onClick: () => void;
  mode: 'add' | 'remove';
  disabled?: boolean;
}

export function CardItem({ card, onClick, mode, disabled }: CardItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isUnit = card.cardType === CardType.UNIT;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && <CardTooltip card={card} />}

      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition text-left text-sm ${
          disabled
            ? 'opacity-40 cursor-not-allowed border-white/5 bg-mugen-bg'
            : mode === 'add'
              ? 'border-white/10 bg-mugen-bg hover:border-mugen-accent/50 hover:bg-mugen-accent/5'
              : 'border-white/10 bg-mugen-bg hover:border-mugen-danger/50 hover:bg-mugen-danger/5'
        }`}
      >
        <span className="w-6 h-6 flex items-center justify-center rounded-md bg-mugen-mana/20 text-mugen-mana text-xs font-mono shrink-0">
          {card.cost}
        </span>

        <span className="flex-1 truncate font-medium text-white">{card.name}</span>

        {isUnit && (
          <span className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
            <span className="flex items-center gap-0.5 text-red-400"><Heart size={10} />{card.hp}</span>
            <span className="flex items-center gap-0.5 text-orange-400"><Sword size={10} />{card.atk}</span>
          </span>
        )}

        <span className={`text-xs px-1.5 py-0.5 rounded ${isUnit ? 'bg-mugen-accent/20 text-mugen-accent' : 'bg-mugen-gold/20 text-mugen-gold'} shrink-0`}>
          {isUnit ? 'U' : 'S'}
        </span>

        <span className={`shrink-0 ${mode === 'add' ? 'text-mugen-success' : 'text-mugen-danger'}`}>
          {mode === 'add' ? <Plus size={14} /> : <Minus size={14} />}
        </span>
      </button>
    </div>
  );
}

import type { Card } from '@mugen/shared';
import { CardType } from '@mugen/shared';
import { Sword, Heart, Move, Target, Sparkles, Zap } from 'lucide-react';

interface CardTooltipProps {
  card: Card;
}

export function CardTooltip({ card }: CardTooltipProps) {
  const isUnit = card.cardType === CardType.UNIT;

  return (
    <div className="absolute z-50 w-64 bg-mugen-bg border border-white/10 rounded-xl p-4 shadow-2xl pointer-events-none -translate-y-full -mt-2 left-1/2 -translate-x-1/2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-white text-sm">{card.name}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-mugen-mana/20 text-mugen-mana font-mono">
          {card.cost}
        </span>
      </div>

      <span className={`text-xs px-2 py-0.5 rounded-full ${isUnit ? 'bg-mugen-accent/20 text-mugen-accent' : 'bg-mugen-gold/20 text-mugen-gold'}`}>
        {card.cardType}
      </span>

      {isUnit && (
        <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
          <div className="flex items-center gap-1 text-red-400">
            <Heart size={12} /> HP: {card.hp}
          </div>
          <div className="flex items-center gap-1 text-orange-400">
            <Sword size={12} /> ATK: {card.atk}
          </div>
          <div className="flex items-center gap-1 text-green-400">
            <Move size={12} /> MOV: {card.movement}
          </div>
          <div className="flex items-center gap-1 text-blue-400">
            <Target size={12} /> RNG: {card.range}
          </div>
        </div>
      )}

      {isUnit && (
        <div className="mt-3 border-t border-white/5 pt-2">
          <div className="flex items-center gap-1 text-xs text-mugen-gold mb-1">
            <Sparkles size={12} /> {card.ability.name}
            <span className="ml-auto text-mugen-mana font-mono">{card.ability.cost}</span>
          </div>
          <p className="text-xs text-gray-400">{card.ability.description}</p>
        </div>
      )}

      {!isUnit && (
        <div className="mt-3 border-t border-white/5 pt-2">
          <div className="flex items-center gap-1 text-xs text-mugen-gold mb-1">
            <Zap size={12} /> Effect
          </div>
          <p className="text-xs text-gray-400">{card.effect}</p>
        </div>
      )}
    </div>
  );
}

import { useGameStore } from '../store/game-store.js';
import { CardType, CombatModifierType } from '@mugen/shared';
import type { UnitCard, SorceryCard } from '@mugen/shared';
import { CardFront } from './CardFront.js';

const PANEL_CLASS = 'fixed left-0 top-1/2 -translate-y-1/2 mt-[70px] w-80 bg-gray-900/90 border-r border-white/10 p-6';

export function HoverPanel() {
  const hoveredCard = useGameStore(state => state.hoveredCard);
  const hoveredUnitInstance = useGameStore(state => state.hoveredUnitInstance);

  if (!hoveredCard) {
    return (
      <div
        data-testid="hover-panel"
        className={PANEL_CLASS}
      >
        <div className="text-gray-500 text-sm text-center">Hover over a unit to see details</div>
      </div>
    );
  }

  if (hoveredCard.cardType === CardType.SORCERY) {
    const sorceryCard = hoveredCard as SorceryCard;

    return (
      <div
        data-testid="hover-panel"
        className={PANEL_CLASS}
      >
        <div className="space-y-4 text-white">
          <div className="flex justify-center">
            <CardFront card={sorceryCard} width={200} height={280} isHovered />
          </div>

          <div className="space-y-3 border-t border-white/15 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Type:</span>
              <span className="font-semibold text-blue-400">Sorcery</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Cost:</span>
              <span className="font-semibold text-yellow-400">{sorceryCard.cost}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Effect</h3>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-sm text-gray-300">{sorceryCard.effect}</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="text-xs text-gray-500">
              Card ID: {sorceryCard.id}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const unitCard = hoveredCard as UnitCard;

  // Use live instance data when available (board units), otherwise fall back to card data
  const currentHp = hoveredUnitInstance ? hoveredUnitInstance.currentHp : unitCard.hp;
  const maxHp = unitCard.maxHp;
  const modifiers = hoveredUnitInstance ? hoveredUnitInstance.combatModifiers : [];
  const abilities = unitCard.abilities && unitCard.abilities.length > 0 ? unitCard.abilities : [unitCard.ability];

  // Calculate effective ATK with buffs
  const atkBuffCount = modifiers.filter(m => m.type === CombatModifierType.ATK_BUFF).length;
  const baseAtk = unitCard.atk;
  const effectiveAtk = baseAtk + atkBuffCount; // +1 ATK per buff
  const hasAtkBuff = atkBuffCount > 0;

  // Check for active modifiers
  const hasNoCounter = modifiers.some(m => m.type === CombatModifierType.NO_COUNTERATTACK);

  return (
    <div
      data-testid="hover-panel"
      className={PANEL_CLASS}
    >
      <div className="space-y-4 text-white">
        <div className="flex justify-center">
          <CardFront card={unitCard} width={200} height={280} isHovered />
        </div>

        <h2 className="text-xl font-bold text-red-400">{unitCard.name}</h2>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs">HP</span>
            <span className={`font-semibold ${currentHp < maxHp ? 'text-red-400' : ''}`}>
              {currentHp} / {maxHp}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-gray-400 text-xs">ATK</span>
            <span className={`font-semibold ${hasAtkBuff ? 'text-green-400' : ''}`}>
              {effectiveAtk}{hasAtkBuff && ` (+${atkBuffCount})`}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-gray-400 text-xs">MOV</span>
            <span className="font-semibold">{unitCard.movement}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-gray-400 text-xs">RNG</span>
            <span className="font-semibold">{unitCard.range}</span>
          </div>
        </div>

        {modifiers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Active Effects</h3>
            <div className="space-y-1">
              {hasAtkBuff && (
                <div className="text-xs text-green-400 bg-green-900/30 rounded px-2 py-1">
                  ATK Buff (+{atkBuffCount})
                </div>
              )}
              {hasNoCounter && (
                <div className="text-xs text-purple-400 bg-purple-900/30 rounded px-2 py-1">
                  No Counterattack
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-white/20">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">{abilities.length > 1 ? 'Abilities' : 'Ability'}</h3>
          <div className="space-y-2">
            {abilities.map((ability) => (
              <div key={ability.id} className="bg-gray-800 rounded p-3">
                <div className="font-semibold text-blue-400 mb-1">{ability.name}</div>
                <div className="text-xs text-gray-300 mb-2">{ability.description}</div>
                <div className="text-xs text-green-400">
                  {ability.cooldown != null ? `Cooldown: ${ability.cooldown}` : 'Free — once per turn'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-xs text-gray-500">
            Card ID: {unitCard.id}
          </div>
        </div>
      </div>
    </div>
  );
}

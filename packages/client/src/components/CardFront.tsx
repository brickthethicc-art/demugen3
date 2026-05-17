import type { CSSProperties } from 'react';
import {
  CardType,
  DEFAULT_STAT_DISPLAY_ORDER,
} from '@mugen/shared';
import type {
  AbilityDefinition,
  Card,
  CardFrameStyle,
  UnitInstance,
  SorceryCard,
  StatDisplayField,
  UnitCard,
} from '@mugen/shared';
import '../styles/card-framework.css';
import frameworkTemplateUrl from '../../../../DEMUGEN FRONT CARD FRAMEWORK.png';

interface CardFrontProps {
  card: Card;
  unitInstance?: UnitInstance;
  width?: number;
  height?: number;
  isHovered?: boolean;
  className?: string;
}

const FRAME_STYLE_CLASS: Record<CardFrameStyle, string> = {
  standard: 'border-standard',
  legendary: 'border-legendary',
  promo: 'border-promo',
};

function getThemeClass(borderTheme?: string): string {
  if (!borderTheme || borderTheme.trim().length === 0) {
    return 'theme-default';
  }

  return `theme-${borderTheme.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
}

function getCardNumber(cardId: string): string {
  const match = cardId.match(/(\d+)$/);
  const numberPart = match?.[1];

  if (!numberPart) {
    return cardId.toUpperCase();
  }

  return numberPart.padStart(3, '0');
}

function getSetCode(card: Card): string {
  return card.cardType === CardType.UNIT ? 'DGN-UNIT' : 'DGN-SORC';
}

function getSubtitle(card: Card): string {
  return card.cardType === CardType.UNIT ? 'Unit / Creature' : 'Sorcery / Spell';
}

function getStatValue(card: UnitCard, stat: StatDisplayField): number {
  switch (stat) {
    case 'atk':
      return card.atk;
    case 'hp':
      return card.hp;
    case 'movement':
      return card.movement;
    case 'range':
      return card.range;
    default:
      return 0;
  }
}

function getStatLabel(stat: StatDisplayField): string {
  switch (stat) {
    case 'atk':
      return 'ATK';
    case 'hp':
      return 'HP';
    case 'movement':
      return 'MOV';
    case 'range':
      return 'RNG';
    default:
      return '';
  }
}

function getUnitAbilities(card: UnitCard): AbilityDefinition[] {
  return card.abilities && card.abilities.length > 0 ? card.abilities : [card.ability];
}

interface SharedCardFrontProps {
  card: Card;
  width: number;
  height: number;
  isHovered: boolean;
  className?: string;
}

function CardFrontFrame({ card, width, height, isHovered, className, children }: SharedCardFrontProps & { children: React.ReactNode }) {
  const framework = card.framework;
  const frameStyle = framework?.cardFrameStyle ?? 'standard';
  const style: CSSProperties & { '--card-framework-template-url': string } = {
    width,
    height,
    '--card-framework-template-url': `url("${frameworkTemplateUrl}")`,
  };

  return (
    <div
      className={[
        'card-front',
        FRAME_STYLE_CLASS[frameStyle],
        getThemeClass(framework?.borderTheme),
        isHovered ? 'is-hovered' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      style={style}
      data-framework-compliant={framework?.frameworkCompliant === false ? 'false' : 'true'}
      data-frame-style={frameStyle}
      data-border-theme={framework?.borderTheme ?? 'default'}
      data-aspect-ratio={framework?.artAspectRatio ?? 'portrait'}
      data-text-layout={framework?.textLayout ?? 'standard'}
    >
      <div className="card-border" />
      <div className={`card-type-indicator ${card.cardType === CardType.UNIT ? 'unit-type' : 'sorcery-type'}`}>
        <span>{card.cardType === CardType.UNIT ? 'U' : 'S'}</span>
      </div>
      <div className="card-cost">{card.cost}</div>
      <div className="card-rarity" data-frame-style={frameStyle} />
      {children}
      <div className="card-meta">
        <span className="card-set">{getSetCode(card)}</span>
        <span className="card-id">#{getCardNumber(card.id)} · {card.id.toUpperCase()}</span>
      </div>
    </div>
  );
}

function UnitCardFront({ card, unitInstance, width, height, isHovered, className }: CardFrontProps & { card: UnitCard; width: number; height: number; isHovered: boolean }) {
  const statOrder =
    card.statDisplayOrder && card.statDisplayOrder.length > 0
      ? card.statDisplayOrder
      : [...DEFAULT_STAT_DISPLAY_ORDER];
  const abilities = getUnitAbilities(card);

  return (
    <CardFrontFrame card={card} width={width} height={height} isHovered={isHovered} className={className}>
      <div className="card-name">{card.name}</div>
      <div className="card-subtitle">{getSubtitle(card)}</div>
      <div className="card-art" data-aspect-ratio={card.framework?.artAspectRatio ?? 'portrait'}>
        {card.framework?.customImage ? (
          <img src={card.framework.customImage} alt={card.name} className="custom-card-art" />
        ) : (
          <div className="card-art-label">Unit</div>
        )}
      </div>
      <div className="card-stats">
        {statOrder.map((stat) => (
          <div key={stat} className={`stat stat-${stat}`}>
            <span className="stat-label">{getStatLabel(stat)}</span>
            <span className="stat-value">{getStatValue(card, stat)}</span>
          </div>
        ))}
      </div>
      <div className="card-ability" data-text-layout={card.framework?.textLayout ?? 'standard'} data-ability-count={abilities.length}>
        {abilities.map((ability) => (
          <div key={ability.id} className="ability-entry">
            <div className="ability-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <span>{ability.name}</span>
              {unitInstance && (unitInstance.abilityCooldowns?.[ability.id] ?? 0) > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    lineHeight: '12px',
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: 'rgba(220, 38, 38, 0.85)',
                    color: '#fff',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {unitInstance.abilityCooldowns?.[ability.id]}t
                </span>
              )}
            </div>
            <div className="ability-desc">{ability.description}</div>
            <div className="ability-cost">
              {ability.cooldown != null ? `Cooldown: ${ability.cooldown}` : `Cost: ${ability.cost}`}
            </div>
          </div>
        ))}
      </div>
    </CardFrontFrame>
  );
}

function SorceryCardFront({ card, width, height, isHovered, className }: CardFrontProps & { card: SorceryCard; width: number; height: number; isHovered: boolean }) {
  return (
    <CardFrontFrame card={card} width={width} height={height} isHovered={isHovered} className={className}>
      <div className="card-name">{card.name}</div>
      <div className="card-subtitle">{getSubtitle(card)}</div>
      <div className="card-art" data-aspect-ratio={card.framework?.artAspectRatio ?? 'portrait'}>
        <div className="card-art-label">Sorcery</div>
      </div>
      <div className="card-effect" data-text-layout={card.framework?.textLayout ?? 'standard'}>
        {card.effect}
      </div>
    </CardFrontFrame>
  );
}

export function CardFront({ card, unitInstance, width = 101, height = 139, isHovered = false, className }: CardFrontProps) {
  if (card.cardType === CardType.UNIT) {
    return (
      <UnitCardFront
        card={card}
        unitInstance={unitInstance}
        width={width}
        height={height}
        isHovered={isHovered}
        className={className}
      />
    );
  }

  return (
    <SorceryCardFront
      card={card}
      width={width}
      height={height}
      isHovered={isHovered}
      className={className}
    />
  );
}

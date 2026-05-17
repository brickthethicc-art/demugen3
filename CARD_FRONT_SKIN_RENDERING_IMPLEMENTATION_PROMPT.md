# Card Front Skin Rendering Implementation Prompt

## Overview
Implement the visual rendering of the card front framework defined in `DEMUGEN FRONT CARD FRAMEWORK.png`. The data structure and validation framework are already in place (see `CARD_FRONT_FRAMEWORK_IMPLEMENTATION_PROMPT.md`). This prompt focuses on applying the visual skin to all current cards and ensuring future cards automatically inherit the framework visual design.

## Current State
- Card framework data structure implemented in `packages/shared/src/types/card.ts`
- Framework validation and template generators in `packages/shared/src/utils/`
- All 64 cards have framework metadata attached (100% compliance validated)
- **NOT YET IMPLEMENTED**: Visual rendering of the framework design in the card components

## Framework Visual Zones (from PNG)
Based on `DEMUGEN FRONT CARD FRAMEWORK.png`, the visual framework includes:

1. **Card Border/Frame** - Outer decorative border with style variations (standard/legendary/promo)
2. **Card Type Indicator** - Visual marker for UNIT vs SORCERY
3. **Cost Display** - Top-left corner cost number with styling
4. **Name Area** - Card name display zone with typography
5. **Art/Image Area** - Central illustration space with aspect ratio handling
6. **Stats Panel** - For Unit cards: ATK, HP, Movement, Range in specified order
7. **Ability/Effect Text** - Description area with text layout modes
8. **Rarity/Quality Indicator** - Visual quality marker (frame style)
9. **Set/Series Identifier** - Card set information display
10. **ID/Number** - Unique card identifier display

## Implementation Tasks

### Phase 1: Create Card Front Component
**File: `packages/client/src/components/CardFront.tsx`**

Create a reusable card front component that renders the framework visual design:

```typescript
import type { UnitCard, SorceryCard, Card } from '@mugen/shared';
import { CardType } from '@mugen/shared';

interface CardFrontProps {
  card: Card;
  width?: number;
  height?: number;
  isHovered?: boolean;
}

export function CardFront({ card, width = 101, height = 139, isHovered = false }: CardFrontProps) {
  const framework = card.framework;
  const isLegendary = framework?.cardFrameStyle === 'legendary';
  const isPromo = framework?.cardFrameStyle === 'promo';
  
  // Determine frame style classes
  const frameStyle = isLegendary ? 'border-legendary' : isPromo ? 'border-promo' : 'border-standard';
  const borderTheme = framework?.borderTheme || 'default';
  
  if (card.cardType === CardType.UNIT) {
    return <UnitCardFront card={card} width={width} height={height} isHovered={isHovered} />;
  }
  
  return <SorceryCardFront card={card} width={width} height={height} isHovered={isHovered} />;
}

function UnitCardFront({ card, width, height, isHovered }: { card: UnitCard; width: number; height: number; isHovered: boolean }) {
  const framework = card.framework;
  const statOrder = card.statDisplayOrder || ['atk', 'hp', 'movement', 'range'];
  
  return (
    <div 
      className={`card-front ${framework?.cardFrameStyle} ${framework?.borderTheme}`}
      style={{ width, height }}
      data-framework-compliant={framework?.frameworkCompliant}
    >
      {/* Border/Frame */}
      <div className="card-border" />
      
      {/* Type Indicator */}
      <div className="card-type-indicator unit-type" />
      
      {/* Cost Display */}
      <div className="card-cost">{card.cost}</div>
      
      {/* Name Area */}
      <div className="card-name">{card.name}</div>
      
      {/* Art/Image Area */}
      <div className="card-art" data-aspect-ratio={framework?.artAspectRatio} />
      
      {/* Stats Panel - in specified order */}
      <div className="card-stats">
        {statOrder.map(stat => (
          <div key={stat} className={`stat stat-${stat}`}>
            {getStatValue(card, stat)}
          </div>
        ))}
      </div>
      
      {/* Ability Text */}
      <div className="card-ability" data-text-layout={framework?.textLayout}>
        <div className="ability-name">{card.ability.name}</div>
        <div className="ability-desc">{card.ability.description}</div>
        <div className="ability-cost">Cost: {card.ability.cost}</div>
      </div>
      
      {/* Rarity/Quality Indicator */}
      <div className="card-rarity" data-frame-style={framework?.cardFrameStyle} />
      
      {/* ID/Number */}
      <div className="card-id">{card.id}</div>
    </div>
  );
}

function SorceryCardFront({ card, width, height, isHovered }: { card: SorceryCard; width: number; height: number; isHovered: boolean }) {
  const framework = card.framework;
  
  return (
    <div 
      className={`card-front ${framework?.cardFrameStyle} ${framework?.borderTheme}`}
      style={{ width, height }}
      data-framework-compliant={framework?.frameworkCompliant}
    >
      {/* Border/Frame */}
      <div className="card-border" />
      
      {/* Type Indicator */}
      <div className="card-type-indicator sorcery-type" />
      
      {/* Cost Display */}
      <div className="card-cost">{card.cost}</div>
      
      {/* Name Area */}
      <div className="card-name">{card.name}</div>
      
      {/* Art/Image Area */}
      <div className="card-art" data-aspect-ratio={framework?.artAspectRatio} />
      
      {/* Effect Text */}
      <div className="card-effect" data-text-layout={framework?.textLayout}>
        {card.effect}
      </div>
      
      {/* Rarity/Quality Indicator */}
      <div className="card-rarity" data-frame-style={framework?.cardFrameStyle} />
      
      {/* ID/Number */}
      <div className="card-id">{card.id}</div>
    </div>
  );
}

function getStatValue(card: UnitCard, stat: string): number {
  switch (stat) {
    case 'atk': return card.atk;
    case 'hp': return card.hp;
    case 'movement': return card.movement;
    case 'range': return card.range;
    default: return 0;
  }
}
```

### Phase 2: Add Framework CSS
**File: `packages/client/src/styles/card-framework.css`**

Implement the visual styling for the framework zones:

```css
/* Card Front Framework Styles */
.card-front {
  position: relative;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card-front:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

/* Frame Styles */
.card-front.border-standard {
  border: 3px solid #4a4a6a;
}

.card-front.border-legendary {
  border: 3px solid #ffd700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
  animation: legendaryGlow 2s ease-in-out infinite alternate;
}

.card-front.border-promo {
  border: 3px solid #ff6b6b;
  box-shadow: 0 0 12px rgba(255, 107, 107, 0.3);
}

@keyframes legendaryGlow {
  from { box-shadow: 0 0 8px rgba(255, 215, 0, 0.2); }
  to { box-shadow: 0 0 16px rgba(255, 215, 0, 0.5); }
}

/* Type Indicators */
.card-type-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.card-type-indicator.unit-type {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-type-indicator.sorcery-type {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

/* Cost Display */
.card-cost {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 32px;
  height: 32px;
  background: #ffd700;
  color: #1a1a2e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  border: 2px solid #1a1a2e;
}

/* Name Area */
.card-name {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-weight: bold;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Art Area */
.card-art {
  flex: 1;
  background: linear-gradient(180deg, #2a2a4e 0%, #1a1a2e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.card-art[data-aspect-ratio="portrait"] {
  aspect-ratio: 3/4;
}

.card-art[data-aspect-ratio="landscape"] {
  aspect-ratio: 4/3;
}

.card-art[data-aspect-ratio="square"] {
  aspect-ratio: 1/1;
}

/* Stats Panel */
.card-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
}

.stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}

.stat::before {
  content: attr(data-stat);
  font-weight: bold;
  text-transform: uppercase;
}

/* Ability/Effect Text */
.card-ability,
.card-effect {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  color: #e0e0e0;
  font-size: 11px;
  line-height: 1.4;
}

.card-ability[data-text-layout="compact"],
.card-effect[data-text-layout="compact"] {
  font-size: 10px;
  padding: 4px 8px;
}

.card-ability[data-text-layout="expanded"],
.card-effect[data-text-layout="expanded"] {
  font-size: 12px;
  padding: 12px;
}

.ability-name {
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 4px;
}

.ability-cost {
  color: #ffd700;
  font-size: 10px;
  margin-top: 4px;
}

/* Rarity Indicator */
.card-rarity {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 12px;
  height: 12px;
}

.card-rarity[data-frame-style="legendary"] {
  background: #ffd700;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
}

.card-rarity[data-frame-style="standard"] {
  background: #4a4a6a;
  border-radius: 2px;
}

.card-rarity[data-frame-style="promo"] {
  background: #ff6b6b;
  border-radius: 2px;
}

/* ID Display */
.card-id {
  position: absolute;
  bottom: 8px;
  left: 8px;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.4);
}

/* Border Theme Variations */
.card-front.utility-support {
  border-color: #4ade80;
}

.card-front.utility-control {
  border-color: #f472b6;
}

.card-front.utility-vision {
  border-color: #60a5fa;
}

.card-front.utility-defense {
  border-color: #fbbf24;
}

.card-front.hidden {
  border-color: #6b7280;
  opacity: 0.8;
}
```

### Phase 3: Integrate CardFront into Existing Components
**Files to update:**
- `packages/client/src/components/HoverPanel.tsx` - Replace inline card display with CardFront
- `packages/client/src/components/GameHUD.tsx` - Use CardFront for hand/zone displays
- `packages/client/src/components/DiscardPileViewer.tsx` - Use CardFront for discard pile

**Example replacement in HoverPanel.tsx:**

```typescript
import { CardFront } from './CardFront';

// Replace inline card rendering with:
<CardFront card={hoveredCard} width={128} height={176} isHovered={true} />
```

### Phase 4: Add Framework Compliance Check to Build
**File: `packages/shared/package.json`**

Add framework validation to build process:

```json
{
  "scripts": {
    "validate-framework": "pnpm --filter @mugen/server exec tsx ../../scripts/migrate-cards-to-framework.ts",
    "build:with-validation": "tsc --noEmit && pnpm run validate-framework"
  }
}
```

### Phase 5: Ensure Future Cards Use Framework
**File: `docs/card-framework.md`**

Add enforcement section:

```markdown
## Framework Enforcement for Future Cards

### Required Process for Adding New Cards

1. **Use Template Generators**: Always use `createUnitCardTemplate()` or `createSorceryCardTemplate()` from `@mugen/shared`
2. **Run Validation**: After adding new cards, run `pnpm --filter @mugen/shared validate-framework`
3. **Build Check**: The build process includes framework validation and will fail on non-compliant cards

### Automated Enforcement

- Build process runs framework validation automatically
- CI/CD pipeline should include `pnpm --filter @mugen/shared validate-framework`
- Any card missing framework metadata will cause build to fail

### Code Review Checklist

When reviewing new card additions:
- [ ] Card uses template generator or includes all framework fields
- [ ] Card passes framework validation
- [ ] High-cost cards (≥7 units, ≥5 sorceries) use legendary frame
- [ ] Unit cards have valid statDisplayOrder
- [ ] borderTheme is set appropriately
- [ ] Framework compliance flag is true
```

### Phase 6: Create Framework Asset References
**File: `packages/client/src/assets/card-framework-assets.ts`**

Define asset paths for framework visual elements:

```typescript
export const CARD_FRAMEWORK_ASSETS = {
  borders: {
    standard: '/assets/borders/standard-border.png',
    legendary: '/assets/borders/legendary-border.png',
    promo: '/assets/borders/promo-border.png',
  },
  typeIcons: {
    unit: '/assets/icons/unit-icon.svg',
    sorcery: '/assets/icons/sorcery-icon.svg',
  },
  backgrounds: {
    portrait: '/assets/backgrounds/portrait-bg.png',
    landscape: '/assets/backgrounds/landscape-bg.png',
    square: '/assets/backgrounds/square-bg.png',
  },
  rarityIndicators: {
    standard: '/assets/indicators/standard-rarity.svg',
    legendary: '/assets/indicators/legendary-rarity.svg',
    promo: '/assets/indicators/promo-rarity.svg',
  },
};
```

### Phase 7: Add Framework Version Migration
**File: `scripts/migrate-framework-version.ts`**

Create script to handle future framework version migrations:

```typescript
import { ALL_CARDS } from '../packages/client/src/data/cards';
import { CARD_FRAMEWORK_VERSION, createDefaultCardFramework } from '../packages/shared/src/types/card';

function migrateFrameworkVersion(targetVersion: string) {
  const currentVersion = CARD_FRAMEWORK_VERSION;
  console.log(`Migrating from ${currentVersion} to ${targetVersion}`);
  
  // Migration logic for version changes
  // This would be updated when framework structure changes
  
  console.log('Migration complete');
}

if (process.argv[2]) {
  migrateFrameworkVersion(process.argv[2]);
} else {
  console.log('Usage: tsx migrate-framework-version.ts <target-version>');
}
```

## Execution Order
1. **Phase 1**: Create CardFront component
2. **Phase 2**: Add framework CSS styles
3. **Phase 3**: Integrate CardFront into existing components
4. **Phase 4**: Add build-time validation
5. **Phase 5**: Update documentation for future cards
6. **Phase 6**: Create asset references
7. **Phase 7**: Add migration script for version updates

## Success Criteria
- CardFront component renders all framework visual zones
- CSS styles implement standard/legendary/promo frame variations
- All existing card displays use CardFront component
- Build process fails on non-compliant cards
- Template generators enforce framework for new cards
- Documentation clearly states framework requirements
- Asset structure supports framework visual elements
- Migration script exists for future framework version changes

## Notes
- Framework visual design should match `DEMUGEN FRONT CARD FRAMEWORK.png` exactly
- All framework zones must be visually distinct and properly positioned
- Responsive design should work at different card sizes
- Performance should be acceptable for rendering many cards
- Framework should be extensible for future visual updates
- Consider adding animated elements for legendary/promo cards

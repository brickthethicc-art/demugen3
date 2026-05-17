# Card Front Design Framework Implementation Prompt

## Overview
Implement a repeatable, enforceable framework for the front design of all cards in the demugen3 game. The framework is defined in `DEMUGEN FRONT CARD FRAMEWORK.png` and must be applied to all existing cards and enforced for all future cards.

## Current State
- Card data structure defined in `packages/shared/src/types/card.ts`
- Card definitions in `packages/client/src/data/cards.ts`
- 42 Unit Cards and 22 Sorcery Cards currently exist
- No visual framework enforcement exists in the data structure

## Framework Design Analysis
Based on `DEMUGEN FRONT CARD FRAMEWORK.png`, the card front framework includes:

### Visual Zones
1. **Card Border/Frame** - Outer decorative border
2. **Card Type Indicator** - Visual marker for UNIT vs SORCERY
3. **Cost Display** - Top-left corner cost number
4. **Name Area** - Card name display zone
5. **Art/Image Area** - Central illustration space
6. **Stats Panel** - For Unit cards: ATK, HP, Movement, Range
7. **Ability/Effect Text** - Description area
8. **Rarity/Quality Indicator** - Visual quality marker
9. **Set/Series Identifier** - Card set information
10. **ID/Number** - Unique card identifier display

### Framework Requirements
- Consistent spacing and layout across all card types
- Type-specific variations (Unit vs Sorcery layouts)
- Scalable design that works at different card sizes
- Enforceable through data structure validation

## Implementation Tasks

### Phase 1: Extend Card Data Types
**File: `packages/shared/src/types/card.ts`**

Add framework-specific fields to card interfaces:

```typescript
export interface CardFramework {
  // Visual framework identifiers
  frameworkVersion: string;
  cardFrameStyle: 'standard' | 'legendary' | 'promo';
  borderTheme: string;
  
  // Layout specifications
  artAspectRatio: 'portrait' | 'landscape' | 'square';
  textLayout: 'standard' | 'compact' | 'expanded';
  
  // Visual elements
  hasSpecialBorder: boolean;
  hasAnimatedElements: boolean;
  backgroundPattern?: string;
  
  // Framework compliance
  frameworkCompliant: boolean;
  frameworkLastUpdated: string;
}

export interface UnitCard {
  // ... existing fields ...
  framework: CardFramework;
  statDisplayOrder: ('atk' | 'hp' | 'movement' | 'range')[];
  abilityIconId?: string;
}

export interface SorceryCard {
  // ... existing fields ...
  framework: CardFramework;
  effectIconId?: string;
  targetIndicator?: string;
}
```

### Phase 2: Create Framework Validation
**File: `packages/shared/src/utils/card-framework-validator.ts`**

Implement validation logic:

```typescript
import { Card, UnitCard, SorceryCard } from '../types/card';

export interface FrameworkValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCardFramework(card: Card): FrameworkValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check framework fields exist
  if (!card.framework) {
    errors.push('Missing framework object');
    return { isValid: false, errors, warnings };
  }
  
  // Validate framework version
  if (!card.framework.frameworkVersion) {
    errors.push('Missing framework version');
  }
  
  // Validate frame style
  const validFrameStyles = ['standard', 'legendary', 'promo'];
  if (!validFrameStyles.includes(card.framework.cardFrameStyle)) {
    errors.push(`Invalid cardFrameStyle: ${card.framework.cardFrameStyle}`);
  }
  
  // Type-specific validations
  if (card.cardType === CardType.UNIT) {
    const unit = card as UnitCard;
    if (!unit.statDisplayOrder || unit.statDisplayOrder.length !== 4) {
      errors.push('Unit cards must have statDisplayOrder with 4 elements');
    }
  }
  
  // Check compliance flag
  if (!card.framework.frameworkCompliant) {
    warnings.push('Card marked as not framework compliant');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateAllCards(cards: Card[]): Map<string, FrameworkValidationResult> {
  const results = new Map();
  
  for (const card of cards) {
    results.set(card.id, validateCardFramework(card));
  }
  
  return results;
}
```

### Phase 3: Update Card Definitions
**File: `packages/client/src/data/cards.ts`**

Update the `unit()` and `sorcery()` helper functions to include framework data:

```typescript
const DEFAULT_FRAMEWORK: CardFramework = {
  frameworkVersion: '1.0.0',
  cardFrameStyle: 'standard',
  borderTheme: 'default',
  artAspectRatio: 'portrait',
  textLayout: 'standard',
  hasSpecialBorder: false,
  hasAnimatedElements: false,
  frameworkCompliant: true,
  frameworkLastUpdated: new Date().toISOString()
};

function unit(
  // ... existing parameters ...
  frameworkOverride?: Partial<CardFramework>,
  statDisplayOrder?: ('atk' | 'hp' | 'movement' | 'range')[]
): UnitCard {
  return {
    // ... existing fields ...
    framework: {
      ...DEFAULT_FRAMEWORK,
      ...frameworkOverride
    },
    statDisplayOrder: statDisplayOrder || ['atk', 'hp', 'movement', 'range']
  };
}

function sorcery(
  // ... existing parameters ...
  frameworkOverride?: Partial<CardFramework>
): SorceryCard {
  return {
    // ... existing fields ...
    framework: {
      ...DEFAULT_FRAMEWORK,
      ...frameworkOverride
    }
  };
}
```

Update all 42 unit cards and 22 sorcery cards to include appropriate framework data. Apply framework overrides for:
- Legendary cards (cost 7-8): `cardFrameStyle: 'legendary'`, `hasSpecialBorder: true`
- High-cost sorceries (cost 5-6): `cardFrameStyle: 'legendary'`
- Special utility cards: Custom border themes as appropriate

### Phase 4: Create Framework Migration Script
**File: `scripts/migrate-cards-to-framework.ts`**

Create a script to validate and report on framework compliance:

```typescript
import { ALL_CARDS } from '../packages/client/src/data/cards';
import { validateAllCards } from '../packages/shared/src/utils/card-framework-validator';

function runMigrationCheck() {
  const results = validateAllCards(ALL_CARDS);
  
  let compliant = 0;
  let nonCompliant = 0;
  
  console.log('=== Card Framework Compliance Report ===\n');
  
  for (const [cardId, result] of results.entries()) {
    const card = ALL_CARDS.find(c => c.id === cardId);
    console.log(`Card: ${card?.name} (${cardId})`);
    console.log(`  Valid: ${result.isValid}`);
    
    if (result.errors.length > 0) {
      console.log('  Errors:');
      result.errors.forEach(err => console.log(`    - ${err}`));
      nonCompliant++;
    } else {
      compliant++;
    }
    
    if (result.warnings.length > 0) {
      console.log('  Warnings:');
      result.warnings.forEach(warn => console.log(`    - ${warn}`));
    }
    
    console.log('');
  }
  
  console.log(`=== Summary ===`);
  console.log(`Total Cards: ${ALL_CARDS.length}`);
  console.log(`Compliant: ${compliant}`);
  console.log(`Non-Compliant: ${nonCompliant}`);
  console.log(`Compliance Rate: ${((compliant / ALL_CARDS.length) * 100).toFixed(2)}%`);
}

runMigrationCheck();
```

### Phase 5: Add Build-Time Validation
**File: `packages/shared/src/utils/card-framework-validator.ts`**

Add a function to be called during build:

```typescript
export function enforceFrameworkCompliance(cards: Card[]): boolean {
  const results = validateAllCards(cards);
  let hasErrors = false;
  
  for (const [cardId, result] of results.entries()) {
    if (!result.isValid) {
      console.error(`Card ${cardId} failed framework validation:`, result.errors);
      hasErrors = true;
    }
  }
  
  if (hasErrors) {
    throw new Error('Framework compliance check failed. Fix errors before building.');
  }
  
  return true;
}
```

Add to `packages/shared/package.json`:
```json
{
  "scripts": {
    "validate-framework": "tsx src/utils/card-framework-validator.ts"
  }
}
```

### Phase 6: Create Card Template Generator
**File: `packages/shared/src/utils/card-template-generator.ts`**

Create a helper for generating new cards with proper framework:

```typescript
import { CardType, AbilityType } from '../types/card';
import type { UnitCard, SorceryCard, CardFramework } from '../types/card';

const DEFAULT_FRAMEWORK: CardFramework = {
  frameworkVersion: '1.0.0',
  cardFrameStyle: 'standard',
  borderTheme: 'default',
  artAspectRatio: 'portrait',
  textLayout: 'standard',
  hasSpecialBorder: false,
  hasAnimatedElements: false,
  frameworkCompliant: true,
  frameworkLastUpdated: new Date().toISOString()
};

export function createUnitCardTemplate(params: {
  id: string;
  name: string;
  cost: number;
  hp: number;
  atk: number;
  movement: number;
  range: number;
  abilityId: string;
  abilityName: string;
  abilityDesc: string;
  abilityCost: number;
  abilityType: AbilityType;
  framework?: Partial<CardFramework>;
}): UnitCard {
  const framework = { ...DEFAULT_FRAMEWORK, ...params.framework };
  
  // Auto-set legendary style for high-cost cards
  if (params.cost >= 7) {
    framework.cardFrameStyle = 'legendary';
    framework.hasSpecialBorder = true;
  }
  
  return {
    id: params.id,
    name: params.name,
    cardType: CardType.UNIT,
    hp: params.hp,
    maxHp: params.hp,
    atk: params.atk,
    movement: params.movement,
    range: params.range,
    cost: params.cost,
    ability: {
      id: params.abilityId,
      name: params.abilityName,
      description: params.abilityDesc,
      cost: params.abilityCost,
      abilityType: params.abilityType
    },
    framework,
    statDisplayOrder: ['atk', 'hp', 'movement', 'range']
  };
}

export function createSorceryCardTemplate(params: {
  id: string;
  name: string;
  cost: number;
  effect: string;
  framework?: Partial<CardFramework>;
}): SorceryCard {
  const framework = { ...DEFAULT_FRAMEWORK, ...params.framework };
  
  // Auto-set legendary style for high-cost cards
  if (params.cost >= 5) {
    framework.cardFrameStyle = 'legendary';
    framework.hasSpecialBorder = true;
  }
  
  return {
    id: params.id,
    name: params.name,
    cardType: CardType.SORCERY,
    cost: params.cost,
    effect: params.effect,
    framework
  };
}
```

### Phase 7: Documentation
**File: `docs/card-framework.md`**

Create documentation for the framework:

```markdown
# Card Front Design Framework

## Overview
All cards in demugen3 must follow the front design framework defined in `DEMUGEN FRONT CARD FRAMEWORK.png`.

## Framework Structure
Each card includes a `framework` object with the following fields:

- `frameworkVersion`: Version string (e.g., "1.0.0")
- `cardFrameStyle`: One of 'standard', 'legendary', 'promo'
- `borderTheme`: Theme identifier for card border
- `artAspectRatio`: 'portrait', 'landscape', or 'square'
- `textLayout`: 'standard', 'compact', or 'expanded'
- `hasSpecialBorder`: Boolean for special border effects
- `hasAnimatedElements`: Boolean for animated card elements
- `backgroundPattern`: Optional pattern identifier
- `frameworkCompliant`: Boolean flag for compliance
- `frameworkLastUpdated`: ISO timestamp of last framework update

## Creating New Cards

### Unit Cards
Use `createUnitCardTemplate()` from `packages/shared/src/utils/card-template-generator.ts`:

```typescript
import { createUnitCardTemplate } from '@mugen/shared/utils/card-template-generator';
import { AbilityType } from '@mugen/shared';

const newCard = createUnitCardTemplate({
  id: 'u43',
  name: 'New Unit',
  cost: 3,
  hp: 5,
  atk: 3,
  movement: 2,
  range: 1,
  abilityId: 'a43',
  abilityName: 'New Ability',
  abilityDesc: 'Does something cool',
  abilityCost: 2,
  abilityType: AbilityType.DAMAGE
});
```

### Sorcery Cards
Use `createSorceryCardTemplate()`:

```typescript
import { createSorceryCardTemplate } from '@mugen/shared/utils/card-template-generator';

const newSorcery = createSorceryCardTemplate({
  id: 's23',
  name: 'New Sorcery',
  cost: 2,
  effect: 'Deal 3 damage to target unit'
});
```

## Validation
Run framework validation:
```bash
cd packages/shared
npm run validate-framework
```

## Framework Compliance Rules
1. All cards must have a `framework` object
2. Framework version must be specified
3. Card frame style must be valid
4. Unit cards must have `statDisplayOrder` with 4 elements
5. High-cost cards (≥7 for units, ≥5 for sorceries) should use 'legendary' frame style
6. All cards should have `frameworkCompliant: true`

## Automatic Style Assignment
The template generators automatically assign:
- 'legendary' frame style to units with cost ≥7
- 'legendary' frame style to sorceries with cost ≥5
- `hasSpecialBorder: true` for legendary cards

## Migration
All existing cards have been migrated to framework version 1.0.0. See `scripts/migrate-cards-to-framework.ts` for validation.
```

## Execution Order
1. **Phase 1**: Extend card data types
2. **Phase 2**: Create validation utilities
3. **Phase 3**: Update card definitions with framework data
4. **Phase 4**: Create migration script
5. **Phase 5**: Add build-time validation
6. **Phase 6**: Create template generators
7. **Phase 7**: Write documentation

## Success Criteria
- All 64 existing cards have framework data
- Validation script passes with 100% compliance
- New card template generators produce compliant cards
- Build process fails on non-compliant cards
- Documentation is complete and accurate
- Framework can be versioned and updated in the future

## Notes
- Framework should be designed to be extensible for future visual updates
- Consider adding visual asset references (frame images, icons) in future iterations
- Framework versioning allows for gradual migration when design changes
- Keep framework fields serializable for network transmission

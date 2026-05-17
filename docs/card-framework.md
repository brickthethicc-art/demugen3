# Card Front Design Framework

## Overview
All cards in demugen3 must follow the front design framework defined in `DEMUGEN FRONT CARD FRAMEWORK.png`.

## Framework Structure
Each card can include a `framework` object with the following fields:

- `frameworkVersion`: Version string (for this rollout: `1.0.0`)
- `cardFrameStyle`: One of `standard`, `legendary`, `promo`
- `borderTheme`: Theme identifier for card border
- `artAspectRatio`: `portrait`, `landscape`, or `square`
- `textLayout`: `standard`, `compact`, or `expanded`
- `hasSpecialBorder`: Boolean for special border effects
- `hasAnimatedElements`: Boolean for animated card elements
- `backgroundPattern`: Optional pattern identifier
- `frameworkCompliant`: Boolean flag for compliance
- `frameworkLastUpdated`: ISO timestamp of last framework update

For unit cards, the framework model also supports:

- `statDisplayOrder`: Ordered stat fields (must include `atk`, `hp`, `movement`, `range`)
- `abilityIconId`: Optional icon reference for card ability

For sorcery cards, the framework model also supports:

- `effectIconId`: Optional icon reference for card effect
- `targetIndicator`: Optional target display hint

## Creating New Cards

### Unit Cards
Use `createUnitCardTemplate()` from `@mugen/shared`:

```typescript
import { AbilityType, createUnitCardTemplate } from '@mugen/shared';

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
  abilityType: AbilityType.DAMAGE,
});
```

### Sorcery Cards
Use `createSorceryCardTemplate()` from `@mugen/shared`:

```typescript
import { createSorceryCardTemplate } from '@mugen/shared';

const newSorcery = createSorceryCardTemplate({
  id: 's23',
  name: 'New Sorcery',
  cost: 2,
  effect: 'Deal 3 damage to target unit',
});
```

## Validation

### Validate Current Card Set
Run framework validation from `packages/shared`:

```bash
pnpm run validate-framework
```

### Programmatic Validation

```typescript
import { enforceFrameworkCompliance, validateAllCards } from '@mugen/shared';
import { ALL_CARDS } from '@mugen/client/src/data/cards';

const results = validateAllCards(ALL_CARDS);
enforceFrameworkCompliance(ALL_CARDS);
```

## Framework Compliance Rules
1. A card should include a `framework` object.
2. `frameworkVersion` should be set and versioned.
3. `cardFrameStyle`, `artAspectRatio`, and `textLayout` must use valid enum values.
4. Unit cards should define a valid `statDisplayOrder` containing all four core stats once.
5. High-cost cards should use `legendary` frame style:
   - units with cost `>= 7`
   - sorceries with cost `>= 5`
6. Cards are expected to keep `frameworkCompliant: true`.

## Automatic Style Assignment
Template generators and card helper builders automatically assign:

- `legendary` frame style to units with cost `>= 7`
- `legendary` frame style to sorceries with cost `>= 5`
- `hasSpecialBorder: true` for these legendary cards

## Framework Enforcement for Future Cards

### Required Process for Adding New Cards

1. **Use template generators**: Always use `createUnitCardTemplate()` or `createSorceryCardTemplate()` from `@mugen/shared`.
2. **Run validation**: After adding or updating cards, run `pnpm --filter @mugen/shared validate-framework`.
3. **Run validated build**: Run `pnpm --filter @mugen/shared build:with-validation` to combine type + framework checks.

### Automated Enforcement

- Build workflow supports framework validation via `build:with-validation`.
- CI should run `pnpm --filter @mugen/shared validate-framework` on card changes.
- Any card missing required framework metadata should fail validation.

### Code Review Checklist

When reviewing card additions/edits:

- [ ] Card uses template generator or includes complete framework fields
- [ ] Card passes framework validation command
- [ ] High-cost cards (units `>= 7`, sorceries `>= 5`) use `legendary` frame style
- [ ] Unit cards define valid `statDisplayOrder`
- [ ] `borderTheme` is set appropriately for utility/theme cards
- [ ] `frameworkCompliant` is `true`

## Migration
A migration/report script exists at `scripts/migrate-cards-to-framework.ts`. It:

- validates all cards in `packages/client/src/data/cards.ts`
- prints per-card compliance details
- prints a summary compliance rate
- throws if any card fails validation

## Versioning Notes
- Framework version constants live in `packages/shared/src/types/card.ts`
- Current version: `1.0.0`
- Baseline timestamp for this rollout: `2026-05-03T00:00:00.000Z`

When visual framework structure changes in future updates, bump `frameworkVersion` and update the validator rules accordingly.

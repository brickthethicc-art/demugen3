# Zeus Card Implementation Prompt

## Overview
Add a new legendary unit card called "Zeus" to the demugen3 game. This card has unique characteristics:
- Custom card front image (zeus.png in project root)
- Three distinct abilities (unlike current cards which have only one)
- High cost and powerful stats fitting a legendary tier

## Card Specifications

### Basic Stats
- **Name**: Zeus
- **Cost**: 10
- **HP**: 18
- **ATK**: 7
- **Range**: 5
- **MOV**: 4
- **Card Type**: Unit
- **Tier**: Legendary (cost ≥ 7 automatically triggers legendary frame style)

### Abilities
1. **THUNDERBRINGER** (Cooldown: 3)
   - Choose up to 2 enemies within 5 tiles
   - Deal 4 damage to each target
   - Targets hit cannot gain buffs until the end of their next turn

2. **WRATH OF OLYMPUS** (Cooldown: 5)
   - All enemy creatures within 4 tiles suffer 3 damage
   - Non-flying enemies are pushed back 1 tile
   - Flying creatures become stunned for 1 turn instead

3. **DIVINE DECREE** (Cooldown: 6)
   - Choose one enemy unit on the battlefield
   - That creature's abilities are disabled until the end of its next turn
   - If the target is below half HP, deal an additional 3 damage

## Implementation Tasks

### 1. Extend Type System for Multiple Abilities
**File**: `packages/shared/src/types/card.ts`

Current UnitCard interface only supports a single ability:
```typescript
ability: AbilityDefinition;
```

**Required Changes**:
- Extend the type system to support multiple abilities per unit
- Add a new field like `abilities?: AbilityDefinition[]` to UnitCard interface
- Maintain backward compatibility - keep `ability` field for single-ability cards
- Add a new AbilityType enum value if needed for the debuff/disable effect type
- Consider adding cooldown tracking to AbilityDefinition interface

### 2. Add Zeus Card Definition
**File**: `packages/client/src/data/cards.ts`

**Required Changes**:
- Add Zeus to the ALL_UNITS array with appropriate ID (e.g., 'u43' or 'zeus')
- Use the unit() helper function or create a new helper for multi-ability units
- Set frameworkOverride to include custom image reference
- Since cost is 10, it will automatically get legendary frame style
- Example structure:
```typescript
unit('u43', 'Zeus', 10, 18, 7, 4, 5, 
  'thunderbringer', 'Thunderbringer', 'Choose up to 2 enemies within 5 tiles. Deal 4 damage to each target. Targets hit cannot gain buffs until the end of their next turn.', 3, AbilityType.DAMAGE,
  { customImage: '/zeus.png' } // or however custom images should be referenced
),
```

**Note**: Since Zeus has 3 abilities, you may need to create a new helper function like `multiAbilityUnit()` that accepts an array of abilities instead of a single ability.

### 3. Implement Custom Card Image Support
**File**: `packages/client/src/components/CardFront.tsx`

Current implementation uses a programmatic framework template. Need to:
- Add support for custom card art images via CardFramework or a new field
- Check if card has a custom image path (e.g., `framework.customImage` or `card.customArtPath`)
- If custom image exists, render it instead of the programmatic card-art div
- Move zeus.png from project root to appropriate location (likely `packages/client/public/assets/` or `packages/client/public/`)
- Update the image reference in the card definition to point to the correct path

**Implementation approach**:
```typescript
// In UnitCardFront component, replace the card-art div with:
<div className="card-art" data-aspect-ratio={card.framework?.artAspectRatio ?? 'portrait'}>
  {card.framework?.customImage ? (
    <img src={card.framework.customImage} alt={card.name} className="custom-card-art" />
  ) : (
    <div className="card-art-label">Unit</div>
  )}
</div>
```

### 4. Update CardFront CSS (if needed)
**File**: `packages/client/src/styles/card-framework.css`

Add CSS for custom card art images to ensure they:
- Fit within the card-art container
- Maintain proper aspect ratio
- Are positioned correctly within the frame
- Don't break the existing framework layout

Example:
```css
.custom-card-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
```

### 5. Validate Card Framework Compliance
Run the framework validation script to ensure Zeus card is compliant:
```bash
pnpm --filter @mugen/shared validate-framework
```

### 6. Test the Implementation
- Verify Zeus card appears in card library/deck builder
- Confirm custom zeus.png image renders correctly on card front
- Check that all 3 abilities are displayed (may need UI updates for multi-ability display)
- Ensure legendary frame style is applied automatically
- Test card in gameplay if ability system supports the new ability types

## Important Notes

1. **Backward Compatibility**: Ensure changes don't break existing 42 unit cards
2. **Type Safety**: Maintain TypeScript strict mode compliance
3. **Image Path**: The zeus.png file is currently in the project root - move it to the public folder for proper serving
4. **Ability Display**: The current CardFront component only shows one ability - you may need to update the UI to display all 3 abilities for Zeus
5. **Cooldown System**: Verify if the game already has a cooldown system implemented; if not, this may require additional backend work

## Files to Modify

1. `packages/shared/src/types/card.ts` - Extend type system for multiple abilities
2. `packages/client/src/data/cards.ts` - Add Zeus card definition
3. `packages/client/src/components/CardFront.tsx` - Add custom image support and multi-ability display
4. `packages/client/src/styles/card-framework.css` - Add CSS for custom card art
5. Move `zeus.png` from project root to `packages/client/public/` or `packages/client/public/assets/`

## Success Criteria

- Zeus card is added to the card library with correct stats
- Custom zeus.png image displays on card front instead of programmatic art
- All 3 abilities are defined in the type system
- Card renders with legendary frame style (automatic due to cost ≥ 7)
- Existing cards continue to work without changes
- Framework validation passes for the new card

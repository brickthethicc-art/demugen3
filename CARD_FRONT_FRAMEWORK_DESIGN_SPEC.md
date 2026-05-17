# Demugen Card Front Framework - Complete Design Specification

## Overview
This specification provides pixel-perfect recreatable details for the demugen card front framework. All values are exact - colors in hex, dimensions in pixels, and all CSS properties specified.

---

## Base Card Dimensions

**Default Size:** 101px width × 139px height
**Border Radius:** 10px (all corners)

---

## Card Background

**Base Gradient:**
```
linear-gradient(180deg, #151a2f 0%, #0a0f1f 100%)
```

**Default Box Shadow:**
```
0 6px 14px rgba(0, 0, 0, 0.32)
```

**Hover State:**
- Transform: translateY(-2px)
- Box Shadow: 0 10px 20px rgba(0, 0, 0, 0.38)
- Transition: 0.2s ease for both transform and box-shadow

---

## Border Styles

### Common Border Properties
- Position: absolute, inset: 0
- Border Radius: 10px
- Z-index: 2
- Pointer events: none

### Standard Frame Style
- Border: 2px solid `#4f5c89`
- Inner Glow: inset 0 0 0 1px rgba(255, 255, 255, 0.08)

### Legendary Frame Style
- Border: 2px solid `#ffd37a`
- Inner Glow: inset 0 0 0 1px rgba(255, 248, 192, 0.35)
- Outer Glow: 0 0 10px rgba(255, 211, 122, 0.45)
- **Animation:** `card-front-legendary-glow` (2.2s ease-in-out infinite alternate)

**Legendary Glow Animation Keyframes:**
```
From:
  box-shadow: inset 0 0 0 1px rgba(255, 248, 192, 0.22), 0 0 6px rgba(255, 211, 122, 0.3)

To:
  box-shadow: inset 0 0 0 1px rgba(255, 248, 192, 0.42), 0 0 14px rgba(255, 211, 122, 0.55)
```

### Promo Frame Style
- Border: 2px solid `#fd8797`
- Inner Glow: inset 0 0 0 1px rgba(255, 208, 214, 0.28)
- Outer Glow: 0 0 8px rgba(253, 135, 151, 0.35)

---

## Border Theme Variations

These modify the border color only (applied via `.theme-*` classes):

- **theme-default:** No additional border color change
- **theme-utility-support:** Border color `#34d399`
- **theme-utility-control:** Border color `#f472b6`
- **theme-utility-vision:** Border color `#d4a574`
- **theme-utility-defense:** Border color `#fbbf24`

---

## Card Type Indicator

**Position:** Top-right corner
- Top: 5px
- Right: 5px
- Width: 16px
- Height: 16px
- Border Radius: 9999px (fully circular)
- Z-index: 3

**Typography:**
- Font Size: 9px
- Font Weight: 700 (bold)
- Color: `#f8fafc`
- Text Shadow: 0 1px 2px rgba(0, 0, 0, 0.45)
- Display: grid, place-items: center
- Content: Single letter "U" for Unit, "S" for Sorcery

**Unit Type Background:**
```
linear-gradient(135deg, #d4a574 0%, #b8956c 100%)
```

**Sorcery Type Background:**
```
linear-gradient(135deg, #e879f9 0%, #fb7185 100%)
```

---

## Card Cost Display

**Position:** Top-left corner
- Top: 5px
- Left: 5px
- Min Width: 16px
- Height: 16px
- Padding: 0 4px (horizontal)
- Border Radius: 9999px (fully circular/rounded)
- Z-index: 3

**Background:**
```
linear-gradient(180deg, #ffe08a 0%, #f5b942 100%)
```

**Border:** 1px solid rgba(38, 28, 6, 0.65)

**Typography:**
- Font Size: 10px
- Line Height: 1
- Font Weight: 700 (bold)
- Color: `#211b0b`
- Display: grid, place-items: center

---

## Card Name

**Grid Row:** 1 (top section)
**Z-index:** 1
**Margins:** 22px (top) 6px (horizontal) 4px (bottom)
**Padding:** 3px (vertical) 6px (horizontal)
**Border Radius:** 5px

**Background:** rgba(9, 12, 21, 0.72)
**Border:** 1px solid rgba(255, 255, 255, 0.08)

**Typography:**
- Color: `#f8fafc`
- Font Weight: 700 (bold)
- Font Size: 10px
- Letter Spacing: 0.01em
- Line Height: 1.15
- Text Align: center
- White Space: nowrap
- Overflow: hidden
- Text Overflow: ellipsis

---

## Card Art Area

**Margins:** 0 6px (horizontal)
**Border Radius:** 6px
**Border:** 1px solid rgba(255, 255, 255, 0.1)
**Min Height:** 30px (default portrait)
**Display:** grid, place-items: center
**Overflow:** hidden

**Background Layer (stacked, top to bottom):**
1. Top highlight:
   ```
   linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 100%)
   ```

2. Radial accent (20% from left, 20% from top):
   ```
   radial-gradient(circle at 20% 20%, rgba(212, 165, 116, 0.32), transparent 45%)
   ```

3. Base gradient:
   ```
   linear-gradient(165deg, #24395f 0%, #111a31 65%, #0b1325 100%)
   ```

**Aspect Ratio Variations:**
- **Portrait:** Min height 30px (default)
- **Landscape:** Min height 24px
- **Square:** Min height 28px

**Art Label (placeholder text):**
- Padding: 2px (vertical) 6px (horizontal)
- Border Radius: 9999px
- Background: rgba(2, 6, 23, 0.55)
- Border: 1px solid rgba(255, 255, 255, 0.12)
- Color: rgba(226, 232, 240, 0.92)
- Font Size: 8px
- Font Weight: 700 (bold)
- Letter Spacing: 0.08em
- Text Transform: uppercase
- Content: "Unit" or "Sorcery"

---

## Card Stats (Unit Cards Only)

**Margins:** 4px (top) 6px (horizontal) 0 (bottom)
**Display:** grid
**Grid Template:** 2 columns, equal width
**Gap:** 2px

**Individual Stat Block:**
- Padding: 2px (vertical) 4px (horizontal)
- Border Radius: 4px
- Background: rgba(15, 23, 42, 0.7)
- Border: 1px solid rgba(148, 163, 184, 0.24)
- Color: `#f8fafc`
- Display: flex
- Align Items: center
- Justify Content: space-between
- Gap: 4px
- Font Size: 8px
- Line Height: 1

**Stat Label:**
- Font Weight: 700 (bold)
- Letter Spacing: 0.04em
- Color: rgba(203, 213, 225, 0.92)
- Values: ATK, HP, MOV, RNG

**Stat Value:**
- Font Weight: 700 (bold)
- Color: rgba(248, 250, 252, 0.96)

---

## Card Ability Section (Unit Cards Only)

**Margins:** 4px (top) 6px (horizontal) 0 (bottom)
**Padding:** 4px (vertical) 5px (horizontal)
**Border Radius:** 5px
**Background:** rgba(3, 7, 17, 0.74)
**Border:** 1px solid rgba(255, 255, 255, 0.08)
**Color:** rgba(226, 232, 240, 0.94)
**Font Size:** 8px
**Line Height:** 1.2
**Overflow:** hidden

**Text Layout Variations:**
- **Standard:** Font size 8px, line height 1.2
- **Compact:** Font size 7px, line height 1.15
- **Expanded:** Font size 8px, line height 1.3

**Ability Name:**
- Color: `#fcd34d` (yellow-gold)
- Font Weight: 700 (bold)
- Font Size: 8px
- Line Height: 1.1
- White Space: nowrap
- Overflow: hidden
- Text Overflow: ellipsis
- Margin Bottom: 2px

**Ability Description:**
- Display: -webkit-box
- Line Clamp: 3 (max 3 lines visible)
- -webkit-line-clamp: 3
- -webkit-box-orient: vertical
- Overflow: hidden

**Ability Cost:**
- Margin Top: 2px
- Color: rgba(212, 165, 116, 0.95) (brown)
- Font Size: 7px
- Font Weight: 700 (bold)
- Format: "Cost: {value}"

---

## Card Effect Section (Sorcery Cards Only)

**Margins:** 4px (top) 6px (horizontal) 0 (bottom)
**Padding:** 4px (vertical) 5px (horizontal)
**Border Radius:** 5px
**Background:** rgba(3, 7, 17, 0.74)
**Border:** 1px solid rgba(255, 255, 255, 0.08)
**Color:** rgba(226, 232, 240, 0.94)
**Font Size:** 8px
**Line Height:** 1.2
**Overflow:** hidden

**Text Layout Variations:**
- **Standard:** Font size 8px, line height 1.2
- **Compact:** Font size 7px, line height 1.15
- **Expanded:** Font size 8px, line height 1.3

**Display:** -webkit-box
**Line Clamp:** 5 (max 5 lines visible)
**-webkit-line-clamp:** 5
**-webkit-box-orient:** vertical

---

## Rarity Indicator

**Position:** Absolute
- Right: 6px
- Bottom: 17px
- Width: 7px
- Height: 7px
- Z-index: 3

**Legendary Rarity:**
- Border Radius: 9999px (circular)
- Background: `#facc15` (yellow)
- Box Shadow: 0 0 6px rgba(250, 204, 21, 0.72)

**Promo Rarity:**
- Border Radius: 2px (square with slight rounding)
- Background: `#fb7185` (pink)

**Standard Rarity:**
- Border Radius: 2px (square with slight rounding)
- Background: `#64748b` (slate gray)

---

## Card Meta Footer

**Grid Row:** 4 (bottom section)
**Z-index:** 1
**Margins:** 4px (top) 6px (horizontal) 6px (bottom)
**Display:** flex
**Align Items:** center
**Justify Content:** space-between
**Gap:** 6px

**Typography:**
- Color: rgba(148, 163, 184, 0.9)
- Font Size: 6px
- Line Height: 1
- Letter Spacing: 0.06em
- Text Transform: uppercase

**Set Code:**
- Content: "DGN-UNIT" for units, "DGN-SORC" for sorceries
- White Space: nowrap
- Overflow: hidden
- Text Overflow: ellipsis

**Card ID:**
- Format: "#{number} · {ID_UPPERCASE}"
- Number: Padded to 3 digits with leading zeros (extracted from trailing digits in ID)
- Example: "#043 · U43"
- White Space: nowrap
- Overflow: hidden
- Text Overflow: ellipsis

---

## Grid Layout Structure

**Container:** `.card-front`
- Display: grid
- Grid Template Rows: `auto minmax(0, 1fr) auto auto`
- Row breakdown:
  1. auto: Card name (top)
  2. minmax(0, 1fr): Art area (flexible middle)
  3. auto: Stats/ability or effect
  4. auto: Meta footer (bottom)

---

## Non-Compliance Visual

**When `data-framework-compliant='false'`:**
- Filter: grayscale(0.2) (slightly desaturated)

---

## Complete Color Palette Reference

### Background Colors
- Card base top: `#151a2f`
- Card base bottom: `#0a0f1f`
- Name background: rgba(9, 12, 21, 0.72)
- Stats background: rgba(15, 23, 42, 0.7)
- Ability/effect background: rgba(3, 7, 17, 0.74)
- Art label background: rgba(2, 6, 23, 0.55)

### Border Colors
- Standard border: `#4f5c89`
- Legendary border: `#ffd37a`
- Promo border: `#fd8797`
- Utility support: `#34d399`
- Utility control: `#f472b6`
- Utility vision: `#d4a574`
- Utility defense: `#fbbf24`

### Text Colors
- Primary text: `#f8fafc`
- Stat label: rgba(203, 213, 225, 0.92)
- Stat value: rgba(248, 250, 252, 0.96)
- Ability name: `#fcd34d`
- Ability cost: rgba(147, 197, 253, 0.95)
- Meta footer: rgba(148, 163, 184, 0.9)
- Art label: rgba(226, 232, 240, 0.92)
- Type indicator: `#f8fafc`
- Cost text: `#211b0b`

### Gradient Colors
- Cost background top: `#ffe08a`
- Cost background bottom: `#f5b942`
- Unit type gradient start: `#d4a574`
- Unit type gradient end: `#b8956c`
- Sorcery type gradient start: `#e879f9`
- Sorcery type gradient end: `#fb7185`
- Art gradient 1: `#24395f`
- Art gradient 2: `#111a31`
- Art gradient 3: `#0b1325`
- Art radial accent: rgba(212, 165, 116, 0.32)

### Rarity Colors
- Legendary: `#facc15`
- Promo: `#fb7185`
- Standard: `#64748b`

### Shadow/Overlay Colors
- Default shadow: rgba(0, 0, 0, 0.32)
- Hover shadow: rgba(0, 0, 0, 0.38)
- Text shadow: rgba(0, 0, 0, 0.45)
- Legendary glow: rgba(255, 211, 122, 0.45)
- Legendary inner glow: rgba(255, 248, 192, 0.35)
- Promo glow: rgba(253, 135, 151, 0.35)
- Standard inner glow: rgba(255, 255, 255, 0.08)
- Cost border: rgba(38, 28, 6, 0.65)
- Stats border: rgba(148, 163, 184, 0.24)
- Name/ability border: rgba(255, 255, 255, 0.08)
- Art border: rgba(255, 255, 255, 0.1)
- Art label border: rgba(255, 255, 255, 0.12)
- Art top highlight: rgba(255, 255, 255, 0.08)

---

## Typography Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Card Name | 10px | 700 | 1.15 | 0.01em |
| Cost | 10px | 700 | 1 | - |
| Type Indicator | 9px | 700 | - | - |
| Stats | 8px | 700 | 1 | - |
| Stat Label | 8px | 700 | - | 0.04em |
| Ability Name | 8px | 700 | 1.1 | - |
| Ability/Effect | 8px | - | 1.2 | - |
| Compact Text | 7px | - | 1.15 | - |
| Ability Cost | 7px | 700 | - | - |
| Art Label | 8px | 700 | - | 0.08em |
| Meta Footer | 6px | - | 1 | 0.06em |

---

## Spacing Reference

| Element | Top | Right | Bottom | Left |
|---------|-----|-------|--------|------|
| Card Type Indicator | 5px | 5px | - | - |
| Card Cost | 5px | - | - | 5px |
| Card Name | 22px | 6px | 4px | 6px |
| Card Art | - | 6px | - | 6px |
| Card Stats | 4px | 6px | 0 | 6px |
| Card Ability/Effect | 4px | 6px | 0 | 6px |
| Card Meta | 4px | 6px | 6px | 6px |
| Rarity Indicator | - | 6px | 17px | - |

---

## Z-Index Stack

1. Card Border: 2
2. Type Indicator: 3
3. Card Cost: 3
4. Rarity Indicator: 3
5. Card Name: 1
6. Card Meta: 1

---

## Animation Timing

- Hover transition: 0.2s ease (transform and box-shadow)
- Legendary glow: 2.2s ease-in-out infinite alternate

---

## Data Attributes (for CSS targeting)

- `data-framework-compliant`: "true" or "false"
- `data-frame-style`: "standard", "legendary", or "promo"
- `data-border-theme`: theme identifier (e.g., "default", "utility-support")
- `data-aspect-ratio`: "portrait", "landscape", or "square"
- `data-text-layout`: "standard", "compact", or "expanded"

---

## CSS Class Naming Convention

- `.card-front` - Main container
- `.card-border` - Border overlay
- `.border-{style}` - Frame style modifier (standard/legendary/promo)
- `.theme-{name}` - Border theme modifier
- `.card-type-indicator` - Type badge
- `.unit-type` / `.sorcery-type` - Type-specific styling
- `.card-cost` - Cost display
- `.card-name` - Name field
- `.card-art` - Art area
- `.card-art-label` - Art placeholder text
- `.card-stats` - Stats container (units)
- `.stat` - Individual stat block
- `.stat-{field}` - Stat-specific (atk/hp/movement/range)
- `.stat-label` / `.stat-value` - Stat text parts
- `.card-ability` - Ability section (units)
- `.card-effect` - Effect section (sorceries)
- `.ability-name` / `.ability-desc` / `.ability-cost` - Ability parts
- `.card-rarity` - Rarity indicator
- `.card-meta` - Footer metadata
- `.card-set` / `.card-id` - Meta parts
- `.is-hovered` - Hover state modifier

---

## Implementation Notes

1. **Grid Layout:** The card uses CSS Grid with 4 rows. The middle row (art) is flexible using `minmax(0, 1fr)` to fill available space.

2. **Overflow Handling:** All text fields use `text-overflow: ellipsis` with `white-space: nowrap` for single-line truncation. Multi-line text uses `-webkit-line-clamp`.

3. **Layering:** The border sits on top (z-index: 2) with decorative elements (type, cost, rarity) at z-index: 3. Content sits at z-index: 1.

4. **Performance:** Uses `isolation: isolate` and `transform: translateZ(0)` for GPU acceleration and proper stacking context.

5. **Responsive:** The component accepts custom width/height props but maintains proportional spacing through margins and percentages.

6. **Accessibility:** All text has sufficient contrast ratios (verified against WCAG AA standards for the given color combinations).

---

## Asset References (Placeholder Structure)

The framework references the following asset paths (currently CSS-only implementation):

```
/assets/borders/standard-border.png
/assets/borders/legendary-border.png
/assets/borders/promo-border.png
/assets/icons/unit-icon.svg
/assets/icons/sorcery-icon.svg
/assets/backgrounds/portrait-bg.png
/assets/backgrounds/landscape-bg.png
/assets/backgrounds/square-bg.png
/assets/indicators/standard-rarity.svg
/assets/indicators/legendary-rarity.svg
/assets/indicators/promo-rarity.svg
```

*Note: Current implementation uses pure CSS gradients and styling without external image assets.*

---

## Version History

- **v1.0.0** (2026-05-03): Initial framework specification

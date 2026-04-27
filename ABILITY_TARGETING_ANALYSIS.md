# Unit Ability Targeting Analysis

## STEP 1: All Unit Abilities - Effect, Target, Trigger

| # | Unit | Ability | Effect | Target | Trigger |
|---|------|---------|--------|--------|---------|
| 1 | Scout Wisp | Flicker | Deal 1 damage | Adjacent enemy | Ability use |
| 2 | Ember Sprite | Spark | Deal 1 damage | Target in range | Ability use |
| 3 | Vine Creeper | Entangle | Reduce movement by 1 | Target enemy | Ability use |
| 4 | Iron Pup | Guard Stance | Gain +1 ATK | Self | Ability use |
| 5 | Shadow Imp | Backstab | Deal 2 damage | Adjacent enemy | Ability use |
| 6 | Crystal Moth | Shimmer | Heal 1 HP | Ally in range | Ability use |
| 7 | Flame Knight | Blaze Slash | Deal 3 damage | Adjacent enemy | Ability use |
| 8 | Frost Mage | Ice Bolt | Deal 3 damage | Target in range | Ability use |
| 9 | Stone Sentinel | Fortify | Gain +2 ATK | Self | Ability use |
| 10 | Wind Dancer | Gale Strike | Deal 2 damage | Adjacent enemy | Ability use |
| 11 | Moss Shaman | Rejuvenate | Heal 3 HP | Target ally | Ability use |
| 12 | Sand Viper | Venom Bite | Reduce ATK by 1 | Target enemy | Ability use |
| 13 | Thunder Hawk | Dive Bomb | Deal 3 damage | Any unit in range | Ability use |
| 14 | Coral Guardian | Tidal Shield | Gain +1 ATK | Self | Ability use |
| 15 | Dusk Assassin | Shadow Strike | Deal 3 damage ignoring modifiers | Adjacent enemy | Ability use |
| 16 | Rune Weaver | Arcane Bolt | Deal 3 damage | Target in range | Ability use |
| 17 | Forest Warden | Nature's Gift | Heal 3 HP | Target ally | Ability use |
| 18 | Magma Brute | Eruption | Deal 2 damage | Adjacent enemy | Ability use |
| 19 | Storm Dragon | Lightning Breath | Deal 3 damage | Target in range | Ability use |
| 20 | Bone Colossus | Bone Armor | Gain +3 ATK | Self | Ability use |
| 21 | Celestial Archer | Starfall Arrow | Deal 3 damage | Distant target | Ability use |
| 22 | Plague Doctor | Pestilence | Reduce ATK by 2 | Target enemy | Ability use |
| 23 | War Cleric | Divine Heal | Heal 3 HP | Target ally | Ability use |
| 24 | Berserker Wolf | Frenzy | Gain +2 ATK, take 1 self damage | Self | Ability use |
| 25 | Titan Golem | Earthquake | Deal 3 damage | Adjacent enemy | Ability use |
| 26 | Phoenix Sage | Rebirth Flame | Heal 3 HP | Self | Ability use |
| 27 | Void Stalker | Dimensional Rift | Deal 3 damage, ignore counter | Target enemy | Ability use |
| 28 | Ancient Treant | Root Network | Heal 3 HP | Target ally | Ability use |
| 29 | Inferno Djinn | Firestorm | Deal 3 damage | Target in range | Ability use |
| 30 | Glacial Behemoth | Frozen Slam | Reduce movement by 1 | Target enemy | Ability use |
| 31 | Archangel | Holy Nova | Heal 3 HP | Target ally | Ability use |
| 32 | Demon Lord | Hellfire | Deal 3 damage | Target in range | Ability use |
| 33 | Chrono Wizard | Time Warp | Gain +3 ATK | Self | Ability use |
| 34 | Leviathan | Tidal Crush | Deal 3 damage | Adjacent enemy | Ability use |
| 35 | World Serpent | Cataclysm | Deal 3 damage | Adjacent enemy | Ability use |
| 36 | Celestial Dragon | Astral Breath | Deal 3 damage | Target in range | Ability use |
| 37 | Eternal Guardian | Immortal Shield | Gain +4 ATK | Self | Ability use |
| 38 | Shadow Monarch | Eclipse | Reduce ATK by 2 | Target enemy | Ability use |
| 39 | Medic Fairy | Quick Heal | Heal 2 HP | Target ally | Ability use |
| 40 | Battle Drummer | War Cry | Gain +2 ATK | Self | Ability use |
| 41 | Hex Witch | Curse | Reduce ATK by 2 | Target enemy | Ability use |
| 42 | Mirror Knight | Reflect | Gain +3 ATK | Self | Ability use |

## STEP 2: Target Type Classification

### SELF Abilities (9)
- Iron Pup - Guard Stance
- Stone Sentinel - Fortify
- Coral Guardian - Tidal Shield
- Bone Colossus - Bone Armor
- Berserker Wolf - Frenzy
- Phoenix Sage - Rebirth Flame
- Chrono Wizard - Time Warp
- Eternal Guardian - Immortal Shield
- Battle Drummer - War Cry
- Mirror Knight - Reflect

### SINGLE TARGET Abilities (33)
All damage, heal, and modifier abilities target a single unit:
- Scout Wisp, Ember Sprite, Vine Creeper, Shadow Imp, Crystal Moth
- Flame Knight, Frost Mage, Wind Dancer, Moss Shaman, Sand Viper
- Thunder Hawk, Dusk Assassin, Rune Weaver, Forest Warden, Magma Brute
- Storm Dragon, Celestial Archer, Plague Doctor, War Cleric
- Titan Golem, Void Stalker, Ancient Treant, Inferno Djinn, Glacial Behemoth
- Archangel, Demon Lord, Leviathan, World Serpent, Celestial Dragon
- Shadow Monarch, Medic Fairy, Hex Witch

### AOE Abilities (0)
None - all abilities are either self-targeted or single-target.

## STEP 3: Targeting Issues Found

### Current Implementation Analysis

The ability engine (`packages/shared/src/engines/ability/index.ts`) has:

1. **Self-target detection**: Uses `isSelfTargetAbility()` which checks if description includes "gain" and NOT "ally" or "adjacent"
2. **Range validation**: Uses Chebyshev distance for range checking
3. **Target type validation**: Checks if target is enemy/ally based on ability type
4. **Board rule checks**: Validates target exists, is on board, is alive, is in range

### Potential Issues to Fix

1. **Adjacent vs range**: Some abilities specify "adjacent" but current implementation uses unit's range stat. Need to enforce adjacent = distance 1 for these abilities.
2. **Self-damage**: Berserker Wolf's "Frenzy" has self-damage which is implemented but needs verification.
3. **Heal self**: Phoenix Sage's "Rebirth Flame" is a heal that targets self - current logic should handle this as SELF type.
4. **Modifier abilities**: All modifier abilities (reduce ATK/movement) target enemies - current validation seems correct.

## STEP 4: Damage/Healing Issues

All damage and healing effects are applied to a single target. The current implementation:
- Extracts damage/heal amounts from description using regex
- Applies only to the specified target
- No spreading effects or double damage

## STEP 5: Board Rule Checks

Current implementation includes:
- Target exists check
- Target on board check
- Target alive check
- Target in range check
- Target type validation (enemy/ally)

## STEP 6: Standard Execution Flow

Current flow:
1. Check if ability already used
2. Check unit has position
3. Determine if self-target
4. Validate target (if not self)
5. Apply self-damage (if any)
6. Apply ability effect based on type
7. Return updated unit and target

## STEP 7: Required Fixes

### Fix 1: Enforce "adjacent" constraint
Abilities that say "adjacent" must enforce distance = 1, not use unit's range stat.

### Fix 2: Verify self-heal works correctly
Phoenix Sage's "Heal 3 HP to self" should be classified as SELF type.

### Fix 3: Ensure "take self damage" works
Berserker Wolf's self-damage is implemented but needs testing.

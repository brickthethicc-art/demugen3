import { CardType, AbilityType } from '@mugen/shared';
import type { UnitCard, SorceryCard, Card } from '@mugen/shared';

function unit(
  id: string,
  name: string,
  cost: number,
  hp: number,
  atk: number,
  movement: number,
  range: number,
  abilityId: string,
  abilityName: string,
  abilityDesc: string,
  abilityCost: number,
  abilityType: AbilityType
): UnitCard {
  return {
    id,
    name,
    cardType: CardType.UNIT,
    hp,
    maxHp: hp,
    atk,
    movement,
    range,
    cost,
    ability: {
      id: abilityId,
      name: abilityName,
      description: abilityDesc,
      cost: abilityCost,
      abilityType,
    },
  };
}

function sorcery(
  id: string,
  name: string,
  cost: number,
  effect: string
): SorceryCard {
  return { id, name, cardType: CardType.SORCERY, cost, effect };
}

// ── Unit Cards (42) ──────────────────────────────────────────────────

export const ALL_UNITS: UnitCard[] = [
  // Cost 1–2: Cheap scouts / utility
  unit('u01', 'Scout Wisp', 1, 2, 1, 3, 1, 'a01', 'Flicker', 'Deal 1 damage to adjacent enemy', 1, AbilityType.DAMAGE),
  unit('u02', 'Ember Sprite', 1, 3, 1, 2, 1, 'a02', 'Spark', 'Deal 1 damage to target in range', 1, AbilityType.DAMAGE),
  unit('u03', 'Vine Creeper', 2, 4, 2, 2, 1, 'a03', 'Entangle', 'Reduce target movement by 1', 1, AbilityType.MODIFIER),
  unit('u04', 'Iron Pup', 2, 5, 1, 2, 1, 'a04', 'Guard Stance', 'Gain +1 ATK until end of turn', 1, AbilityType.BUFF),
  unit('u05', 'Shadow Imp', 2, 3, 2, 3, 1, 'a05', 'Backstab', 'Deal 2 damage to adjacent enemy', 1, AbilityType.DAMAGE),
  unit('u06', 'Crystal Moth', 1, 2, 1, 3, 2, 'a06', 'Shimmer', 'Heal 1 HP to ally in range', 1, AbilityType.HEAL),

  // Cost 3: Balanced fighters
  unit('u07', 'Flame Knight', 3, 6, 3, 2, 1, 'a07', 'Blaze Slash', 'Deal 3 damage to adjacent enemy', 2, AbilityType.DAMAGE),
  unit('u08', 'Frost Mage', 3, 4, 2, 2, 3, 'a08', 'Ice Bolt', 'Deal 3 damage to target in range', 2, AbilityType.DAMAGE),
  unit('u09', 'Stone Sentinel', 3, 8, 2, 1, 1, 'a09', 'Fortify', 'Gain +2 ATK until end of turn', 2, AbilityType.BUFF),
  unit('u10', 'Wind Dancer', 3, 5, 3, 3, 1, 'a10', 'Gale Strike', 'Deal 2 damage and push target back', 2, AbilityType.DAMAGE),
  unit('u11', 'Moss Shaman', 3, 5, 1, 2, 2, 'a11', 'Rejuvenate', 'Heal 3 HP to target ally', 2, AbilityType.HEAL),
  unit('u12', 'Sand Viper', 3, 5, 3, 2, 1, 'a12', 'Venom Bite', 'Deal 2 damage, reduce ATK by 1', 2, AbilityType.MODIFIER),

  // Cost 4: Strong mid-range
  unit('u13', 'Thunder Hawk', 4, 6, 4, 3, 1, 'a13', 'Dive Bomb', 'Deal 3 damage to any unit in range', 2, AbilityType.DAMAGE),
  unit('u14', 'Coral Guardian', 4, 9, 2, 1, 1, 'a14', 'Tidal Shield', 'Heal 3 HP and gain +1 ATK', 3, AbilityType.HEAL),
  unit('u15', 'Dusk Assassin', 4, 5, 5, 3, 1, 'a15', 'Shadow Strike', 'Deal 3 damage ignoring modifiers', 3, AbilityType.DAMAGE),
  unit('u16', 'Rune Weaver', 4, 6, 2, 2, 3, 'a16', 'Arcane Bolt', 'Deal 3 damage at range', 2, AbilityType.DAMAGE),
  unit('u17', 'Forest Warden', 4, 7, 3, 2, 2, 'a17', 'Nature\'s Gift', 'Heal 3 HP to all adjacent allies', 3, AbilityType.HEAL),
  unit('u18', 'Magma Brute', 4, 8, 4, 1, 1, 'a18', 'Eruption', 'Deal 2 damage to all adjacent enemies', 3, AbilityType.DAMAGE),

  // Cost 5: Heavy hitters
  unit('u19', 'Storm Dragon', 5, 8, 5, 2, 2, 'a19', 'Lightning Breath', 'Deal 3 damage in a line', 3, AbilityType.DAMAGE),
  unit('u20', 'Bone Colossus', 5, 12, 3, 1, 1, 'a20', 'Bone Armor', 'Gain +3 ATK until end of turn', 3, AbilityType.BUFF),
  unit('u21', 'Celestial Archer', 5, 6, 4, 2, 4, 'a21', 'Starfall Arrow', 'Deal 3 damage to distant target', 3, AbilityType.DAMAGE),
  unit('u22', 'Plague Doctor', 5, 7, 3, 2, 2, 'a22', 'Pestilence', 'Deal 2 damage and reduce ATK by 2', 3, AbilityType.MODIFIER),
  unit('u23', 'War Cleric', 5, 8, 3, 2, 2, 'a23', 'Divine Heal', 'Heal 3 HP to target ally', 3, AbilityType.HEAL),
  unit('u24', 'Berserker Wolf', 5, 7, 6, 3, 1, 'a24', 'Frenzy', 'Gain +2 ATK, take 1 self damage', 2, AbilityType.BUFF),

  // Cost 6: Powerhouses
  unit('u25', 'Titan Golem', 6, 14, 4, 1, 1, 'a25', 'Earthquake', 'Deal 3 damage to all adjacent units', 4, AbilityType.DAMAGE),
  unit('u26', 'Phoenix Sage', 6, 8, 4, 2, 3, 'a26', 'Rebirth Flame', 'Heal 3 HP and deal 3 damage', 4, AbilityType.HEAL),
  unit('u27', 'Void Stalker', 6, 9, 5, 3, 1, 'a27', 'Dimensional Rift', 'Deal 3 damage, ignore counter', 4, AbilityType.MODIFIER),
  unit('u28', 'Ancient Treant', 6, 12, 3, 1, 2, 'a28', 'Root Network', 'Heal 3 HP to all allies in range', 4, AbilityType.HEAL),
  unit('u29', 'Inferno Djinn', 6, 9, 5, 2, 2, 'a29', 'Firestorm', 'Deal 3 damage to two targets', 4, AbilityType.DAMAGE),
  unit('u30', 'Glacial Behemoth', 6, 13, 4, 1, 1, 'a30', 'Frozen Slam', 'Deal 3 damage, reduce movement', 4, AbilityType.MODIFIER),

  // Cost 7: Elite
  unit('u31', 'Archangel', 7, 10, 6, 2, 3, 'a31', 'Holy Nova', 'Heal 3 HP to all allies, deal 3 to enemies', 5, AbilityType.HEAL),
  unit('u32', 'Demon Lord', 7, 11, 7, 2, 1, 'a32', 'Hellfire', 'Deal 3 damage to all units in range 2', 5, AbilityType.DAMAGE),
  unit('u33', 'Chrono Wizard', 7, 8, 4, 2, 3, 'a33', 'Time Warp', 'Gain +3 ATK and +1 movement', 5, AbilityType.BUFF),
  unit('u34', 'Leviathan', 7, 14, 5, 1, 2, 'a34', 'Tidal Crush', 'Deal 3 damage and push all adjacent', 5, AbilityType.DAMAGE),

  // Cost 8: Legendaries
  unit('u35', 'World Serpent', 8, 16, 6, 1, 1, 'a35', 'Cataclysm', 'Deal 3 damage to all enemies on board', 6, AbilityType.DAMAGE),
  unit('u36', 'Celestial Dragon', 8, 14, 7, 2, 2, 'a36', 'Astral Breath', 'Deal 3 damage in cone, heal self 3', 6, AbilityType.DAMAGE),
  unit('u37', 'Eternal Guardian', 8, 18, 4, 1, 1, 'a37', 'Immortal Shield', 'Heal 3 to all allies, gain +4 ATK', 6, AbilityType.BUFF),
  unit('u38', 'Shadow Monarch', 8, 12, 8, 2, 2, 'a38', 'Eclipse', 'Deal 3 damage to all, reduce ATK by 2', 6, AbilityType.MODIFIER),

  // Extra utility units
  unit('u39', 'Medic Fairy', 2, 3, 1, 2, 2, 'a39', 'Quick Heal', 'Heal 2 HP to target ally', 1, AbilityType.HEAL),
  unit('u40', 'Battle Drummer', 3, 5, 2, 2, 1, 'a40', 'War Cry', 'Buff adjacent ally ATK by 2', 2, AbilityType.BUFF),
  unit('u41', 'Hex Witch', 4, 5, 3, 2, 3, 'a41', 'Curse', 'Reduce target ATK by 2 for 1 turn', 2, AbilityType.MODIFIER),
  unit('u42', 'Mirror Knight', 5, 9, 4, 2, 1, 'a42', 'Reflect', 'Deal damage equal to ATK buff on self', 3, AbilityType.BUFF),
];

// ── Sorcery Cards (22) ──────────────────────────────────────────────

export const ALL_SORCERIES: SorceryCard[] = [
  // Cost 1: Minor effects
  sorcery('s01', 'Quick Strike', 1, 'Deal 2 damage to target unit'),
  sorcery('s02', 'Minor Heal', 1, 'Heal 2 HP to target unit'),
  sorcery('s03', 'Scout Ahead', 1, 'Reveal a 3x3 area on the board'),

  // Cost 2: Utility
  sorcery('s04', 'Fireball', 2, 'Deal 3 damage to target unit'),
  sorcery('s05', 'Mend Wounds', 2, 'Heal 3 HP to target unit'),
  sorcery('s06', 'Haste', 2, 'Grant +2 movement to target unit this turn'),
  sorcery('s07', 'Weaken', 2, 'Reduce target unit ATK by 2 for 1 turn'),

  // Cost 3: Medium impact
  sorcery('s08', 'Chain Lightning', 3, 'Deal 2 damage to up to 3 adjacent units'),
  sorcery('s09', 'Mass Heal', 3, 'Heal 2 HP to all friendly units'),
  sorcery('s10', 'Fortification', 3, 'All friendly units gain +1 ATK this turn'),
  sorcery('s11', 'Displacement', 3, 'Move target unit up to 3 spaces'),

  // Cost 4: Strong effects
  sorcery('s12', 'Meteor Strike', 4, 'Deal 4 damage to target and 2 to adjacent units'),
  sorcery('s13', 'Full Restore', 4, 'Heal target unit to full HP'),
  sorcery('s14', 'Battle Rage', 4, 'Target unit gains +3 ATK this turn'),
  sorcery('s15', 'Paralyze', 4, 'Target unit cannot move or attack next turn'),

  // Cost 5: Powerful
  sorcery('s16', 'Inferno', 5, 'Deal 3 damage to all enemy units'),
  sorcery('s17', 'Divine Blessing', 5, 'Heal 3 HP to all friendly units and gain +1 ATK'),
  sorcery('s18', 'Dimensional Swap', 5, 'Swap positions of two units on the board'),

  // Cost 6: Ultimate
  sorcery('s19', 'Armageddon', 6, 'Deal 4 damage to all units on the board'),
  sorcery('s20', 'Resurrection', 6, 'Return a destroyed unit to the board with half HP'),
  sorcery('s21', 'Time Stop', 6, 'Skip the opponent\'s next turn'),
  sorcery('s22', 'Soul Drain', 6, 'Deal 5 damage to target, heal your life by the same amount'),
];

// ── Combined ─────────────────────────────────────────────────────────

export const ALL_CARDS: Card[] = [...ALL_UNITS, ...ALL_SORCERIES];

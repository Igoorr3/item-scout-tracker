
import { WeaponBase } from "@/types/items";

// Comprehensive weapon base database based on data from poe2db.tw
export const WEAPON_BASES: Record<string, WeaponBase> = {
  // Quarterstaffs
  "Sinister Quarterstaff": {
    name: "Sinister Quarterstaff",
    physDamageMin: 55,
    physDamageMax: 92,
    critChance: 11.5,
    attacksPerSecond: 1.4,
    weaponRange: 1.3
  },
  "Lunar Quarterstaff": {
    name: "Lunar Quarterstaff",
    physDamageMin: 50,
    physDamageMax: 103,
    critChance: 10.0,
    attacksPerSecond: 1.5,
    weaponRange: 1.3
  },
  "Striking Quarterstaff": {
    name: "Striking Quarterstaff",
    physDamageMin: 53,
    physDamageMax: 111,
    critChance: 10.0,
    attacksPerSecond: 1.4,
    weaponRange: 1.3,
    implicitMod: "16% increased Melee Strike Range with this weapon"
  },
  "Bolting Quarterstaff": {
    name: "Bolting Quarterstaff",
    physDamageMin: 0,
    physDamageMax: 0,
    eleDamageMin: 43,
    eleDamageMax: 172,
    eleDamageType: "lightning",
    critChance: 10.0,
    attacksPerSecond: 1.4,
    weaponRange: 1.3,
    implicitMod: "100% of Physical Damage Converted to Lightning Damage"
  },
  "Aegis Quarterstaff": {
    name: "Aegis Quarterstaff",
    physDamageMin: 58,
    physDamageMax: 97,
    critChance: 10.0,
    attacksPerSecond: 1.4,
    weaponRange: 1.3,
    implicitMod: "+(10–15)% to Block chance"
  },
  "Razor Quarterstaff": {
    name: "Razor Quarterstaff",
    physDamageMin: 65,
    physDamageMax: 108,
    critChance: 10.0,
    attacksPerSecond: 1.4,
    weaponRange: 1.3
  },
  "Quarterstaff": {
    name: "Quarterstaff",
    physDamageMin: 50,
    physDamageMax: 90,
    critChance: 10.0,
    attacksPerSecond: 1.4,
    weaponRange: 1.3
  },
  
  // Two-handed Maces
  "Anvil Maul": {
    name: "Anvil Maul",
    physDamageMin: 112,
    physDamageMax: 151,
    critChance: 5.0,
    attacksPerSecond: 1.05,
    weaponRange: 1.3
  },
  "Sacred Maul": {
    name: "Sacred Maul",
    physDamageMin: 76,
    physDamageMax: 158,
    critChance: 5.0,
    attacksPerSecond: 1.2,
    weaponRange: 1.3
  },
  "Ironwood Greathammer": {
    name: "Ironwood Greathammer",
    physDamageMin: 94,
    physDamageMax: 174,
    critChance: 5.0,
    attacksPerSecond: 1.05,
    weaponRange: 1.3,
    implicitMod: "Causes (30–50)% increased Stun Buildup"
  },
  "Fanatic Greathammer": {
    name: "Fanatic Greathammer",
    physDamageMin: 89,
    physDamageMax: 120,
    critChance: 5.0,
    attacksPerSecond: 1.05,
    weaponRange: 1.3,
    implicitMod: "Strikes deal Splash damage to targets within 1.5 metres"
  },
  "Ruination Maul": {
    name: "Ruination Maul",
    physDamageMin: 113,
    physDamageMax: 138,
    critChance: 5.0,
    attacksPerSecond: 1.1,
    weaponRange: 1.3,
    implicitMod: "Causes Enemies to Explode on Critical kill, for 10% of their Life as Physical Damage"
  },
  "Massive Greathammer": {
    name: "Massive Greathammer",
    physDamageMin: 119,
    physDamageMax: 161,
    critChance: 5.0,
    attacksPerSecond: 1.1,
    weaponRange: 1.3
  },
  
  // Crossbows
  "Stout Crossbow": {
    name: "Stout Crossbow",
    physDamageMin: 30,
    physDamageMax: 119,
    critChance: 5.0,
    attacksPerSecond: 1.55,
    reloadTime: 0.75
  },
  "Engraved Crossbow": {
    name: "Engraved Crossbow",
    physDamageMin: 31,
    physDamageMax: 124,
    critChance: 5.0,
    attacksPerSecond: 1.6,
    reloadTime: 0.8
  },
  "Flexed Crossbow": {
    name: "Flexed Crossbow",
    physDamageMin: 32,
    physDamageMax: 127,
    critChance: 5.0,
    attacksPerSecond: 1.6,
    reloadTime: 0.85,
    implicitMod: "(20–30)% increased Bolt Speed"
  },
  "Gemini Crossbow": {
    name: "Gemini Crossbow",
    physDamageMin: 28,
    physDamageMax: 112,
    critChance: 5.0,
    attacksPerSecond: 1.6,
    reloadTime: 1.1,
    implicitMod: "Loads an additional bolt"
  },
  "Siege Crossbow": {
    name: "Siege Crossbow",
    physDamageMin: 29,
    physDamageMax: 115,
    critChance: 5.0,
    attacksPerSecond: 1.65,
    reloadTime: 0.75,
    implicitMod: "Grenade Skills Fire an additional Projectile"
  },
  "Desolate Crossbow": {
    name: "Desolate Crossbow",
    physDamageMin: 33,
    physDamageMax: 132,
    critChance: 5.0,
    attacksPerSecond: 1.6,
    reloadTime: 0.8
  },
  
  // Bows
  "Ironwood Shortbow": {
    name: "Ironwood Shortbow",
    physDamageMin: 41,
    physDamageMax: 76,
    critChance: 5.0,
    attacksPerSecond: 1.25
  },
  "Cavalry Bow": {
    name: "Cavalry Bow",
    physDamageMin: 49,
    physDamageMax: 82,
    critChance: 5.0,
    attacksPerSecond: 1.2
  },
  "Guardian Bow": {
    name: "Guardian Bow",
    physDamageMin: 53,
    physDamageMax: 80,
    critChance: 5.0,
    attacksPerSecond: 1.15,
    implicitMod: "(20–30)% chance to Chain an additional time"
  },
  "Gemini Bow": {
    name: "Gemini Bow",
    physDamageMin: 39,
    physDamageMax: 73,
    critChance: 5.0,
    attacksPerSecond: 1.2,
    implicitMod: "Bow Attacks fire an additional Arrow"
  },
  "Fanatic Bow": {
    name: "Fanatic Bow",
    physDamageMin: 0,
    physDamageMax: 0,
    eleDamageMin: 52,
    eleDamageMax: 87,
    eleDamageType: "chaos",
    critChance: 5.0,
    attacksPerSecond: 1.2,
    implicitMod: "100% of Physical Damage Converted to Chaos Damage"
  },
  "Warmonger Bow": {
    name: "Warmonger Bow",
    physDamageMin: 56,
    physDamageMax: 84,
    critChance: 5.0,
    attacksPerSecond: 1.2
  },
  
  // Spears
  "Orichalcum Spear": {
    name: "Orichalcum Spear",
    physDamageMin: 38,
    physDamageMax: 70,
    critChance: 5.0,
    attacksPerSecond: 1.6,
    weaponRange: 1.5,
    implicitMod: "Grants Skill: Spear Throw"
  },
  "Pronged Spear": {
    name: "Pronged Spear",
    physDamageMin: 40,
    physDamageMax: 75,
    critChance: 5.0,
    attacksPerSecond: 1.6,
    weaponRange: 1.5,
    implicitMod: "Grants Skill: Spear Throw"
  },
  "Stalking Spear": {
    name: "Stalking Spear",
    physDamageMin: 44,
    physDamageMax: 82,
    critChance: 5.0,
    attacksPerSecond: 1.55,
    weaponRange: 1.5,
    implicitMod: "Grants Skill: Spear Throw\n(15–25)% chance to Maim on Hit"
  },
  "Flying Spear": {
    name: "Flying Spear",
    physDamageMin: 41,
    physDamageMax: 76,
    critChance: 5.0,
    attacksPerSecond: 1.6,
    weaponRange: 1.5,
    implicitMod: "Grants Skill: Spear Throw\n(25–35)% increased Projectile Speed with this Weapon"
  },
  "Grand Spear": {
    name: "Grand Spear",
    physDamageMin: 46,
    physDamageMax: 85,
    critChance: 5.0,
    attacksPerSecond: 1.5,
    weaponRange: 1.5,
    implicitMod: "Grants Skill: Spear Throw"
  },
  "Spiked Spear": {
    name: "Spiked Spear",
    physDamageMin: 41,
    physDamageMax: 76,
    critChance: 6.5,
    attacksPerSecond: 1.6,
    weaponRange: 1.5,
    implicitMod: "Grants Skill: Spear Throw"
  },
  
  // One-handed Maces
  "Flanged Mace": {
    name: "Flanged Mace",
    physDamageMin: 45,
    physDamageMax: 67,
    critChance: 5.0,
    attacksPerSecond: 1.55,
    weaponRange: 1.1
  },
  "Crown Mace": {
    name: "Crown Mace",
    physDamageMin: 43,
    physDamageMax: 89,
    critChance: 5.0,
    attacksPerSecond: 1.4,
    weaponRange: 1.1
  },
  "Molten Hammer": {
    name: "Molten Hammer",
    physDamageMin: 30.5,
    physDamageMax: 50.5,
    eleDamageMin: 30.5,
    eleDamageMax: 50.5,
    eleDamageType: "fire",
    critChance: 5.0,
    attacksPerSecond: 1.45,
    weaponRange: 1.1,
    implicitMod: "50% of Physical Damage Converted to Fire Damage"
  },
  "Strife Pick": {
    name: "Strife Pick",
    physDamageMin: 49,
    physDamageMax: 66,
    critChance: 7.0,
    attacksPerSecond: 1.45,
    weaponRange: 1.1,
    implicitMod: "+(10–15)% to Critical Damage Bonus"
  },
  "Fortified Hammer": {
    name: "Fortified Hammer",
    physDamageMin: 60,
    physDamageMax: 73,
    critChance: 5.0,
    attacksPerSecond: 1.4,
    weaponRange: 1.1,
    implicitMod: "Causes Daze buildup equal to 100% of Damage dealt"
  },
  "Marauding Mace": {
    name: "Marauding Mace",
    physDamageMin: 51,
    physDamageMax: 84,
    critChance: 5.0,
    attacksPerSecond: 1.45,
    weaponRange: 1.1
  }
};

// Helper function to find a weapon base by name or partial match
export const findWeaponBase = (itemName: string): WeaponBase | null => {
  // Try exact match first
  if (WEAPON_BASES[itemName]) {
    return WEAPON_BASES[itemName];
  }
  
  // Try to find by partial match
  for (const [baseName, baseData] of Object.entries(WEAPON_BASES)) {
    if (itemName.includes(baseName)) {
      return baseData;
    }
  }
  
  // Check for common categories as fallbacks
  if (itemName.toLowerCase().includes("quarterstaff")) {
    return WEAPON_BASES["Quarterstaff"];
  } else if (itemName.toLowerCase().includes("bow") && !itemName.toLowerCase().includes("cross")) {
    return WEAPON_BASES["Cavalry Bow"];
  } else if (itemName.toLowerCase().includes("crossbow")) {
    return WEAPON_BASES["Engraved Crossbow"];
  } else if (itemName.toLowerCase().includes("spear")) {
    return WEAPON_BASES["Pronged Spear"];
  } else if (itemName.toLowerCase().includes("maul") || itemName.toLowerCase().includes("hammer") && itemName.toLowerCase().includes("great")) {
    return WEAPON_BASES["Sacred Maul"];
  } else if (itemName.toLowerCase().includes("mace") || itemName.toLowerCase().includes("hammer") && !itemName.toLowerCase().includes("great")) {
    return WEAPON_BASES["Crown Mace"];
  }
  
  // No match found
  return null;
};

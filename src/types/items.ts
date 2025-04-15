
export interface ItemStat {
  name: string;
  value: string | number;
  min?: number;
  max?: number;
  isAffix?: boolean;
}

export interface DivineAnalysis {
  worthDivine: boolean;
  currentPercentile: number;
  potentialGain: number;
  recommendation: string;
  statName?: string; 
  statId?: string;   
  currentValue?: number;
  minValue?: number;
  maxValue?: number;
  affectsDps?: boolean; // Added to track whether a mod affects weapon DPS
}

export interface WeaponBase {
  name: string;
  physDamageMin: number;
  physDamageMax: number;
  eleDamageMin?: number;
  eleDamageMax?: number;
  eleDamageType?: string; // "fire", "cold", "lightning", "chaos"
  critChance: number;
  attacksPerSecond: number;
  reloadTime?: number; // For crossbows
  weaponRange?: number;
  implicitMod?: string;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  baseType: string; // Added to track the specific base type
  rarity: string; // normal, magic, rare, unique
  price: number;
  currency: string;
  expectedPrice?: number;
  averagePrice?: number;
  stats: ItemStat[];
  divineAnalysis?: DivineAnalysis[];
  
  // Split DPS values more explicitly
  totalDps?: number;
  physicalDps?: number;
  elementalDps?: number;
  
  // Current values
  currentPhysDamageMin?: number;
  currentPhysDamageMax?: number;
  currentAttackSpeed?: number;
  
  // Potential values
  minDps?: number;    // Minimum possible DPS with poor rolls
  maxDps?: number;    // Maximum possible DPS with perfect rolls
  minPdps?: number;   // Minimum possible Physical DPS
  maxPdps?: number;   // Maximum possible Physical DPS
  
  // For sorting purposes
  dpsGainPotential?: number; // Percentage potential DPS gain
  pdpsGainPotential?: number; // Percentage potential PDPS gain
  
  seller?: string;
  listedTime?: string;
  iconUrl?: string;
  tradeUrl?: string; // URL direta para o site de trade
}

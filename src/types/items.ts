
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
}

export interface Item {
  id: string;
  name: string;
  category: string;
  rarity: string; // normal, magic, rare, unique
  price: number;
  currency: string;
  expectedPrice?: number;
  averagePrice?: number;
  stats: ItemStat[];
  divineAnalysis?: DivineAnalysis[];
  totalDps?: number;
  physicalDps?: number;
  elementalDps?: number;
  minDps?: number;    // Minimum possible DPS with poor rolls
  maxDps?: number;    // Maximum possible DPS with perfect rolls
  maxPdps?: number;   // Maximum possible Physical DPS
  seller?: string;
  listedTime?: string;
  iconUrl?: string;
  tradeUrl?: string; // URL direta para o site de trade
}

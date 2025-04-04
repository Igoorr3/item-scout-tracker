
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
  statName?: string; // Adicionamos esta propriedade
  statId?: string;   // Adicionamos esta propriedade
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
  seller?: string;
  listedTime?: string;
  iconUrl?: string;
  tradeUrl?: string; // URL direta para o site de trade
}

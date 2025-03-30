
export interface ItemStat {
  name: string;
  value: string | number;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  rarity: string; // normal, magic, rare, unique
  price: number;
  expectedPrice: number;
  averagePrice: number;
  stats: ItemStat[];
  seller?: string;
  listedTime?: string;
  iconUrl?: string;
  tradeUrl?: string; // URL direta para o site de trade
}

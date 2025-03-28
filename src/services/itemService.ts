
import { Item } from '@/types/items';
import { TrackingConfiguration } from '@/types/tracking';

// Simula a busca de itens da API do PoE (já que não podemos acessar a API real)
export const fetchItems = async (config: TrackingConfiguration): Promise<Item[]> => {
  console.log(`Fetching items with config: ${JSON.stringify(config)}`);
  
  // Simula o tempo de resposta da API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Gera itens simulados baseados na configuração
  const items: Item[] = [];
  const count = Math.floor(Math.random() * 6) + 1; // 1-6 itens
  
  for (let i = 0; i < count; i++) {
    // Determina o preço base e variação baseado no tipo de item
    let basePrice = 0;
    let priceVariation = 0;
    let baseDps = 0;
    
    // Configura valores específicos para cada tipo de item
    if (config.itemType.includes('Crossbow')) {
      basePrice = 15 + Math.random() * 15;
      priceVariation = 0.3;
      baseDps = 600 + Math.random() * 150;
    } else if (config.itemType.includes('Bow')) {
      basePrice = 10 + Math.random() * 20;
      priceVariation = 0.25;
      baseDps = 500 + Math.random() * 200;
    } else if (config.itemType.includes('Two-Handed')) {
      basePrice = 8 + Math.random() * 12;
      priceVariation = 0.2;
      baseDps = 450 + Math.random() * 150;
    } else if (config.itemType.includes('One-Handed')) {
      basePrice = 5 + Math.random() * 10;
      priceVariation = 0.15;
      baseDps = 350 + Math.random() * 100;
    } else {
      basePrice = 3 + Math.random() * 5;
      priceVariation = 0.1;
      baseDps = 200 + Math.random() * 100;
    }
    
    // Calcula o preço atual com alguma variação
    const expectedPrice = basePrice;
    const priceRatio = 1 + (Math.random() * 2 - 1) * priceVariation;
    const price = Math.round(expectedPrice * priceRatio);
    
    // Calcula o preço médio
    const avgPrice = (expectedPrice + price) / 2;
    
    // Gera estatísticas para o item
    const stats = [];
    
    // Sempre adiciona DPS se estiver nos estatutos do filtro
    if (config.stats.dps !== undefined || config.stats.pdps !== undefined || config.stats.edps !== undefined) {
      const dps = Math.round(baseDps);
      const pdps = Math.round(dps * 0.7);
      const edps = Math.round(dps * 0.3);
      
      stats.push({ name: 'DPS', value: dps });
      stats.push({ name: 'pDPS', value: pdps });
      stats.push({ name: 'eDPS', value: edps });
    }
    
    // Adiciona estatísticas específicas
    if (config.stats.attack_speed !== undefined) {
      stats.push({ name: 'Attack Speed', value: (1 + Math.random() * 0.8).toFixed(2) });
    }
    
    if (config.stats.crit_chance !== undefined) {
      stats.push({ name: 'Critical Strike Chance', value: (5 + Math.random() * 7).toFixed(1) + '%' });
    }
    
    // Adiciona atributos para itens específicos
    if (config.itemType.includes('Armour')) {
      stats.push({ name: 'Armour', value: Math.floor(100 + Math.random() * 400) });
    }
    
    if (config.itemType.includes('Boots')) {
      stats.push({ name: 'Movement Speed', value: Math.floor(20 + Math.random() * 15) + '%' });
    }
    
    // Nomes baseados no tipo de item
    let prefix = '';
    if (Math.random() > 0.8) {
      prefix = ['Maligno', 'Celestial', 'Solar', 'Divino', 'Corrupto'][Math.floor(Math.random() * 5)] + ' ';
    }
    
    const namesByType: Record<string, string[]> = {
      'Crossbow': ['Gale Core', 'Arbalest', 'Siege Engine', 'Decimator', 'Skirmisher'],
      'Bow': ['Spine Bow', 'Death Harp', 'Maraketh Bow', 'Imperial Bow', 'Harbinger Bow'],
      'Sword': ['Greatsword', 'Tiger Blade', 'Exquisite Blade', 'Infernal Sword', 'Highland Blade'],
      'Axe': ['Reaver Axe', 'Decapitator', 'Void Axe', 'Headsman Axe', 'Sundering Axe'],
      'Mace': ['Mallet', 'Destroyer', 'Karui Maul', 'Imperial Maul', 'Terror Maul'],
      'Staff': ['Coiled Staff', 'Eclipse Staff', 'Judgement Staff', 'Moon Staff', 'Royal Staff'],
      'default': ['Armamento', 'Relíquia', 'Tesouro', 'Artefato', 'Engenhoca']
    };
    
    // Encontra a categoria correta para o nome
    let nameCategory = 'default';
    for (const [category, _] of Object.entries(namesByType)) {
      if (config.itemType.includes(category)) {
        nameCategory = category;
        break;
      }
    }
    
    const name = prefix + namesByType[nameCategory][Math.floor(Math.random() * namesByType[nameCategory].length)];
    
    // Gera a raridade do item
    const rarityRoll = Math.random();
    let rarity = 'normal';
    if (rarityRoll > 0.95) {
      rarity = 'unique';
    } else if (rarityRoll > 0.7) {
      rarity = 'rare';
    } else if (rarityRoll > 0.4) {
      rarity = 'magic';
    }
    
    items.push({
      id: `item-${Date.now()}-${i}`,
      name,
      category: config.itemType,
      rarity,
      price,
      expectedPrice,
      averagePrice: avgPrice,
      stats
    });
  }
  
  // Filtra os itens de acordo com as estatísticas mínimas configuradas
  const filteredItems = items.filter(item => {
    for (const [statId, minValue] of Object.entries(config.stats)) {
      const stat = item.stats.find(s => {
        const normalizedStatName = s.name.toLowerCase().replace(' ', '_');
        return normalizedStatName === statId;
      });
      
      if (!stat || Number(stat.value) < minValue) {
        return false;
      }
    }
    return true;
  });
  
  return filteredItems;
};

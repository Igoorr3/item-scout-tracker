
import { Item } from '@/types/items';
import { TrackingConfiguration } from '@/types/tracking';
import { toast } from "sonner";

// Interface para a resposta da pesquisa inicial
interface PoeApiSearchResponse {
  id: string;
  result: string[];
  total?: number;
}

// Interface para a resposta de detalhes dos itens
interface PoeItemResponse {
  result: PoeItemResult[];
}

interface PoeItemResult {
  id: string;
  listing: {
    price: {
      amount: number;
      currency: string;
    };
    account: {
      name: string;
    };
    indexed?: string;
  };
  item: {
    name: string;
    typeLine: string;
    rarity: string;
    properties?: {
      name: string;
      values: [string, number][];
    }[];
    ilvl?: number;
    verified: boolean;
    icon?: string;
  };
}

// Função para construir o payload de busca com base na configuração
const buildSearchPayload = (config: TrackingConfiguration) => {
  // Estrutura básica do payload de busca
  const payload: any = {
    query: {
      status: { option: "online" },
      filters: {}
    },
    sort: { price: "asc" }
  };

  // Adiciona o tipo de item
  if (config.itemType) {
    payload.query.filters.type_filters = {
      filters: { category: { option: config.itemType } }
    };
  }

  // Adiciona filtros para estatísticas
  if (Object.keys(config.stats).length > 0) {
    payload.query.stats = [{ 
      type: "and",
      filters: []
    }];

    for (const [statId, minValue] of Object.entries(config.stats)) {
      // Converte o ID da estatística para o formato da API
      const statName = statId.replace('_', ' ');
      
      payload.query.stats[0].filters.push({
        id: statName,
        value: { min: minValue },
        disabled: false
      });
    }
  }

  return payload;
};

// Realiza a busca inicial para obter IDs dos itens
export const searchItems = async (config: TrackingConfiguration): Promise<PoeApiSearchResponse> => {
  try {
    const payload = buildSearchPayload(config);
    console.log("Enviando payload de busca:", payload);

    const response = await fetch("https://www.pathofexile.com/api/trade2/search/poe2/Standard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "POE Item Scout/1.0"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error("Erro na API de busca:", await response.text());
      throw new Error(`Erro na API de busca: ${response.status}`);
    }

    const data = await response.json();
    console.log("Resposta da API de busca:", data);
    return data;
  } catch (error) {
    console.error("Erro ao buscar itens:", error);
    throw error;
  }
};

// Busca os detalhes dos itens a partir dos IDs
export const fetchItemDetails = async (itemIds: string[], queryId: string): Promise<PoeItemResponse> => {
  try {
    // Limita a 10 itens por requisição, conforme recomendado
    const idsToFetch = itemIds.slice(0, 10).join(",");
    const url = `https://www.pathofexile.com/api/trade2/fetch/${idsToFetch}?query=${queryId}&realm=poe2`;
    
    console.log("Buscando detalhes de itens:", url);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "POE Item Scout/1.0"
      }
    });

    if (!response.ok) {
      console.error("Erro na API de detalhes:", await response.text());
      throw new Error(`Erro na API de detalhes: ${response.status}`);
    }

    const data = await response.json();
    console.log("Resposta da API de detalhes:", data);
    return data;
  } catch (error) {
    console.error("Erro ao buscar detalhes dos itens:", error);
    throw error;
  }
};

// Converte as respostas da API para nosso formato de Item
const convertApiResponseToItems = (response: PoeItemResponse): Item[] => {
  if (!response.result || !Array.isArray(response.result)) {
    return [];
  }

  return response.result.map(result => {
    // Extrai estatísticas das propriedades
    const stats = (result.item.properties || []).map(prop => {
      return {
        name: prop.name,
        value: prop.values[0][0]
      };
    });
    
    // Obtém o preço e moeda
    const price = result.listing.price.amount;
    const currency = result.listing.price.currency;
    
    // Estima preço esperado e médio (poderia ser melhorado com dados históricos)
    const expectedPrice = price; // Simplificado - idealmente seria baseado em dados históricos
    const avgPrice = price;      // Simplificado - idealmente seria baseado em dados históricos
    
    return {
      id: result.id,
      name: result.item.name || result.item.typeLine,
      category: result.item.typeLine,
      rarity: result.item.rarity,
      price: price,
      expectedPrice: expectedPrice,
      averagePrice: avgPrice,
      stats: stats,
      seller: result.listing.account.name,
      listedTime: result.listing.indexed,
      iconUrl: result.item.icon
    };
  });
};

// Função principal que realiza todo o processo de busca
export const fetchItems = async (config: TrackingConfiguration): Promise<Item[]> => {
  try {
    console.log(`Buscando itens para configuração: ${config.name}`);
    
    // Verifica se estamos em desenvolvimento sem acesso real à API
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK === 'true') {
      toast.warning("Usando dados simulados para desenvolvimento");
      // Retorna dados simulados se estiver no modo de desenvolvimento
      return mockFetchItems(config);
    }
    
    // Passo 1: Busca os IDs dos itens com base nos filtros
    const searchResponse = await searchItems(config);
    console.log(`IDs encontrados: ${searchResponse.result.length}`);
    
    if (!searchResponse.result || searchResponse.result.length === 0) {
      return [];
    }
    
    // Espera 1 segundo para evitar rate limiting da API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Passo 2: Busca os detalhes dos primeiros 10 itens
    const itemsResponse = await fetchItemDetails(
      searchResponse.result.slice(0, 10), 
      searchResponse.id
    );
    
    // Passo 3: Converte para nosso formato
    const items = convertApiResponseToItems(itemsResponse);
    console.log(`Itens obtidos: ${items.length}`);
    
    return items;
    
  } catch (error) {
    console.error('Erro ao buscar itens:', error);
    
    // Se houver erro na API, exibe mensagem com instruções
    toast.error(
      "Erro ao acessar a API do Path of Exile 2. Verifique o console para detalhes. " +
      "Esta API requer autenticação via cookie de sessão."
    );
    
    // Retorna array vazio em caso de erro
    return [];
  }
};

// Função para dados simulados apenas para desenvolvimento/testes
const mockFetchItems = async (config: TrackingConfiguration): Promise<Item[]> => {
  console.log(`Usando dados simulados para: ${config.name}`);
  
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
      stats,
      seller: `Player${Math.floor(Math.random() * 1000)}`,
      listedTime: new Date().toISOString()
    });
  }
  
  return items;
};

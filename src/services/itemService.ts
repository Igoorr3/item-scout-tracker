
import { Item } from '@/types/items';
import { TrackingConfiguration } from '@/types/tracking';
import { ApiCredentials } from '@/types/api';
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

// Lista de proxies CORS disponíveis
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://crossorigin.me/',
  'https://cors-proxy.htmldriven.com/?url='
];

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

// Função para construir os cookies como string para os cabeçalhos HTTP
const buildCookieString = (apiCredentials: ApiCredentials): string => {
  let cookieString = '';
  
  // Adiciona POESESSID se disponível
  if (apiCredentials.poesessid) {
    cookieString += `POESESSID=${apiCredentials.poesessid}; `;
  }
  
  // Adiciona todos os cf_clearance se disponíveis
  if (apiCredentials.cfClearance && apiCredentials.cfClearance.length > 0) {
    apiCredentials.cfClearance.forEach(clearance => {
      if (clearance && clearance.trim()) {
        cookieString += `cf_clearance=${clearance}; `;
      }
    });
  }
  
  return cookieString.trim();
};

// Função para construir todos os cabeçalhos necessários para a API
const buildHeaders = (apiCredentials: ApiCredentials, isSearch: boolean = false): Record<string, string> => {
  const headers: Record<string, string> = {
    "User-Agent": apiCredentials.useragent,
    "Accept": "application/json",
    "Origin": "https://www.pathofexile.com",
    "Referer": "https://www.pathofexile.com/trade2/search/poe2/Standard"
  };

  if (isSearch) {
    headers["Content-Type"] = "application/json";
  }

  // Adiciona cookies se disponíveis
  const cookieString = buildCookieString(apiCredentials);
  if (cookieString) {
    headers["Cookie"] = cookieString;
  }

  return headers;
};

// Função para tentar diferentes proxies CORS
const tryWithDifferentProxies = async (url: string, options: RequestInit): Promise<Response> => {
  let lastError;
  
  // Se opções não incluem cabeçalhos, inicializa como objeto vazio
  if (!options.headers) {
    options.headers = {};
  }
  
  // Primeiro tenta sem proxy
  try {
    console.log("Tentando acessar diretamente:", url);
    return await fetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'include'
    });
  } catch (error) {
    console.log("Falha ao acessar diretamente:", error);
    lastError = error;
  }
  
  // Se falhar, tenta com cada proxy na lista
  for (const proxy of CORS_PROXIES) {
    try {
      console.log(`Tentando acessar via proxy ${proxy}:`, url);
      const proxyUrl = proxy + encodeURIComponent(url);
      const proxyOptions = {
        ...options,
        headers: {
          ...options.headers as Record<string, string>,
          'X-Requested-With': 'XMLHttpRequest'
        },
        mode: 'cors' as RequestMode,
        credentials: 'include' as RequestCredentials
      };
      return await fetch(proxyUrl, proxyOptions);
    } catch (error) {
      console.log(`Falha ao acessar via proxy ${proxy}:`, error);
      lastError = error;
    }
  }
  
  // Se todas as tentativas falharem, lança o último erro
  throw lastError;
};

// Realiza a busca inicial para obter IDs dos itens
export const searchItems = async (config: TrackingConfiguration, apiCredentials: ApiCredentials): Promise<PoeApiSearchResponse> => {
  try {
    const payload = buildSearchPayload(config);
    console.log("Enviando payload de busca:", JSON.stringify(payload, null, 2));

    const headers = buildHeaders(apiCredentials, true);
    console.log("Headers de busca:", headers);

    const url = "https://www.pathofexile.com/api/trade2/search/poe2/Standard";
    
    let response;
    if (apiCredentials.useProxy) {
      response = await tryWithDifferentProxies(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
    } else {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        credentials: "include",
        mode: "cors"
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na API de busca: Status ${response.status}`, errorText);
      throw new Error(`Erro na API de busca: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Resposta da API de busca:", data);
    return data;
  } catch (error) {
    console.error("Erro ao buscar itens:", error);
    
    // Se já estamos usando proxy, não tente novamente
    if (apiCredentials.useProxy) {
      throw error;
    }
    
    // Tentar novamente com proxy
    console.log("Tentando novamente com proxy...");
    const updatedCredentials = { ...apiCredentials, useProxy: true };
    return searchItems(config, updatedCredentials);
  }
};

// Busca os detalhes dos itens a partir dos IDs
export const fetchItemDetails = async (itemIds: string[], queryId: string, apiCredentials: ApiCredentials): Promise<PoeItemResponse> => {
  try {
    // Limita a 10 itens por requisição, conforme recomendado na documentação da API
    const idsToFetch = itemIds.slice(0, 10).join(",");
    const url = `https://www.pathofexile.com/api/trade2/fetch/${idsToFetch}?query=${queryId}&realm=poe2`;
    
    console.log("Buscando detalhes de itens:", url);
    
    const headers = buildHeaders(apiCredentials);
    console.log("Headers de detalhes:", headers);
    
    let response;
    if (apiCredentials.useProxy) {
      response = await tryWithDifferentProxies(url, {
        headers,
      });
    } else {
      response = await fetch(url, {
        headers,
        credentials: "include",
        mode: "cors"
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na API de detalhes: Status ${response.status}`, errorText);
      throw new Error(`Erro na API de detalhes: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Resposta da API de detalhes:", data);
    return data;
  } catch (error) {
    console.error("Erro ao buscar detalhes dos itens:", error);
    
    // Se já estamos usando proxy, não tente novamente
    if (apiCredentials.useProxy) {
      throw error;
    }
    
    // Tentar novamente com proxy
    console.log("Tentando novamente com proxy...");
    const updatedCredentials = { ...apiCredentials, useProxy: true };
    return fetchItemDetails(itemIds, queryId, updatedCredentials);
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

// Função para gerar dados de mock (para desenvolvimento)
const generateMockItems = (config: TrackingConfiguration): Item[] => {
  console.log(`Gerando dados simulados para: ${config.name}`);
  
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
      listedTime: new Date().toISOString(),
      iconUrl: undefined
    });
  }
  
  return items;
};

// Verifica se a conexão com a API do PoE está funcionando
export const testApiConnection = async (apiCredentials: ApiCredentials): Promise<boolean> => {
  try {
    const headers = buildHeaders(apiCredentials);
    console.log("Headers para teste de API:", headers);

    // Tenta acessar o endpoint de leagues que é mais leve
    let response;
    if (apiCredentials.useProxy) {
      response = await tryWithDifferentProxies("https://www.pathofexile.com/api/trade2/leagues", {
        headers
      });
    } else {
      response = await fetch("https://www.pathofexile.com/api/trade2/leagues", {
        headers,
        credentials: "include",
        mode: "cors"
      });
    }

    if (!response.ok) {
      console.error(`Teste de API falhou com status: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    console.log("Teste de API bem sucedido:", data);
    return true;
  } catch (error) {
    console.error("Erro ao testar conexão com a API:", error);
    
    // Se já estamos usando proxy, não tente novamente
    if (apiCredentials.useProxy) {
      return false;
    }
    
    // Tentar novamente com proxy
    console.log("Tentando teste de API novamente com proxy...");
    const updatedCredentials = { ...apiCredentials, useProxy: true };
    return testApiConnection(updatedCredentials);
  }
};

// Função principal que realiza todo o processo de busca
export const fetchItems = async (config: TrackingConfiguration, apiCredentials: ApiCredentials): Promise<Item[]> => {
  try {
    console.log(`Buscando itens para configuração: ${config.name}`);
    console.log("Credenciais da API:", { 
      poesessid: apiCredentials.poesessid ? "Configurado" : "Não configurado", 
      cfClearance: apiCredentials.cfClearance && apiCredentials.cfClearance.length > 0 ? 
        `Configurado (${apiCredentials.cfClearance.length} valores)` : "Não configurado",
      useragent: apiCredentials.useragent ? "Configurado" : "Padrão",
      useProxy: apiCredentials.useProxy ? "Sim" : "Não",
      customHeaders: apiCredentials.customHeaders ? "Sim" : "Não"
    });
    
    // Se não temos as credenciais da API configuradas, usamos dados simulados
    if (!apiCredentials.isConfigured) {
      toast.warning("Usando dados simulados - configure a API para dados reais", {
        description: "Acesse as configurações para adicionar seus cookies de sessão do Path of Exile"
      });
      
      // Simula o tempo de resposta da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retorna dados simulados
      return generateMockItems(config);
    }
    
    // Testa a conexão antes de fazer a busca completa
    const connectionOk = await testApiConnection(apiCredentials);
    if (!connectionOk) {
      toast.error("Falha na conexão com a API do Path of Exile", {
        description: "Verificando com proxy alternativo..."
      });
      
      // Tentar novamente com proxy
      const testWithProxy = await testApiConnection({...apiCredentials, useProxy: true});
      if (!testWithProxy) {
        toast.error("Falha na conexão com a API mesmo usando proxy", {
          description: "Verifique seus cookies e tente novamente. Usando dados simulados temporariamente."
        });
        return generateMockItems(config);
      }
      
      // Se funcionou com proxy, atualiza a configuração
      apiCredentials = {...apiCredentials, useProxy: true};
      toast.success("Conexão estabelecida usando proxy", {
        description: "Os dados reais serão obtidos normalmente"
      });
    }
    
    // Passo 1: Busca os IDs dos itens com base nos filtros
    const searchResponse = await searchItems(config, apiCredentials);
    console.log(`IDs encontrados: ${searchResponse.result?.length || 0}`);
    
    if (!searchResponse.result || searchResponse.result.length === 0) {
      toast.info("Nenhum item encontrado com esses filtros");
      return [];
    }
    
    // Espera 2 segundos para evitar rate limiting da API
    toast.info("Aguardando para evitar limite de requisições...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Passo 2: Busca os detalhes dos primeiros 10 itens
    const itemsResponse = await fetchItemDetails(
      searchResponse.result.slice(0, 10), 
      searchResponse.id,
      apiCredentials
    );
    
    // Passo 3: Converte para nosso formato
    const items = convertApiResponseToItems(itemsResponse);
    console.log(`Itens obtidos: ${items.length}`);
    
    return items;
    
  } catch (error) {
    console.error('Erro ao buscar itens:', error);
    
    // Exibe mensagens de erro mais específicas
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        toast.error("Erro de autenticação na API", {
          description: "Verifique se os cookies de sessão são válidos e estão atualizados"
        });
      } else if (error.message.includes('429')) {
        toast.error("Limite de requisições excedido", {
          description: "Aguarde alguns minutos antes de tentar novamente"
        });
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error("Erro de conexão com a API", {
          description: "Tentando com proxies alternativos... Se persistir, verifique sua conexão de internet."
        });
        
        // Tenta novamente com proxy ativado
        try {
          const updatedCredentials = {...apiCredentials, useProxy: true};
          const items = await fetchItems(config, updatedCredentials);
          if (items.length > 0) {
            return items;
          }
        } catch (retryError) {
          console.error("Falha na segunda tentativa com proxy:", retryError);
        }
        
        return generateMockItems(config);
      } else {
        toast.error(`Erro ao acessar a API: ${error.message}`);
      }
    } else {
      toast.error("Erro desconhecido ao acessar a API");
    }
    
    // Em caso de erro, retorna dados simulados para manter a aplicação funcionando
    toast.info("Usando dados simulados temporariamente");
    return generateMockItems(config);
  }
};

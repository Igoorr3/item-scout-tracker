import { Item } from '@/types/items';
import { TrackingConfiguration } from '@/types/tracking';
import { ApiCredentials, ApiDebugInfo } from '@/types/api';
import { toast } from "sonner";

interface PoeApiSearchResponse {
  id: string;
  result: string[];
  total?: number;
}

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

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://crossorigin.me/',
  'https://cors-proxy.htmldriven.com/?url='
];

const buildSearchPayload = (config: TrackingConfiguration) => {
  const payload: any = {
    query: {
      status: { option: "online" },
      stats: [{
        type: "and",
        filters: []
      }]
    },
    sort: { price: "asc" }
  };

  if (config.itemType) {
    if (!payload.query.filters) {
      payload.query.filters = {};
    }

    payload.query.filters.type_filters = {
      filters: { category: { option: config.itemType } }
    };
  }

  if (Object.keys(config.stats).length > 0) {
    if (!payload.query.stats) {
      payload.query.stats = [{ 
        type: "and",
        filters: []
      }];
    }

    for (const [statId, minValue] of Object.entries(config.stats)) {
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

const buildCookieString = (apiCredentials: ApiCredentials): string => {
  let cookieString = '';
  
  if (apiCredentials.poesessid) {
    cookieString += `POESESSID=${apiCredentials.poesessid}; `;
  }
  
  if (apiCredentials.cfClearance && apiCredentials.cfClearance.length > 0) {
    apiCredentials.cfClearance.forEach(clearance => {
      if (clearance && clearance.trim()) {
        cookieString += `cf_clearance=${clearance}; `;
      }
    });
  }
  
  return cookieString.trim();
};

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

  const cookieString = buildCookieString(apiCredentials);
  if (cookieString) {
    headers["Cookie"] = cookieString;
  }

  return headers;
};

const tryWithDifferentProxies = async (url: string, options: RequestInit): Promise<Response> => {
  let lastError;
  
  if (!options.headers) {
    options.headers = {};
  }
  
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
  
  throw lastError;
};

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
      
      if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
        throw new Error(`Proteção Cloudflare ativada. Você precisa atualizar seus cookies cf_clearance.`);
      }
      
      throw new Error(`Erro na API de busca: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Resposta da API de busca:", data);
    
    if (!data.id || !data.result) {
      throw new Error("Resposta da API inválida - formato inesperado");
    }
    
    return data;
  } catch (error) {
    console.error("Erro ao buscar itens:", error);
    
    if (apiCredentials.useProxy) {
      throw error;
    }
    
    const updatedCredentials = { ...apiCredentials, useProxy: true };
    return searchItems(config, updatedCredentials);
  }
};

export const fetchItemDetails = async (itemIds: string[], queryId: string, apiCredentials: ApiCredentials): Promise<PoeItemResponse> => {
  try {
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
      
      if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
        throw new Error(`Proteção Cloudflare ativada. Você precisa atualizar seus cookies cf_clearance.`);
      }
      
      throw new Error(`Erro na API de detalhes: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Resposta da API de detalhes:", data);
    return data;
  } catch (error) {
    console.error("Erro ao buscar detalhes dos itens:", error);
    
    if (apiCredentials.useProxy) {
      throw error;
    }
    
    const updatedCredentials = { ...apiCredentials, useProxy: true };
    return fetchItemDetails(itemIds, queryId, updatedCredentials);
  }
};

export const fetchItemsByDirectQuery = async (queryId: string, apiCredentials: ApiCredentials): Promise<Item[]> => {
  try {
    const url = `https://www.pathofexile.com/trade2/search/poe2/${queryId}`;
    console.log(`Tentando acessar consulta direta: ${url}`);
    
    const headers = buildHeaders(apiCredentials);
    
    let response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers,
        credentials: "include",
        mode: "cors"
      });
    } catch (directError) {
      console.error("Erro ao acessar consulta direta:", directError);
      
      for (const proxy of CORS_PROXIES) {
        try {
          const proxyUrl = proxy + encodeURIComponent(url);
          response = await fetch(proxyUrl, {
            method: "GET",
            headers: {
              ...headers,
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          break;
        } catch (error) {
          console.error(`Falha com proxy ${proxy}:`, error);
        }
      }
    }
    
    if (!response || !response.ok) {
      throw new Error(`Não foi possível acessar a consulta direta: ${response?.status || 'falha na rede'}`);
    }
    
    const html = await response.text();
    
    const scriptPattern = /<script\s+id="main-page-data"\s+type="application\/json">([^<]+)<\/script>/;
    const match = html.match(scriptPattern);
    
    if (!match || !match[1]) {
      throw new Error("Não foi possível encontrar dados do item no HTML");
    }
    
    try {
      const pageData = JSON.parse(match[1]);
      if (pageData.items && Array.isArray(pageData.items)) {
        return pageData.items.map((item: any) => {
          return {
            id: item.id || `direct-${Date.now()}`,
            name: item.name || item.typeLine || "Item desconhecido",
            category: item.typeLine || "Desconhecido",
            rarity: item.rarity || "normal",
            price: item.price?.amount || 0,
            expectedPrice: item.price?.amount || 0,
            averagePrice: item.price?.amount || 0,
            stats: item.properties?.map((prop: any) => ({
              name: prop.name,
              value: prop.values?.[0]?.[0] || "N/A"
            })) || [],
            seller: item.account?.name || "Desconhecido",
            listedTime: item.indexed || new Date().toISOString(),
            iconUrl: item.icon
          };
        });
      }
    } catch (parseError) {
      console.error("Erro ao parsear dados do HTML:", parseError);
    }
    
    return [];
  } catch (error) {
    console.error("Erro ao buscar via consulta direta:", error);
    return [];
  }
};

const convertApiResponseToItems = (response: PoeItemResponse): Item[] => {
  if (!response.result || !Array.isArray(response.result)) {
    return [];
  }

  return response.result.map(result => {
    const stats = (result.item.properties || []).map(prop => {
      return {
        name: prop.name,
        value: prop.values?.[0]?.[0] || "N/A"
      };
    });
    
    const price = result.listing.price?.amount || 0;
    const currency = result.listing.price?.currency || "chaos";
    
    const expectedPrice = price;
    const avgPrice = price;
    
    return {
      id: result.id,
      name: result.item.name || result.item.typeLine || "Item sem nome",
      category: result.item.typeLine || "Desconhecido",
      rarity: result.item.rarity || "normal",
      price: price,
      expectedPrice: expectedPrice,
      averagePrice: avgPrice,
      stats: stats,
      seller: result.listing.account?.name || "Desconhecido",
      listedTime: result.listing.indexed,
      iconUrl: result.item.icon
    };
  });
};

const generateMockItems = (config: TrackingConfiguration): Item[] => {
  console.log(`Gerando dados simulados para: ${config.name}`);
  
  const items: Item[] = [];
  const count = Math.floor(Math.random() * 6) + 1;
  
  for (let i = 0; i < count; i++) {
    let basePrice = 0;
    let priceVariation = 0;
    let baseDps = 0;
    
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
    
    const expectedPrice = basePrice;
    
    const isVeryGoodDeal = Math.random() > 0.8;
    const priceRatio = isVeryGoodDeal 
      ? 0.5 + Math.random() * 0.2
      : 1 + (Math.random() * 2 - 1) * priceVariation;
      
    const price = Math.round(expectedPrice * priceRatio * 100) / 100;
    
    const avgPrice = (expectedPrice + price) / 2;
    
    const stats = [];
    
    if (config.stats.dps !== undefined || config.stats.pdps !== undefined || config.stats.edps !== undefined) {
      const dps = Math.round(baseDps);
      const pdps = Math.round(dps * 0.7);
      const edps = Math.round(dps * 0.3);
      
      stats.push({ name: 'DPS', value: dps });
      stats.push({ name: 'pDPS', value: pdps });
      stats.push({ name: 'eDPS', value: edps });
    }
    
    if (config.stats.attack_speed !== undefined) {
      stats.push({ name: 'Attack Speed', value: (1 + Math.random() * 0.8).toFixed(2) });
    }
    
    if (config.stats.crit_chance !== undefined) {
      stats.push({ name: 'Critical Strike Chance', value: (5 + Math.random() * 7).toFixed(1) + '%' });
    }
    
    if (config.itemType.includes('Armour')) {
      stats.push({ name: 'Armour', value: Math.floor(100 + Math.random() * 400) });
    }
    
    if (config.itemType.includes('Boots')) {
      stats.push({ name: 'Movement Speed', value: Math.floor(20 + Math.random() * 15) + '%' });
    }
    
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
    
    let nameCategory = 'default';
    for (const [category, _] of Object.entries(namesByType)) {
      if (config.itemType.includes(category)) {
        nameCategory = category;
        break;
      }
    }
    
    const name = prefix + namesByType[nameCategory][Math.floor(Math.random() * namesByType[nameCategory].length)];
    
    const rarityRoll = Math.random();
    let rarity = 'normal';
    if (rarityRoll > 0.95) {
      rarity = 'unique';
    } else if (rarityRoll > 0.7) {
      rarity = 'rare';
    } else if (rarityRoll > 0.4) {
      rarity = 'magic';
    }
    
    const fakeTradeId = Math.random().toString(36).substring(2, 10);
    const tradeUrl = `https://www.pathofexile.com/trade2/search/poe2/fake-${fakeTradeId}`;
    
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
      iconUrl: undefined,
      tradeUrl: isVeryGoodDeal ? tradeUrl : undefined
    });
  }
  
  return items;
};

export const testApiConnection = async (apiCredentials: ApiCredentials): Promise<boolean> => {
  try {
    const headers = buildHeaders(apiCredentials);
    console.log("Headers para teste de API:", headers);

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
      
      const responseText = await response.text();
      if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
        console.error("Resposta Cloudflare detectada. Necessário atualizar cookies.");
      }
      
      return false;
    }
    
    const data = await response.json();
    console.log("Teste de API bem sucedido:", data);
    return true;
  } catch (error) {
    console.error("Erro ao testar conexão com a API:", error);
    
    if (apiCredentials.useProxy) {
      return false;
    }
    
    const updatedCredentials = { ...apiCredentials, useProxy: true };
    return testApiConnection(updatedCredentials);
  }
};

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
    
    if (apiCredentials.forceSimulation) {
      toast.info("Usando dados simulados conforme solicitado", {
        description: "Você optou por usar dados simulados em vez de dados reais"
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return generateMockItems(config);
    }
    
    if (!apiCredentials.isConfigured) {
      toast.warning("Usando dados simulados - configure a API para dados reais", {
        description: "Acesse as configurações para adicionar seus cookies de sessão do Path of Exile"
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return generateMockItems(config);
    }
    
    const connectionOk = await testApiConnection(apiCredentials);
    if (!connectionOk) {
      toast.error("Falha na conexão com a API do Path of Exile", {
        description: "Verificando com proxy alternativo..."
      });
      
      const testWithProxy = await testApiConnection({...apiCredentials, useProxy: true});
      if (!testWithProxy) {
        toast.error("Falha na conexão com a API mesmo usando proxy", {
          description: "Verifique seus cookies e tente novamente. Usando dados simulados temporariamente."
        });
        return generateMockItems(config);
      }
      
      apiCredentials = {...apiCredentials, useProxy: true};
      toast.success("Conexão estabelecida usando proxy", {
        description: "Os dados reais serão obtidos normalmente"
      });
    }
    
    const searchResponse = await searchItems(config, apiCredentials);
    console.log(`IDs encontrados: ${searchResponse.result?.length || 0}`);
    
    if (!searchResponse.result || searchResponse.result.length === 0) {
      toast.info("Nenhum item encontrado com esses filtros");
      return [];
    }
    
    if (apiCredentials.directQuery && searchResponse.id) {
      toast.info("Tentando obter dados via consulta direta...");
      const directItems = await fetchItemsByDirectQuery(searchResponse.id, apiCredentials);
      if (directItems.length > 0) {
        toast.success(`Encontrados ${directItems.length} itens via consulta direta`);
        return directItems;
      }
      toast.info("Consulta direta não retornou itens, voltando para API padrão");
    }
    
    toast.info("Aguardando para evitar limite de requisições...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const itemsResponse = await fetchItemDetails(
      searchResponse.result.slice(0, 10), 
      searchResponse.id,
      apiCredentials
    );
    
    const items = convertApiResponseToItems(itemsResponse);
    console.log(`Itens obtidos: ${items.length}`);
    
    return items;
  } catch (error) {
    console.error('Erro ao buscar itens:', error);
    
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
        
        const updatedCredentials = {...apiCredentials, useProxy: true};
        const items = await fetchItems(config, updatedCredentials);
        if (items.length > 0) {
          return items;
        }
      } else if (error.message.includes('Cloudflare')) {
        toast.error("Proteção Cloudflare detectada", {
          description: "É necessário atualizar o cookie cf_clearance. Use o Debug API para mais detalhes."
        });
      } else {
        toast.error(`Erro ao acessar a API: ${error.message}`);
      }
    } else {
      toast.error("Erro desconhecido ao acessar a API");
    }
    
    toast.info("Usando dados simulados temporariamente");
    return generateMockItems(config);
  }
};


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
    extended?: {
      dps?: number;
      pdps?: number;
      edps?: number;
    };
  };
}

// CORS proxies used for handling API calls when direct access fails
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://crossorigin.me/',
  'https://cors-proxy.htmldriven.com/?url='
];

/**
 * Builds the search payload based on the tracking configuration
 */
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

/**
 * Builds cookie string from API credentials
 */
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

/**
 * Builds headers for API requests
 */
const buildHeaders = (apiCredentials: ApiCredentials, isSearch: boolean = false): Record<string, string> => {
  const headers: Record<string, string> = {
    "User-Agent": apiCredentials.useragent || 'Mozilla/5.0',
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

/**
 * Try different CORS proxies if direct fetch fails
 */
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

/**
 * Search for items matching configuration
 */
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
      // Check for rate limiting (status 429)
      if (response.status === 429) {
        throw new Error("API rate limit reached. Please wait before trying again.");
      }
      
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

/**
 * Fetch item details from search results
 * Following the pattern: https://www.pathofexile.com/api/trade2/fetch/ID1,ID2,...?query=QUERY_ID&realm=poe2
 */
export const fetchItemDetails = async (itemIds: string[], queryId: string, apiCredentials: ApiCredentials): Promise<PoeItemResponse> => {
  try {
    // Only fetch 10 items at once, per the API's design
    const idsToFetch = itemIds.slice(0, 10).join(",");
    const url = `https://www.pathofexile.com/api/trade2/fetch/${idsToFetch}?query=${queryId}&realm=poe2`;
    
    console.log("Buscando detalhes de itens:", url);
    
    const headers = buildHeaders(apiCredentials);
    console.log("Headers de detalhes:", headers);
    
    // Apply rate limiting if enabled
    if (apiCredentials.respectRateLimit && apiCredentials.rateLimitDelay) {
      console.log(`Respeitando limite de requisições: aguardando ${apiCredentials.rateLimitDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, apiCredentials.rateLimitDelay));
    }
    
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
      if (response.status === 429) {
        throw new Error("API rate limit reached. Please wait before trying again.");
      }
      
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

/**
 * Fetch items directly from the query ID (direct website link)
 */
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
            iconUrl: item.icon,
            tradeUrl: url
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

/**
 * Convert API response to Item objects
 */
const convertApiResponseToItems = (response: PoeItemResponse, queryId: string): Item[] => {
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
    
    // Extract DPS from the extended property if available
    let dpsStats = [];
    if (result.item.extended) {
      if (result.item.extended.dps) {
        dpsStats.push({ name: 'DPS', value: result.item.extended.dps });
      }
      if (result.item.extended.pdps) {
        dpsStats.push({ name: 'pDPS', value: result.item.extended.pdps });
      }
      if (result.item.extended.edps) {
        dpsStats.push({ name: 'eDPS', value: result.item.extended.edps });
      }
    }
    
    // Generate trade URL for the item
    const tradeUrl = `https://www.pathofexile.com/trade2/search/poe2/${queryId}/${result.id}`;
    
    return {
      id: result.id,
      name: result.item.name || result.item.typeLine || "Item sem nome",
      category: result.item.typeLine || "Desconhecido",
      rarity: result.item.rarity || "normal",
      price: price,
      expectedPrice: expectedPrice,
      averagePrice: avgPrice,
      stats: [...stats, ...dpsStats],
      seller: result.listing.account?.name || "Desconhecido",
      listedTime: result.listing.indexed,
      iconUrl: result.item.icon,
      tradeUrl: tradeUrl
    };
  });
};

/**
 * Test API connection
 */
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

/**
 * Main function to fetch items
 */
export const fetchItems = async (config: TrackingConfiguration, apiCredentials: ApiCredentials): Promise<Item[]> => {
  try {
    console.log(`Buscando itens para configuração: ${config.name}`);
    console.log("Credenciais da API:", { 
      poesessid: apiCredentials.poesessid ? "Configurado" : "Não configurado", 
      cfClearance: apiCredentials.cfClearance && apiCredentials.cfClearance.length > 0 ? 
        `Configurado (${apiCredentials.cfClearance.length} valores)` : "Não configurado",
      useragent: apiCredentials.useragent ? "Configurado" : "Padrão",
      useProxy: apiCredentials.useProxy ? "Sim" : "Não",
      customHeaders: apiCredentials.customHeaders ? "Sim" : "Não",
      respectRateLimit: apiCredentials.respectRateLimit ? "Sim" : "Não"
    });
    
    if (!apiCredentials.isConfigured) {
      toast.error("Configuração da API incompleta", {
        description: "Acesse as configurações para adicionar seus cookies de sessão do Path of Exile"
      });
      return [];
    }
    
    const connectionOk = await testApiConnection(apiCredentials);
    if (!connectionOk) {
      toast.error("Falha na conexão com a API do Path of Exile", {
        description: "Verificando com proxy alternativo..."
      });
      
      const testWithProxy = await testApiConnection({...apiCredentials, useProxy: true});
      if (!testWithProxy) {
        toast.error("Falha na conexão com a API mesmo usando proxy", {
          description: "Verifique seus cookies e tente novamente."
        });
        return [];
      }
      
      apiCredentials = {...apiCredentials, useProxy: true};
      toast.success("Conexão estabelecida usando proxy", {
        description: "Os dados reais serão obtidos normalmente"
      });
    }
    
    // Step 1: Search for items
    const searchResponse = await searchItems(config, apiCredentials);
    console.log(`IDs encontrados: ${searchResponse.result?.length || 0}`);
    
    if (!searchResponse.result || searchResponse.result.length === 0) {
      toast.info("Nenhum item encontrado com esses filtros");
      return [];
    }
    
    // Generate direct trade URL for the user
    const directTradeUrl = `https://www.pathofexile.com/trade2/search/poe2/${searchResponse.id}`;
    toast.info(`Consulta gerada: ${searchResponse.id}`, {
      description: "Você pode acessar esses resultados diretamente no site oficial",
      action: {
        label: "Abrir",
        onClick: () => window.open(directTradeUrl, '_blank')
      }
    });
    
    // Step 2: Try direct query approach if enabled
    if (apiCredentials.directQuery && searchResponse.id) {
      toast.info("Tentando obter dados via consulta direta...");
      const directItems = await fetchItemsByDirectQuery(searchResponse.id, apiCredentials);
      if (directItems.length > 0) {
        toast.success(`Encontrados ${directItems.length} itens via consulta direta`);
        return directItems;
      }
      toast.info("Consulta direta não retornou itens, voltando para API padrão");
    }
    
    // Apply rate limiting delay if enabled
    if (apiCredentials.respectRateLimit) {
      const delay = apiCredentials.rateLimitDelay || 2000; // Default 2 seconds
      toast.info(`Respeitando limite de requisições: aguardando ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Step 3: Fetch item details (batch of 10 item IDs at once)
    const itemsResponse = await fetchItemDetails(
      searchResponse.result.slice(0, 10), 
      searchResponse.id,
      apiCredentials
    );
    
    const items = convertApiResponseToItems(itemsResponse, searchResponse.id);
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
    
    return [];
  }
};

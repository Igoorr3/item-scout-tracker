
import { TrackingConfiguration } from '@/types/tracking';
import { ApiCredentials } from '@/types/api';
import { Item, ItemStat, DivineAnalysis } from '@/types/items';
import { analyzeDivineValue, STAT_RANGES, getStatLabel } from '@/data/statIds';

const API_BASE_URL = '/api';

export const fetchItems = async (config: TrackingConfiguration, apiConfig: ApiCredentials): Promise<Item[]> => {
  try {
    // Primeiro, verifique se a API está funcionando
    const isApiWorking = await testApiConnection(apiConfig);
    
    if (!isApiWorking && !apiConfig.useProxy) {
      console.log("API direta não está funcionando, tentando via proxy...");
      const isProxyWorking = await testApiConnection({...apiConfig, useProxy: true});
      
      if (!isProxyWorking) {
        throw new Error("Não foi possível conectar à API do Path of Exile, nem diretamente nem via proxy");
      }
      
      // Se chegamos aqui, o proxy está funcionando
      apiConfig = {...apiConfig, useProxy: true};
    }
    
    // Construir o payload para a busca
    const searchPayload = buildSearchPayload(config);
    
    // Fazer a requisição de busca
    console.log("Enviando requisição de busca com configuração:", config.name);
    const searchResponse = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Use-Proxy': apiConfig.useProxy ? 'true' : 'false',
        'X-POE-Session-Id': apiConfig.poesessid,
        'X-CF-Clearance': Array.isArray(apiConfig.cfClearance) ? 
                          apiConfig.cfClearance[0] : 
                          apiConfig.cfClearance || '',
        'X-User-Agent': apiConfig.useragent
      },
      body: JSON.stringify(searchPayload)
    });
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Erro na busca:", searchResponse.status, errorText);
      throw new Error(`Erro ao buscar itens: ${searchResponse.status} - ${errorText}`);
    }
    
    const searchData = await searchResponse.json();
    
    // Se não houver resultados, retornar lista vazia
    if (!searchData.result || searchData.result.length === 0) {
      console.log("Nenhum item encontrado");
      return [];
    }
    
    // Buscar os detalhes dos itens (limitado aos primeiros 10)
    const itemCount = Math.min(searchData.result.length, 10);
    const itemsToFetch = searchData.result.slice(0, itemCount);
    
    console.log(`Buscando detalhes de ${itemCount} itens`);
    
    // URL para buscar os detalhes dos itens
    const fetchUrl = `${API_BASE_URL}/fetch?ids=${itemsToFetch.join(',')}&realm=poe2&query=${searchData.id}`;
    
    const fetchResponse = await fetch(fetchUrl, {
      headers: {
        'X-Use-Proxy': apiConfig.useProxy ? 'true' : 'false',
        'X-POE-Session-Id': apiConfig.poesessid,
        'X-CF-Clearance': Array.isArray(apiConfig.cfClearance) ? 
                         apiConfig.cfClearance[0] : 
                         apiConfig.cfClearance || '',
        'X-User-Agent': apiConfig.useragent
      }
    });
    
    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error("Erro ao buscar detalhes:", fetchResponse.status, errorText);
      throw new Error(`Erro ao buscar detalhes dos itens: ${fetchResponse.status} - ${errorText}`);
    }
    
    const fetchData = await fetchResponse.json();
    const items = fetchData.result || [];
    
    // Processar os itens para o formato interno
    return items.map((item: any) => processItem(item, searchData.id));
    
  } catch (error) {
    console.error("Erro ao buscar itens:", error);
    throw error;
  }
};

export const testApiConnection = async (apiConfig: ApiCredentials): Promise<boolean> => {
  try {
    const testUrl = `${API_BASE_URL}/test`;
    
    const response = await fetch(testUrl, {
      headers: {
        'X-Use-Proxy': apiConfig.useProxy ? 'true' : 'false',
        'X-POE-Session-Id': apiConfig.poesessid,
        'X-CF-Clearance': Array.isArray(apiConfig.cfClearance) ? 
                         apiConfig.cfClearance[0] : 
                         apiConfig.cfClearance || '',
        'X-User-Agent': apiConfig.useragent
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.success === true;
    
  } catch (error) {
    console.error("Erro ao testar conexão com API:", error);
    return false;
  }
};

const buildSearchPayload = (config: TrackingConfiguration) => {
  // Payload base
  const payload: any = {
    query: {
      status: {
        option: "online"
      },
      stats: [
        {
          type: "and",
          filters: []
        }
      ],
      filters: {
        type_filters: {
          filters: {
            category: {
              option: config.itemType || "weapon"
            }
          }
        }
      }
    },
    sort: {
      price: "asc"
    }
  };
  
  // Adicionar filtros de estatísticas
  if (config.stats) {
    for (const [statId, value] of Object.entries(config.stats)) {
      if (value > 0) {
        payload.query.stats[0].filters.push({
          id: statId,
          value: {
            min: value
          },
          disabled: false
        });
      }
    }
  }
  
  return payload;
};

const processItem = (item: any, queryId: string): Item => {
  const itemData = item.item || {};
  const listingData = item.listing || {};
  
  // Extrair stats básicos
  const stats: ItemStat[] = [];
  
  // Adicionar propriedades base
  if (itemData.properties) {
    itemData.properties.forEach((prop: any) => {
      const name = prop.name;
      if (prop.values && prop.values.length > 0) {
        stats.push({
          name,
          value: prop.values[0][0],
          isAffix: false
        });
      } else {
        stats.push({
          name,
          value: "",
          isAffix: false
        });
      }
    });
  }
  
  // Calcular DPS e pDPS se aplicável
  let totalDps: number | undefined = undefined;
  let physicalDps: number | undefined = undefined;
  let elementalDps: number | undefined = undefined;
  
  if (itemData.properties) {
    const dpsProperty = itemData.properties.find((p: any) => p.name === "Total DPS" || p.name.includes("DPS"));
    if (dpsProperty && dpsProperty.values && dpsProperty.values.length > 0) {
      totalDps = parseFloat(dpsProperty.values[0][0]);
    }
    
    const physDpsProperty = itemData.properties.find((p: any) => p.name === "Physical DPS" || p.name.includes("Physical"));
    if (physDpsProperty && physDpsProperty.values && physDpsProperty.values.length > 0) {
      physicalDps = parseFloat(physDpsProperty.values[0][0]);
      
      // Se temos totalDps e physicalDps, podemos calcular elementalDps
      if (totalDps) {
        elementalDps = totalDps - physicalDps;
      }
    }
  }
  
  // Adicionar mods explícitos
  const divineAnalysis: DivineAnalysis[] = [];
  
  if (itemData.explicitMods) {
    itemData.explicitMods.forEach((mod: string) => {
      // Encontrar o stat correspondente a este mod
      const matchingStat = Object.entries(STAT_RANGES).find(([statId, range]) => {
        const statLabel = getStatLabel(statId);
        return mod.includes(statLabel);
      });
      
      if (matchingStat) {
        const [statId, range] = matchingStat;
        
        // Extrair o valor numérico do mod
        const valueMatch = mod.match(/(\d+(\.\d+)?)/);
        if (valueMatch) {
          const value = parseFloat(valueMatch[0]);
          
          stats.push({
            name: getStatLabel(statId),
            value,
            min: range.min,
            max: range.max,
            isAffix: true
          });
          
          // Analisar se vale a pena usar Divine
          const analysis = analyzeDivineValue(statId, value);
          divineAnalysis.push({
            ...analysis,
            statName: getStatLabel(statId),
            statId
          });
        }
      } else {
        // Se não encontramos o stat correspondente, adicionamos apenas o texto
        stats.push({
          name: mod,
          value: "",
          isAffix: true
        });
      }
    });
  }
  
  // Dados de preço
  const priceData = listingData.price || {};
  const price = priceData.amount || 0;
  const currency = priceData.currency || "chaos";
  
  // Dados do vendedor
  const seller = listingData.account?.name;
  
  // Data de listagem
  let listedTime = "";
  if (listingData.indexed) {
    const date = new Date(listingData.indexed);
    listedTime = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // URL para o item no site
  const tradeUrl = `https://www.pathofexile.com/trade2/search/poe2/${queryId}/${item.id}`;
  
  // Montar o objeto final
  return {
    id: item.id,
    name: `${itemData.name || ""} ${itemData.typeLine || ""}`.trim(),
    category: itemData.typeLine || "",
    rarity: itemData.rarity || "normal",
    price,
    currency,
    stats,
    divineAnalysis,
    totalDps,
    physicalDps,
    elementalDps,
    seller,
    listedTime,
    tradeUrl
  };
};

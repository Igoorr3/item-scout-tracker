
import { TrackingConfiguration } from '@/types/tracking';
import { ApiCredentials } from '@/types/api';
import { Item, ItemStat, DivineAnalysis } from '@/types/items';
import { analyzeDivineValue, STAT_RANGES, getStatLabel } from '@/data/statIds';

const API_BASE_URL = '/api';

// Weapon base data (simplified version)
interface WeaponBase {
  name: string;
  baseDamage: [number, number]; // [min, max]
  aps: number; // attacks per second
  critChance: number;
}

// Sample weapon base data - would be expanded with data from poe2db.tw
const WEAPON_BASES: Record<string, WeaponBase> = {
  "Quarterstaff": { 
    name: "Quarterstaff", 
    baseDamage: [130, 240], 
    aps: 1.3, 
    critChance: 6.0 
  },
  "Striking Quarterstaff": { 
    name: "Striking Quarterstaff", 
    baseDamage: [200, 370], 
    aps: 1.4, 
    critChance: 10.0 
  },
  "Crossbow": { 
    name: "Crossbow", 
    baseDamage: [168, 315], 
    aps: 1.1, 
    critChance: 6.0 
  },
  "Engraved Crossbow": { 
    name: "Engraved Crossbow", 
    baseDamage: [220, 410], 
    aps: 1.2, 
    critChance: 7.5 
  },
  // Add more weapon bases as needed
};

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
    const processedItems = items.map((item: any) => processItem(item, searchData.id));
    
    // Calcular preços previstos baseados no potencial Divine
    const itemsWithPredictedPrices = processedItems.map(calculatePredictedPrice);
    
    // Ordenar itens por potencial de melhoria (do melhor para o pior)
    return itemsWithPredictedPrices.sort((a, b) => {
      const aDivineWorth = Math.max(...(a.divineAnalysis?.map(d => d.potentialGain) || [0]));
      const bDivineWorth = Math.max(...(b.divineAnalysis?.map(d => d.potentialGain) || [0]));
      return bDivineWorth - aDivineWorth;
    });
    
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

// Função para calcular DPS potencial com base nos modificadores
const calculatePotentialDPS = (itemData: any, baseStats: any): { 
  currentDps: number, 
  minDps: number, 
  maxDps: number,
  currentPdps: number,
  maxPdps: number
} => {
  // Valores padrão
  let increasedPhysicalDamage = 0;
  let addedPhysicalMin = 0;
  let addedPhysicalMax = 0;
  let addedElementalMin = 0;
  let addedElementalMax = 0;
  let increasedAttackSpeed = 0;
  
  // Base do item (se disponível)
  let baseName = itemData.typeLine || "";
  let baseItemData = WEAPON_BASES[baseName];
  
  // Se não encontrar o nome exato, tentamos parcial
  if (!baseItemData) {
    for (const [name, data] of Object.entries(WEAPON_BASES)) {
      if (baseName.includes(name)) {
        baseItemData = data;
        break;
      }
    }
  }
  
  // Valores padrão se não tivermos a base
  let basePhysMin = 100;
  let basePhysMax = 200;
  let baseAPS = 1.3;
  
  // Se tivermos os dados da base, usamos eles
  if (baseItemData) {
    basePhysMin = baseItemData.baseDamage[0];
    basePhysMax = baseItemData.baseDamage[1];
    baseAPS = baseItemData.aps;
  }
  
  // Pegar valores dos mods
  if (itemData.explicitMods) {
    for (const mod of itemData.explicitMods) {
      // Increased Physical Damage
      if (mod.includes("increased Physical Damage")) {
        const match = mod.match(/(\d+)%/);
        if (match) increasedPhysicalDamage = parseInt(match[1], 10);
      }
      
      // Added Physical Damage
      if (mod.toLowerCase().includes("adds") && mod.includes("to") && mod.includes("physical damage")) {
        const match = mod.match(/Adds (\d+) to (\d+) Physical Damage/i);
        if (match) {
          addedPhysicalMin = parseInt(match[1], 10);
          addedPhysicalMax = parseInt(match[2], 10);
        }
      }
      
      // Added Elemental Damage (simplificado para qualquer tipo de dano elemental)
      if (mod.toLowerCase().includes("adds") && mod.includes("to") && 
         (mod.includes("Fire Damage") || mod.includes("Cold Damage") || mod.includes("Lightning Damage"))) {
        const match = mod.match(/Adds (\d+) to (\d+)/);
        if (match) {
          addedElementalMin += parseInt(match[1], 10);
          addedElementalMax += parseInt(match[2], 10);
        }
      }
      
      // Increased Attack Speed
      if (mod.includes("increased Attack Speed")) {
        const match = mod.match(/(\d+)%/);
        if (match) increasedAttackSpeed = parseInt(match[1], 10);
      }
    }
  }
  
  // Buscar valores de range de mods para cálculo de min/max
  let incPhysDamageRange = [0, 0];
  let addedPhysDamageMinRange = [0, 0];
  let addedPhysDamageMaxRange = [0, 0];
  let attackSpeedRange = [0, 0];
  
  // Extrair os ranges das estatísticas
  if (itemData.extended?.hashes?.explicit) {
    for (const hash of itemData.extended.hashes.explicit) {
      const statId = hash[0];
      // Verificar qual stat é esse baseado no ID
      if (statId === "explicit.stat_1509134228" || statId === "explicit.stat_2901986750") { // Increased Phys Damage
        const mods = itemData.extended.mods?.explicit || [];
        for (const mod of mods) {
          if (mod.magnitudes && mod.magnitudes.find((m: any) => m.hash === statId)) {
            const magnitude = mod.magnitudes.find((m: any) => m.hash === statId);
            if (magnitude) {
              incPhysDamageRange = [magnitude.min, magnitude.max];
            }
          }
        }
      } 
      else if (statId === "explicit.stat_1940865751") { // Adds Phys Damage
        const mods = itemData.extended.mods?.explicit || [];
        for (const mod of mods) {
          if (mod.magnitudes && mod.magnitudes.find((m: any) => m.hash === statId)) {
            const magnitudes = mod.magnitudes.filter((m: any) => m.hash === statId);
            if (magnitudes.length >= 2) {
              addedPhysDamageMinRange = [magnitudes[0].min, magnitudes[0].max];
              addedPhysDamageMaxRange = [magnitudes[1].min, magnitudes[1].max];
            }
          }
        }
      }
      else if (statId === "explicit.stat_210067635" || statId === "explicit.stat_2923486259") { // Attack Speed
        const mods = itemData.extended.mods?.explicit || [];
        for (const mod of mods) {
          if (mod.magnitudes && mod.magnitudes.find((m: any) => m.hash === statId)) {
            const magnitude = mod.magnitudes.find((m: any) => m.hash === statId);
            if (magnitude) {
              attackSpeedRange = [magnitude.min, magnitude.max];
            }
          }
        }
      }
    }
  }
  
  // Calcular valores atuais de dano físico
  const physDamageMult = 1 + (increasedPhysicalDamage / 100);
  const currentPhysMin = (basePhysMin * physDamageMult) + addedPhysicalMin;
  const currentPhysMax = (basePhysMax * physDamageMult) + addedPhysicalMax;
  
  // Calcular APS atual
  const currentAPS = baseAPS * (1 + (increasedAttackSpeed / 100));
  
  // Calcular DPS atual
  const currentPhysDps = ((currentPhysMin + currentPhysMax) / 2) * currentAPS;
  const currentEleDps = ((addedElementalMin + addedElementalMax) / 2) * currentAPS;
  const currentTotalDps = currentPhysDps + currentEleDps;
  
  // Calcular DPS máximo possível (com rolls perfeitos)
  const maxIncreasedPhys = incPhysDamageRange[1] || increasedPhysicalDamage;
  const maxPhysDamageMult = 1 + (maxIncreasedPhys / 100);
  
  const maxAddedPhysMin = addedPhysDamageMinRange[1] || addedPhysicalMin;
  const maxAddedPhysMax = addedPhysDamageMaxRange[1] || addedPhysicalMax;
  
  const maxAttackSpeed = attackSpeedRange[1] || increasedAttackSpeed;
  const maxAPS = baseAPS * (1 + (maxAttackSpeed / 100));
  
  const maxPhysMin = (basePhysMin * maxPhysDamageMult) + maxAddedPhysMin;
  const maxPhysMax = (basePhysMax * maxPhysDamageMult) + maxAddedPhysMax;
  
  const maxPhysDps = ((maxPhysMin + maxPhysMax) / 2) * maxAPS;
  const maxTotalDps = maxPhysDps + currentEleDps; // Mantemos os elemental damage atuais
  
  // Calcular DPS mínimo possível (com rolls ruins)
  const minIncreasedPhys = incPhysDamageRange[0] || increasedPhysicalDamage;
  const minPhysDamageMult = 1 + (minIncreasedPhys / 100);
  
  const minAddedPhysMin = addedPhysDamageMinRange[0] || addedPhysicalMin;
  const minAddedPhysMax = addedPhysDamageMaxRange[0] || addedPhysicalMax;
  
  const minAttackSpeed = attackSpeedRange[0] || increasedAttackSpeed;
  const minAPS = baseAPS * (1 + (minAttackSpeed / 100));
  
  const minPhysMin = (basePhysMin * minPhysDamageMult) + minAddedPhysMin;
  const minPhysMax = (basePhysMax * minPhysDamageMult) + minAddedPhysMax;
  
  const minPhysDps = ((minPhysMin + minPhysMax) / 2) * minAPS;
  const minTotalDps = minPhysDps + currentEleDps; // Mantemos os elemental damage atuais
  
  return {
    currentDps: currentTotalDps,
    minDps: minTotalDps,
    maxDps: maxTotalDps,
    currentPdps: currentPhysDps,
    maxPdps: maxPhysDps
  };
};

// Calcula o preço previsto baseado na melhoria potencial
const calculatePredictedPrice = (item: Item): Item => {
  if (!item.divineAnalysis || item.divineAnalysis.length === 0) {
    return item;
  }
  
  // Calculamos o potencial de ganho em percentual 
  const maxPotentialGain = Math.max(...item.divineAnalysis.map(a => a.potentialGain));
  
  // Um modelo simples: 
  // - Se podemos ganhar até 20%, aumentamos o preço em até 10%
  // - Se podemos ganhar 20-50%, aumentamos o preço em até 30%
  // - Se podemos ganhar >50%, aumentamos o preço em até 50%
  let priceMultiplier = 1;
  
  if (maxPotentialGain >= 50) {
    priceMultiplier = 1.5; // +50%
  } else if (maxPotentialGain >= 20) {
    priceMultiplier = 1.3; // +30%
  } else if (maxPotentialGain > 0) {
    priceMultiplier = 1.1; // +10%
  }
  
  const expectedPrice = Math.round((item.price * priceMultiplier) * 100) / 100;
  const averagePrice = (item.price + expectedPrice) / 2;
  
  return {
    ...item,
    expectedPrice,
    averagePrice
  };
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
  
  // Calcular DPS e pDPS
  let totalDps: number | undefined = undefined;
  let physicalDps: number | undefined = undefined;
  let elementalDps: number | undefined = undefined;
  let minDps: number | undefined = undefined;
  let maxDps: number | undefined = undefined;
  let maxPdps: number | undefined = undefined;
  
  // Calcular DPS usando nossa função avançada
  if (itemData.typeLine && 
      (itemData.typeLine.includes("Sword") || 
       itemData.typeLine.includes("Axe") || 
       itemData.typeLine.includes("Mace") || 
       itemData.typeLine.includes("Staff") ||
       itemData.typeLine.includes("Quarterstaff") ||
       itemData.typeLine.includes("Bow") ||
       itemData.typeLine.includes("Crossbow") ||
       itemData.typeLine.includes("Wand") ||
       itemData.typeLine.includes("Sceptre"))) {
    
    const dpsValues = calculatePotentialDPS(itemData, {});
    totalDps = Math.round(dpsValues.currentDps * 10) / 10;
    physicalDps = Math.round(dpsValues.currentPdps * 10) / 10;
    elementalDps = Math.round((dpsValues.currentDps - dpsValues.currentPdps) * 10) / 10;
    minDps = Math.round(dpsValues.minDps * 10) / 10;
    maxDps = Math.round(dpsValues.maxDps * 10) / 10;
    maxPdps = Math.round(dpsValues.maxPdps * 10) / 10;
  } else if (itemData.properties) {
    // Fallback para o método simples
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
  
  // Adicionar mods explícitos e calcular potencial Divine
  const divineAnalysis: DivineAnalysis[] = [];
  
  if (itemData.explicitMods) {
    itemData.explicitMods.forEach((mod: string, index: number) => {
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
          
          // Adicionar estatísticas extras à análise para mostrar na UI
          const enhancedAnalysis: DivineAnalysis = {
            ...analysis,
            statName: getStatLabel(statId),
            statId,
            currentValue: value,
            minValue: range.min,
            maxValue: range.max
          };
          
          divineAnalysis.push(enhancedAnalysis);
        }
      } else {
        // Se não encontramos o stat correspondente, adicionamos apenas o texto
        // Mas antes tentamos extrair valores com range entre colchetes
        const rangeMatch = mod.match(/(.*?)(\s+\[.*?\])?$/);
        if (rangeMatch) {
          const modText = rangeMatch[1].trim();
          const rangeText = rangeMatch[2]?.trim() || "";
          
          // Extrair os valores min e max do range se disponível
          let min: number | undefined = undefined;
          let max: number | undefined = undefined;
          
          if (rangeText) {
            const minMaxMatch = rangeText.match(/\[(\d+)–(\d+)\]/);
            if (minMaxMatch) {
              min = parseInt(minMaxMatch[1], 10);
              max = parseInt(minMaxMatch[2], 10);
            }
          }
          
          stats.push({
            name: modText,
            value: "",
            min,
            max,
            isAffix: true
          });
          
          // Se temos min e max, podemos tentar extrair o valor atual também
          if (min !== undefined && max !== undefined) {
            const valueMatch = modText.match(/(\d+(\.\d+)?)/);
            if (valueMatch) {
              const currentValue = parseFloat(valueMatch[0]);
              
              // Calcular a porcentagem em relação ao máximo
              const range = max - min;
              if (range > 0) {
                const percentile = Math.round(((currentValue - min) / range) * 100);
                const potentialGain = Math.round(((max - currentValue) / currentValue) * 100);
                
                const worthDivine = potentialGain >= 15; // Consideramos valer a pena se puder melhorar 15% ou mais
                
                divineAnalysis.push({
                  worthDivine,
                  currentPercentile: percentile,
                  potentialGain,
                  recommendation: worthDivine 
                    ? `Usar Divine pode melhorar em até ${potentialGain}%` 
                    : "Não vale a pena usar Divine",
                  statName: modText,
                  currentValue,
                  minValue: min,
                  maxValue: max
                });
              }
            }
          }
        } else {
          stats.push({
            name: mod,
            value: "",
            isAffix: true
          });
        }
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
  const processedItem: Item = {
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
    minDps,
    maxDps,
    maxPdps,
    seller,
    listedTime,
    tradeUrl
  };
  
  return processedItem;
};

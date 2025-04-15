
import { TrackingConfiguration } from '@/types/tracking';
import { ApiCredentials } from '@/types/api';
import { Item, ItemStat, DivineAnalysis, WeaponBase } from '@/types/items';
import { analyzeDivineValue, STAT_RANGES, getStatLabel } from '@/data/statIds';
import { findWeaponBase } from '@/data/weaponBases';

const API_BASE_URL = '/api';

// DPS-affecting mod IDs
const DPS_AFFECTING_STAT_IDS = [
  "explicit.stat_1509134228", // Increased Physical Damage
  "explicit.stat_2901986750", // Increased Physical Damage (local)
  "explicit.stat_1940865751", // Adds Physical Damage
  "explicit.stat_210067635",  // Attack Speed
  "explicit.stat_2923486259", // Attack Speed (local)
  "explicit.stat_2628039082", // Critical Strike Chance
  "explicit.stat_2311243048", // Critical Strike Multiplier
  "explicit.stat_2301191210", // Critical Strike Multiplier
  "explicit.stat_709508406",  // Adds Fire Damage
  "explicit.stat_1999113824", // Adds Cold Damage
  "explicit.stat_737908626",  // Adds Lightning Damage
  "explicit.stat_1202301673", // +# to Level of all Projectile Skills
];

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
    
    // Calculate DPS and PDPS gain potentials for better sorting
    const itemsWithDpsGainPotential = itemsWithPredictedPrices.map(item => {
      if (!item.totalDps || !item.maxDps) return item;
      
      // Calculate potential gains as percentages
      const dpsGainPotential = item.maxDps > item.totalDps 
        ? ((item.maxDps - item.totalDps) / item.totalDps) * 100 
        : 0;
        
      const pdpsGainPotential = item.physicalDps && item.maxPdps && item.maxPdps > item.physicalDps
        ? ((item.maxPdps - item.physicalDps) / item.physicalDps) * 100
        : 0;
        
      return {
        ...item,
        dpsGainPotential,
        pdpsGainPotential
      };
    });
    
    // Default sorting - by divine potential
    return itemsWithDpsGainPotential.sort((a, b) => {
      const aDivineWorth = Math.max(...(a.divineAnalysis?.filter(d => d.affectsDps).map(d => d.potentialGain) || [0]));
      const bDivineWorth = Math.max(...(b.divineAnalysis?.filter(d => d.affectsDps).map(d => d.potentialGain) || [0]));
      return bDivineWorth - aDivineWorth;
    });
    
  } catch (error) {
    console.error("Erro ao buscar itens:", error);
    throw error;
  }
};

// Export the testApiConnection function to fix the first build error
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

const calculatePotentialDPS = (itemData: any): { 
  currentDps: number, 
  minDps: number, 
  maxDps: number,
  currentPdps: number,
  minPdps: number,
  maxPdps: number,
  currentPhysDamageMin: number,
  currentPhysDamageMax: number,
  currentAttackSpeed: number
} => {
  // Valores padrão
  let increasedPhysicalDamage = 0;
  let addedPhysicalMin = 0;
  let addedPhysicalMax = 0;
  let addedElementalMin = 0;
  let addedElementalMax = 0;
  let increasedAttackSpeed = 0;
  
  // Extract the base type name from the item
  const baseTypeName = itemData.typeLine || "";
  
  // Get the base data from our database
  const baseData = findWeaponBase(baseTypeName);
  
  if (!baseData) {
    console.warn(`Base data not found for: ${baseTypeName}`);
  }
  
  // Use base data or fallbacks if not found
  const basePhysMin = baseData?.physDamageMin || 50;
  const basePhysMax = baseData?.physDamageMax || 100;
  const baseAPS = baseData?.attacksPerSecond || 1.3;
  
  // Check if weapon has elemental base damage
  let baseEleMin = baseData?.eleDamageMin || 0;
  let baseEleMax = baseData?.eleDamageMax || 0;
  
  // Pegar valores dos mods de explicit e implicit
  const allMods = [
    ...(itemData.explicitMods || []),
    ...(itemData.implicitMods || [])
  ];
  
  for (const mod of allMods) {
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
    
    // Added Elemental Damage (all types)
    if (mod.toLowerCase().includes("adds") && mod.includes("to") && 
       (mod.includes("Fire Damage") || mod.includes("Cold Damage") || mod.includes("Lightning Damage") || mod.includes("Chaos Damage"))) {
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
  
  // Buscar valores de range de mods para cálculo de min/max
  let incPhysDamageRange = [0, 0];
  let addedPhysDamageMinRange = [0, 0];
  let addedPhysDamageMaxRange = [0, 0];
  let attackSpeedRange = [0, 0];
  
  // Extrair os ranges das estatísticas da API
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
  
  // CURRENT VALUES CALCULATION
  
  // Physical damage calculation
  const physDamageMult = 1 + (increasedPhysicalDamage / 100);
  const currentPhysMin = (basePhysMin * physDamageMult) + addedPhysicalMin;
  const currentPhysMax = (basePhysMax * physDamageMult) + addedPhysicalMax;
  
  // Attack speed calculation
  const currentAPS = baseAPS * (1 + (increasedAttackSpeed / 100));
  
  // DPS calculations
  const currentPhysDps = ((currentPhysMin + currentPhysMax) / 2) * currentAPS;
  
  // Handle base elemental damage + added elemental damage
  const currentEleDps = ((baseEleMin + baseEleMax) / 2 + (addedElementalMin + addedElementalMax) / 2) * currentAPS;
  const currentTotalDps = currentPhysDps + currentEleDps;
  
  // MAXIMUM VALUES CALCULATION
  
  // Max increased phys damage
  const maxIncreasedPhys = incPhysDamageRange[1] || increasedPhysicalDamage;
  const maxPhysDamageMult = 1 + (maxIncreasedPhys / 100);
  
  // Max added phys damage
  const maxAddedPhysMin = addedPhysDamageMinRange[1] || addedPhysicalMin;
  const maxAddedPhysMax = addedPhysDamageMaxRange[1] || addedPhysicalMax;
  
  // Max attack speed
  const maxAttackSpeed = attackSpeedRange[1] || increasedAttackSpeed;
  const maxAPS = baseAPS * (1 + (maxAttackSpeed / 100));
  
  // Max damage values
  const maxPhysMin = (basePhysMin * maxPhysDamageMult) + maxAddedPhysMin;
  const maxPhysMax = (basePhysMax * maxPhysDamageMult) + maxAddedPhysMax;
  
  // Max DPS
  const maxPhysDps = ((maxPhysMin + maxPhysMax) / 2) * maxAPS;
  const maxTotalDps = maxPhysDps + currentEleDps; // Keep current ele damage
  
  // MINIMUM VALUES CALCULATION
  
  // Min increased phys damage
  const minIncreasedPhys = incPhysDamageRange[0] || increasedPhysicalDamage;
  const minPhysDamageMult = 1 + (minIncreasedPhys / 100);
  
  // Min added phys damage
  const minAddedPhysMin = addedPhysDamageMinRange[0] || addedPhysicalMin;
  const minAddedPhysMax = addedPhysDamageMaxRange[0] || addedPhysicalMax;
  
  // Min attack speed
  const minAttackSpeed = attackSpeedRange[0] || increasedAttackSpeed;
  const minAPS = baseAPS * (1 + (minAttackSpeed / 100));
  
  // Min damage values
  const minPhysMin = (basePhysMin * minPhysDamageMult) + minAddedPhysMin;
  const minPhysMax = (basePhysMax * minPhysDamageMult) + minAddedPhysMax;
  
  // Min DPS
  const minPhysDps = ((minPhysMin + minPhysMax) / 2) * minAPS;
  const minTotalDps = minPhysDps + currentEleDps; // Keep current ele damage
  
  return {
    currentDps: parseFloat(currentTotalDps.toFixed(2)),
    minDps: parseFloat(minTotalDps.toFixed(2)),
    maxDps: parseFloat(maxTotalDps.toFixed(2)),
    currentPdps: parseFloat(currentPhysDps.toFixed(2)),
    minPdps: parseFloat(minPhysDps.toFixed(2)),
    maxPdps: parseFloat(maxPhysDps.toFixed(2)),
    currentPhysDamageMin: parseFloat(currentPhysMin.toFixed(2)),
    currentPhysDamageMax: parseFloat(currentPhysMax.toFixed(2)),
    currentAttackSpeed: parseFloat(currentAPS.toFixed(2))
  };
};

const calculatePredictedPrice = (item: Item): Item => {
  if (!item.divineAnalysis || item.divineAnalysis.length === 0) {
    return item;
  }
  
  // Focus on DPS-affecting mods for weapons
  const dpsAffectingMods = item.divineAnalysis.filter(a => a.affectsDps === true);
  
  // For weapons, primarily look at DPS gains
  let maxPotentialGain = 0;
  let isWeapon = false;
  
  if (item.totalDps && item.maxDps) {
    isWeapon = true;
    const dpsGain = ((item.maxDps - item.totalDps) / item.totalDps) * 100;
    maxPotentialGain = Math.max(dpsGain, maxPotentialGain);
  }
  
  // If it's not a weapon or we don't have DPS values, use the general mod potential
  if (!isWeapon || maxPotentialGain < 10) {
    // Use DPS-affecting mods first if available
    if (dpsAffectingMods.length > 0) {
      maxPotentialGain = Math.max(...dpsAffectingMods.map(a => a.potentialGain));
    } else {
      // Otherwise use all mods
      maxPotentialGain = Math.max(...item.divineAnalysis.map(a => a.potentialGain));
    }
  }
  
  // Price model:
  // - Up to 15% gain: minimal price increase
  // - 15-30% gain: moderate price increase
  // - 30-50% gain: significant price increase
  // - >50% gain: large price increase
  let priceMultiplier = 1;
  
  if (maxPotentialGain >= 50) {
    priceMultiplier = 1.75; // +75%
  } else if (maxPotentialGain >= 30) {
    priceMultiplier = 1.5; // +50%
  } else if (maxPotentialGain >= 15) {
    priceMultiplier = 1.25; // +25%
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
  
  // Extract the base type
  const typeLine = itemData.typeLine || "";
  const baseType = itemData.baseType || typeLine;
  
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
  
  // Calcular DPS avançado para armas
  let dpsValues = {
    currentDps: 0,
    minDps: 0,
    maxDps: 0,
    currentPdps: 0,
    minPdps: 0,
    maxPdps: 0,
    currentPhysDamageMin: 0,
    currentPhysDamageMax: 0,
    currentAttackSpeed: 0
  };
  
  let totalDps: number | undefined = undefined;
  let physicalDps: number | undefined = undefined;
  let elementalDps: number | undefined = undefined;
  let minDps: number | undefined = undefined;
  let maxDps: number | undefined = undefined;
  let minPdps: number | undefined = undefined;
  let maxPdps: number | undefined = undefined;
  let currentPhysDamageMin: number | undefined = undefined;
  let currentPhysDamageMax: number | undefined = undefined;
  let currentAttackSpeed: number | undefined = undefined;
  
  // Identificar se é uma arma pela categoria ou tipo
  const isWeapon = 
    typeLine.includes("Sword") || 
    typeLine.includes("Axe") || 
    typeLine.includes("Mace") || 
    typeLine.includes("Staff") ||
    typeLine.includes("Quarterstaff") ||
    typeLine.includes("Bow") ||
    typeLine.includes("Crossbow") ||
    typeLine.includes("Spear") ||
    typeLine.includes("Wand") ||
    typeLine.includes("Sceptre") ||
    typeLine.includes("Dagger") ||
    typeLine.includes("Hammer") ||
    typeLine.includes("Greathammer") ||
    typeLine.includes("Flail") ||
    typeLine.includes("Claw");
  
  if (isWeapon) {
    // Usar nossa função avançada de cálculo de DPS
    dpsValues = calculatePotentialDPS(itemData);
    
    totalDps = dpsValues.currentDps;
    physicalDps = dpsValues.currentPdps;
    elementalDps = totalDps - physicalDps;
    minDps = dpsValues.minDps;
    maxDps = dpsValues.maxDps;
    minPdps = dpsValues.minPdps;
    maxPdps = dpsValues.maxPdps;
    currentPhysDamageMin = dpsValues.currentPhysDamageMin;
    currentPhysDamageMax = dpsValues.currentPhysDamageMax;
    currentAttackSpeed = dpsValues.currentAttackSpeed;
    
  } else if (itemData.properties) {
    // Fallback para o método simples (para itens não-armas)
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
  
  // Mapear stat IDs para os mods (para identificar quais afetam DPS)
  const modStatIdMap = new Map<string, string>();
  
  if (itemData.extended?.hashes?.explicit) {
    for (const hashEntry of itemData.extended.hashes.explicit) {
      if (Array.isArray(hashEntry) && hashEntry.length >= 2) {
        const statId = hashEntry[0];
        const indices = hashEntry[1];
        
        if (Array.isArray(indices)) {
          for (const idx of indices) {
            // Converter o índice para string para usar como chave no mapa
            modStatIdMap.set(idx.toString(), statId);
          }
        }
      }
    }
  }
  
  if (itemData.explicitMods) {
    itemData.explicitMods.forEach((mod: string, index: number) => {
      // Get statId for this mod if available
      const statId = modStatIdMap.get(index.toString());
      
      // Verificar se o mod afeta DPS (importante para armas)
      const affectsDps = statId && DPS_AFFECTING_STAT_IDS.includes(statId);
      
      // Encontrar o stat correspondente a este mod
      const matchingStat = Object.entries(STAT_RANGES).find(([id, range]) => {
        return id === statId || mod.includes(getStatLabel(id));
      });
      
      if (matchingStat) {
        const [statId, range] = matchingStat;
        
        // Extract the numeric value from the mod
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
          
          // Analyze Divine worth
          const analysis = analyzeDivineValue(statId, value);
          
          // Add extra stats to analysis for UI display
          const enhancedAnalysis: DivineAnalysis = {
            ...analysis,
            statName: getStatLabel(statId),
            statId,
            currentValue: value,
            minValue: range.min,
            maxValue: range.max,
            affectsDps
          };
          
          divineAnalysis.push(enhancedAnalysis);
        }
      } else {
        // Try to extract values with range in brackets
        const rangeMatch = mod.match(/(.*?)(\s+\[.*?\])?$/);
        if (rangeMatch) {
          const modText = rangeMatch[1].trim();
          const rangeText = rangeMatch[2]?.trim() || "";
          
          // Extract min/max values from range if available
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
          
          // Check if this mod affects DPS by keyword matching
          const isDpsMod = 
            (modText.includes("Physical Damage") && !modText.includes("taken")) ||
            modText.includes("Attack Speed") ||
            (modText.includes("Critical") && (modText.includes("Chance") || modText.includes("Multiplier"))) ||
            (modText.toLowerCase().includes("adds") && 
              (modText.includes("Fire Damage") || modText.includes("Cold Damage") || 
               modText.includes("Lightning Damage") || modText.includes("Chaos Damage"))) ||
            modText.includes("to Level of all Projectile Skills");
          
          // If we have min/max, try to extract current value and calculate percentile
          if (min !== undefined && max !== undefined) {
            const valueMatch = modText.match(/(\d+(\.\d+)?)/);
            if (valueMatch) {
              const currentValue = parseFloat(valueMatch[0]);
              
              // Calculate percentile relative to max
              const range = max - min;
              if (range > 0) {
                const percentile = Math.round(((currentValue - min) / range) * 100);
                const potentialGain = Math.round(((max - currentValue) / currentValue) * 100);
                
                // Consider worth divine ONLY if it affects DPS and has significant potential
                const worthDivine = isDpsMod ? potentialGain >= 10 : false;
                
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
                  maxValue: max,
                  affectsDps: isDpsMod
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
    listedTime = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // URL para o item no site
  const tradeUrl = `https://www.pathofexile.com/trade2/search/poe2/${queryId}/${item.id}`;
  
  // Montar o objeto final - now with baseType included
  const processedItem: Item = {
    id: item.id,
    name: `${itemData.name || ""} ${typeLine || ""}`.trim(),
    category: typeLine || "",
    baseType: baseType, // Add baseType here
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
    minPdps,
    maxPdps,
    currentPhysDamageMin,
    currentPhysDamageMax,
    currentAttackSpeed,
    seller,
    listedTime,
    tradeUrl
  };
  
  return processedItem;
};

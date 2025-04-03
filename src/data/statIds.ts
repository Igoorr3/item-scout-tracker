
// Estatísticas oficiais da API do PoE2 (formato: explicit.stat_NUMEROID)
export const STAT_OPTIONS = [
  { label: "Vida Máxima", value: "explicit.stat_3299347043" },
  { label: "% Vida Aumentada", value: "explicit.stat_1671376347" },
  { label: "Mana Máxima", value: "explicit.stat_1050105434" },
  { label: "% Mana Aumentada", value: "explicit.stat_4220027924" },
  { label: "Resistência ao Fogo", value: "explicit.stat_3372524247" },
  { label: "Resistência ao Gelo", value: "explicit.stat_3642289083" },
  { label: "Resistência ao Raio", value: "explicit.stat_1010850144" },
  { label: "Resistência ao Caos", value: "explicit.stat_3795704793" },
  { label: "Dano Físico Aumentado", value: "explicit.stat_2901986750" },
  { label: "Dano Elemental Aumentado", value: "explicit.stat_2974417149" },
  { label: "Dano de Feitiços Aumentado", value: "explicit.stat_1368271171" },
  { label: "Velocidade de Ataque", value: "explicit.stat_2923486259" },
  { label: "Velocidade de Conjuração", value: "explicit.stat_4277795662" },
  { label: "Chance de Acerto Crítico", value: "explicit.stat_2628039082" },
  { label: "Multiplicador de Críticos", value: "explicit.stat_2301191210" },
  { label: "Alcance de Ataque", value: "explicit.stat_2469416729" },
  { label: "Atributo Força", value: "explicit.stat_3489782002" },
  { label: "Atributo Destreza", value: "explicit.stat_4080418644" },
  { label: "Atributo Inteligência", value: "explicit.stat_4043464511" },
  { label: "Todos Atributos", value: "explicit.stat_2026728709" },
  { label: "Velocidade de Movimento", value: "explicit.stat_3848254059" }
];

// IDs para propriedades derivadas (como DPS)
export const DERIVED_STATS = {
  totalDps: "Total DPS",
  physicalDps: "Physical DPS",
  elementalDps: "Elemental DPS"
};

// Valores mínimos e máximos para cada afixo
export const STAT_RANGES = {
  "explicit.stat_3299347043": { min: 20, max: 120 },    // Vida Máxima
  "explicit.stat_1671376347": { min: 5, max: 20 },      // % Vida Aumentada
  "explicit.stat_1050105434": { min: 15, max: 90 },     // Mana Máxima
  "explicit.stat_4220027924": { min: 5, max: 20 },      // % Mana Aumentada
  "explicit.stat_3372524247": { min: 10, max: 48 },     // Resistência ao Fogo
  "explicit.stat_3642289083": { min: 10, max: 48 },     // Resistência ao Gelo
  "explicit.stat_1010850144": { min: 10, max: 48 },     // Resistência ao Raio
  "explicit.stat_3795704793": { min: 10, max: 35 },     // Resistência ao Caos
  "explicit.stat_2901986750": { min: 10, max: 79 },     // Dano Físico Aumentado
  "explicit.stat_2974417149": { min: 10, max: 79 },     // Dano Elemental Aumentado
  "explicit.stat_1368271171": { min: 10, max: 79 },     // Dano de Feitiços Aumentado
  "explicit.stat_2923486259": { min: 5, max: 25 },      // Velocidade de Ataque
  "explicit.stat_4277795662": { min: 5, max: 25 },      // Velocidade de Conjuração
  "explicit.stat_2628039082": { min: 5, max: 38 },      // Chance de Acerto Crítico
  "explicit.stat_2301191210": { min: 5, max: 38 },      // Multiplicador de Críticos
  "explicit.stat_2469416729": { min: 1, max: 6 },       // Alcance de Ataque
  "explicit.stat_3489782002": { min: 8, max: 55 },      // Atributo Força
  "explicit.stat_4080418644": { min: 8, max: 55 },      // Atributo Destreza
  "explicit.stat_4043464511": { min: 8, max: 55 },      // Atributo Inteligência
  "explicit.stat_2026728709": { min: 4, max: 25 },      // Todos Atributos
  "explicit.stat_3848254059": { min: 3, max: 12 }       // Velocidade de Movimento
};

// Função auxiliar para encontrar o label de um valor
export const getStatLabel = (statId: string): string => {
  const stat = STAT_OPTIONS.find(stat => stat.value === statId);
  return stat ? stat.label : statId;
};

// Função para analisar se vale a pena usar Divine
export const analyzeDivineValue = (statId: string, currentValue: number): { 
  worthDivine: boolean, 
  currentPercentile: number,
  potentialGain: number,
  recommendation: string 
} => {
  const range = STAT_RANGES[statId];
  
  // Se não encontramos as informações de range para este stat
  if (!range) {
    return { 
      worthDivine: false, 
      currentPercentile: 0,
      potentialGain: 0, 
      recommendation: "Informações insuficientes para análise" 
    };
  }
  
  const { min, max } = range;
  const range_size = max - min;
  
  // Cálculo do percentil atual do item (0-100%)
  const currentPercentile = Math.round(((currentValue - min) / range_size) * 100);
  
  // Ganho potencial médio teórico (média do range - valor atual)
  const averageRoll = min + range_size / 2;
  const potentialGain = Math.max(0, averageRoll - currentValue);
  
  // Lógica de decisão
  let worthDivine = false;
  let recommendation = "";
  
  if (currentPercentile <= 20) {
    worthDivine = true;
    recommendation = "Altamente recomendado usar Divine (valor atual muito baixo)";
  } else if (currentPercentile <= 35) {
    worthDivine = true;
    recommendation = "Recomendado usar Divine (valor atual baixo)";
  } else if (currentPercentile < 50) {
    worthDivine = potentialGain > (range_size * 0.15);
    recommendation = worthDivine 
      ? "Considere usar Divine (ganho potencial significativo)" 
      : "Divine não recomendado (ganho potencial limitado)";
  } else {
    worthDivine = false;
    recommendation = "Divine não recomendado (valor atual já é bom)";
  }
  
  return {
    worthDivine,
    currentPercentile,
    potentialGain,
    recommendation
  };
};

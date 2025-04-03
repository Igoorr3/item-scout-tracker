
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

// Função auxiliar para encontrar o label de um valor
export const getStatLabel = (statId: string): string => {
  const stat = STAT_OPTIONS.find(stat => stat.value === statId);
  return stat ? stat.label : statId;
};

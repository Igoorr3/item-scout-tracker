
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StatType = {
  name: string;
  id: string;
};

// Stats aceitas pela API do Path of Exile 2 - IDs corrigidos de acordo com os erros da API
const COMMON_STATS: StatType[] = [
  // Stats gerais para todos os itens
  { name: "Vida Máxima", id: "explicit.stat_3299347043" },
  { name: "% Vida Máxima", id: "explicit.stat_983749596" },
  { name: "Mana Máxima", id: "explicit.stat_1050105434" },
  { name: "% Mana Máxima", id: "explicit.stat_3771516363" },
  { name: "% Velocidade de Movimento", id: "explicit.stat_2250533757" },
  
  // Resistências
  { name: "% Resistência ao Fogo", id: "explicit.stat_4220027924" },
  { name: "% Resistência ao Frio", id: "explicit.stat_1671376347" },
  { name: "% Resistência ao Raio", id: "explicit.stat_4080551317" },
  { name: "% Resistência ao Caos", id: "explicit.stat_2451402625" },
  { name: "% Resistência a Todos os Elementos", id: "explicit.stat_2901986750" },
  
  // Atributos
  { name: "Força", id: "explicit.stat_3987107905" },
  { name: "Destreza", id: "explicit.stat_2149273975" },
  { name: "Inteligência", id: "explicit.stat_4158059829" },
  { name: "Todos os Atributos", id: "explicit.stat_2026948966" },
  
  // Armas - Mods explícitos
  { name: "% Dano Físico Aumentado", id: "explicit.stat_2974417149" },
  { name: "% Dano com Ataques", id: "explicit.stat_1509134228" },
  { name: "% Dano Elemental com Ataques", id: "explicit.stat_2231191851" },
  { name: "% Dano de Feitiços", id: "explicit.stat_3291999324" },
  { name: "% Velocidade de Ataque", id: "explicit.stat_210067635" },
  { name: "% Velocidade de Conjuração", id: "explicit.stat_2891184298" },
  { name: "% Chance de Acerto Crítico", id: "explicit.stat_587431675" },
  { name: "% Multiplicador de Acerto Crítico", id: "explicit.stat_2891784511" },
  
  // Armaduras - Mods locais
  { name: "Armadura", id: "explicit.stat_1062208444" },
  { name: "Evasão", id: "explicit.stat_3872739249" },
  { name: "Escudo de Energia", id: "explicit.stat_2482852589" },
  
  // Mods de dano com armas específicas
  { name: "% Dano com Espadas", id: "explicit.stat_2044559612" },
  { name: "% Dano com Machados", id: "explicit.stat_1359148592" },
  { name: "% Dano com Maças", id: "explicit.stat_1219205955" },
  { name: "% Dano com Arcos", id: "explicit.stat_731304034" },
  { name: "% Dano com Armas de Duas Mãos", id: "explicit.stat_1754445155" },
  { name: "% Dano com Armas de Uma Mão", id: "explicit.stat_380815083" },
  
  // Mods com penetração de resistência
  { name: "% Penetração de Resistência Elemental", id: "explicit.stat_359688963" },
  { name: "% Penetração de Resistência ao Fogo", id: "explicit.stat_1136915655" },
  { name: "% Penetração de Resistência ao Frio", id: "explicit.stat_796459275" },
  { name: "% Penetração de Resistência ao Raio", id: "explicit.stat_187808414" },
  
  // Outros mods úteis
  { name: "% Chance de Acerto Múltiplo", id: "explicit.stat_916808129" },
  { name: "% Chance de Bloquear", id: "explicit.stat_1935568886" },
  { name: "% Chance de Evitar", id: "explicit.stat_4127673221" },
  { name: "% Velocidade de Incineração", id: "explicit.stat_4193088687" },
];

interface StatFilterProps {
  onStatChange: (statId: string, value: number) => void;
  selectedStat?: string;
  value?: number;
}

const StatFilter = ({ onStatChange, selectedStat, value }: StatFilterProps) => {
  const [statId, setStatId] = React.useState<string>(selectedStat || "");
  const [minValue, setMinValue] = React.useState<string>(value?.toString() || "");

  const handleStatChange = (newStatId: string) => {
    setStatId(newStatId);
    onStatChange(newStatId, Number(minValue) || 0);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinValue(e.target.value);
    onStatChange(statId, Number(e.target.value) || 0);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="stat-type" className="text-sm text-muted-foreground mb-1 block">Estatística</Label>
        <Select value={statId} onValueChange={handleStatChange}>
          <SelectTrigger id="stat-type" className="w-full bg-muted border-border">
            <SelectValue placeholder="Selecione uma estatística" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {COMMON_STATS.map((stat) => (
              <SelectItem 
                key={stat.id} 
                value={stat.id}
                className="hover:bg-muted hover:text-primary cursor-pointer"
              >
                {stat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="min-value" className="text-sm text-muted-foreground mb-1 block">Valor Mínimo</Label>
        <Input
          id="min-value"
          type="number"
          value={minValue}
          onChange={handleValueChange}
          className="bg-muted border-border"
          placeholder="ex: 50"
        />
      </div>
    </div>
  );
};

export default StatFilter;

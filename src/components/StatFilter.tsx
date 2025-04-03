
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

// Stats aceitas pela API do Path of Exile 2 - Atualizadas para usar os IDs corretos
const COMMON_STATS: StatType[] = [
  // Armas
  { name: "Dano Físico Mínimo", id: "local_minimum_added_physical_damage" },
  { name: "Dano Físico Máximo", id: "local_maximum_added_physical_damage" },
  { name: "% Dano Físico Aumentado", id: "local_physical_damage_+%" },
  { name: "Velocidade de Ataque", id: "local_attack_speed_+%" },
  { name: "Chance de Acerto Crítico", id: "local_critical_strike_chance_+%" },
  // Armaduras
  { name: "Armadura", id: "local_base_armour" },
  { name: "Evasão", id: "local_base_evasion_rating" },
  { name: "Escudo de Energia", id: "local_energy_shield" },
  // Modificadores Globais
  { name: "% Vida Máxima", id: "maximum_life_+%" },
  { name: "Vida Máxima", id: "maximum_life" },
  { name: "% Mana Máxima", id: "maximum_mana_+%" },
  { name: "Mana Máxima", id: "maximum_mana" },
  { name: "% Velocidade de Movimento", id: "base_movement_velocity_+%" },
  // Resistências
  { name: "% Resistência ao Fogo", id: "fire_damage_resistance_%" },
  { name: "% Resistência ao Frio", id: "cold_damage_resistance_%" },
  { name: "% Resistência ao Raio", id: "lightning_damage_resistance_%" },
  { name: "% Resistência ao Caos", id: "chaos_damage_resistance_%" },
  // Atributos
  { name: "Força", id: "base_strength" },
  { name: "Destreza", id: "base_dexterity" },
  { name: "Inteligência", id: "base_intelligence" },
  { name: "Todos os Atributos", id: "base_all_attributes" },
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

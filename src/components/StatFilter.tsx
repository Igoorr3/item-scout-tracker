
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

// Stats aceitas pela API do Path of Exile 2
const COMMON_STATS: StatType[] = [
  { name: "Physical DPS", id: "weapon.physical_dps" },
  { name: "Elemental DPS", id: "weapon.elemental_dps" },
  { name: "Total DPS", id: "weapon.total_dps" },
  { name: "Velocidade de Ataque", id: "weapon.aps" },
  { name: "Chance de Acerto Crítico", id: "weapon.crit" },
  { name: "Armadura", id: "armour.armour" },
  { name: "Evasão", id: "armour.evasion" },
  { name: "Escudo de Energia", id: "armour.energy_shield" },
  { name: "% Vida", id: "explicit.stat_3299347043" },
  { name: "Vida Máxima", id: "explicit.stat_3932700432" },
  { name: "% Mana", id: "explicit.stat_1671376347" },
  { name: "Mana Máxima", id: "explicit.stat_4220027924" },
  { name: "% Vel. Movimento", id: "explicit.stat_2250533757" },
  { name: "% Res. Fogo", id: "explicit.stat_3372524247" },
  { name: "% Res. Gelo", id: "explicit.stat_1671376347" },
  { name: "% Res. Raio", id: "explicit.stat_4220027924" },
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
          placeholder="ex: 500"
        />
      </div>
    </div>
  );
};

export default StatFilter;

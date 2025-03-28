
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

const COMMON_STATS: StatType[] = [
  { name: "DPS (Damage Per Second)", id: "dps" },
  { name: "pDPS (Physical DPS)", id: "pdps" },
  { name: "eDPS (Elemental DPS)", id: "edps" },
  { name: "Attack Speed", id: "attack_speed" },
  { name: "Critical Strike Chance", id: "crit_chance" },
  { name: "Armour", id: "armour" },
  { name: "Evasion", id: "evasion" },
  { name: "Energy Shield", id: "energy_shield" },
  { name: "Life", id: "life" },
  { name: "Mana", id: "mana" },
  { name: "Movement Speed", id: "movement_speed" },
  { name: "Resistances", id: "resistances" },
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

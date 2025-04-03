
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { STAT_OPTIONS } from '@/data/statIds';

interface StatFilterProps {
  selectedStat: string;
  value: number;
  onStatChange: (statId: string, value: number) => void;
}

const StatFilter = ({ selectedStat, value, onStatChange }: StatFilterProps) => {
  const [statId, setStatId] = useState<string>(selectedStat || '');
  const [statValue, setStatValue] = useState<number>(value || 0);

  useEffect(() => {
    if (selectedStat && selectedStat !== statId) {
      setStatId(selectedStat);
    }
    
    if (value !== undefined && value !== statValue) {
      setStatValue(value);
    }
  }, [selectedStat, value]);

  const handleStatChange = (newStatId: string) => {
    setStatId(newStatId);
    onStatChange(newStatId, statValue);
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value);
    setStatValue(newValue);
    onStatChange(statId, newValue);
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Label htmlFor="stat-type" className="text-sm text-muted-foreground">Estatística</Label>
        <Select 
          value={statId} 
          onValueChange={handleStatChange}
        >
          <SelectTrigger className="w-full bg-muted border-border">
            <SelectValue placeholder="Selecione uma estatística" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-[200px]">
            {STAT_OPTIONS.map((stat) => (
              <SelectItem 
                key={stat.value} 
                value={stat.value}
                className="hover:bg-muted hover:text-primary cursor-pointer"
              >
                {stat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="stat-value" className="text-sm text-muted-foreground">Valor Mínimo</Label>
        <Input
          id="stat-value"
          type="number"
          value={statValue}
          onChange={handleValueChange}
          className="w-full bg-muted border-border"
          min={0}
        />
      </div>
    </div>
  );
};

export default StatFilter;

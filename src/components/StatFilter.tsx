
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
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from 'lucide-react';

interface StatFilterProps {
  selectedStat: string;
  value: number;
  onStatChange: (statId: string, value: number) => void;
}

const StatFilter = ({ selectedStat, value, onStatChange }: StatFilterProps) => {
  const [statId, setStatId] = useState<string>(selectedStat || STAT_OPTIONS[0].value);
  const [statValue, setStatValue] = useState<number>(value || 0);
  const [useRawStatId, setUseRawStatId] = useState<boolean>(false);
  const [customStatId, setCustomStatId] = useState<string>("");

  useEffect(() => {
    // Se o selectedStat mudou e é diferente do estado atual, atualizamos
    if (selectedStat && selectedStat !== statId) {
      setStatId(selectedStat);
      
      // Se o stat parece ser um ID raw (contém explicit.stat_), ativamos o modo raw
      if (selectedStat.includes('explicit.stat_')) {
        setUseRawStatId(true);
        setCustomStatId(selectedStat);
      }
    }
    
    // Se value mudou e é diferente do estado atual, atualizamos
    if (value !== undefined && value !== statValue) {
      setStatValue(value);
    }
  }, [selectedStat, value]);

  const handleStatChange = (newStatId: string) => {
    setStatId(newStatId);
    // Notificamos o componente pai sobre a mudança
    onStatChange(newStatId, statValue);
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value);
    setStatValue(newValue);
    // Notificamos o componente pai sobre a mudança
    onStatChange(useRawStatId ? customStatId : statId, newValue);
  };

  const handleCustomStatIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStatId = event.target.value;
    setCustomStatId(newStatId);
    // Notificamos o componente pai sobre a mudança apenas se estiver usando ID raw
    if (useRawStatId) {
      onStatChange(newStatId, statValue);
    }
  };

  const toggleRawStatId = (checked: boolean) => {
    setUseRawStatId(checked);
    // Se ativar o modo raw, usamos o customStatId (ou inicializamos com o formato correto)
    if (checked) {
      // Inicializa com um formato padrão se estiver vazio
      const initialRawId = customStatId || "explicit.stat_";
      setCustomStatId(initialRawId);
      onStatChange(initialRawId, statValue);
    } else {
      // Volta a usar o statId do dropdown
      onStatChange(statId, statValue);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="stat-type" className="text-sm text-muted-foreground">Estatística</Label>
          <div className="flex items-center gap-2">
            <Switch
              id="use-raw-id"
              checked={useRawStatId}
              onCheckedChange={toggleRawStatId}
            />
            <Label htmlFor="use-raw-id" className="text-xs cursor-pointer">
              ID Raw
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className="text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[250px]">
                    Habilite para usar IDs de estatísticas no formato raw (ex: explicit.stat_3299347043).
                    Este é o formato oficial da API do Path of Exile 2.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {useRawStatId ? (
          <Input
            placeholder="explicit.stat_NUMEROID"
            value={customStatId}
            onChange={handleCustomStatIdChange}
            className="w-full bg-muted border-border"
          />
        ) : (
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
        )}
      </div>
      
      <div>
        <Label htmlFor="stat-value" className="text-sm text-muted-foreground">Valor Mínimo</Label>
        <Input
          id="stat-value"
          type="number"
          value={statValue || ''}
          onChange={handleValueChange}
          className="w-full bg-muted border-border"
          min={0}
        />
      </div>
    </div>
  );
};

export default StatFilter;

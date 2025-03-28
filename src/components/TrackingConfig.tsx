
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ItemTypeSelect from './ItemTypeSelect';
import StatFilter from './StatFilter';
import { TrackingConfiguration } from '@/types/tracking';
import { Plus, Save, X } from 'lucide-react';

interface TrackingConfigProps {
  onSave: (config: TrackingConfiguration) => void;
  defaultConfig?: TrackingConfiguration;
}

const TrackingConfig = ({ onSave, defaultConfig }: TrackingConfigProps) => {
  const [name, setName] = useState(defaultConfig?.name || '');
  const [itemType, setItemType] = useState(defaultConfig?.itemType || '');
  const [refreshInterval, setRefreshInterval] = useState(defaultConfig?.refreshInterval?.toString() || '30');
  const [enabled, setEnabled] = useState(defaultConfig?.enabled ?? true);
  const [stats, setStats] = useState<Record<string, number>>(defaultConfig?.stats || {});
  const [statFilters, setStatFilters] = useState<string[]>(
    defaultConfig?.stats ? Object.keys(defaultConfig.stats) : ['dps']
  );

  const handleSave = () => {
    const config: TrackingConfiguration = {
      id: defaultConfig?.id || Date.now().toString(),
      name: name || `Tracker para ${itemType}`,
      itemType,
      refreshInterval: Number(refreshInterval),
      enabled,
      stats,
    };
    
    onSave(config);
  };

  const addStatFilter = () => {
    setStatFilters([...statFilters, '']);
  };

  const removeStatFilter = (index: number) => {
    const newStatFilters = [...statFilters];
    const statToRemove = newStatFilters[index];
    newStatFilters.splice(index, 1);
    setStatFilters(newStatFilters);
    
    // Remove o stat do objeto stats também
    if (statToRemove && stats[statToRemove]) {
      const newStats = { ...stats };
      delete newStats[statToRemove];
      setStats(newStats);
    }
  };

  const updateStat = (index: number, statId: string, value: number) => {
    const oldStatId = statFilters[index];
    
    // Se o statId mudou, remova o antigo do objeto stats
    if (oldStatId && oldStatId !== statId && stats[oldStatId]) {
      const newStats = { ...stats };
      delete newStats[oldStatId];
      setStats(newStats);
    }
    
    // Atualiza o statFilters com o novo statId
    const newStatFilters = [...statFilters];
    newStatFilters[index] = statId;
    setStatFilters(newStatFilters);
    
    // Atualiza o valor no objeto stats
    setStats({
      ...stats,
      [statId]: value
    });
  };

  return (
    <Card className="bg-card border-primary/20 shadow-lg">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-primary">Configuração de Rastreamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="tracker-name" className="text-sm text-muted-foreground">Nome do Rastreador</Label>
          <Input 
            id="tracker-name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Ex: Bows com DPS Alto"
            className="bg-muted border-border"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="item-type" className="text-sm text-muted-foreground">Tipo de Item</Label>
          <ItemTypeSelect 
            value={itemType} 
            onSelect={setItemType} 
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="stat-filters" className="text-sm text-muted-foreground">Filtros de Estatísticas</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addStatFilter}
              className="h-7 px-2 text-primary border-primary/30 hover:bg-primary/10"
            >
              <Plus size={16} className="mr-1" /> Adicionar Filtro
            </Button>
          </div>
          
          <div className="space-y-3 pt-1">
            {statFilters.map((statId, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1">
                  <StatFilter
                    selectedStat={statId}
                    value={stats[statId]}
                    onStatChange={(newStatId, value) => updateStat(index, newStatId, value)}
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeStatFilter(index)}
                  className="mt-6 text-muted-foreground hover:text-destructive"
                >
                  <X size={18} />
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="refresh-interval" className="text-sm text-muted-foreground">Intervalo de Atualização (segundos)</Label>
          <Input 
            id="refresh-interval" 
            type="number" 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(e.target.value)} 
            min="5"
            className="bg-muted border-border"
          />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <Label htmlFor="enable-tracking" className="text-muted-foreground cursor-pointer">
            Ativar Rastreamento
          </Label>
          <Switch 
            id="enable-tracking" 
            checked={enabled} 
            onCheckedChange={setEnabled}
          />
        </div>
      </CardContent>
      <CardFooter className="border-t border-border pt-4">
        <Button 
          onClick={handleSave} 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Save size={16} className="mr-2" /> Salvar Configuração
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TrackingConfig;

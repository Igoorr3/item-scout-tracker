
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TrackingConfiguration } from '@/types/tracking';
import { Edit, RefreshCw, Trash2 } from 'lucide-react';

interface TrackingListProps {
  configs: TrackingConfiguration[];
  onEdit: (configId: string) => void;
  onDelete: (configId: string) => void;
  onToggle: (configId: string, enabled: boolean) => void;
  onRefresh: (configId: string) => void;
}

const TrackingList = ({ configs, onEdit, onDelete, onToggle, onRefresh }: TrackingListProps) => {
  if (configs.length === 0) {
    return (
      <Card className="bg-card border-primary/20 shadow-lg">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-primary">Rastreamentos Configurados</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-6 text-center">
          <p className="text-muted-foreground">Nenhum rastreamento configurado ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Configure um novo rastreamento para começar a monitorar itens.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-primary/20 shadow-lg">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-primary">Rastreamentos Configurados</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {configs.map((config) => (
            <li key={config.id} className="p-4 hover:bg-muted/10 transition-colors">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">{config.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground space-x-2">
                    <Badge variant="outline" className="bg-muted/20">
                      {config.itemType}
                    </Badge>
                    <span>•</span>
                    <span>A cada {config.refreshInterval}s</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(config.stats).map(([statId, value]) => (
                      <Badge key={statId} variant="secondary" className="text-xs">
                        {statId.replace('_', ' ')}: {value}+
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Switch 
                    checked={config.enabled} 
                    onCheckedChange={(checked) => onToggle(config.id, checked)}
                    aria-label={`Ativar ${config.name}`}
                  />
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRefresh(config.id)}
                    title="Atualizar agora"
                    disabled={!config.enabled}
                  >
                    <RefreshCw size={18} className="text-muted-foreground hover:text-primary" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(config.id)}
                    title="Editar"
                  >
                    <Edit size={18} className="text-muted-foreground hover:text-primary" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(config.id)}
                    title="Excluir"
                  >
                    <Trash2 size={18} className="text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default TrackingList;


import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import TrackerHeader from '@/components/TrackerHeader';
import TrackingConfig from '@/components/TrackingConfig';
import TrackingList from '@/components/TrackingList';
import ItemList from '@/components/ItemList';
import { TrackingConfiguration } from '@/types/tracking';
import { Item } from '@/types/items';
import { fetchItems } from '@/services/itemService';

const Index = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('trackers');
  const [trackingConfigs, setTrackingConfigs] = useState<TrackingConfiguration[]>([]);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Referência para a última requisição para controlar o tempo entre elas
  const lastRequestTime = useRef<number>(0);

  // Carrega os trackings salvos ao iniciar
  useEffect(() => {
    try {
      const savedConfigs = localStorage.getItem('poe-trackings');
      if (savedConfigs) {
        setTrackingConfigs(JSON.parse(savedConfigs));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações salvas');
    }
  }, []);

  // Salva os trackings quando mudam
  useEffect(() => {
    try {
      localStorage.setItem('poe-trackings', JSON.stringify(trackingConfigs));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  }, [trackingConfigs]);

  // Configura os intervalos de atualização para cada tracking ativo
  useEffect(() => {
    const intervals: Record<string, NodeJS.Timeout> = {};
    
    trackingConfigs.forEach(config => {
      if (config.enabled) {
        // No mínimo 10 segundos para evitar rate limiting
        const interval = Math.max(config.refreshInterval, 10) * 1000;
        
        intervals[config.id] = setInterval(() => {
          fetchItemsForConfig(config);
        }, interval);
      }
    });
    
    // Limpa os intervalos anteriores
    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [trackingConfigs]);

  const handleCreateTracker = () => {
    setEditingConfigId(null);
    setIsDialogOpen(true);
  };

  const handleSaveConfig = (config: TrackingConfiguration) => {
    const now = new Date().toISOString();
    const configWithTimestamp = {
      ...config,
      lastUpdated: now
    };
    
    if (editingConfigId) {
      // Atualiza a configuração existente
      setTrackingConfigs(prev => prev.map(c => c.id === editingConfigId ? configWithTimestamp : c));
      toast.success(`Rastreador "${config.name}" atualizado com sucesso!`);
    } else {
      // Adiciona uma nova configuração
      setTrackingConfigs(prev => [...prev, configWithTimestamp]);
      toast.success(`Rastreador "${config.name}" criado com sucesso!`);
    }
    setIsDialogOpen(false);
    
    // Se o rastreador estiver ativo, busca itens imediatamente
    if (config.enabled) {
      fetchItemsForConfig(configWithTimestamp);
    }
  };

  const handleEditConfig = (configId: string) => {
    setEditingConfigId(configId);
    setIsDialogOpen(true);
  };

  const handleDeleteConfig = (configId: string) => {
    const configToDelete = trackingConfigs.find(c => c.id === configId);
    if (configToDelete) {
      setTrackingConfigs(prev => prev.filter(c => c.id !== configId));
      toast.info(`Rastreador "${configToDelete.name}" removido`);
    }
  };

  const handleToggleConfig = (configId: string, enabled: boolean) => {
    setTrackingConfigs(prev => 
      prev.map(c => c.id === configId ? { 
        ...c, 
        enabled,
        lastUpdated: enabled ? new Date().toISOString() : c.lastUpdated 
      } : c)
    );
    
    const config = trackingConfigs.find(c => c.id === configId);
    if (config) {
      if (enabled) {
        toast.info(`Rastreador "${config.name}" ativado`);
        fetchItemsForConfig({ ...config, enabled: true });
      } else {
        toast.info(`Rastreador "${config.name}" desativado`);
      }
    }
  };

  const handleRefreshConfig = (configId: string) => {
    const config = trackingConfigs.find(c => c.id === configId);
    if (config && config.enabled) {
      // Atualiza o timestamp
      setTrackingConfigs(prev => 
        prev.map(c => c.id === configId ? { 
          ...c, 
          lastUpdated: new Date().toISOString() 
        } : c)
      );
      fetchItemsForConfig(config);
    }
  };

  // Busca itens para uma configuração
  const fetchItemsForConfig = async (config: TrackingConfiguration) => {
    try {
      setError(null);
      setIsLoading(true);
      setActiveTab('items'); // Muda para a aba de itens ao buscar
      
      // Verifica o tempo desde a última requisição para evitar rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      
      // Se a última requisição foi feita há menos de 2 segundos, espera
      if (timeSinceLastRequest < 2000) {
        const waitTime = 2000 - timeSinceLastRequest;
        toast.info(`Aguardando ${waitTime/1000}s para evitar limite de requisições...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Atualiza o timestamp da última requisição
      lastRequestTime.current = Date.now();
      
      const fetchedItems = await fetchItems(config);
      setItems(fetchedItems);
      
      if (fetchedItems.length > 0) {
        toast.success(`Encontrados ${fetchedItems.length} itens para "${config.name}"`);
      } else {
        toast.info(`Nenhum item encontrado para "${config.name}"`);
      }
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      setError('Falha ao acessar a API. Verifique se você está logado no site do Path of Exile.');
      toast.error('Erro ao buscar itens. Verifique o console para detalhes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Encontra a configuração que está sendo editada
  const configBeingEdited = editingConfigId 
    ? trackingConfigs.find(c => c.id === editingConfigId) 
    : undefined;

  return (
    <div className="container mx-auto p-4 pb-16 relative">
      <TrackerHeader onCreateTracker={handleCreateTracker} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="trackers" className="text-base">Rastreadores</TabsTrigger>
          <TabsTrigger value="items" className="text-base">Itens Encontrados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trackers" className="space-y-6 mt-0">
          <TrackingList 
            configs={trackingConfigs}
            onEdit={handleEditConfig}
            onDelete={handleDeleteConfig}
            onToggle={handleToggleConfig}
            onRefresh={handleRefreshConfig}
          />
        </TabsContent>
        
        <TabsContent value="items" className="mt-0">
          <ItemList 
            title="Itens Rastreados" 
            items={items}
            isLoading={isLoading}
            error={error || undefined}
          />
        </TabsContent>
      </Tabs>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] p-0">
          <DialogTitle className="sr-only">Configuração de Rastreamento</DialogTitle>
          <TrackingConfig 
            onSave={handleSaveConfig}
            defaultConfig={configBeingEdited}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;

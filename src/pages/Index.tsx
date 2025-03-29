import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import TrackerHeader from '@/components/TrackerHeader';
import TrackingConfig from '@/components/TrackingConfig';
import TrackingList from '@/components/TrackingList';
import ItemList from '@/components/ItemList';
import ApiConfigDialog from '@/components/ApiConfigDialog';
import { TrackingConfiguration } from '@/types/tracking';
import { ApiCredentials } from '@/types/api';
import { Item } from '@/types/items';
import { fetchItems, testApiConnection } from '@/services/itemService';

const Index = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('trackers');
  const [trackingConfigs, setTrackingConfigs] = useState<TrackingConfiguration[]>([]);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiCredentials>({
    poesessid: '',
    cfClearance: [],
    useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    isConfigured: false,
    useProxy: false
  });
  
  const lastRequestTime = useRef<number>(0);

  useEffect(() => {
    try {
      const savedConfigs = localStorage.getItem('poe-trackings');
      if (savedConfigs) {
        setTrackingConfigs(JSON.parse(savedConfigs));
      }
      
      const savedApiConfig = localStorage.getItem('poe-api-config');
      if (savedApiConfig) {
        const parsedConfig = JSON.parse(savedApiConfig) as ApiCredentials;
        if (typeof parsedConfig.cfClearance === 'string' && parsedConfig.cfClearance) {
          parsedConfig.cfClearance = [parsedConfig.cfClearance];
        } else if (!Array.isArray(parsedConfig.cfClearance)) {
          parsedConfig.cfClearance = [];
        }
        setApiConfig(parsedConfig);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações salvas');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('poe-trackings', JSON.stringify(trackingConfigs));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  }, [trackingConfigs]);
  
  useEffect(() => {
    try {
      localStorage.setItem('poe-api-config', JSON.stringify(apiConfig));
    } catch (error) {
      console.error('Erro ao salvar configuração da API:', error);
    }
  }, [apiConfig]);

  useEffect(() => {
    const intervals: Record<string, NodeJS.Timeout> = {};
    
    trackingConfigs.forEach(config => {
      if (config.enabled) {
        const interval = Math.max(config.refreshInterval, 10) * 1000;
        
        intervals[config.id] = setInterval(() => {
          fetchItemsForConfig(config);
        }, interval);
      }
    });
    
    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [trackingConfigs, apiConfig]);

  const handleCreateTracker = () => {
    setEditingConfigId(null);
    setIsDialogOpen(true);
  };
  
  const handleConfigureApi = () => {
    setIsApiConfigOpen(true);
  };
  
  const handleSaveApiConfig = (config: ApiCredentials) => {
    const updatedConfig = {
      ...config,
      cfClearance: Array.isArray(config.cfClearance) ? config.cfClearance : 
                   config.cfClearance ? [config.cfClearance] : []
    };
    
    setApiConfig(updatedConfig);
    toast.success("Configuração da API salva com sucesso", {
      description: "Os rastreadores agora usarão dados reais do Path of Exile 2"
    });
    
    testAndNotifyApiConnection(updatedConfig);
  };
  
  const testAndNotifyApiConnection = async (config: ApiCredentials) => {
    setIsLoading(true);
    try {
      const isConnected = await testApiConnection(config);
      if (isConnected) {
        toast.success("Conexão com API do PoE2 confirmada", {
          description: "Os dados reais serão utilizados nos rastreadores"
        });
      } else {
        const isConnectedWithProxy = await testApiConnection({...config, useProxy: true});
        if (isConnectedWithProxy) {
          toast.success("Conexão com API do PoE2 estabelecida (via proxy)", {
            description: "Os dados reais serão utilizados, mas pode haver algum atraso"
          });
          const updatedConfig = {...config, useProxy: true};
          setApiConfig(updatedConfig);
          localStorage.setItem('poe-api-config', JSON.stringify(updatedConfig));
        } else {
          toast.error("Falha na conexão com a API do Path of Exile", {
            description: "Verifique se seus cookies são válidos e estão atualizados"
          });
        }
      }
    } catch (error) {
      console.error("Erro ao testar a API:", error);
      toast.error("Erro ao testar conexão com a API", {
        description: "Verifique o console para mais detalhes"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = (config: TrackingConfiguration) => {
    const now = new Date().toISOString();
    const configWithTimestamp = {
      ...config,
      lastUpdated: now
    };
    
    if (editingConfigId) {
      setTrackingConfigs(prev => prev.map(c => c.id === editingConfigId ? configWithTimestamp : c));
      toast.success(`Rastreador "${config.name}" atualizado com sucesso!`);
    } else {
      setTrackingConfigs(prev => [...prev, configWithTimestamp]);
      toast.success(`Rastreador "${config.name}" criado com sucesso!`);
    }
    setIsDialogOpen(false);
    
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
      setTrackingConfigs(prev => 
        prev.map(c => c.id === configId ? { 
          ...c, 
          lastUpdated: new Date().toISOString() 
        } : c)
      );
      fetchItemsForConfig(config);
    }
  };

  const fetchItemsForConfig = async (config: TrackingConfiguration) => {
    try {
      setError(null);
      setIsLoading(true);
      setActiveTab('items');
      
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      
      if (timeSinceLastRequest < 2000 && apiConfig.isConfigured) {
        const waitTime = 2000 - timeSinceLastRequest;
        toast.info(`Aguardando ${waitTime/1000}s para evitar limite de requisições...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      lastRequestTime.current = Date.now();
      
      console.log("Buscando itens com as seguintes configurações:", {
        config: config.name,
        api: apiConfig.isConfigured ? "Configurada" : "Não configurada",
        poesessid: apiConfig.poesessid ? "Presente" : "Ausente",
        cfClearance: apiConfig.cfClearance && apiConfig.cfClearance.length > 0 ? "Presente" : "Ausente",
        useragent: apiConfig.useragent ? "Configurado" : "Padrão",
        useProxy: apiConfig.useProxy ? "Sim" : "Não"
      });
      
      const fetchedItems = await fetchItems(config, apiConfig);
      setItems(fetchedItems);
      
      if (fetchedItems.length > 0) {
        toast.success(`Encontrados ${fetchedItems.length} itens para "${config.name}"`);
      } else {
        toast.info(`Nenhum item encontrado para "${config.name}"`);
      }
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      setError('Falha ao acessar a API. Verifique suas configurações de conexão.');
      toast.error('Erro ao buscar itens. Verifique o console para detalhes.');
    } finally {
      setIsLoading(false);
    }
  };

  const configBeingEdited = editingConfigId 
    ? trackingConfigs.find(c => c.id === editingConfigId) 
    : undefined;

  return (
    <div className="container mx-auto p-4 pb-16 relative">
      <TrackerHeader 
        onCreateTracker={handleCreateTracker} 
        onConfigureApi={handleConfigureApi}
        apiConfigured={apiConfig.isConfigured}
      />
      
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
      
      <ApiConfigDialog 
        open={isApiConfigOpen}
        onOpenChange={setIsApiConfigOpen}
        apiConfig={apiConfig}
        onSaveConfig={handleSaveApiConfig}
      />
    </div>
  );
};

export default Index;

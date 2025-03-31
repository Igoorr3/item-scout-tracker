
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ApiCredentials } from '@/types/api';
import { InfoIcon, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ApiConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiConfig: ApiCredentials;
  onSaveConfig: (config: ApiCredentials) => void;
}

const ApiConfigDialog = ({ open, onOpenChange, apiConfig, onSaveConfig }: ApiConfigDialogProps) => {
  const [poesessid, setPoesessid] = useState(apiConfig.poesessid || '');
  const [cfClearanceValues, setCfClearanceValues] = useState<string[]>(
    apiConfig.cfClearance && apiConfig.cfClearance.length > 0 
      ? apiConfig.cfClearance 
      : ['']
  );
  const [useragent, setUseragent] = useState(apiConfig.useragent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  const [useProxy, setUseProxy] = useState(apiConfig.useProxy || false);
  const [directQuery, setDirectQuery] = useState(apiConfig.directQuery || false);
  const [forceSimulation, setForceSimulation] = useState(false); // Always start with false
  const [notifyGoodDeals, setNotifyGoodDeals] = useState(apiConfig.notifyGoodDeals ?? true);
  const [respectRateLimit, setRespectRateLimit] = useState(apiConfig.respectRateLimit ?? true);
  const [rateLimitDelay, setRateLimitDelay] = useState(apiConfig.rateLimitDelay || 2000);
  const [useBatchQuery, setUseBatchQuery] = useState(apiConfig.useBatchQuery ?? true);
  const [preferDirectLink, setPreferDirectLink] = useState(apiConfig.preferDirectLink ?? true);
  const [activeTab, setActiveTab] = useState('auth');

  const handleSave = () => {
    // Filtra valores vazios de cf_clearance
    const filteredCfClearance = cfClearanceValues.filter(value => value.trim().length > 0);
    
    onSaveConfig({
      poesessid,
      cfClearance: filteredCfClearance.length > 0 ? filteredCfClearance : [],
      useragent,
      isConfigured: Boolean(poesessid),
      useProxy,
      directQuery,
      forceSimulation: false, // Always false - No simulated data
      notifyGoodDeals,
      respectRateLimit,
      rateLimitDelay,
      useBatchQuery,
      preferDirectLink,
      customHeaders: true
    });
    onOpenChange(false);
  };

  const addCfClearanceField = () => {
    setCfClearanceValues([...cfClearanceValues, '']);
  };

  const removeCfClearanceField = (index: number) => {
    const newValues = [...cfClearanceValues];
    newValues.splice(index, 1);
    if (newValues.length === 0) {
      newValues.push(''); // Sempre manter pelo menos um campo
    }
    setCfClearanceValues(newValues);
  };

  const updateCfClearanceValue = (index: number, value: string) => {
    const newValues = [...cfClearanceValues];
    newValues[index] = value;
    setCfClearanceValues(newValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configurar Conexão com a API do PoE</DialogTitle>
          <DialogDescription>
            Insira os cookies necessários para acessar a API do Path of Exile 2.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="auth">Autenticação</TabsTrigger>
            <TabsTrigger value="options">Opções da API</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="auth">
            <Alert className="mb-4 bg-blue-500/10 border-blue-500/50">
              <InfoIcon className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm">
                Para obter seus cookies:
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Faça login no site oficial do <a href="https://www.pathofexile.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Path of Exile</a></li>
                  <li>Abra o <a href="https://www.pathofexile.com/trade2/search/poe2/Standard" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">site de trade do PoE2</a></li>
                  <li>Pressione F12 para abrir as ferramentas de desenvolvedor</li>
                  <li>Vá para a aba "Application" (ou "Aplicação")</li>
                  <li>No menu lateral, expanda "Cookies" e clique em "https://www.pathofexile.com"</li>
                  <li>Copie o valor do cookie "POESESSID" (clique duas vezes no valor para selecioná-lo)</li>
                  <li>Copie também o valor de todos os cookies "cf_clearance" que encontrar</li>
                  <li>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-500 text-xs flex items-center gap-1"
                      onClick={() => window.open('https://i.imgur.com/3XRUK4O.png', '_blank')}
                    >
                      Ver exemplo <ExternalLink className="h-3 w-3" />
                    </Button>
                  </li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="poesessid" className="text-right">
                  POESESSID
                </Label>
                <Input
                  id="poesessid"
                  placeholder="Valor do cookie POESESSID"
                  value={poesessid}
                  onChange={(e) => setPoesessid(e.target.value)}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  CF Clearance
                </Label>
                <div className="col-span-3 space-y-2">
                  {cfClearanceValues.map((value, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={`Valor ${index + 1} do cookie cf_clearance`}
                        value={value}
                        onChange={(e) => updateCfClearanceValue(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeCfClearanceField(index)}
                        className="text-destructive hover:text-destructive/90"
                        disabled={cfClearanceValues.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addCfClearanceField}
                    className="mt-1"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adicionar outro CF Clearance
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="useragent" className="text-right">
                  User-Agent
                </Label>
                <Input
                  id="useragent"
                  placeholder="Valor do User-Agent do navegador"
                  value={useragent}
                  onChange={(e) => setUseragent(e.target.value)}
                  className="col-span-3"
                />
              </div>

              <Alert className="col-span-4 bg-amber-500/10 border-amber-500/50">
                <InfoIcon className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  <p><strong>Dica importante:</strong> A API do PoE pode ser sensível a qualquer variação nos cookies. Se encontrar problemas:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Certifique-se de que você está logado no site oficial</li>
                    <li>Copie exatamente todos os valores sem espaços extras</li>
                    <li>Tente ativar a opção "Usar Proxy" nas opções avançadas</li>
                    <li>Se ainda não funcionar, tente limpar os cookies do seu navegador e fazer login novamente</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          <TabsContent value="options">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="use-proxy" className="text-right">
                  Usar Proxy
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch 
                    id="use-proxy" 
                    checked={useProxy}
                    onCheckedChange={setUseProxy}
                  />
                  <Label htmlFor="use-proxy" className="text-sm text-muted-foreground">
                    Ative se estiver tendo problemas de CORS ou bloqueio de requisições
                  </Label>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="direct-query" className="text-right">
                  Consulta Direta
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch 
                    id="direct-query" 
                    checked={directQuery}
                    onCheckedChange={setDirectQuery}
                  />
                  <Label htmlFor="direct-query" className="text-sm text-muted-foreground">
                    Tenta extrair dados diretamente da página de busca (como no site)
                  </Label>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notify-deals" className="text-right">
                  Notificar Ofertas
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch 
                    id="notify-deals" 
                    checked={notifyGoodDeals}
                    onCheckedChange={setNotifyGoodDeals}
                  />
                  <Label htmlFor="notify-deals" className="text-sm text-muted-foreground">
                    Destaca e notifica sobre itens com preços abaixo da média
                  </Label>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="batch-query" className="text-right">
                  Consulta em Lote
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch 
                    id="batch-query" 
                    checked={useBatchQuery}
                    onCheckedChange={setUseBatchQuery}
                  />
                  <Label htmlFor="batch-query" className="text-sm text-muted-foreground">
                    Buscar 10 itens de cada vez (formato da API oficial)
                  </Label>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="direct-link" className="text-right">
                  Links Diretos
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch 
                    id="direct-link" 
                    checked={preferDirectLink}
                    onCheckedChange={setPreferDirectLink}
                  />
                  <Label htmlFor="direct-link" className="text-sm text-muted-foreground">
                    Usar links diretos para o site de trade quando disponíveis
                  </Label>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="respect-rate-limit" className="text-right">
                  Controle de Taxa
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch 
                    id="respect-rate-limit" 
                    checked={respectRateLimit}
                    onCheckedChange={setRespectRateLimit}
                  />
                  <Label htmlFor="respect-rate-limit" className="text-sm text-muted-foreground">
                    Aguardar entre requisições para evitar bloqueios da API
                  </Label>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rate-limit-delay" className="text-right">
                  Delay (ms)
                </Label>
                <Input
                  id="rate-limit-delay"
                  type="number"
                  value={rateLimitDelay}
                  onChange={(e) => setRateLimitDelay(Number(e.target.value))}
                  className="col-span-3"
                  min={500}
                  max={10000}
                  step={500}
                  disabled={!respectRateLimit}
                />
                <div className="col-span-3 col-start-2">
                  <p className="text-xs text-muted-foreground">
                    Tempo de espera entre requisições. Recomendado: 2000ms (2 segundos)
                  </p>
                </div>
              </div>
              
              <Alert className="col-span-4 bg-amber-500/10 border-amber-500/50 mt-4">
                <InfoIcon className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  <p>Configurações avançadas que podem ajudar caso você esteja enfrentando bloqueios do Cloudflare:</p>
                  <ol className="list-decimal ml-5 mt-2 text-xs space-y-1">
                    <li>Ative o "Controle de Taxa" e aumente o delay para 3000ms (3 segundos)</li>
                    <li>Ative a opção "Usar Proxy" na aba "Opções da API"</li>
                    <li>Se o problema persistir, abra o Debug API para mais informações detalhadas</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Salvar Configuração</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiConfigDialog;

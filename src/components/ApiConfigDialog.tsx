
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ApiCredentials } from '@/types/api';
import { X, Check, Cookie, RefreshCcw, Code } from 'lucide-react';
import { parseCurlCommand, extractCredentialsFromCurl } from '@/utils/curlParser';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ApiConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiConfig: ApiCredentials;
  onSaveConfig: (config: ApiCredentials) => void;
}

const ApiConfigDialog = ({ open, onOpenChange, apiConfig, onSaveConfig }: ApiConfigDialogProps) => {
  const [poesessid, setPoesessid] = useState(apiConfig.poesessid || '');
  const [cfClearance, setCfClearance] = useState<string>(apiConfig.cfClearance?.join('\n') || '');
  const [useragent, setUseragent] = useState(apiConfig.useragent || '');
  const [useProxy, setUseProxy] = useState(apiConfig.useProxy || false);
  const [bypassCloudflare, setBypassCloudflare] = useState(apiConfig.bypassCloudflare || false);
  const [respectRateLimit, setRespectRateLimit] = useState(apiConfig.respectRateLimit || false);
  const [rateLimitDelay, setRateLimitDelay] = useState(apiConfig.rateLimitDelay || 2000);
  const [directQuery, setDirectQuery] = useState(apiConfig.directQuery || false);
  const [curlCommand, setCurlCommand] = useState('');
  const [activeTab, setActiveTab] = useState<string>('curl');

  const handleSave = () => {
    const cfClearanceArray = cfClearance
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    
    const config: ApiCredentials = {
      poesessid,
      cfClearance: cfClearanceArray,
      useragent,
      isConfigured: Boolean(poesessid || cfClearanceArray.length > 0),
      useProxy,
      bypassCloudflare,
      respectRateLimit,
      rateLimitDelay,
      directQuery,
      customHeaders: true
    };
    
    onSaveConfig(config);
    onOpenChange(false);
  };
  
  const handlePasteCurl = async () => {
    try {
      let text = curlCommand;
      
      // Tenta acessar a área de transferência se o campo estiver vazio
      if (!text) {
        try {
          text = await navigator.clipboard.readText();
          setCurlCommand(text);
        } catch (err) {
          toast.error("Não foi possível acessar a área de transferência", {
            description: "Cole o comando cURL manualmente no campo"
          });
          return;
        }
      }
      
      if (!text.toLowerCase().includes('curl ')) {
        toast.error("O texto não parece ser um comando cURL válido", {
          description: "Certifique-se de copiar todo o comando, começando com 'curl'"
        });
        return;
      }
      
      const parsed = parseCurlCommand(text);
      console.log("cURL parseado:", parsed);
      
      const credentials = extractCredentialsFromCurl(parsed);
      console.log("Credenciais extraídas:", credentials);
      
      if (credentials.poesessid) {
        setPoesessid(credentials.poesessid);
        toast.success("POESESSID extraído com sucesso");
      }
      
      if (credentials.cfClearance && credentials.cfClearance.length > 0) {
        setCfClearance(credentials.cfClearance.join('\n'));
        toast.success("cf_clearance extraído com sucesso");
      }
      
      if (credentials.useragent) {
        setUseragent(credentials.useragent);
        toast.success("User-Agent extraído com sucesso");
      }
      
      // Cria evento para notificar que as credenciais foram extraídas
      const event = new CustomEvent("curl-credentials-extracted", {
        detail: credentials
      });
      document.dispatchEvent(event);
      
      setActiveTab('manual');
    } catch (error) {
      console.error("Erro ao processar comando cURL:", error);
      toast.error("Não foi possível processar o comando cURL", {
        description: "Verifique se o formato está correto e tente novamente"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Configurar Conexão com a API</DialogTitle>
          <DialogDescription>
            Configure suas credenciais para acessar a API do Path of Exile
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="curl">
              <div className="flex items-center">
                <Code className="mr-2 h-4 w-4" />
                cURL (Recomendado)
              </div>
            </TabsTrigger>
            <TabsTrigger value="manual">
              <div className="flex items-center">
                <Cookie className="mr-2 h-4 w-4" />
                Manual
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="curl" className="space-y-4">
            <div>
              <Label htmlFor="curl-command" className="mb-1 block">
                Cole o comando cURL da API do Path of Exile
              </Label>
              <div className="space-y-2">
                <Textarea 
                  id="curl-command"
                  placeholder="curl 'https://www.pathofexile.com/api/...' -H 'Cookie: POESESSID=xyz; cf_clearance=abc' -H 'User-Agent: ...'"
                  value={curlCommand}
                  onChange={(e) => setCurlCommand(e.target.value)}
                  className="font-mono text-xs h-32"
                />
                <div className="text-sm text-muted-foreground">
                  <p>Como obter o comando cURL:</p>
                  <ol className="list-decimal ml-5 space-y-1">
                    <li>Acesse o site do Path of Exile e faça login</li>
                    <li>Abra as ferramentas de desenvolvedor (F12)</li>
                    <li>Vá para a aba Network (Rede)</li>
                    <li>Faça uma busca no site de trade do PoE</li>
                    <li>Clique com botão direito na requisição para a API</li>
                    <li>Selecione "Copy" &gt; "Copy as cURL" (bash)</li>
                  </ol>
                </div>
                <Button onClick={handlePasteCurl} className="w-full">
                  Extrair credenciais do cURL
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <div>
              <Label htmlFor="poesessid" className="mb-1 block">POESESSID</Label>
              <Input 
                id="poesessid" 
                value={poesessid} 
                onChange={(e) => setPoesessid(e.target.value)} 
                placeholder="5e80b25f8354e83105ef75a95b35d687"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Encontrado nos cookies após fazer login no site do Path of Exile
              </p>
            </div>
            
            <div>
              <Label htmlFor="cf-clearance" className="mb-1 block">cf_clearance (um por linha)</Label>
              <Textarea 
                id="cf-clearance" 
                value={cfClearance} 
                onChange={(e) => setCfClearance(e.target.value)} 
                placeholder="abc123def456ghi789..."
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cookie de proteção do Cloudflare, necessário para acessar a API
              </p>
            </div>
            
            <div>
              <Label htmlFor="useragent" className="mb-1 block">User-Agent</Label>
              <Input 
                id="useragent" 
                value={useragent} 
                onChange={(e) => setUseragent(e.target.value)} 
                placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deve ser exatamente igual ao do seu navegador
              </p>
            </div>
            
            <div className="space-y-4 border border-gray-200 dark:border-gray-800 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="use-proxy" 
                  checked={useProxy}
                  onCheckedChange={setUseProxy}
                />
                <Label htmlFor="use-proxy">Usar proxy CORS (para contornar bloqueios)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="bypass-cloudflare" 
                  checked={bypassCloudflare}
                  onCheckedChange={setBypassCloudflare}
                />
                <Label htmlFor="bypass-cloudflare">Tentar contornar proteção Cloudflare</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="respect-rate-limit" 
                  checked={respectRateLimit}
                  onCheckedChange={setRespectRateLimit}
                />
                <Label htmlFor="respect-rate-limit">Respeitar limite de requisições</Label>
              </div>
              
              {respectRateLimit && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="rate-limit-delay" className="whitespace-nowrap">
                    Delay (ms):
                  </Label>
                  <Input 
                    id="rate-limit-delay" 
                    type="number" 
                    value={rateLimitDelay} 
                    onChange={(e) => setRateLimitDelay(Number(e.target.value))}
                    min={500}
                    max={10000}
                    step={500}
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="direct-query" 
                  checked={directQuery}
                  onCheckedChange={setDirectQuery}
                />
                <Label htmlFor="direct-query">Usar consulta direta quando possível</Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Check className="mr-2 h-4 w-4" /> Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiConfigDialog;


import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, X, Code } from 'lucide-react';
import { ApiCredentials } from '@/types/api';
import { parseCurlCommand, extractCredentialsFromCurl } from '@/utils/curlParser';
import { toast } from "sonner";

interface ApiConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiConfig: ApiCredentials;
  onSaveConfig: (config: ApiCredentials) => void;
}

const ApiConfigDialog = ({ open, onOpenChange, apiConfig, onSaveConfig }: ApiConfigDialogProps) => {
  const [curlCommand, setCurlCommand] = useState(apiConfig.fullCurlCommand || '');
  const [parsedCurlInfo, setParsedCurlInfo] = useState<any>(null);
  
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
      
      setParsedCurlInfo({
        ...credentials,
        fullCommand: text
      });
      
      if (credentials.poesessid) {
        toast.success("POESESSID extraído com sucesso");
      }
      
      if (credentials.cfClearance && credentials.cfClearance.length > 0) {
        toast.success("cf_clearance extraído com sucesso");
      }
      
      if (credentials.useragent) {
        toast.success("User-Agent extraído com sucesso");
      }
      
      if (credentials.exactHeaders && Object.keys(credentials.exactHeaders).length > 0) {
        toast.success(`${Object.keys(credentials.exactHeaders).length} headers extraídos com sucesso`);
      }
      
    } catch (error) {
      console.error("Erro ao processar comando cURL:", error);
      toast.error("Não foi possível processar o comando cURL", {
        description: "Verifique se o formato está correto e tente novamente"
      });
    }
  };

  const handleSave = () => {
    if (!parsedCurlInfo && !curlCommand) {
      toast.error("Nenhum comando cURL foi processado", {
        description: "Por favor, cole um comando cURL válido e clique em 'Analisar cURL'"
      });
      return;
    }
    
    // Se temos o curlCommand mas não o parsedCurlInfo, tente analisá-lo agora
    if (curlCommand && !parsedCurlInfo) {
      try {
        const parsed = parseCurlCommand(curlCommand);
        const credentials = extractCredentialsFromCurl(parsed);
        setParsedCurlInfo({
          ...credentials,
          fullCommand: curlCommand
        });
      } catch (error) {
        console.error("Erro ao processar comando cURL no salvamento:", error);
      }
    }
    
    // Atualiza as credenciais usando o parsedCurlInfo ou valores existentes
    const newCredentials: ApiCredentials = {
      poesessid: parsedCurlInfo?.poesessid || apiConfig.poesessid || '',
      cfClearance: parsedCurlInfo?.cfClearance || apiConfig.cfClearance || [],
      useragent: parsedCurlInfo?.useragent || apiConfig.useragent || '',
      isConfigured: true,
      fullCurlCommand: curlCommand,
      allCookies: parsedCurlInfo?.allCookies || apiConfig.allCookies,
      exactHeaders: parsedCurlInfo?.exactHeaders || apiConfig.exactHeaders,
      respectRateLimit: true,
      rateLimitDelay: 2000,
    };
    
    console.log("Salvando credenciais:", newCredentials);
    
    // Cria evento para notificar que as credenciais foram extraídas (para outros componentes)
    const event = new CustomEvent("curl-credentials-extracted", {
      detail: parsedCurlInfo || {
        fullCurlCommand: curlCommand,
        allCookies: apiConfig.allCookies,
        exactHeaders: apiConfig.exactHeaders,
        poesessid: apiConfig.poesessid,
        cfClearance: apiConfig.cfClearance,
        useragent: apiConfig.useragent
      }
    });
    document.dispatchEvent(event);
    
    onSaveConfig(newCredentials);
    onOpenChange(false);
    
    toast.success("Configuração da API salva com sucesso", {
      description: "Use o Debug API para testar a conexão com a API do Path of Exile"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Configurar Conexão com a API</DialogTitle>
          <DialogDescription>
            Cole o comando cURL da API do Path of Exile para conectar-se automaticamente
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <Alert className="bg-blue-500/10 border-blue-500/50">
            <Code className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm">
              <strong>Comando cURL:</strong> O jeito mais fácil de conectar à API do Path of Exile é usando um comando cURL copiado diretamente do seu navegador. Isso captura automaticamente todos os cookies e headers necessários.
            </AlertDescription>
          </Alert>
          
          <div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-sm mb-3">
              <p className="font-medium mb-1">🔴 Como obter o comando cURL (IMPORTANTE):</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Acesse o site oficial do <a href="https://www.pathofexile.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Path of Exile</a> e faça login</li>
                <li>Abra o <a href="https://www.pathofexile.com/trade2/search/poe2/Standard" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">site de trade do PoE2</a></li>
                <li>Pressione F12 para abrir as ferramentas de desenvolvedor</li>
                <li>Vá para a aba "Network" e faça uma busca de item qualquer (filtre por weapon por exemplo)</li>
                <li><strong>✅ Clique com o botão direito na requisição "Standard" (POST) que é mostrada na imagem</strong></li>
                <li>Selecione "Copy" &gt; "Copy as cURL (bash)"</li>
                <li>Cole o comando abaixo</li>
              </ol>
              <p className="mt-2 text-xs font-medium">É essa requisição POST que contém todos os cookies necessários para autenticação!</p>
            </div>
            
            <Textarea 
              value={curlCommand}
              onChange={(e) => setCurlCommand(e.target.value)}
              className="font-mono text-xs min-h-[150px]"
              placeholder="curl &quot;https://www.pathofexile.com/api/trade2/search/poe2/Standard&quot; -X POST -H &quot;User-Agent: Mozilla/5.0...&quot; -H &quot;Cookie: POESESSID=abc123; cf_clearance=xyz789...&quot;"
            />
            
            <div className="flex gap-2 mt-2">
              <Button 
                onClick={handlePasteCurl} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Analisar cURL
              </Button>
              
              <Button 
                onClick={async () => {
                  try {
                    const clipboardText = await navigator.clipboard.readText();
                    setCurlCommand(clipboardText);
                    toast.success("Comando colado da área de transferência");
                  } catch (err) {
                    toast.error("Não foi possível acessar a área de transferência");
                  }
                }}
                variant="outline"
                size="sm"
              >
                Colar da área de transferência
              </Button>
            </div>
          </div>
          
          {parsedCurlInfo && (
            <div className="mt-2 p-3 border border-green-200 dark:border-green-800 rounded-md bg-green-500/10 text-sm">
              <p className="font-medium mb-2">✅ Informações extraídas com sucesso:</p>
              <ul className="list-disc pl-5 space-y-1">
                {parsedCurlInfo.poesessid && <li>POESESSID: <span className="font-mono">{parsedCurlInfo.poesessid.substring(0, 8)}...</span></li>}
                {parsedCurlInfo.cfClearance?.length > 0 && <li>cf_clearance: <span className="font-mono">{parsedCurlInfo.cfClearance[0].substring(0, 8)}...</span></li>}
                {parsedCurlInfo.useragent && <li>User-Agent: <span className="font-mono">{parsedCurlInfo.useragent.substring(0, 20)}...</span></li>}
                {parsedCurlInfo.allCookies && <li>Cookies completos capturados</li>}
                {parsedCurlInfo.exactHeaders && Object.keys(parsedCurlInfo.exactHeaders).length > 0 && (
                  <li>Headers ({Object.keys(parsedCurlInfo.exactHeaders).length}): {Object.keys(parsedCurlInfo.exactHeaders).slice(0, 3).join(", ")}{Object.keys(parsedCurlInfo.exactHeaders).length > 3 ? "..." : ""}</li>
                )}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Check className="mr-2 h-4 w-4" /> Salvar Configurações
          </Button>
        </div>
        
        {!parsedCurlInfo && apiConfig.isConfigured && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aviso: Você não analisou um novo comando cURL. Salvar manterá as configurações anteriores.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApiConfigDialog;


import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles, AlertCircle, InfoIcon, Settings, Bug, FileSearch, Code } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ApiCredentials } from '@/types/api';

interface TrackerHeaderProps {
  onCreateTracker: () => void;
  onConfigureApi: () => void;
  apiConfigured: boolean;
  onToggleDebugMode: () => void;
  debugMode: boolean;
}

const TrackerHeader = ({ 
  onCreateTracker, 
  onConfigureApi, 
  apiConfigured, 
  onToggleDebugMode, 
  debugMode 
}: TrackerHeaderProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center">
            <Sparkles className="mr-2 h-8 w-8" />
            Item Scout Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Rastreie e analise itens do mercado do Path of Exile 2
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={onConfigureApi} 
            variant={apiConfigured ? "outline" : "secondary"}
            className="flex-shrink-0"
          >
            <Code className="mr-2 h-4 w-4" />
            {apiConfigured ? "Editar cURL" : "Configurar cURL"}
          </Button>
          
          <Button
            onClick={onToggleDebugMode}
            variant="outline"
            className={`flex-shrink-0 ${debugMode ? 'border-amber-500 text-amber-500' : ''}`}
          >
            <Bug className="mr-2 h-4 w-4" />
            {debugMode ? "Ocultar Debug" : "Debug API"}
          </Button>
          
          <Button 
            onClick={onCreateTracker} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Rastreador
          </Button>
        </div>
      </div>
      
      <Alert className={`border-${apiConfigured ? "blue" : "amber"}-500/50 bg-${apiConfigured ? "blue" : "amber"}-500/10`}>
        {apiConfigured ? (
          <>
            <InfoIcon className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm">
              <strong>API Configurada:</strong> Você está conectado à API do Path of Exile 2. 
              Seus rastreadores estão usando dados reais do mercado.
            </AlertDescription>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              <strong>Configure o comando cURL:</strong> Para usar dados reais, clique no botão "Configurar cURL" 
              acima e cole o comando cURL completo do site do Path of Exile 2.
              
              <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="instructions">
                  <AccordionTrigger className="text-sm py-2">Ver instruções detalhadas</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal pl-5 space-y-2 text-xs">
                      <li>Faça login no site oficial do <a href="https://www.pathofexile.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Path of Exile</a></li>
                      <li>Abra o <a href="https://www.pathofexile.com/trade2/search/poe2/Standard" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">site de trade do PoE2</a></li>
                      <li>Pressione F12 para abrir as ferramentas de desenvolvedor</li>
                      <li>Vá para a aba "Network" e faça uma busca no site</li>
                      <li><strong>IMPORTANTE:</strong> Clique com o botão direito na requisição <strong>POST</strong> chamada "Standard" e escolha "Copy as cURL (bash)"</li>
                      <li>Cole o comando cURL completo na interface de configuração</li>
                      <li>O comando cURL deve conter todos os cookies necessários (como cf_clearance e POESESSID)</li>
                      <li>Use o modo de Debug API para testar suas credenciais</li>
                      <li>Lembre-se: a API tem limitações no navegador. Considere usar um script Python para consultas frequentes</li>
                    </ol>
                    <div className="mt-4 p-2 bg-amber-500/20 rounded text-xs">
                      <p><strong>Nota sobre CORS:</strong> A API do PoE bloqueia requisições diretas de domínios diferentes (como este app). 
                      Nossa aplicação tenta usar proxies CORS públicos, mas eles podem nem sempre funcionar.
                      Se continuar com problemas, considere usar um script Python em seu computador local.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </AlertDescription>
          </>
        )}
      </Alert>
    </div>
  );
};

export default TrackerHeader;

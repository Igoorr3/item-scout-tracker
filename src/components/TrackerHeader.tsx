
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles, AlertCircle, InfoIcon, Settings } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ApiCredentials } from '@/types/api';

interface TrackerHeaderProps {
  onCreateTracker: () => void;
  onConfigureApi: () => void;
  apiConfigured: boolean;
}

const TrackerHeader = ({ onCreateTracker, onConfigureApi, apiConfigured }: TrackerHeaderProps) => {
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
            <Settings className="mr-2 h-4 w-4" />
            {apiConfigured ? "Editar Cookies" : "Configurar API"}
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
              <strong>Acesso à API do PoE2:</strong> Para usar dados reais, você precisa configurar seus cookies 
              de sessão clicando no botão "Configurar API" acima.
              
              <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="instructions">
                  <AccordionTrigger className="text-sm py-2">Ver instruções detalhadas</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal pl-5 space-y-2 text-sm">
                      <li>Faça login no site oficial do <a href="https://www.pathofexile.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Path of Exile</a></li>
                      <li>Abra o <a href="https://www.pathofexile.com/trade2/search/poe2/Standard" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">site de trade do PoE2</a></li>
                      <li>Pressione F12 para abrir as ferramentas de desenvolvedor</li>
                      <li>Vá para a aba "Application" e encontre os cookies do site</li>
                      <li>Copie os valores de "POESESSID", "session_id" e "cf_clearance"</li>
                      <li>Cole esses valores no formulário de configuração da API</li>
                      <li>Respeite os limites de requisição para evitar bloqueios temporários</li>
                    </ol>
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

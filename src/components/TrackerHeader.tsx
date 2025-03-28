
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles, AlertCircle, InfoIcon } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface TrackerHeaderProps {
  onCreateTracker: () => void;
}

const TrackerHeader = ({ onCreateTracker }: TrackerHeaderProps) => {
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
        
        <Button 
          onClick={onCreateTracker} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Rastreador
        </Button>
      </div>
      
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <InfoIcon className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-sm">
          <strong>Acesso à API do PoE2:</strong> Para usar dados reais, você precisa estar logado no site 
          do Path of Exile 2 no seu navegador e ter os cookies de sessão ativos.
          
          <Accordion type="single" collapsible className="mt-2">
            <AccordionItem value="instructions">
              <AccordionTrigger className="text-sm py-2">Ver instruções detalhadas</AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Faça login no site oficial do <a href="https://www.pathofexile.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Path of Exile</a></li>
                  <li>Abra o <a href="https://www.pathofexile.com/trade2/search/poe2/Standard" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">site de trade do PoE2</a></li>
                  <li>Mantenha a janela do trade aberta enquanto usa este aplicativo</li>
                  <li>Os rastreadores vão usar seus cookies de sessão para acessar a API</li>
                  <li>Respeite os limites de requisição para evitar bloqueios temporários (não faça mais de uma requisição a cada 2 segundos)</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TrackerHeader;

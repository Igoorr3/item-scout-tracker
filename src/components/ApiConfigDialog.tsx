
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiCredentials } from '@/types/api';
import { InfoIcon, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  const handleSave = () => {
    // Filtra valores vazios de cf_clearance
    const filteredCfClearance = cfClearanceValues.filter(value => value.trim().length > 0);
    
    onSaveConfig({
      poesessid,
      cfClearance: filteredCfClearance.length > 0 ? filteredCfClearance : undefined,
      useragent,
      isConfigured: Boolean(poesessid)
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

        <Alert className="mb-4 bg-blue-500/10 border-blue-500/50">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm">
            Para obter seus cookies:
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Faça login no site oficial do <a href="https://www.pathofexile.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Path of Exile</a></li>
              <li>Abra o <a href="https://www.pathofexile.com/trade2/search/poe2/Standard" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">site de trade do PoE2</a></li>
              <li>Pressione F12 para abrir as ferramentas de desenvolvedor</li>
              <li>Vá para a aba "Application" (ou "Armazenamento")</li>
              <li>Expanda "Cookies" no menu lateral e selecione o site do Path of Exile</li>
              <li>Copie o valor dos cookies "POESESSID" e <strong>todos</strong> os valores "cf_clearance" (pode haver mais de um)</li>
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
        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Salvar Configuração</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiConfigDialog;


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiCredentials } from '@/types/api';
import { InfoIcon } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiConfig: ApiCredentials;
  onSaveConfig: (config: ApiCredentials) => void;
}

const ApiConfigDialog = ({ open, onOpenChange, apiConfig, onSaveConfig }: ApiConfigDialogProps) => {
  const [poesessid, setPoesessid] = useState(apiConfig.poesessid || '');
  const [cfClearance, setCfClearance] = useState(apiConfig.cfClearance || '');

  const handleSave = () => {
    onSaveConfig({
      poesessid,
      cfClearance,
      isConfigured: Boolean(poesessid)
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
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
              <li>Copie o valor dos cookies "POESESSID" e "cf_clearance" (este último é opcional)</li>
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cf-clearance" className="text-right">
              CF Clearance
            </Label>
            <Input
              id="cf-clearance"
              placeholder="Valor do cookie cf_clearance (opcional)"
              value={cfClearance}
              onChange={(e) => setCfClearance(e.target.value)}
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

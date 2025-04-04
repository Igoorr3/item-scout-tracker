import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const PythonIntegration = () => {
  const [pythonPath, setPythonPath] = useState('python');
  const [scriptContent, setScriptContent] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [configVisible, setConfigVisible] = useState(false);
  const [pythonCode, setPythonCode] = useState('');

  const handleRunScript = async () => {
    setIsLoading(true);
    setOutput("Executando script Python...\n");

    try {
      // Esta é apenas uma simulação, em um ambiente real, 
      // você precisaria de um backend que execute o script Python
      setOutput(prev => prev + "\nSimulação de execução de script Python.\n");
      setOutput(prev => prev + "Na implementação real, isso chamaria um endpoint da API que executa o script.\n");
      
      toast.info("Abordagem recomendada", {
        description: "Para executar código Python, é recomendado criar uma API Python (como Flask ou FastAPI) e chamá-la do frontend."
      });

      // Em um ambiente real, você chamaria algo como:
      // const response = await fetch('/api/run-python', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ script: scriptContent })
      // });
      // const data = await response.json();
      // setOutput(data.output);
      
    } catch (error) {
      console.error("Erro ao executar script:", error);
      setOutput(prev => prev + `\nErro: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      toast.error("Erro ao executar o script");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowPythonConfig = () => {
    setConfigVisible(!configVisible);
    if (!configVisible) {
      setPythonCode(`
import requests
import json
import time
import os
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import threading
import configparser
import re
from datetime import datetime, timezone
import traceback
import math
import uuid

# -- Constantes --
CONFIG_FILE = 'poe2_config.ini'
STAT_MAP = {
    "Maximum Life": "explicit.stat_3299347043",
    "Increased Life": "explicit.stat_1671376347",
    "Maximum Mana": "explicit.stat_1050105434",
    "Fire Resistance": "explicit.stat_3372524247",
    "Cold Resistance": "explicit.stat_3642289083",
    "Lightning Resistance": "explicit.stat_1010850144",
    "Chaos Resistance": "explicit.stat_3795704793",
    # Outras estatísticas...
}

# -- Classe Principal --
class PoeTracker:
    def __init__(self, root):
        self.root = root
        self.root.title("Path of Exile 2 - Item Tracker")
        # ... restante do código Python ...

# -- Inicialização --
if __name__ == "__main__":
    root = tk.Tk()
    app = PoeTracker(root)
    root.mainloop()
      `);
    }
  };

  const handleSaveScript = () => {
    if (!scriptContent.trim()) {
      toast.error("O conteúdo do script está vazio");
      return;
    }
    
    try {
      // Cria um blob com o conteúdo do script
      const blob = new Blob([scriptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Cria um link para download e clica nele
      const a = document.createElement('a');
      a.href = url;
      a.download = 'poe2_tracker.py';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      toast.success("Script salvo como arquivo");
    } catch (error) {
      console.error("Erro ao salvar script:", error);
      toast.error("Erro ao salvar o script");
    }
  };

  const handleImportScript = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setScriptContent(content);
        toast.success("Script importado com sucesso");
      }
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo");
    };
    reader.readAsText(file);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 448 512" 
            className="h-6 w-6 mr-2"
            fill="currentColor"
          >
            <path d="M439.8 200.5c-7.7-30.9-22.3-54.2-53.4-54.2h-40.1v47.4c0 36.8-31.2 67.8-66.8 67.8H172.7c-29.2 0-53.4 25-53.4 54.3v101.8c0 29 25.2 46 53.4 54.3 33.8 9.9 66.3 11.7 106.8 0 26.9-7.8 53.4-23.5 53.4-54.3v-40.7H226.2v-13.6h160.2c31.1 0 42.6-21.7 53.4-54.2 11.2-33.5 10.7-65.7 0-108.6zM286.2 404c11.1 0 20.1 9.1 20.1 20.3 0 11.3-9 20.4-20.1 20.4-11 0-20.1-9.2-20.1-20.4.1-11.3 9.1-20.3 20.1-20.3zM167.8 248.1h106.8c29.7 0 53.4-24.5 53.4-54.3V91.9c0-29-24.4-50.7-53.4-55.6-35.8-5.9-74.7-5.6-106.8.1-45.2 8-53.4 24.7-53.4 55.6v40.7h106.9v13.6h-147c-31.1 0-58.3 18.7-66.8 54.2-9.8 40.7-10.2 66.1 0 108.6 7.6 31.6 25.7 54.2 56.8 54.2H101v-48.8c0-35.3 30.5-66.4 66.8-66.4zm-6.7-142.6c-11.1 0-20.1-9.1-20.1-20.3.1-11.3 9-20.4 20.1-20.4 11 0 20.1 9.2 20.1 20.4s-9 20.3-20.1 20.3z"/>
          </svg>
          Integração Python
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 bg-amber-500/10 border-amber-500/50">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm">
            Esta funcionalidade permite utilizar o script Python de Path of Exile 2 que você já tem funcionando.
            O script será executado em um servidor Python (backend) e os resultados serão exibidos aqui.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label htmlFor="script-content">Script Python</Label>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowPythonConfig}
                >
                  {configVisible ? "Ocultar exemplo" : "Ver exemplo"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveScript}
                >
                  Salvar script
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('import-script')?.click()}
                >
                  Importar script
                </Button>
                <input
                  type="file"
                  id="import-script"
                  className="hidden"
                  accept=".py"
                  onChange={handleImportScript}
                />
              </div>
            </div>
            <Textarea
              id="script-content"
              className="min-h-[200px] font-mono text-sm"
              placeholder="# Cole seu script Python aqui"
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
            />
          </div>

          {configVisible && (
            <div className="border border-border p-4 rounded-lg mt-2">
              <h3 className="font-medium mb-2">Exemplo de código Python</h3>
              <Textarea
                className="min-h-[150px] font-mono text-xs"
                value={pythonCode}
                readOnly
              />
              <p className="text-sm text-muted-foreground mt-2">
                Este é um exemplo simplificado. Seu script completo deve conter toda a lógica necessária para buscar itens no Path of Exile 2.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="python-path" className="mb-2 block">Configuração do Python</Label>
            <div className="flex gap-2">
              <Input
                id="python-path"
                placeholder="Caminho do executável Python (ex: python, python3)"
                value={pythonPath}
                onChange={(e) => setPythonPath(e.target.value)}
              />
              <Button onClick={handleRunScript} disabled={isLoading || !scriptContent.trim()}>
                {isLoading ? "Executando..." : "Executar script"}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="output" className="mb-2 block">Saída do script</Label>
            <Textarea
              id="output"
              className="min-h-[200px] font-mono text-sm bg-muted"
              readOnly
              value={output}
            />
          </div>

          <Alert className="mt-2">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Para utilizar esta integração completamente, você precisa de um servidor Python rodando (como Flask ou FastAPI) que execute o script e retorne os resultados. Consulte a documentação para mais informações.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default PythonIntegration;


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle, ChevronLeft, Download, Upload, Play, FileCode, Save } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { POE2_PYTHON_EXAMPLE } from "@/utils/pythonExample";

const PythonIntegration = () => {
  const [pythonPath, setPythonPath] = useState('python');
  const [scriptContent, setScriptContent] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [configVisible, setConfigVisible] = useState(false);
  const [pythonCode, setPythonCode] = useState('');

  // Carregar o exemplo completo de código Python ao montar o componente
  useEffect(() => {
    setScriptContent(POE2_PYTHON_EXAMPLE);
  }, []);

  const handleRunScript = async () => {
    setIsLoading(true);
    setOutput("Executando script Python...\n");

    try {
      // Esta é apenas uma simulação, em um ambiente real, 
      // você precisaria de um backend que execute o script Python
      setOutput(prev => prev + "\nSimulação de execução de script Python.\n");
      setOutput(prev => prev + "Na implementação real, isso chamaria um endpoint da API que executa o script.\n");
      setOutput(prev => prev + "\nO arquivo poe2_config.ini será criado na mesma pasta do script para armazenar cookies e configurações.\n");
      
      toast.info("Abordagem recomendada", {
        description: "Para executar código Python, é recomendado criar uma API Python (como Flask ou FastAPI) e chamá-la do frontend."
      });
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
# Exemplo simplificado da estrutura do arquivo poe2_config.ini
# que será gerado pelo script Python:

[Authentication]
poesessid = seu_poesessid_aqui
cf_clearance = seu_cf_clearance_aqui
useragent = Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36

[Preferences]
DarkMode = False

# O arquivo .ini será criado automaticamente na
# primeira vez que você salvar a configuração.
# Ele é armazenado no mesmo diretório do script Python.
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
      a.download = 'poe2_item_tracker.py';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      toast.success("Script salvo como 'poe2_item_tracker.py'");
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
    <>
      <div className="mb-6">
        <Button 
          variant="default" 
          size="lg" 
          className="flex items-center gap-2"
          asChild
        >
          <Link to="/">
            <ChevronLeft className="h-5 w-5" />
            Voltar para o Rastreador Principal
          </Link>
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-2xl flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 448 512" 
              className="h-6 w-6 mr-2"
              fill="currentColor"
            >
              <path d="M439.8 200.5c-7.7-30.9-22.3-54.2-53.4-54.2h-40.1v47.4c0 36.8-31.2 67.8-66.8 67.8H172.7c-29.2 0-53.4 25-53.4 54.3v101.8c0 29 25.2 46 53.4 54.3 33.8 9.9 66.3 11.7 106.8 0 26.9-7.8 53.4-23.5 53.4-54.3v-40.7H226.2v-13.6h160.2c31.1 0 42.6-21.7 53.4-54.2 11.2-33.5 10.7-65.7 0-108.6zM286.2 404c11.1 0 20.1 9.1 20.1 20.3 0 11.3-9 20.4-20.1 20.4-11 0-20.1-9.2-20.1-20.4.1-11.3 9.1-20.3 20.1-20.3zM167.8 248.1h106.8c29.7 0 53.4-24.5 53.4-54.3V91.9c0-29-24.4-50.7-53.4-55.6-35.8-5.9-74.7-5.6-106.8.1-45.2 8-53.4 24.7-53.4 55.6v40.7h106.9v13.6h-147c-31.1 0-58.3 18.7-66.8 54.2-9.8 40.7-10.2 66.1 0 108.6 7.6 31.6 25.7 54.2 56.8 54.2H101v-48.8c0-35.3 30.5-66.4 66.8-66.4zm-6.7-142.6c-11.1 0-20.1-9.1-20.1-20.3.1-11.3 9-20.4 20.1-20.4 11 0 20.1 9.2 20.1 20.4s-9 20.3-20.1 20.3z"/>
            </svg>
            Integração Python - Path of Exile 2 - Item Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Alert className="mb-6 bg-amber-500/10 border-amber-500/50">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertDescription className="text-base">
              <p className="font-medium mb-2">Rastreador PoE2 com Suporte a Múltiplas Abas</p>
              <p>Este é um aplicativo Python completo para rastrear itens do Path of Exile 2. Você pode salvar o código abaixo como <strong>poe2_item_tracker.py</strong> e executá-lo em seu computador. Os cookies e configurações são armazenados automaticamente no arquivo <strong>poe2_config.ini</strong> no mesmo diretório do script.</p>
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-blue-500" />
                  <Label htmlFor="script-content" className="text-lg font-medium">
                    Script Python - Rastreador PoE2
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowPythonConfig}
                    className="flex items-center gap-1"
                  >
                    <Info className="h-4 w-4" />
                    {configVisible ? "Ocultar exemplo" : "Ver exemplo do config.ini"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveScript}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" />
                    Salvar script
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('import-script')?.click()}
                    className="flex items-center gap-1"
                  >
                    <Upload className="h-4 w-4" />
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
                className="min-h-[400px] font-mono text-sm"
                placeholder="# O código do script Python será carregado automaticamente"
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
              />

              {configVisible && (
                <div className="border border-border p-4 rounded-lg mt-2 bg-muted/30">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    Exemplo do arquivo poe2_config.ini
                  </h3>
                  <Textarea
                    className="min-h-[150px] font-mono text-xs"
                    value={pythonCode}
                    readOnly
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Este arquivo <strong>poe2_config.ini</strong> será criado automaticamente pelo script Python na primeira vez que você salvar as configurações. Ele armazena os cookies de autenticação, preferências de tema e outras configurações.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="python-path" className="mb-2 block font-medium">Configuração para Execução</Label>
                <div className="flex gap-2">
                  <Input
                    id="python-path"
                    placeholder="Caminho do executável Python (ex: python, python3)"
                    value={pythonPath}
                    onChange={(e) => setPythonPath(e.target.value)}
                  />
                  <Button 
                    onClick={handleRunScript} 
                    disabled={isLoading || !scriptContent.trim()}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {isLoading ? "Executando..." : "Executar script"}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="download" className="mb-2 block font-medium">Baixar e Executar</Label>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveScript} 
                    className="flex-1 flex items-center gap-2"
                    variant="default"
                  >
                    <Download className="h-4 w-4" />
                    Baixar script Python
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Após baixar, execute com: <code>python poe2_item_tracker.py</code>
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="output" className="mb-2 block font-medium">Saída do script</Label>
              <Textarea
                id="output"
                className="min-h-[120px] font-mono text-sm bg-muted"
                readOnly
                value={output || "A saída do script será exibida aqui quando executado."}
              />
            </div>

            <Alert className="mt-2">
              <Info className="h-5 w-5" />
              <AlertDescription className="text-sm">
                <p><strong>Instruções:</strong></p>
                <ol className="list-decimal pl-5 space-y-1 mt-2">
                  <li>Baixe o script clicando no botão "Baixar script Python"</li>
                  <li>Salve-o como <code>poe2_item_tracker.py</code></li>
                  <li>Execute-o com <code>python poe2_item_tracker.py</code></li>
                  <li>Na primeira execução, você precisará configurar seus cookies na aba "Configuração"</li>
                  <li>O arquivo <code>poe2_config.ini</code> será criado automaticamente no mesmo diretório</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default PythonIntegration;

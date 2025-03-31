
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiCredentials, ApiDebugInfo } from '@/types/api';
import { InfoIcon, AlertCircle, Bug, Copy, Check, ExternalLink, Download } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ApiDebuggerProps {
  apiCredentials: ApiCredentials;
}

const ApiDebugger = ({ apiCredentials }: ApiDebuggerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchUrl, setSearchUrl] = useState('https://www.pathofexile.com/api/trade2/search/poe2/Standard');
  const [searchPayload, setSearchPayload] = useState(JSON.stringify({
    query: {
      status: { option: "online" },
      stats: [{
        type: "and",
        filters: []
      }],
      filters: {
        type_filters: {
          filters: { category: { option: "weapon.warstaff" } }
        }
      }
    },
    sort: { price: "asc" }
  }, null, 2));
  const [fetchUrl, setFetchUrl] = useState('');
  const [searchResponse, setSearchResponse] = useState('');
  const [fetchResponse, setFetchResponse] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('payload');
  const [queryId, setQueryId] = useState('');
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [useDirectQuery, setUseDirectQuery] = useState(false);
  const [copied, setCopied] = useState(false);
  const [debugInfo, setDebugInfo] = useState<ApiDebugInfo>({});
  const [respectRateLimit, setRespectRateLimit] = useState(true);
  const [rateLimitDelay, setRateLimitDelay] = useState(2000);
  const [bypassCloudflare, setBypassCloudflare] = useState(false);
  const [customOrigin, setCustomOrigin] = useState('https://www.pathofexile.com');
  const [customReferrer, setCustomReferrer] = useState('https://www.pathofexile.com/trade2/search/poe2/Standard');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const buildCookieString = (): string => {
    let cookieString = '';
    
    if (apiCredentials.poesessid) {
      cookieString += `POESESSID=${apiCredentials.poesessid}; `;
    }
    
    if (apiCredentials.cfClearance && apiCredentials.cfClearance.length > 0) {
      apiCredentials.cfClearance.forEach(clearance => {
        if (clearance && clearance.trim()) {
          cookieString += `cf_clearance=${clearance}; `;
        }
      });
    }
    
    return cookieString.trim();
  };

  const buildHeaders = (isSearchRequest: boolean = false): Record<string, string> => {
    const headers: Record<string, string> = {
      "User-Agent": apiCredentials.useragent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      "Accept": "application/json",
      "Origin": customOrigin,
      "Referer": customReferrer,
      "Connection": "keep-alive",
      "sec-ch-ua": '"Chromium";v="120", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    };

    if (isSearchRequest) {
      headers["Content-Type"] = "application/json";
    }

    const cookieString = buildCookieString();
    if (cookieString) {
      headers["Cookie"] = cookieString;
    }
    
    // Add special headers to help bypass Cloudflare if enabled
    if (bypassCloudflare) {
      headers["Accept-Language"] = "en-US,en;q=0.9";
      headers["Accept-Encoding"] = "gzip, deflate, br";
      headers["X-Requested-With"] = "XMLHttpRequest";
    }

    return headers;
  };

  useEffect(() => {
    if (queryId) {
      const directQueryUrl = `https://www.pathofexile.com/trade2/search/poe2/${queryId}`;
      console.log("Direct query URL generated:", directQueryUrl);
    }
  }, [queryId]);

  const handleSearchRequest = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSearchResponse('');
    setFetchResponse('');
    setQueryId('');
    setItemIds([]);
    
    const startTime = new Date().toISOString();
    setDebugInfo({
      ...debugInfo,
      requestTimestamp: startTime,
      requestUrl: searchUrl,
      requestPayload: JSON.parse(searchPayload),
      requestMethod: "POST",
      headers: buildHeaders(true)
    });
    
    try {
      let response;
      const headers = buildHeaders(true);
      
      try {
        console.log("Making direct search request with headers:", headers);
        console.log("Search payload:", searchPayload);
        
        response = await fetch(searchUrl, {
          method: "POST",
          headers,
          body: searchPayload,
          mode: "cors",
          credentials: "include",
          cache: "no-cache"
        });
      } catch (directError) {
        console.error("Direct request failed:", directError);
        
        const CORS_PROXIES = [
          'https://corsproxy.io/?',
          'https://api.allorigins.win/raw?url='
        ];
        
        let proxyError;
        for (const proxy of CORS_PROXIES) {
          try {
            console.log(`Trying with proxy: ${proxy}`);
            const proxyUrl = proxy + encodeURIComponent(searchUrl);
            response = await fetch(proxyUrl, {
              method: "POST",
              headers: {
                ...headers,
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: searchPayload,
              cache: "no-cache"
            });
            break;
          } catch (error) {
            console.error(`Failed with proxy ${proxy}:`, error);
            proxyError = error;
          }
        }
        
        if (!response) {
          throw proxyError || new Error("All proxy attempts failed");
        }
      }
      
      setDebugInfo(prev => ({
        ...prev,
        statusCode: response.status
      }));
      
      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 429) {
          setDebugInfo(prev => ({
            ...prev,
            rateLimited: true
          }));
          throw new Error(`API Rate limit reached. Please wait before trying again. Status: ${response.status}`);
        }
        
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
          setDebugInfo(prev => ({
            ...prev,
            cloudflareBlocked: true,
            error: "Cloudflare proteção detectada"
          }));
          
          // Extract Cloudflare Ray ID if possible
          const rayIdMatch = errorText.match(/Ray ID:\s*<strong[^>]*>([^<]+)<\/strong>/);
          if (rayIdMatch && rayIdMatch[1]) {
            setDebugInfo(prev => ({
              ...prev,
              error: `Cloudflare proteção detectada (Ray ID: ${rayIdMatch[1]})`
            }));
          }
          
          throw new Error(`Proteção Cloudflare detectada. É necessário usar cookies cf_clearance válidos.`);
        }
        
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setSearchResponse(JSON.stringify(data, null, 2));
      setDebugInfo({
        ...debugInfo,
        responseTimestamp: new Date().toISOString(),
        responseData: data,
        statusCode: response.status
      });
      
      if (data.id && data.result && data.result.length > 0) {
        setQueryId(data.id);
        setDebugInfo(prev => ({
          ...prev,
          queryId: data.id
        }));
        
        setItemIds(data.result.slice(0, 10));
        
        const fetchUrlBase = 'https://www.pathofexile.com/api/trade2/fetch/';
        const itemIdsStr = data.result.slice(0, 10).join(',');
        const newFetchUrl = `${fetchUrlBase}${itemIdsStr}?query=${data.id}&realm=poe2`;
        setFetchUrl(newFetchUrl);
        
        const directTradeUrl = `https://www.pathofexile.com/trade2/search/poe2/${data.id}`;
        console.log("Direct trade site URL:", directTradeUrl);
        setDebugInfo(prev => ({
          ...prev,
          queryString: directTradeUrl
        }));
        
        setActiveTab('fetch');
      }
    } catch (error) {
      console.error("Search request error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      setDebugInfo({
        ...debugInfo,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchRequest = async () => {
    if (!fetchUrl) {
      setErrorMessage("Fetch URL is empty. Run a search request first.");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setFetchResponse('');
    
    if (respectRateLimit && rateLimitDelay > 0) {
      toast.info(`Respeitando limite de requisições: aguardando ${rateLimitDelay/1000}s`);
      await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
    }
    
    try {
      let response;
      const headers = buildHeaders();
      
      setDebugInfo(prev => ({
        ...prev,
        requestUrl: fetchUrl,
        requestMethod: "GET",
        headers: headers
      }));
      
      try {
        console.log("Making direct fetch request with headers:", headers);
        response = await fetch(fetchUrl, {
          method: "GET",
          headers,
          mode: "cors",
          credentials: "include",
          cache: "no-cache"
        });
      } catch (directError) {
        console.error("Direct fetch request failed:", directError);
        
        const CORS_PROXIES = [
          'https://corsproxy.io/?',
          'https://api.allorigins.win/raw?url='
        ];
        
        let proxyError;
        for (const proxy of CORS_PROXIES) {
          try {
            console.log(`Trying fetch with proxy: ${proxy}`);
            const proxyUrl = proxy + encodeURIComponent(fetchUrl);
            response = await fetch(proxyUrl, {
              method: "GET",
              headers: {
                ...headers,
                'X-Requested-With': 'XMLHttpRequest'
              },
              cache: "no-cache"
            });
            break;
          } catch (error) {
            console.error(`Failed with proxy ${proxy}:`, error);
            proxyError = error;
          }
        }
        
        if (!response) {
          throw proxyError || new Error("All proxy attempts failed");
        }
      }
      
      setDebugInfo(prev => ({
        ...prev,
        statusCode: response.status
      }));
      
      if (!response.ok) {
        if (response.status === 429) {
          setDebugInfo(prev => ({
            ...prev,
            rateLimited: true
          }));
          throw new Error(`API Rate limit reached. Please wait before trying again. Status: ${response.status}`);
        }
        
        const errorText = await response.text();
        
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
          setDebugInfo(prev => ({
            ...prev,
            cloudflareBlocked: true,
            error: "Cloudflare proteção detectada"
          }));
          
          throw new Error(`Proteção Cloudflare detectada. É necessário usar cookies cf_clearance válidos.`);
        }
        
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setFetchResponse(JSON.stringify(data, null, 2));
      setDebugInfo(prev => ({
        ...prev,
        responseTimestamp: new Date().toISOString(),
        responseData: data
      }));
      setActiveTab('results');
    } catch (error) {
      console.error("Fetch request error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      setDebugInfo(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error"
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("URL copiada para a área de transferência");
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const downloadDebugInfo = () => {
    const data = {
      timestamp: new Date().toISOString(),
      apiCredentials: {
        poesessid: apiCredentials.poesessid ? "configured" : "not configured",
        cfClearance: apiCredentials.cfClearance?.map(c => c.substring(0, 5) + "...") || [],
        useragent: apiCredentials.useragent ? apiCredentials.useragent.substring(0, 20) + "..." : "default"
      },
      search: {
        url: searchUrl,
        payload: JSON.parse(searchPayload),
        response: searchResponse ? JSON.parse(searchResponse) : null
      },
      fetch: {
        url: fetchUrl,
        response: fetchResponse ? JSON.parse(fetchResponse) : null
      },
      debug: debugInfo,
      error: errorMessage,
      headers: buildHeaders(true)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poe-api-debug-${new Date().toISOString().split('.')[0].replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Arquivo de debug salvo", {
      description: "O arquivo pode ser usado para depuração ou compartilhado para obter ajuda"
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          API Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Alert className="mb-4 bg-amber-500/10 border-amber-500/50">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm">
            Este é um depurador para entender como a API do PoE2 funciona. Use-o para verificar se suas credenciais estão corretas e se as requisições estão sendo enviadas corretamente.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="direct-query" 
                checked={useDirectQuery}
                onCheckedChange={setUseDirectQuery}
              />
              <Label htmlFor="direct-query">Usar formato de consulta direta</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              O formato direto permite acessar os resultados no site oficial do PoE2
            </p>
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="respect-rate-limit" 
                checked={respectRateLimit}
                onCheckedChange={setRespectRateLimit}
              />
              <Label htmlFor="respect-rate-limit">Respeitar limite de requisições</Label>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Label htmlFor="rate-limit-delay" className="whitespace-nowrap text-xs">
                Delay (ms):
              </Label>
              <Input 
                id="rate-limit-delay" 
                type="number" 
                value={rateLimitDelay} 
                onChange={(e) => setRateLimitDelay(Number(e.target.value))}
                className="h-7 text-xs"
                min={500}
                max={10000}
                step={500}
                disabled={!respectRateLimit}
              />
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Switch 
              id="show-advanced" 
              checked={showAdvancedOptions}
              onCheckedChange={setShowAdvancedOptions}
            />
            <Label htmlFor="show-advanced">Mostrar opções avançadas</Label>
          </div>
          
          {showAdvancedOptions && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-md p-3 space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Switch 
                    id="bypass-cloudflare" 
                    checked={bypassCloudflare}
                    onCheckedChange={setBypassCloudflare}
                  />
                  <Label htmlFor="bypass-cloudflare">Tentar contornar Cloudflare</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adiciona cabeçalhos especiais que podem ajudar a contornar a proteção do Cloudflare
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="custom-origin" className="text-xs">Origin header personalizado</Label>
                  <Input 
                    id="custom-origin" 
                    value={customOrigin}
                    onChange={(e) => setCustomOrigin(e.target.value)}
                    className="text-xs"
                    placeholder="https://www.pathofexile.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="custom-referrer" className="text-xs">Referrer header personalizado</Label>
                  <Input 
                    id="custom-referrer" 
                    value={customReferrer}
                    onChange={(e) => setCustomReferrer(e.target.value)}
                    className="text-xs"
                    placeholder="https://www.pathofexile.com/trade2/search/poe2/Standard"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {queryId && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Link direto para busca no site oficial:</p>
              <a 
                href={`https://www.pathofexile.com/trade2/search/poe2/${queryId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-mono text-blue-500 hover:underline break-all flex items-center gap-1"
              >
                https://www.pathofexile.com/trade2/search/poe2/{queryId}
                <ExternalLink size={12} />
              </a>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="ml-2 flex-shrink-0"
              onClick={() => copyToClipboard(`https://www.pathofexile.com/trade2/search/poe2/${queryId}`)}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="payload">1. Payload</TabsTrigger>
            <TabsTrigger value="fetch">2. Fetch</TabsTrigger>
            <TabsTrigger value="results">3. Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payload" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Search URL:</label>
                <Input 
                  value={searchUrl} 
                  onChange={(e) => setSearchUrl(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Search Payload:</label>
                <Textarea 
                  value={searchPayload}
                  onChange={(e) => setSearchPayload(e.target.value)}
                  className="font-mono text-xs h-48"
                />
              </div>
              
              <Button 
                onClick={handleSearchRequest} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Executando..." : "Enviar Requisição de Busca"}
              </Button>
              
              {searchResponse && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Response:</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-xs h-48">
                    {searchResponse}
                  </pre>
                </div>
              )}
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="fetch" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Fetch URL:</label>
                <Input 
                  value={fetchUrl} 
                  onChange={(e) => setFetchUrl(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Exemplo: https://www.pathofexile.com/api/trade2/fetch/ID1,ID2,...?query=QUERY_ID&realm=poe2
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Query ID:</label>
                  <span className="text-sm font-mono text-muted-foreground">{queryId || "Nenhum"}</span>
                </div>
                
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Item IDs:</label>
                  <span className="text-sm font-mono text-muted-foreground">{itemIds.length} encontrados</span>
                </div>
                
                {itemIds.length > 0 && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-ids">
                      <AccordionTrigger className="text-sm py-1">Ver Item IDs</AccordionTrigger>
                      <AccordionContent>
                        <div className="bg-muted p-2 rounded-md overflow-auto text-xs max-h-24">
                          {itemIds.map((id, index) => (
                            <div key={index} className="mb-1 font-mono break-all">
                              {id}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
              
              <Button 
                onClick={handleFetchRequest} 
                disabled={isLoading || !fetchUrl}
                className="w-full"
              >
                {isLoading ? "Executando..." : "Enviar Requisição de Detalhes"}
              </Button>
              
              {fetchResponse && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Response:</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-xs h-48">
                    {fetchResponse}
                  </pre>
                </div>
              )}
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Alert className="bg-blue-500/10 border-blue-500/50">
                <InfoIcon className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm">
                  Esta aba mostra uma visualização formatada dos resultados obtidos da API.
                </AlertDescription>
              </Alert>
              
              {fetchResponse ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Itens Encontrados:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      try {
                        const data = JSON.parse(fetchResponse);
                        if (!data.result || !Array.isArray(data.result)) {
                          return <p>Nenhum item encontrado ou formato inválido.</p>;
                        }
                        
                        return data.result.map((item: any, index: number) => (
                          <Card key={index} className="overflow-hidden">
                            <CardHeader className="p-3 bg-muted/50">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span>{item.item.name || item.item.typeLine || "Item sem nome"}</span>
                                {item.item.icon && (
                                  <img 
                                    src={item.item.icon} 
                                    alt="Item icon" 
                                    className="w-6 h-6" 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 text-xs">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p><strong>ID:</strong> {item.id}</p>
                                  <p><strong>Preço:</strong> {item.listing.price?.amount} {item.listing.price?.currency}</p>
                                  <p><strong>Vendedor:</strong> {item.listing.account?.name}</p>
                                </div>
                                <div>
                                  <p><strong>Tipo:</strong> {item.item.typeLine}</p>
                                  <p><strong>Raridade:</strong> {item.item.rarity}</p>
                                  {item.item.ilvl && <p><strong>Item Level:</strong> {item.item.ilvl}</p>}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ));
                      } catch (error) {
                        return <p>Erro ao processar resultados: {String(error)}</p>;
                      }
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum resultado disponível ainda.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete os passos 1 e 2 para ver os resultados aqui.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <Accordion type="single" collapsible>
            <AccordionItem value="headers">
              <AccordionTrigger className="text-sm">Headers utilizados</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                  {JSON.stringify(buildHeaders(true), null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="url-format">
              <AccordionTrigger className="text-sm">Formato de URL e Query</AccordionTrigger>
              <AccordionContent className="text-xs space-y-2">
                <p>O Path of Exile Trade API trabalha com dois formatos de URL:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li><strong>API direta:</strong> https://www.pathofexile.com/api/trade2/search/poe2/Standard</li>
                  <li><strong>API via site:</strong> https://www.pathofexile.com/trade2/search/poe2/[QUERY_ID]</li>
                </ol>
                <p className="mt-2">Após uma busca bem-sucedida, você pode usar o query ID retornado para:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Acessar diretamente no site (segunda URL)</li>
                  <li>Buscar detalhes dos itens via API fetch</li>
                </ul>
                <p className="mt-2">Para detalhes do item, use o formato:</p>
                <p className="font-mono bg-muted p-1 rounded mt-1">https://www.pathofexile.com/api/trade2/fetch/ID1,ID2,...?query=QUERY_ID&realm=poe2</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="debugging-tools">
              <AccordionTrigger className="text-sm">Ferramentas de diagnóstico</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={downloadDebugInfo}
                    >
                      <Download className="mr-2 h-4 w-4" /> Salvar informações de debug
                    </Button>
                  </div>
                
                  <div>
                    <h4 className="font-medium mb-1">Para verificar se o POESESSID é válido:</h4>
                    <p className="text-xs">Tente acessar <a href="https://www.pathofexile.com/my-account" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">sua conta</a> em uma nova janela. Se conseguir acessar, o POESESSID está válido.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Para obter novos cookies cf_clearance:</h4>
                    <p className="text-xs">Abra as ferramentas de desenvolvedor (F12), vá para a aba Application {'>'} Storage {'>'} Cookies {'>'} www.pathofexile.com e copie os valores de cf_clearance.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Instruções baseadas no Reddit:</h4>
                    <p className="text-xs">De acordo com as dicas do Reddit, muitos usuários conseguem acessar a API usando o Python. Vale a pena comparar os headers enviados pelo Python com os daqui para ver as diferenças.</p>
                    <Alert className="mt-2 bg-muted/50 border">
                      <p className="text-xs">
                        Certifique-se de que está logado no site do Path of Exile e que resolveu qualquer desafio do Cloudflare antes de copiar os cookies. Você também pode tentar acessar o site em um navegador normal (fora do iframe) e depois copiar os cookies frescos.
                      </p>
                    </Alert>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Para comparar payloads:</h4>
                    <p className="text-xs">No site oficial, faça uma busca e inspecione a requisição "Standard" (POST). Compare o payload com o que está sendo usado aqui.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiDebugger;

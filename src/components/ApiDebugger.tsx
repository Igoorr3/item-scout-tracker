
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiCredentials } from '@/types/api';
import { InfoIcon, AlertCircle, Bug } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ApiDebuggerProps {
  apiCredentials: ApiCredentials;
}

const ApiDebugger = ({ apiCredentials }: ApiDebuggerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchUrl, setSearchUrl] = useState('https://www.pathofexile.com/api/trade2/search/poe2/Standard');
  const [searchPayload, setSearchPayload] = useState(JSON.stringify({
    query: {
      status: { option: "online" },
      filters: {
        type_filters: {
          filters: { category: { option: "Crossbow" } }
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

  // Build cookie string for HTTP headers
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

  // Build headers for API requests
  const buildHeaders = (isSearchRequest: boolean = false): Record<string, string> => {
    const headers: Record<string, string> = {
      "User-Agent": apiCredentials.useragent || 'Mozilla/5.0',
      "Accept": "application/json",
      "Origin": "https://www.pathofexile.com",
      "Referer": "https://www.pathofexile.com/trade2/search/poe2/Standard"
    };

    if (isSearchRequest) {
      headers["Content-Type"] = "application/json";
    }

    const cookieString = buildCookieString();
    if (cookieString) {
      headers["Cookie"] = cookieString;
    }

    return headers;
  };

  // Handle search request
  const handleSearchRequest = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSearchResponse('');
    setFetchResponse('');
    setQueryId('');
    setItemIds([]);
    
    try {
      // Try direct request first
      let response;
      const headers = buildHeaders(true);
      
      try {
        console.log("Making direct search request with headers:", headers);
        response = await fetch(searchUrl, {
          method: "POST",
          headers,
          body: searchPayload,
          mode: "cors",
          credentials: "include"
        });
      } catch (directError) {
        console.error("Direct request failed:", directError);
        
        // Try with CORS proxies
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
              body: searchPayload
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
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setSearchResponse(JSON.stringify(data, null, 2));
      
      // Extract query ID and item IDs for fetch request
      if (data.id && data.result && data.result.length > 0) {
        setQueryId(data.id);
        setItemIds(data.result.slice(0, 10));
        
        // Create fetch URL
        const fetchUrlBase = 'https://www.pathofexile.com/api/trade2/fetch/';
        const itemIdsStr = data.result.slice(0, 10).join(',');
        const newFetchUrl = `${fetchUrlBase}${itemIdsStr}?query=${data.id}&realm=poe2`;
        setFetchUrl(newFetchUrl);
        
        setActiveTab('fetch');
      }
    } catch (error) {
      console.error("Search request error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle fetch request
  const handleFetchRequest = async () => {
    if (!fetchUrl) {
      setErrorMessage("Fetch URL is empty. Run a search request first.");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setFetchResponse('');
    
    try {
      // Try direct request first
      let response;
      const headers = buildHeaders();
      
      try {
        console.log("Making direct fetch request with headers:", headers);
        response = await fetch(fetchUrl, {
          method: "GET",
          headers,
          mode: "cors",
          credentials: "include"
        });
      } catch (directError) {
        console.error("Direct fetch request failed:", directError);
        
        // Try with CORS proxies
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
              }
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
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setFetchResponse(JSON.stringify(data, null, 2));
      setActiveTab('results');
    } catch (error) {
      console.error("Fetch request error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
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
                                  <p><strong>Preço:</strong> {item.listing.price.amount} {item.listing.price.currency}</p>
                                  <p><strong>Vendedor:</strong> {item.listing.account.name}</p>
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
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiDebugger;

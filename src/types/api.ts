
export interface ApiCredentials {
  poesessid: string;
  cfClearance: string[];
  useragent: string;
  isConfigured: boolean;
  useProxy?: boolean;
  customHeaders?: boolean;
  debugMode?: boolean;
  directQuery?: boolean;  // Nova opção para usar o formato de consulta direta como no site
  forceSimulation?: boolean;  // Nova opção para forçar dados simulados
  notifyGoodDeals?: boolean;  // Nova opção para notificar sobre boas ofertas
}

export interface ApiDebugInfo {
  requestTimestamp?: string;
  requestUrl?: string;
  requestPayload?: any;
  responseTimestamp?: string;
  responseData?: any;
  error?: string;
  queryString?: string;
  queryId?: string;
}

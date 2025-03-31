
export interface ApiCredentials {
  poesessid: string;
  cfClearance: string[];
  useragent: string;
  isConfigured: boolean;
  useProxy?: boolean;
  customHeaders?: boolean;
  debugMode?: boolean;
  directQuery?: boolean;
  forceSimulation?: boolean; // Will always be false
  notifyGoodDeals?: boolean;
  respectRateLimit?: boolean;  // Add option to wait between requests to avoid rate limiting
  rateLimitDelay?: number;     // Delay in milliseconds between API calls (default 2000ms)
  useBatchQuery?: boolean;     // Option to use the batch query approach (10 items at a time)
  preferDirectLink?: boolean;  // Option to prefer direct trade site links when available
  bypassCloudflare?: boolean;  // Option to enable special headers to bypass Cloudflare
  originHeader?: string;       // Custom Origin header
  referrerHeader?: string;     // Custom Referrer header
  enableAdvancedOptions?: boolean; // Show advanced options in UI
  supportCurl?: boolean;       // New option to enable cURL command support
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
  headers?: Record<string, string>;
  requestMethod?: string;
  statusCode?: number;
  rateLimited?: boolean;
  cloudflareBlocked?: boolean;
}

// Tipo para comando cURL parseado
export interface ParsedCurlCommand {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  jsonBody?: any; // Corpo parseado como JSON, se possível
  cookies?: Record<string, string>;
}

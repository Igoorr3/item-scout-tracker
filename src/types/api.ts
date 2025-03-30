
export interface ApiCredentials {
  poesessid: string;
  cfClearance: string[];
  useragent: string;
  isConfigured: boolean;
  useProxy?: boolean;
  customHeaders?: boolean;
  debugMode?: boolean;
  directQuery?: boolean;
  forceSimulation?: boolean;
  notifyGoodDeals?: boolean;
  respectRateLimit?: boolean;  // Add option to wait between requests to avoid rate limiting
  rateLimitDelay?: number;     // Delay in milliseconds between API calls (default 2000ms)
  useBatchQuery?: boolean;     // Option to use the batch query approach (10 items at a time)
  preferDirectLink?: boolean;  // Option to prefer direct trade site links when available
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
}


import { ParsedCurlCommand } from '@/types/api';

/**
 * Parses a cURL command into its components
 * 
 * @param curlCommand The cURL command string copied from browser
 * @returns Parsed components including URL, headers, method, body, etc.
 */
export const parseCurlCommand = (curlCommand: string): ParsedCurlCommand => {
  const result: ParsedCurlCommand = {
    headers: {},
    cookies: {},
    method: 'GET'
  };

  // Remove 'curl' if present at the beginning
  let cmd = curlCommand.trim();
  if (cmd.startsWith('curl ')) {
    cmd = cmd.substring(5).trim();
  }

  // Extract URL - it's either the first non-flag argument or after -X flag
  const urlMatch = cmd.match(/(?:^|\s+)(['"])(https?:\/\/[^'"]+)(\1)/i) ||
                  cmd.match(/(?:^|\s+)(https?:\/\/\S+)/i);
  
  if (urlMatch) {
    result.url = urlMatch[2] || urlMatch[1];
  }

  // Extract request method
  const methodMatch = cmd.match(/-X\s+(['"]?)(\w+)(\1)/i);
  if (methodMatch) {
    result.method = methodMatch[2].toUpperCase();
  }

  // Extract headers
  const headerMatches = cmd.matchAll(/-H\s+(['"])(.*?)(\1)/gi);
  for (const match of headerMatches) {
    const headerLine = match[2];
    const separatorIndex = headerLine.indexOf(':');
    
    if (separatorIndex > 0) {
      const name = headerLine.substring(0, separatorIndex).trim();
      const value = headerLine.substring(separatorIndex + 1).trim();
      
      if (name.toLowerCase() === 'cookie') {
        // Parse cookies
        const cookies = value.split(';');
        for (const cookie of cookies) {
          const cookieParts = cookie.split('=');
          if (cookieParts.length >= 2) {
            const cookieName = cookieParts[0].trim();
            const cookieValue = cookieParts.slice(1).join('=').trim();
            result.cookies![cookieName] = cookieValue;
          }
        }
      } else {
        result.headers![name] = value;
      }
    }
  }

  // Extract request body
  const dataMatch = cmd.match(/--data\s+(['"])(.*?)(\1)/i) || 
                    cmd.match(/--data-raw\s+(['"])(.*?)(\1)/i) ||
                    cmd.match(/-d\s+(['"])(.*?)(\1)/i);
                    
  if (dataMatch) {
    result.body = dataMatch[2];
  }

  return result;
};

/**
 * Extract useful API credentials from a parsed cURL command
 */
export const extractCredentialsFromCurl = (parsedCurl: ParsedCurlCommand) => {
  const credentials: {
    poesessid?: string;
    cfClearance?: string[];
    useragent?: string;
    originHeader?: string;
    referrerHeader?: string;
    otherHeaders?: Record<string, string>;
  } = {
    cfClearance: []
  };

  // Extract POESESSID and cf_clearance from cookies
  if (parsedCurl.cookies) {
    if (parsedCurl.cookies['POESESSID']) {
      credentials.poesessid = parsedCurl.cookies['POESESSID'];
    }
    
    if (parsedCurl.cookies['cf_clearance']) {
      credentials.cfClearance = [parsedCurl.cookies['cf_clearance']];
    }
  }

  // Extract useful headers
  if (parsedCurl.headers) {
    if (parsedCurl.headers['User-Agent']) {
      credentials.useragent = parsedCurl.headers['User-Agent'];
    }
    
    if (parsedCurl.headers['Origin']) {
      credentials.originHeader = parsedCurl.headers['Origin'];
    }
    
    if (parsedCurl.headers['Referer']) {
      credentials.referrerHeader = parsedCurl.headers['Referer'];
    }

    // Store other potentially useful headers
    credentials.otherHeaders = { ...parsedCurl.headers };
    delete credentials.otherHeaders['User-Agent'];
    delete credentials.otherHeaders['Origin'];
    delete credentials.otherHeaders['Referer'];
  }

  return credentials;
};

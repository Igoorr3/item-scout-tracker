
import { ParsedCurlCommand } from '@/types/api';

/**
 * Parseia um comando cURL em seus componentes
 * 
 * @param curlCommand A string do comando cURL copiada do navegador
 * @returns Componentes parseados incluindo URL, headers, método, body, etc.
 */
export const parseCurlCommand = (curlCommand: string): ParsedCurlCommand => {
  const result: ParsedCurlCommand = {
    headers: {},
    cookies: {},
    method: 'GET'
  };

  // Remove 'curl' se presente no início
  let cmd = curlCommand.trim();
  if (cmd.toLowerCase().startsWith('curl ')) {
    cmd = cmd.substring(5).trim();
  }

  // Extrai URL - é o primeiro argumento não-flag ou após a flag -X
  const urlMatch = cmd.match(/(?:^|\s+)(['"])(https?:\/\/[^'"]+)(\1)/i) ||
                  cmd.match(/(?:^|\s+)(https?:\/\/\S+)/i);
  
  if (urlMatch) {
    result.url = urlMatch[2] || urlMatch[1];
    // Limpar possíveis aspas ou caracteres extras
    if (result.url.endsWith('"') || result.url.endsWith("'")) {
      result.url = result.url.slice(0, -1);
    }
  }

  // Extrai método da requisição
  const methodMatch = cmd.match(/-X\s+(['"]?)(\w+)(\1)/i);
  if (methodMatch) {
    result.method = methodMatch[2].toUpperCase();
  }

  // Extrai headers
  const headerMatches = Array.from(cmd.matchAll(/-H\s+(['"])(.*?)(\1)/gi));
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

  // Extrai body da requisição
  const dataMatch = cmd.match(/--data(?:-raw)?\s+(['"])(.*?)(\1)/i) || 
                   cmd.match(/-d\s+(['"])(.*?)(\1)/i);
                    
  if (dataMatch) {
    result.body = dataMatch[2];
    
    // Tenta parsear o body como JSON
    try {
      const jsonBody = JSON.parse(result.body);
      result.jsonBody = jsonBody;
    } catch (e) {
      console.log("Body não é um JSON válido:", e);
    }
  }

  return result;
};

/**
 * Extrai credenciais úteis da API de um comando cURL parseado
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

  // Extrai POESESSID e cf_clearance dos cookies
  if (parsedCurl.cookies) {
    if (parsedCurl.cookies['POESESSID']) {
      credentials.poesessid = parsedCurl.cookies['POESESSID'];
    }
    
    if (parsedCurl.cookies['cf_clearance']) {
      credentials.cfClearance = [parsedCurl.cookies['cf_clearance']];
    }
  }

  // Extrai headers úteis
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

    // Armazena outros headers potencialmente úteis
    credentials.otherHeaders = { ...parsedCurl.headers };
    delete credentials.otherHeaders['User-Agent'];
    delete credentials.otherHeaders['Origin'];
    delete credentials.otherHeaders['Referer'];
  }

  return credentials;
};

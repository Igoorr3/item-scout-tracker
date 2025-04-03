
# Path of Exile 2 Item Scout Tracker

Este projeto permite rastrear itens do mercado do Path of Exile 2, usando a API interna do site oficial do PoE.

## Requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Python](https://www.python.org/) (v3.8 ou superior)
- Um navegador moderno (Chrome, Firefox, Edge)
- Uma conta no Path of Exile

## Estrutura do Projeto

Este é um projeto híbrido com:
- Frontend: React + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Servidor Python Flask para contornar limitações de CORS

## Passo a Passo para Executar

### 1. Configurar o Servidor Python

O servidor Python é necessário para contornar as restrições de CORS do navegador e permitir que a aplicação React se comunique com a API do Path of Exile.

1. Instale as dependências Python:

```bash
pip install flask flask-cors requests
```

2. Execute o arquivo `api_server.py` incluído no projeto:

```bash
python api_server.py
```

O servidor deve iniciar e mostrar: "Iniciando servidor na porta 5000..."

### 2. Configurar e Executar o Frontend React

1. Abra um novo terminal na pasta do projeto.

2. Instale as dependências do projeto:

```bash
npm install
```

3. Inicie a aplicação React:

```bash
npm run dev
```

A aplicação deve iniciar e abrir no navegador em `http://localhost:5173/` ou similar.

### 3. Configurar o Comando cURL

Para que a aplicação funcione corretamente, você precisa fornecer os cookies e cabeçalhos corretos do seu navegador:

1. Faça login no site oficial do [Path of Exile](https://www.pathofexile.com)
2. Acesse o [site de trade do PoE2](https://www.pathofexile.com/trade2/search/poe2/Standard)
3. Pressione F12 para abrir as ferramentas de desenvolvedor
4. Vá para a aba "Network"
5. Faça uma busca qualquer no site
6. Na lista de requisições, encontre a requisição POST chamada "Standard"
7. Clique com o botão direito na requisição e escolha "Copy as cURL (bash)"
8. Na aplicação React, clique no botão "Configurar cURL" e cole o comando copiado

### 4. Formatos Corretos de IDs

#### Categorias de Itens

A API do PoE2 utiliza os seguintes formatos para categorias de itens:

- Armas: `weapon.bow`, `weapon.onesword`, `weapon.staff`, etc.
- Armaduras: `armour.helmet`, `armour.chest`, `armour.boots`, etc.
- Acessórios: `accessory.ring`, `accessory.amulet`, etc.

**Importante:** Não use nomes genéricos como "Bow" ou "Helmet". A API espera o formato completo com o prefixo da categoria.

#### IDs de Estatísticas

Os IDs de estatísticas seguem um formato específico:

- Para DPS físico: `local_physical_damage_+%`
- Para velocidade de ataque: `local_attack_speed_+%`
- Para resistências: `fire_damage_resistance_%`

**Importante:** Não use formatos como "dps" ou "weapon.total_dps". Esses IDs não são reconhecidos pela API.

### 5. Estrutura de Arquivos Importantes

```
├── api_server.py            # Servidor Python para intermediar requisições
├── src/
│   ├── components/          # Componentes React
│   │   ├── ItemCard.tsx     # Card que exibe um item
│   │   ├── ItemList.tsx     # Lista de itens
│   │   ├── StatFilter.tsx   # Filtro de estatísticas de items
│   │   ├── TrackerHeader.tsx # Cabeçalho da aplicação
│   │   └── TrackingConfig.tsx # Configuração de rastreadores
│   ├── services/
│   │   └── itemService.ts   # Serviço de comunicação com a API
│   ├── types/
│   │   ├── api.ts           # Tipos relacionados à API
│   │   ├── items.ts         # Tipos para itens
│   │   └── tracking.ts      # Tipos para configuração de rastreamento
│   └── utils/
│       └── curlParser.ts    # Utilitário para extrair dados do comando cURL
```

## Problemas Conhecidos e Soluções

### 1. Erro "Unknown category"

**Causa**: A API do PoE2 espera identificadores específicos para categorias de item.

**Solução**: Use categorias válidas como `weapon.bow` em vez de `Bow`. Os valores corretos estão na lista suspensa de tipos de item no aplicativo.

### 2. Erro "Invalid stat provided" ou "Unsupported stat domain provided"

**Causa**: A API do Path of Exile 2 utiliza identificadores específicos para stats.

**Solução**: Use IDs de estatísticas corretos como `local_physical_damage_+%` em vez de `weapon.physical_dps`. Os valores corretos estão na lista de estatísticas disponíveis.

### 3. Erro CORS (Cross-Origin Resource Sharing)

**Causa**: Os navegadores bloqueiam requisições diretas para domínios diferentes por segurança.

**Solução**: Certifique-se de que o servidor Python está rodando. O servidor atua como um proxy para contornar esta limitação.

### 4. Erro "Falha na conexão com o servidor Python"

**Causa**: O servidor Python não está rodando ou está em uma porta diferente.

**Solução**: Verifique se o servidor Python está rodando corretamente com o comando `python api_server.py`.

### 5. Cookies Expirados

**Causa**: Os cookies de sessão e clearance do Cloudflare têm validade limitada.

**Solução**: Gere um novo comando cURL conforme as instruções na seção "Configurar o Comando cURL".

## Notas Técnicas

- **CORS**: O navegador impede requisições diretas para a API do Path of Exile devido a restrições de CORS. Por isso usamos um servidor Python como intermediário.
  
- **Cloudflare**: O site do Path of Exile usa proteção Cloudflare, por isso precisamos dos cookies corretos para acessar a API.

- **Rate Limiting**: A API do Path of Exile tem limite de requisições. Use a opção "Respeitar limite de requisições" para evitar ser bloqueado.

## Informações Adicionais

Este projeto é apenas para uso pessoal. Não abuse da API oficial do Path of Exile para não sobrecarregar seus servidores.

## Depuração Avançada

Se você continuar enfrentando problemas com as requisições à API, considere:

1. Verificar se os IDs das estatísticas e categorias correspondem exatamente ao que a API espera
2. Usar o modo de depuração para verificar os payloads enviados e respostas recebidas
3. Comparar seu payload com o enviado pelo site oficial, copiando-o das ferramentas de desenvolvedor

Muitas vezes a API do Path of Exile 2 retorna códigos de erro 400 quando o formato do payload não está exatamente como esperado, mesmo com pequenas diferenças de nomenclatura.

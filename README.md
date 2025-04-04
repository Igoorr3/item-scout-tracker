
# Path of Exile 2 - Item Tracker

Este é um rastreador de itens para Path of Exile 2 que permite monitorar itens do mercado com base em filtros personalizados.

## Recursos

- Interface gráfica simples e intuitiva
- Busca de itens por categoria, estatísticas e preço
- Monitoramento automático em intervalos configuráveis
- Contorna as proteções do Cloudflare usando cookies de autenticação
- Exibição detalhada de propriedades e modificadores dos itens
- Análise de uso de Divine Orb (mostra se vale a pena usar em cada item)
- Exibição de DPS total e DPS físico para armas
- Links diretos para o site de comércio oficial do PoE2
- Integração com script Python existente

## Requisitos

- Python 3.7 ou superior
- Node.js 18 ou superior (para versão Web)
- Bibliotecas: requests, tkinter (Python) ou React (Web)

## Como Executar o Projeto

### Versão Web (React)

1. Instale as dependências:
```bash
npm install
# ou
yarn install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

3. Para produção:
```bash
npm run build
npm run preview
# ou
yarn build
yarn preview
```

### API Python (opcional)

Para utilizar a integração Python completa, é necessário executar o servidor de API Python:

```bash
python api_server.py
```

Este servidor deve estar rodando na porta 5000 para que a integração funcione corretamente.

## Executando apenas o Script Python Standalone

Se você preferir usar apenas a versão Python standalone:

1. Certifique-se de ter o Python instalado no seu sistema
2. Instale as dependências necessárias:

```bash
pip install requests
```

3. A biblioteca `tkinter` geralmente já vem incluída com o Python, mas se necessário:

```bash
# No Ubuntu/Debian:
sudo apt-get install python3-tk

# No Fedora:
sudo dnf install python3-tkinter

# No Windows e macOS geralmente já vem incluído com o Python
```

4. Execute o script Python:

```bash
python poe2_item_tracker.py
```

## Navegação na Interface

- A página principal contém os recursos de busca e monitoramento de itens
- A página de "Integração Python" permite usar/integrar com scripts Python existentes
- Use o botão "Voltar" para retornar à página principal quando estiver na seção de Python

## Como Usar

1. Configure suas credenciais do Path of Exile:
   - Você pode obter os cookies acessando o site do Path of Exile (pathofexile.com)
   - Abrindo as ferramentas de desenvolvedor (F12)
   - Indo para a aba Application > Storage > Cookies
   - Procure por POESESSID e cf_clearance

2. Configure seus filtros de busca:
   - Selecione a categoria de item
   - Defina filtros de estatísticas (vida, resistências, etc.)
   - Configure faixas de preço

3. Use "Buscar Itens" para uma pesquisa única ou "Iniciar Monitoramento" para pesquisas periódicas

## Entendendo os IDs de Estatísticas

A API do PoE2 usa IDs específicos para cada estatística. Os IDs seguem o formato:
- `explicit.stat_NUMEROID` (para afixos explícitos)
- `implicit.stat_NUMEROID` (para afixos implícitos)

Por exemplo:
- Vida máxima: `explicit.stat_3299347043`
- Resistência ao Fogo: `explicit.stat_3372524247`

Os IDs internos foram mapeados para nomes legíveis na interface.

## Análise de Divine Orb

O aplicativo analisa cada afixo dos itens para determinar se vale a pena usar um Divine Orb:

- Verifica o percentil atual do valor do afixo
- Calcula o ganho potencial com um reroll
- Fornece recomendações baseadas na qualidade atual do item

## Por que este método funciona?

A API oficial do Path of Exile 2 usa proteção Cloudflare e requer autenticação para funcionar. O método implementado neste aplicativo:

1. Utiliza cookies válidos do seu navegador (POESESSID e cf_clearance)
2. Envia o User-Agent adequado para simular um navegador real
3. Respeita os limites de taxa (rate limits) da API para evitar bloqueios
4. Utiliza a mesma estrutura de requisições que o site oficial usa

Isso permite contornar as proteções sem violar os termos de serviço, pois você está usando sua própria sessão autenticada.

## Solução de Problemas

- **Erro 403 (Forbidden)**: Seus cookies provavelmente expiraram. Atualize o POESESSID e cf_clearance.
- **Erro 400 (Bad Request)**: Verifique se os filtros de estatísticas estão corretos.
- **Erro 429 (Too Many Requests)**: A API está limitando suas requisições. Aumente o intervalo de monitoramento.
- **npm start não funciona**: Use `npm run dev` em vez de `npm start` (este projeto usa Vite, não Create React App)

## Notas Importantes

- Este aplicativo não é oficial e não é associado à Grinding Gear Games
- O uso é por sua conta e risco
- Sempre respeite os termos de serviço do jogo
- Os cookies expiram com o tempo, então você precisará atualizá-los periodicamente

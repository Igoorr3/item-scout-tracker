
# Path of Exile 2 - Item Tracker

Este é um rastreador de itens para Path of Exile 2 desenvolvido em Python que permite monitorar itens do mercado com base em filtros personalizados.

## Recursos

- Interface gráfica simples e intuitiva
- Busca de itens por categoria, estatísticas e preço
- Monitoramento automático em intervalos configuráveis
- Contorna as proteções do Cloudflare usando cookies de autenticação
- Exibição detalhada de propriedades e modificadores dos itens
- Links diretos para o site de comércio oficial do PoE2

## Requisitos

- Python 3.7 ou superior
- Bibliotecas: requests, tkinter

## Instalação

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

## Como Usar

1. Execute o script:

```bash
python poe2_item_tracker.py
```

2. Na aba "Configuração", adicione seu POESESSID e cf_clearance:
   - Você pode obter esses cookies acessando o site do Path of Exile
   - Abrindo as ferramentas de desenvolvedor (F12)
   - Indo para a aba Application > Storage > Cookies

3. Configure seus filtros de busca na aba "Rastreador":
   - Selecione a categoria de item
   - Defina filtros de estatísticas (vida, resistências, etc.)
   - Configure faixas de preço

4. Use "Buscar Itens" para uma pesquisa única ou "Iniciar Monitoramento" para pesquisas periódicas

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

## Notas Importantes

- Este aplicativo não é oficial e não é associado à Grinding Gear Games
- O uso é por sua conta e risco
- Sempre respeite os termos de serviço do jogo
- Os cookies expiram com o tempo, então você precisará atualizá-los periodicamente

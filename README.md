
# Path of Exile 2 - Item Tracker (Python)

Um rastreador de itens para Path of Exile 2 com interface gráfica moderna que permite monitorar itens do mercado e analisar seu potencial para melhorias com Divine Orbs.

![Screenshot do Aplicativo](https://i.imgur.com/example.png)

## Recursos

- Interface gráfica moderna e intuitiva com suporte a temas claro/escuro
- Sistema de abas para gerenciar múltiplas buscas simultaneamente
- Busca de itens por categoria, estatísticas e preço
- Monitoramento automático em intervalos configuráveis
- Exibição detalhada de propriedades e modificadores dos itens
- **Análise avançada de Divine Orb**:
  - Calcula o percentual de melhoria possível para cada modificador
  - Estima o valor potencial do item após usar Divine Orbs
  - Calcula DPS/PDPS mínimo e máximo possível
  - Destaca itens com alto potencial para lucro
- Contorna as proteções do Cloudflare usando cookies de autenticação
- Links diretos para o site de comércio oficial do PoE2

## Requisitos

- Python 3.7 ou superior
- Bibliotecas: 
  - requests
  - tkinter (geralmente já incluído com o Python)
  - configparser
  - datetime

## Instalação

1. Clone este repositório ou baixe o arquivo `poe2_item_tracker.py`
2. Instale as dependências necessárias:

```bash
pip install requests
```

3. Execute o aplicativo:

```bash
python poe2_item_tracker.py
```

## Como Usar

1. Na primeira execução, você será direcionado para a aba "Configuração"
2. Configure suas credenciais:
   - POESESSID: Cookie de autenticação do site do Path of Exile
   - cf_clearance: Cookie do Cloudflare para contornar proteções
   - User-Agent: Identificação do seu navegador

   Você pode obter esses valores seguindo as instruções na aba "Configuração".

3. Clique em "Salvar Configuração"
4. Vá para a aba "Rastreador PoE 2"
5. Crie uma nova busca clicando em "+ Nova Busca"
6. Configure seus filtros:
   - Selecione a categoria de item (armas, armaduras, etc.)
   - Defina o intervalo de preço
   - Adicione filtros específicos para estatísticas (vida, resistências, etc.)
   - Configure valores mínimos para DPS/PDPS se desejado
7. Clique em "Buscar Itens" para uma pesquisa única ou "Monitorar" para pesquisas periódicas

## Entendendo a Análise de Divine Orb

O aplicativo analisa cada afixo dos itens encontrados para:

1. Calcular onde o valor atual se encontra na faixa possível
2. Estimar quanto o item pode melhorar com o uso de Divine Orbs
3. Calcular o DPS mínimo, médio e máximo possível para armas
4. Fornecer uma estimativa de preço pós-Divine baseada em itens similares

Os itens são coloridos na lista de acordo com seu potencial:
- **Verde**: Alto potencial (>65% de melhoria possível)
- **Amarelo**: Médio potencial (35-65% de melhoria)
- **Vermelho**: Baixo potencial (<35% de melhoria)

## Configuração Avançada

O arquivo `poe2_config.ini` é criado automaticamente no mesmo diretório do script e armazena:
- Suas credenciais de autenticação
- Preferência de tema (claro/escuro)
- Outras configurações (configurável apenas editando o arquivo)

## Solução de Problemas

- **Erro 403 (Forbidden)**: Seus cookies provavelmente expiraram. Atualize o POESESSID e cf_clearance.
- **Erro 400 (Bad Request)**: Verifique se os filtros de estatísticas estão corretos.
- **Erro 429 (Too Many Requests)**: A API está limitando suas requisições. Aumente o intervalo de monitoramento.
- **Interface não aparece**: Verifique se o tkinter está instalado corretamente no seu sistema.

## Notas Importantes

- Este aplicativo não é oficial e não é associado à Grinding Gear Games
- O uso é por sua conta e risco
- Sempre respeite os termos de serviço do jogo
- Os cookies expiram com o tempo, então você precisará atualizá-los periodicamente

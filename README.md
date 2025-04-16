
# Path of Exile 2 - Item Tracker (Python)

Um rastreador de itens para Path of Exile 2 com interface gráfica moderna que permite monitorar itens do mercado e analisar seu potencial para melhorias com Divine Orbs.

## Recursos

- Interface gráfica moderna e intuitiva com suporte a temas claro/escuro
- Sistema de abas para gerenciar múltiplas buscas simultaneamente
- Busca de itens por categoria, estatísticas e preço
- Monitoramento automático em intervalos configuráveis
- Exibição detalhada de propriedades e modificadores dos itens
- **Análise avançada de Divine Orb**:
  - Foco exclusivo em modificadores que aumentam o DPS (dano físico, velocidade de ataque, critical)
  - Ignora modificadores que não afetam o dano para recomendações de Divine
  - Calcula o percentual de melhoria possível para cada modificador relevante
  - Estima o valor potencial do item após usar Divine Orbs
  - Destaca itens com alto potencial para lucro
- **Visualização separada de DPS e PDPS**:
  - Alterne entre modo DPS total, PDPS ou ambos
  - Ordenação automática de itens conforme o modo selecionado
  - Destaque de itens com alto potencial de ganho de DPS/PDPS
- **Resumo Visual de Potencial**:
  - Exibição compacta dos valores atuais e máximos
  - Cálculo de ganho percentual de DPS
  - Análise se vale a pena usar Divine Orb
  - Destaque dos modificadores mais importantes para o dano
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
8. Use o seletor "Modo de DPS" para escolher visualização de DPS, PDPS ou ambos

## Entendendo a Análise de Divine Orb

O aplicativo agora foca apenas nos modificadores que realmente afetam o DPS das armas:

1. **Modificadores que afetam DPS:**
   - % Dano Físico Aumentado (local)
   - Adiciona # a # de Dano Físico
   - % Velocidade de Ataque (local)
   - % Chance de Acerto Crítico
   - % Multiplicador de Dano Crítico
   - Dano elemental adicionado (Fogo, Gelo, Raio)
   - +# para Nível de Habilidades de Projétil

2. **Priorização Inteligente:**
   - Apenas recomenda Divine Orb em itens com potencial significativo de ganho de DPS
   - Não considera modificadores irrelevantes para o cálculo de ganho (resistências, vida, etc.)
   - Analisa separadamente cada componente DPS (físico vs total)

3. **Apresentação Visual Aprimorada:**
   - Os itens são coloridos na lista de acordo com seu potencial:
     - **Verde**: Alto potencial (>65% de melhoria possível)
     - **Amarelo**: Médio potencial (35-65% de melhoria)
     - **Vermelho**: Baixo potencial (15-35% de melhoria)
   - **Novo!** Resumo visual compacto com valores atuais, máximos e ganho percentual
   - **Novo!** Mostra apenas os mods relevantes para dano no topo da análise

## Solução de Problemas

- **Erro 403 (Forbidden)**: Seus cookies provavelmente expiraram. Atualize o POESESSID e cf_clearance.
- **Erro 400 (Bad Request)**: Verifique se os filtros de estatísticas estão corretos.
- **Erro 429 (Too Many Requests)**: A API está limitando suas requisições. Aumente o intervalo de monitoramento.
- **Interface não aparece**: Verifique se o tkinter está instalado corretamente no seu sistema.
- **DPS calculado incorretamente**: O aplicativo pode não reconhecer corretamente a base da arma. Verifique o nome do item.

## Notas Importantes

- Este aplicativo não é oficial e não é associado à Grinding Gear Games
- O uso é por sua conta e risco
- Sempre respeite os termos de serviço do jogo
- Os cookies expiram com o tempo, então você precisará atualizá-los periodicamente

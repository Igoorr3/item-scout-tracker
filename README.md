
# Item Scout Tracker - Path of Exile 2

Um rastreador de itens para Path of Exile 2 que permite monitorar itens no sistema de comércio com base em estatísticas, preços e outros filtros.

## Visão Geral

Este aplicativo permite que você:
- Crie rastreadores personalizados para diferentes tipos de itens
- Defina filtros baseados em estatísticas do jogo (vida, resistências, dano, etc.)
- Monitore automaticamente itens em intervalos regulares
- Receba notificações ao encontrar itens que correspondam aos seus critérios

## Requisitos

1. Node.js 16+ e npm 7+
2. Python 3.8+ com pip
3. Uma conta Path of Exile com acesso ao Path of Exile 2
4. Um navegador moderno como Chrome, Firefox ou Edge

## Configuração

### 1. Servidor Python (API Proxy)

O aplicativo usa um servidor Python local para contornar as limitações de CORS do navegador e se comunicar com a API do Path of Exile 2.

```bash
# Instale as dependências
pip install flask flask-cors requests

# Execute o servidor
python api_server.py
```

O servidor deve iniciar na porta 5000. Você verá uma mensagem de confirmação no console.

### 2. Aplicação React

```bash
# Instale as dependências
npm install

# Execute a aplicação em modo de desenvolvimento
npm run dev
```

A aplicação estará disponível em http://localhost:5173/

## Configuração da API (Importante)

Para funcionar corretamente, o tracker precisa se autenticar na API do Path of Exile 2. Siga estes passos:

1. Faça login no site oficial do Path of Exile (https://www.pathofexile.com/)
2. Acesse a página de comércio do Path of Exile 2 (https://www.pathofexile.com/trade2/search/poe2/Standard)
3. Abra as ferramentas de desenvolvedor (F12)
4. Na aba "Network", realize uma busca de itens e encontre a requisição POST chamada "Standard"
5. Clique com o botão direito na requisição e escolha "Copy as cURL (bash)"
6. No aplicativo Item Scout Tracker, clique em "Configurar API"
7. Cole o comando cURL copiado

## Uso

### Criando um rastreador

1. Clique no botão "Novo Rastreador"
2. Defina um nome para o rastreador
3. Selecione o tipo de item que deseja rastrear
4. Adicione filtros de estatísticas (por exemplo, vida mínima, resistências, velocidade de ataque)
5. Configure o intervalo de atualização (em segundos)
6. Ative ou desative o rastreador
7. Clique em "Salvar Configuração"

### Visualizando itens

1. Alterne para a guia "Itens Encontrados" para ver os resultados
2. Os itens são ordenados por preço, do mais barato ao mais caro
3. Clique em um item para ver mais detalhes

## Formato das Estatísticas da API PoE2

As estatísticas no Path of Exile 2 seguem o formato específico: `explicit.stat_NUMEROID`.

Exemplos comuns:
- Vida: `explicit.stat_3299347043`
- Resistência ao Fogo: `explicit.stat_3372524247`
- Velocidade de Ataque: `explicit.stat_2923486259`

## Categorias de Itens Aceitas

O sistema usa categorias específicas para a API do PoE2. Exemplos incluem:
- Para arcos: `weapon.bow`
- Para bestas: `weapon.crossbow`
- Para bastões: `weapon.staff`
- Para anéis: `accessory.ring`

## Solução de problemas

### API mostra "Unknown category"

Verifique se está usando os valores corretos para o tipo de item. As categorias já estão pré-configuradas no aplicativo para corresponder à API do PoE2.

### API mostra "Invalid stat provided"

Os IDs de estatísticas para o Path of Exile 2 seguem o formato `explicit.stat_NUMEROID`. O aplicativo já vem pré-configurado com os IDs corretos.

### Erro de CORS ou de Autenticação

1. Verifique se o servidor Python está rodando na porta 5000
2. Atualize seu comando cURL para obter cookies mais recentes
3. Verifique se está usando o navegador que está logado no site do Path of Exile

### Problemas com Cloudflare

Se você receber erros de acesso, pode ser devido à proteção Cloudflare do site do PoE:
1. Certifique-se de que o comando cURL copiado inclui o cookie `cf_clearance`
2. Pode ser necessário atualizar esse cookie periodicamente (a cada sessão do navegador)
3. Se estiver usando um proxy, ele deve ser capaz de lidar com o Cloudflare

### Erro ao abrir a configuração do rastreador

Se a tela ficar preta ao abrir o modal de configuração:
1. Recarregue a página
2. Verifique se não há erros no console do navegador
3. Tente criar um rastreador novo em vez de editar um existente

## Notas Técnicas

- O aplicativo usa um servidor Python para contornar limitações de CORS
- Suas credenciais são armazenadas localmente no seu navegador (localStorage)
- A API do Path of Exile 2 tem limitações de taxa (rate limit), então os intervalos de atualização muito curtos podem causar falhas temporárias
- A API interna do POE, como mostrado no Reddit, requer autenticação via cookies da sessão do navegador e não é uma API pública oficial

## Limitações Conhecidas

- A API do PoE2 está em desenvolvimento, então alguns filtros podem mudar
- Há um limite da API de 10 itens por busca
- A autenticação é baseada em cookies e pode expirar, necessitando atualização

## Contribuindo

Se você encontrar bugs ou quiser sugerir melhorias, sinta-se à vontade para:
1. Reportar problemas
2. Enviar pull requests com correções ou novas funcionalidades

## Aviso Legal

Este é um aplicativo de terceiros não oficial e não é afiliado ou endossado pela Grinding Gear Games. Use por sua própria conta e risco.

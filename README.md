
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

2. Crie um arquivo `api_server.py` com o seguinte código:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)

@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({'success': True, 'message': 'API server is running correctly'})

@app.route('/api/search', methods=['POST'])
def search_items():
    try:
        search_payload = request.json
        print(f"Payload recebido: {json.dumps(search_payload, indent=2)}")

        # URL da API de busca
        url = "https://www.pathofexile.com/api/trade2/search/poe2/Standard"
        
        # Fazemos a requisição sem usar os cabeçalhos do navegador
        response = requests.post(
            url,
            json=search_payload,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                'Origin': 'https://www.pathofexile.com',
                'Referer': 'https://www.pathofexile.com/trade2/search/poe2/Standard'
            }
        )
        
        print(f"Status da resposta: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Erro na API: {response.text}")
            return jsonify({'error': f"Erro ao buscar itens: {response.status_code}"}), response.status_code
        
        return response.json()
    except Exception as e:
        print(f"Erro no servidor: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/fetch', methods=['GET'])
def fetch_items():
    try:
        ids = request.args.get('ids')
        query_id = request.args.get('query')
        
        if not ids or not query_id:
            return jsonify({'error': 'IDs de item e ID de consulta são obrigatórios'}), 400
        
        # URL da API para buscar detalhes dos itens
        url = f"https://www.pathofexile.com/api/trade2/fetch/{ids}?query={query_id}"
        
        # Fazemos a requisição sem usar os cabeçalhos do navegador
        response = requests.get(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                'Origin': 'https://www.pathofexile.com',
                'Referer': f'https://www.pathofexile.com/trade2/search/poe2/{query_id}'
            }
        )
        
        print(f"Status da resposta: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Erro na API: {response.text}")
            return jsonify({'error': f"Erro ao buscar detalhes dos itens: {response.status_code}"}), response.status_code
        
        return response.json()
    except Exception as e:
        print(f"Erro no servidor: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Iniciando servidor na porta 5000...")
    print("Este servidor é necessário para contornar limitações de CORS do navegador")
    app.run(debug=True, port=5000)
```

3. Execute o servidor Python:

```bash
python api_server.py
```

O servidor deve iniciar e mostrar: "Iniciando servidor na porta 5000..."

### 2. Configurar e Executar o Frontend React

1. Extraia os arquivos do projeto para uma pasta local.

2. Abra um terminal na pasta do projeto.

3. Instale as dependências do projeto:

```bash
npm install
```

4. Inicie a aplicação React:

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

### 4. Usando a Aplicação

1. Após configurar o cURL, clique em "Novo Rastreador" para criar uma configuração de rastreamento.
2. Defina um nome para o rastreador, o tipo de item e os filtros desejados.
3. Salve a configuração e clique em "Atualizar" para buscar os itens.
4. Use o botão "Debug API" para verificar logs e depurar problemas com as requisições.

### Solução de Problemas

1. **Erro "Forbidden" ou 403**: Certifique-se de que você está logado no site do Path of Exile e que copiou o comando cURL corretamente.

2. **Erro "CORS"**: Verifique se o servidor Python está rodando corretamente na porta 5000.

3. **Cookies expirados**: Os cookies de sessão e clearance podem expirar. Se isso acontecer, você precisará gerar um novo comando cURL.

## Notas Técnicas

- **CORS**: O navegador impede requisições diretas para a API do Path of Exile devido a restrições de CORS. Por isso usamos um servidor Python como intermediário.
  
- **Cloudflare**: O site do Path of Exile usa proteção Cloudflare, por isso precisamos dos cookies corretos para acessar a API.

- **Rate Limiting**: A API do Path of Exile tem limite de requisições. Use a opção "Respeitar limite de requisições" para evitar ser bloqueado.

## Arquivos Principais

- `src/services/itemService.ts`: Lida com todas as requisições à API
- `src/components/TrackerHeader.tsx`: Cabeçalho da aplicação com instruções e botões principais
- `api_server.py`: Servidor Python para intermediar requisições

## Informações Adicionais

Este projeto é apenas para uso pessoal. Não abuse da API oficial do Path of Exile para não sobrecarregar seus servidores.


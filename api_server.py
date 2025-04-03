
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os

app = Flask(__name__)
CORS(app)  # Habilita CORS para todas as rotas

# URL base da API do PoE2
POE_API_BASE_URL = "https://www.pathofexile.com/api/trade2"

print("Iniciando servidor na porta 5000...")
print("Este servidor é necessário para contornar limitações de CORS do navegador")

@app.route('/api/test', methods=['GET'])
def test_connection():
    return jsonify({"success": True, "message": "Conexão com o servidor Python estabelecida com sucesso!"})

@app.route('/api/search', methods=['POST'])
def search_items():
    try:
        payload = request.json
        print("Payload recebido:", json.dumps(payload, indent=2))
        
        # Obter cookies e headers do request se disponíveis
        cookies = {}
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Origin": "https://www.pathofexile.com",
            "Referer": "https://www.pathofexile.com/trade2/search/poe2/Standard"
        }
        
        # Enviar requisição para a API do PoE2
        response = requests.post(
            f"{POE_API_BASE_URL}/search/poe2/Standard",
            json=payload,
            headers=headers,
            cookies=cookies
        )
        
        print(f"Status da resposta: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Erro na API: {response.text}")
            return response.text, response.status_code
        
        data = response.json()
        return jsonify(data)
    
    except Exception as e:
        print(f"Erro no servidor: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/fetch', methods=['GET'])
def fetch_items():
    try:
        ids = request.args.get('ids', '')
        query_id = request.args.get('query', '')
        
        if not ids or not query_id:
            return jsonify({"error": "IDs de itens ou ID de consulta não fornecidos"}), 400
        
        # Obter cookies e headers do request se disponíveis
        cookies = {}
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Origin": "https://www.pathofexile.com",
            "Referer": "https://www.pathofexile.com/trade2/search/poe2/Standard"
        }
        
        # Enviar requisição para a API do PoE2
        response = requests.get(
            f"{POE_API_BASE_URL}/fetch/{ids}?query={query_id}&realm=poe2",
            headers=headers,
            cookies=cookies
        )
        
        print(f"Status da resposta de detalhes: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Erro na API de detalhes: {response.text}")
            return response.text, response.status_code
        
        data = response.json()
        return jsonify(data)
    
    except Exception as e:
        print(f"Erro no servidor ao buscar detalhes: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Esta linha permite rodar o servidor diretamente com python api_server.py
if __name__ == '__main__':
    app.run(debug=True)

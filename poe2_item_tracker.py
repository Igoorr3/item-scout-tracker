
import requests
import json
import time
import os
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import threading
import configparser
import re
from datetime import datetime

# Configuração inicial
CONFIG_FILE = 'poe2_config.ini'
STAT_MAP = {
    "Vida Máxima": "explicit.stat_3299347043",
    "% Vida Aumentada": "explicit.stat_1671376347",
    "Mana Máxima": "explicit.stat_1050105434",
    "% Mana Aumentada": "explicit.stat_4220027924",
    "Resistência ao Fogo": "explicit.stat_3372524247",
    "Resistência ao Gelo": "explicit.stat_3642289083",
    "Resistência ao Raio": "explicit.stat_1010850144",
    "Resistência ao Caos": "explicit.stat_3795704793",
    "Dano Físico Aumentado": "explicit.stat_2901986750",
    "Dano Elemental Aumentado": "explicit.stat_2974417149",
    "Dano de Feitiços Aumentado": "explicit.stat_1368271171",
    "Velocidade de Ataque": "explicit.stat_2923486259",
    "Velocidade de Conjuração": "explicit.stat_4277795662",
    "Chance de Acerto Crítico": "explicit.stat_2628039082",
    "Multiplicador de Críticos": "explicit.stat_2301191210",
    "Alcance de Ataque": "explicit.stat_2469416729",
    "Atributo Força": "explicit.stat_3489782002",
    "Atributo Destreza": "explicit.stat_4080418644",
    "Atributo Inteligência": "explicit.stat_4043464511",
    "Todos Atributos": "explicit.stat_2026728709",
    "Velocidade de Movimento": "explicit.stat_3848254059"
}

ITEM_CATEGORIES = {
    "Qualquer Arma": "weapon",
    "Arma de Uma Mão": "weapon.one",
    "Garra": "weapon.claw",
    "Adaga": "weapon.dagger",
    "Espada de Uma Mão": "weapon.onesword",
    "Machado de Uma Mão": "weapon.oneaxe",
    "Maça de Uma Mão": "weapon.onemace",
    "Lança": "weapon.spear",
    "Mangual": "weapon.flail",
    "Arma de Duas Mãos": "weapon.two",
    "Espada de Duas Mãos": "weapon.twosword",
    "Machado de Duas Mãos": "weapon.twoaxe",
    "Maça de Duas Mãos": "weapon.twomace",
    "Bastão": "weapon.staff",
    "Arma à Distância": "weapon.ranged",
    "Arco": "weapon.bow",
    "Besta": "weapon.crossbow",
    "Arma de Conjurador": "weapon.caster",
    "Varinha": "weapon.wand",
    "Cetro": "weapon.sceptre",
    "Cajado": "weapon.staff",
    "Anel": "accessory.ring",
    "Amuleto": "accessory.amulet",
    "Cinto": "accessory.belt",
    "Armadura": "armour.chest",
    "Elmo": "armour.helmet",
    "Luvas": "armour.gloves",
    "Botas": "armour.boots",
    "Escudo": "armour.shield"
}

CURRENCIES = ["chaos", "divine", "exalted", "regal", "vaal", "alchemy", "alteration", "fusing", "jeweller"]

class PoeTracker:
    def __init__(self, root):
        self.root = root
        self.root.title("Path of Exile 2 - Item Tracker")
        self.root.geometry("1200x800")
        
        # Variáveis para salvar as credenciais
        self.poesessid = tk.StringVar()
        self.cf_clearance = tk.StringVar()
        self.useragent = tk.StringVar(value="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36")
        
        # Variáveis para os filtros
        self.selected_category = tk.StringVar()
        self.selected_currency = tk.StringVar(value="chaos")
        self.price_min = tk.StringVar()
        self.price_max = tk.StringVar()
        
        # Variáveis para o polling
        self.is_polling = False
        self.polling_interval = tk.StringVar(value="30")
        self.polling_thread = None
        self.stop_polling_flag = threading.Event()
        
        # Carregar configuração
        self.load_config()
        
        # Criar a interface
        self.create_ui()
    
    def create_ui(self):
        notebook = ttk.Notebook(self.root)
        notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Aba de Configuração
        config_frame = ttk.Frame(notebook)
        notebook.add(config_frame, text="Configuração")
        
        # Frame para Autenticação
        auth_frame = ttk.LabelFrame(config_frame, text="Autenticação")
        auth_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(auth_frame, text="POESESSID:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        ttk.Entry(auth_frame, textvariable=self.poesessid, width=50).grid(row=0, column=1, sticky=tk.W, padx=5, pady=5)
        
        ttk.Label(auth_frame, text="cf_clearance:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        ttk.Entry(auth_frame, textvariable=self.cf_clearance, width=50).grid(row=1, column=1, sticky=tk.W, padx=5, pady=5)
        
        ttk.Label(auth_frame, text="User-Agent:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=5)
        ttk.Entry(auth_frame, textvariable=self.useragent, width=50).grid(row=2, column=1, sticky=tk.W, padx=5, pady=5)
        
        ttk.Button(auth_frame, text="Salvar Configurações", command=self.save_config).grid(row=3, column=1, sticky=tk.W, padx=5, pady=5)
        ttk.Button(auth_frame, text="Extrair do Navegador", command=self.show_browser_instructions).grid(row=3, column=0, sticky=tk.W, padx=5, pady=5)
        
        # Frame para instruções
        instruction_frame = ttk.LabelFrame(config_frame, text="Como obter as credenciais")
        instruction_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        instructions = scrolledtext.ScrolledText(instruction_frame, wrap=tk.WORD, height=10)
        instructions.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        instructions.insert(tk.END, """
1. Abra o navegador (Chrome ou Firefox) e acesse https://www.pathofexile.com/
2. Faça login na sua conta
3. Abra as ferramentas de desenvolvedor (F12 ou Ctrl+Shift+I)
4. Vá para a aba "Application" (Chrome) ou "Storage" (Firefox)
5. No painel esquerdo, expanda "Cookies" e clique em "https://www.pathofexile.com"
6. Encontre o cookie "POESESSID" e copie seu valor
7. Encontre o cookie "cf_clearance" e copie seu valor
8. O User-Agent pode ser encontrado em qualquer requisição no painel "Network":
   - Faça alguma ação no site
   - Vá para a aba "Network"
   - Clique em qualquer requisição
   - Procure por "User-Agent" nos headers
   - Copie o valor completo

Observações:
- O cf_clearance é necessário para contornar a proteção Cloudflare
- Esses cookies expiram periodicamente, então você pode precisar atualizá-los
- Use o navegador onde você já está logado no Path of Exile
        """)
        instructions.config(state=tk.DISABLED)
        
        # Aba de Rastreamento
        tracker_frame = ttk.Frame(notebook)
        notebook.add(tracker_frame, text="Rastreador")
        
        # Frame para filtros
        filters_frame = ttk.LabelFrame(tracker_frame, text="Filtros de Busca")
        filters_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(filters_frame, text="Categoria de Item:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        category_combo = ttk.Combobox(filters_frame, textvariable=self.selected_category, width=30)
        category_combo['values'] = list(ITEM_CATEGORIES.keys())
        category_combo.grid(row=0, column=1, sticky=tk.W, padx=5, pady=5)
        category_combo.current(0)
        
        ttk.Label(filters_frame, text="Moeda:").grid(row=0, column=2, sticky=tk.W, padx=5, pady=5)
        currency_combo = ttk.Combobox(filters_frame, textvariable=self.selected_currency, width=10)
        currency_combo['values'] = CURRENCIES
        currency_combo.grid(row=0, column=3, sticky=tk.W, padx=5, pady=5)
        currency_combo.current(0)
        
        ttk.Label(filters_frame, text="Preço Min:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        ttk.Entry(filters_frame, textvariable=self.price_min, width=10).grid(row=1, column=1, sticky=tk.W, padx=5, pady=5)
        
        ttk.Label(filters_frame, text="Preço Max:").grid(row=1, column=2, sticky=tk.W, padx=5, pady=5)
        ttk.Entry(filters_frame, textvariable=self.price_max, width=10).grid(row=1, column=3, sticky=tk.W, padx=5, pady=5)
        
        # Frame para estatísticas
        stats_frame = ttk.LabelFrame(tracker_frame, text="Estatísticas (Filtros)")
        stats_frame.pack(fill=tk.X, padx=10, pady=5)
        
        self.stat_entries = []
        self.stat_values = []
        
        # Adicionar até 3 filtros de estatísticas iniciais
        for i in range(3):
            self.add_stat_filter(stats_frame, i)
        
        ttk.Button(stats_frame, text="Adicionar Estatística", command=lambda: self.add_stat_filter(stats_frame, len(self.stat_entries))).grid(row=len(self.stat_entries), column=0, columnspan=4, padx=5, pady=5)
        
        # Frame para controles
        control_frame = ttk.Frame(tracker_frame)
        control_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Button(control_frame, text="Buscar Itens", command=self.search_items).pack(side=tk.LEFT, padx=5, pady=5)
        
        ttk.Label(control_frame, text="Intervalo (segundos):").pack(side=tk.LEFT, padx=5, pady=5)
        ttk.Entry(control_frame, textvariable=self.polling_interval, width=5).pack(side=tk.LEFT, padx=5, pady=5)
        
        self.start_polling_button = ttk.Button(control_frame, text="Iniciar Monitoramento", command=self.start_polling)
        self.start_polling_button.pack(side=tk.LEFT, padx=5, pady=5)
        
        self.stop_polling_button = ttk.Button(control_frame, text="Parar Monitoramento", command=self.stop_polling, state=tk.DISABLED)
        self.stop_polling_button.pack(side=tk.LEFT, padx=5, pady=5)
        
        # Frame para status
        status_frame = ttk.Frame(tracker_frame)
        status_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(status_frame, text="Status:").pack(side=tk.LEFT, padx=5, pady=5)
        self.status_label = ttk.Label(status_frame, text="Pronto")
        self.status_label.pack(side=tk.LEFT, padx=5, pady=5)
        
        # Frame para resultados
        results_frame = ttk.LabelFrame(tracker_frame, text="Itens Encontrados")
        results_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Treeview para resultados
        columns = ('nome', 'preco', 'dps', 'vendedor', 'data_listagem', 'link')
        self.results_tree = ttk.Treeview(results_frame, columns=columns, show='headings')
        
        self.results_tree.heading('nome', text='Nome do Item')
        self.results_tree.heading('preco', text='Preço')
        self.results_tree.heading('dps', text='DPS')
        self.results_tree.heading('vendedor', text='Vendedor')
        self.results_tree.heading('data_listagem', text='Data')
        self.results_tree.heading('link', text='Link')
        
        self.results_tree.column('nome', width=250)
        self.results_tree.column('preco', width=100)
        self.results_tree.column('dps', width=100)
        self.results_tree.column('vendedor', width=150)
        self.results_tree.column('data_listagem', width=150)
        self.results_tree.column('link', width=100)
        
        scrollbar = ttk.Scrollbar(results_frame, orient=tk.VERTICAL, command=self.results_tree.yview)
        self.results_tree.configure(yscroll=scrollbar.set)
        
        self.results_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Vincular evento de clique duplo para abrir link
        self.results_tree.bind("<Double-1>", self.on_item_double_click)
        
        # Frame para detalhes
        details_frame = ttk.LabelFrame(tracker_frame, text="Detalhes do Item")
        details_frame.pack(fill=tk.X, padx=10, pady=5)
        
        self.details_text = scrolledtext.ScrolledText(details_frame, wrap=tk.WORD, height=10)
        self.details_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
    def add_stat_filter(self, parent, row):
        # Criar variáveis para combo e entry
        stat_var = tk.StringVar()
        value_var = tk.StringVar()
        
        # Adicionar às listas
        self.stat_entries.append(stat_var)
        self.stat_values.append(value_var)
        
        # Criar widgets
        ttk.Label(parent, text=f"Estatística {row+1}:").grid(row=row, column=0, sticky=tk.W, padx=5, pady=5)
        
        stat_combo = ttk.Combobox(parent, textvariable=stat_var, width=30)
        stat_combo['values'] = list(STAT_MAP.keys())
        stat_combo.grid(row=row, column=1, sticky=tk.W, padx=5, pady=5)
        
        ttk.Label(parent, text="Valor Min:").grid(row=row, column=2, sticky=tk.W, padx=5, pady=5)
        ttk.Entry(parent, textvariable=value_var, width=10).grid(row=row, column=3, sticky=tk.W, padx=5, pady=5)
    
    def save_config(self):
        config = configparser.ConfigParser()
        config['Authentication'] = {
            'poesessid': self.poesessid.get(),
            'cf_clearance': self.cf_clearance.get(),
            'useragent': self.useragent.get()
        }
        
        with open(CONFIG_FILE, 'w') as configfile:
            config.write(configfile)
        
        messagebox.showinfo("Configuração", "Configurações salvas com sucesso!")
    
    def load_config(self):
        if os.path.exists(CONFIG_FILE):
            config = configparser.ConfigParser()
            config.read(CONFIG_FILE)
            
            if 'Authentication' in config:
                self.poesessid.set(config['Authentication'].get('poesessid', ''))
                self.cf_clearance.set(config['Authentication'].get('cf_clearance', ''))
                self.useragent.set(config['Authentication'].get('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'))
    
    def show_browser_instructions(self):
        messagebox.showinfo("Extrair Cookies", """
Para extrair cookies e User-Agent automaticamente:

1. Abra o site do Path of Exile e faça login
2. Pressione F12 para abrir as ferramentas de desenvolvedor
3. Vá para a aba "Console"
4. Cole o seguinte comando e pressione Enter:

fetch('https://www.pathofexile.com').then(() => {
  let cookies = document.cookie.split('; ');
  let poesessid = cookies.find(c => c.startsWith('POESESSID='))?.split('=')[1] || 'não encontrado';
  let cf_clearance = cookies.find(c => c.startsWith('cf_clearance='))?.split('=')[1] || 'não encontrado';
  console.log(`POESESSID: ${poesessid}`);
  console.log(`cf_clearance: ${cf_clearance}`);
  console.log(`User-Agent: ${navigator.userAgent}`);
})

5. Copie os valores exibidos no console
        """)
    
    def update_status(self, message):
        self.status_label.config(text=message)
        self.root.update_idletasks()
    
    def build_search_payload(self):
        category = ITEM_CATEGORIES.get(self.selected_category.get(), "weapon")
        
        # Construir payload base
        payload = {
            "query": {
                "status": {"option": "online"},
                "stats": [{"type": "and", "filters": []}],
                "filters": {
                    "type_filters": {
                        "filters": {
                            "category": {"option": category}
                        }
                    }
                }
            },
            "sort": {"price": "asc"}
        }
        
        # Adicionar filtro de preço
        if self.price_min.get() or self.price_max.get():
            price_filter = {"option": self.selected_currency.get()}
            
            if self.price_min.get():
                try:
                    price_min = float(self.price_min.get())
                    price_filter["min"] = price_min
                except ValueError:
                    pass
            
            if self.price_max.get():
                try:
                    price_max = float(self.price_max.get())
                    price_filter["max"] = price_max
                except ValueError:
                    pass
            
            payload["query"]["filters"]["trade_filters"] = {
                "filters": {
                    "price": price_filter
                }
            }
        
        # Adicionar filtros de estatísticas
        for stat_var, value_var in zip(self.stat_entries, self.stat_values):
            stat_name = stat_var.get()
            value_str = value_var.get()
            
            if stat_name and value_str:
                try:
                    value = float(value_str)
                    stat_id = STAT_MAP.get(stat_name)
                    
                    if stat_id:
                        payload["query"]["stats"][0]["filters"].append({
                            "id": stat_id,
                            "value": {"min": value},
                            "disabled": False
                        })
                except ValueError:
                    continue
        
        return payload
    
    def search_items(self):
        # Verificar autenticação
        if not self.poesessid.get():
            messagebox.showerror("Erro", "POESESSID não configurado!")
            return
        
        self.update_status("Buscando itens...")
        
        # Limpar resultados anteriores
        for item in self.results_tree.get_children():
            self.results_tree.delete(item)
        
        self.details_text.delete(1.0, tk.END)
        
        # Construir headers
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': self.useragent.get(),
            'Accept': '*/*',
            'Origin': 'https://www.pathofexile.com',
            'Referer': 'https://www.pathofexile.com/trade2/search/poe2/Standard',
        }
        
        # Adicionar cookies
        cookies = {}
        if self.poesessid.get():
            cookies['POESESSID'] = self.poesessid.get()
        if self.cf_clearance.get():
            cookies['cf_clearance'] = self.cf_clearance.get()
        
        # URLs da API
        search_url = "https://www.pathofexile.com/api/trade2/search/poe2/Standard"
        
        # Construir payload
        payload = self.build_search_payload()
        
        try:
            # Requisição de busca
            search_response = requests.post(search_url, headers=headers, cookies=cookies, json=payload, timeout=30)
            
            if search_response.status_code != 200:
                self.update_status(f"Erro na busca: {search_response.status_code}")
                error_text = search_response.text
                self.details_text.insert(tk.END, f"Erro na requisição:\n{error_text}\n\nVerifique seus cookies e filtros!")
                return
            
            search_data = search_response.json()
            query_id = search_data.get("id")
            item_ids = search_data.get("result", [])
            total = search_data.get("total", 0)
            
            self.update_status(f"Encontrado(s) {total} item(ns). Buscando detalhes...")
            
            # Se não houver resultados
            if not item_ids:
                self.update_status("Nenhum item encontrado.")
                return
            
            # URL para o site de trade (para abrir no navegador)
            trade_url = f"https://www.pathofexile.com/trade2/search/poe2/{query_id}"
            
            # Adicionar link para os resultados no site
            self.details_text.insert(tk.END, f"Resultados no site oficial:\n{trade_url}\n\n")
            
            # Buscar detalhes dos itens em lotes de 10
            items_processed = 0
            for i in range(0, min(len(item_ids), 50), 10):
                batch = item_ids[i:i+10]
                batch_ids = ",".join(batch)
                
                fetch_url = f"https://www.pathofexile.com/api/trade2/fetch/{batch_ids}?query={query_id}&realm=poe2"
                
                # Respeitar rate limit
                if i > 0:
                    time.sleep(1)
                
                fetch_response = requests.get(fetch_url, headers=headers, cookies=cookies)
                
                if fetch_response.status_code != 200:
                    self.update_status(f"Erro ao buscar detalhes: {fetch_response.status_code}")
                    continue
                
                fetch_data = fetch_response.json()
                items = fetch_data.get("result", [])
                
                for item in items:
                    self.process_item(item, query_id)
                    items_processed += 1
            
            self.update_status(f"Busca concluída. {items_processed} itens processados.")
            
        except Exception as e:
            self.update_status(f"Erro: {str(e)}")
            import traceback
            self.details_text.insert(tk.END, f"Erro detalhado:\n{traceback.format_exc()}")
    
    def process_item(self, item_data, query_id):
        try:
            item_info = item_data.get("item", {})
            listing_info = item_data.get("listing", {})
            
            # Extrair informações básicas
            item_id = item_data.get("id", "")
            item_name = item_info.get("name", "")
            item_type = item_info.get("typeLine", "")
            full_name = f"{item_name} {item_type}".strip()
            
            # Extrair informações de preço
            price_info = listing_info.get("price", {})
            price_amount = price_info.get("amount")
            price_currency = price_info.get("currency", "")
            price_text = f"{price_amount} {price_currency}" if price_amount is not None else "Sem preço"
            
            # Extrair informações do vendedor
            seller = listing_info.get("account", {}).get("name", "Desconhecido")
            
            # Extrair data de listagem
            listing_date = listing_info.get("indexed", "")
            if listing_date:
                try:
                    date_obj = datetime.fromisoformat(listing_date.replace('Z', '+00:00'))
                    listing_date = date_obj.strftime('%d/%m/%Y %H:%M')
                except ValueError:
                    pass
            
            # Calcular DPS (se for arma)
            dps = "N/A"
            properties = item_info.get("properties", [])
            
            # Tentar extrair DPS ou outros valores relevantes
            for prop in properties:
                prop_name = prop.get("name", "")
                if "DPS" in prop_name and prop.get("values") and len(prop.get("values")) > 0:
                    dps_value = prop.get("values")[0][0]
                    dps = dps_value
                    break
            
            # Construir link para o item
            item_link = f"https://www.pathofexile.com/trade2/search/poe2/{query_id}/{item_id}"
            
            # Inserir na tabela de resultados
            self.results_tree.insert("", tk.END, values=(full_name, price_text, dps, seller, listing_date, "Abrir"), tags=(item_link,))
            
            # Preparar detalhes completos para quando o item for clicado
            item_details = {
                "id": item_id,
                "name": full_name,
                "price": price_text,
                "seller": seller,
                "listing_date": listing_date,
                "link": item_link,
                "properties": properties,
                "mods": item_info.get("explicitMods", []),
                "implicit_mods": item_info.get("implicitMods", []),
                "item_level": item_info.get("ilvl", "?"),
                "rarity": item_info.get("rarity", "normal"),
                "raw_data": item_data
            }
            
            # Armazenar detalhes usando o item_id como tag
            self.results_tree.item(self.results_tree.get_children()[-1], tags=(item_id, item_link))
            
            # Salvar no cache de detalhes
            self._item_details_cache = getattr(self, '_item_details_cache', {})
            self._item_details_cache[item_id] = item_details
            
        except Exception as e:
            print(f"Erro ao processar item: {str(e)}")
    
    def on_item_double_click(self, event):
        selected_item = self.results_tree.selection()
        if not selected_item:
            return
        
        item_id, link = self.results_tree.item(selected_item[0], "tags")
        
        # Exibir detalhes do item
        self.show_item_details(item_id)
        
        # Perguntar se quer abrir no navegador
        if messagebox.askyesno("Abrir Link", "Deseja abrir este item no navegador?"):
            import webbrowser
            webbrowser.open(link)
    
    def show_item_details(self, item_id):
        item_cache = getattr(self, '_item_details_cache', {})
        item_details = item_cache.get(item_id)
        
        if not item_details:
            return
        
        self.details_text.delete(1.0, tk.END)
        
        # Formatar detalhes do item
        self.details_text.insert(tk.END, f"=== {item_details['name']} ===\n", "title")
        self.details_text.insert(tk.END, f"Preço: {item_details['price']}\n")
        self.details_text.insert(tk.END, f"Vendedor: {item_details['seller']}\n")
        self.details_text.insert(tk.END, f"Listado em: {item_details['listing_date']}\n")
        self.details_text.insert(tk.END, f"Item Level: {item_details['item_level']}\n")
        
        # Propriedades
        self.details_text.insert(tk.END, "\n=== Propriedades ===\n", "header")
        for prop in item_details.get("properties", []):
            name = prop.get("name", "")
            values = prop.get("values", [])
            if values and len(values) > 0:
                self.details_text.insert(tk.END, f"{name}: {values[0][0]}\n")
            else:
                self.details_text.insert(tk.END, f"{name}\n")
        
        # Mods implícitos
        if item_details.get("implicit_mods"):
            self.details_text.insert(tk.END, "\n=== Modificadores Implícitos ===\n", "header")
            for mod in item_details["implicit_mods"]:
                self.details_text.insert(tk.END, f"{mod}\n", "implicit")
        
        # Mods explícitos
        if item_details.get("mods"):
            self.details_text.insert(tk.END, "\n=== Modificadores ===\n", "header")
            for mod in item_details["mods"]:
                self.details_text.insert(tk.END, f"{mod}\n", "mod")
        
        # Link
        self.details_text.insert(tk.END, f"\nLink: {item_details['link']}\n", "link")
        
        # Aplicar tags
        self.details_text.tag_configure("title", font=("Helvetica", 12, "bold"))
        self.details_text.tag_configure("header", font=("Helvetica", 10, "bold"))
        self.details_text.tag_configure("implicit", foreground="blue")
        self.details_text.tag_configure("mod", foreground="green")
        self.details_text.tag_configure("link", foreground="blue", underline=1)
    
    def start_polling(self):
        if self.is_polling:
            return
        
        try:
            interval = int(self.polling_interval.get())
            if interval < 5:
                messagebox.showwarning("Aviso", "O intervalo mínimo é de 5 segundos para evitar bloqueios.")
                interval = 5
                self.polling_interval.set("5")
        except ValueError:
            messagebox.showerror("Erro", "Intervalo inválido!")
            return
        
        self.is_polling = True
        self.stop_polling_flag.clear()
        
        self.start_polling_button.config(state=tk.DISABLED)
        self.stop_polling_button.config(state=tk.NORMAL)
        
        self.polling_thread = threading.Thread(target=self.polling_worker, args=(interval,), daemon=True)
        self.polling_thread.start()
    
    def stop_polling(self):
        if not self.is_polling:
            return
        
        self.stop_polling_flag.set()
        self.is_polling = False
        
        self.start_polling_button.config(state=tk.NORMAL)
        self.stop_polling_button.config(state=tk.DISABLED)
        
        self.update_status("Monitoramento parado.")
    
    def polling_worker(self, interval):
        while not self.stop_polling_flag.is_set():
            self.update_status("Executando busca periódica...")
            
            # Executar busca
            self.search_items()
            
            # Verificar se o monitoramento foi interrompido
            if self.stop_polling_flag.is_set():
                break
            
            # Aguardar pelo próximo ciclo
            self.update_status(f"Próxima busca em {interval} segundos...")
            
            # Usar wait com timeout para permitir interrupção
            self.stop_polling_flag.wait(timeout=interval)
        
        self.update_status("Monitoramento finalizado.")

if __name__ == "__main__":
    root = tk.Tk()
    app = PoeTracker(root)
    root.mainloop()

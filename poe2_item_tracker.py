
# -*- coding: utf-8 -*-
import requests
import json
import time
import os
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, simpledialog # Adicionado simpledialog
import threading
import configparser
import re
from datetime import datetime, timezone # Importar timezone
import traceback
import math # Importar math para isnan
import uuid # Para gerar IDs únicos para as abas

# --- Constantes (Mantidas Iguais) ---
CONFIG_FILE = 'poe2_config.ini'
STAT_MAP = {
    "Maximum Life": "explicit.stat_3299347043", "Increased Life": "explicit.stat_1671376347",
    "Maximum Mana": "explicit.stat_1050105434", "Increased Mana": "explicit.stat_4220027924",
    "Fire Resistance": "explicit.stat_3372524247", "Cold Resistance": "explicit.stat_3642289083",
    "Lightning Resistance": "explicit.stat_1010850144", "Chaos Resistance": "explicit.stat_3795704793",
    "Increased Physical Damage": "explicit.stat_1509134228", # Hash principal para %Phys
    "Increased Elemental Damage": "explicit.stat_2974417149",
    "Increased Spell Damage": "explicit.stat_1368271171", "Attack Speed": "explicit.stat_210067635",
    "Cast Speed": "explicit.stat_4277795662", "Critical Strike Chance": "explicit.stat_2628039082", # Flat base crit?
    "+#% Critical Strike Chance": "explicit.stat_2311243048", # Increased crit chance? Needs confirmation
    "Critical Strike Multiplier": "explicit.stat_2301191210", # Increased multi?
    "+#% Critical Strike Multiplier": "explicit.stat_2301191210", # Same? Needs check
    "Critical Damage Bonus": "explicit.stat_2694482655", # Likely Flat Multiplier
    "Attack Range": "explicit.stat_2469416729",
    "Strength": "explicit.stat_4080418644", "Dexterity": "explicit.stat_3261801346",
    "Intelligence": "explicit.stat_4043464511", "All Attributes": "explicit.stat_2026728709",
    "Movement Speed": "explicit.stat_3848254059",
    "Accuracy Rating": "explicit.stat_691932474", # Flat Accuracy
    "+#% Accuracy Rating": "explicit.stat_1069133534", # Increased Accuracy (often hybrid)
    "Physical Damage Leeched as Mana": "explicit.stat_3371059371", "Mana per Enemy Killed": "explicit.stat_105698561",
    "Reduced Attribute Requirements": "explicit.stat_3639275092",
    "Bolt Speed": "implicit.stat_1803308202",
    "Life per Enemy Killed": "explicit.stat_3695891184",
    "Adds # to # Physical Damage": "explicit.stat_1940865751", # Flat Phys
    "Adds # to # Fire Damage": "explicit.stat_709508406",    # Flat Fire
    "+# to Level of all Projectile Skills": "explicit.stat_1202301673"
}
ITEM_CATEGORIES = {
    "Any": "any", "Any Weapon": "weapon", "Any One-Handed Melee Weapon": "weapon.one", "Unarmed": "weapon.unarmed",
    "Claw": "weapon.claw", "Dagger": "weapon.dagger", "One-Handed Sword": "weapon.onesword", "One-Handed Axe": "weapon.oneaxe",
    "One-Handed Mace": "weapon.onemace", "Spear": "weapon.spear", "Flail": "weapon.flail", "Any Two-Handed Melee Weapon": "weapon.two",
    "Two-Handed Sword": "weapon.twosword", "Two-Handed Axe": "weapon.twoaxe", "Two-Handed Mace": "weapon.twomace",
    "Quarterstaff": "weapon.warstaff",  # <-- ADICIONADO
    "Any Ranged Weapon": "weapon.ranged", "Bow": "weapon.bow", "Crossbow": "weapon.crossbow",
    "Any Caster Weapon": "weapon.caster", "Wand": "weapon.wand", "Sceptre": "weapon.sceptre", "Staff": "weapon.staff",
    "Fishing Rod": "weapon.fishingrod", "Any Armour": "armour", "Helmet": "armour.helmet", "Body Armour": "armour.chest",
    "Gloves": "armour.gloves", "Boots": "armour.boots", "Quiver": "armour.quiver", "Shield": "armour.shield",
    "Focus": "armour.focus", "Buckler": "armour.buckler", "Any Accessory": "accessory", "Amulet": "accessory.amulet",
    "Belt": "accessory.belt", "Ring": "accessory.ring",
}
CURRENCIES = [
    "divine", "exalted", "chaos", "alchemy", "annulment", "regal", "vaal",
    "augmentation", "transmutation", "mirror", "gold"
]

# --- Novos Mapeamentos de DPS para Divine ---
# Mods que realmente afetam o DPS para armas
DAMAGE_MODS = [
    "Increased Physical Damage",
    "Adds # to # Physical Damage",
    "Attack Speed",
    "Critical Strike Chance",
    "+#% Critical Strike Chance",
    "Critical Strike Multiplier",
    "+#% Critical Strike Multiplier",
    "Critical Damage Bonus",
    "Adds # to # Fire Damage",
    "Adds # to # Cold Damage",
    "Adds # to # Lightning Damage",
    "+# to Level of all Projectile Skills"
]

# --- Definições de Cores (LIGHT_COLORS, DARK_COLORS) (Mantidas Iguais) ---
LIGHT_COLORS = {
    "bg": "#F0F0F0",  # Default light background
    "fg": "#000000",  # Default black text
    "widget_bg": "#FFFFFF", # White background for entries, lists etc.
    "widget_fg": "#000000",
    "tree_bg": "#FFFFFF",
    "tree_fg": "#000000",
    "tree_heading_bg": "#E0E0E0",
    "tree_heading_fg": "#000000",
    "tree_selected_bg": "#0078D7", # Standard blue selection
    "tree_selected_fg": "#FFFFFF",
    "log_bg": "#FFFFFF", # White background for text widgets
    "log_fg": "#000000",
    "status_bg": "#E0E0E0",
    "status_fg": "#000000",
    "button_bg": "#E0E0E0",
    "button_fg": "#000000",
    "labelframe_fg": "#333333",
    # Text Tags - Light Mode (Improved Contrast)
    "tag_title": {"font": ("Helvetica", 11, "bold")},
    "tag_header": {"font": ("Helvetica", 10, "bold"), "foreground": "#404040"},
    "tag_error": {"foreground": "#CC0000"}, # Brighter Red
    "tag_info": {"foreground": "#0000CC"}, # Brighter Blue
    "tag_debug": {"foreground": "#707070"}, # Darker Grey
    "tag_mod_implicit": {"foreground": "#6A0DAD"}, # Darker Purple
    "tag_mod_explicit": {"foreground": "#0000A0"}, # Slightly Lighter Dark Blue
    "tag_link": {"foreground": "#0000EE", "underline": 1}, # Standard Link Blue
    "tag_rarity_0": {"foreground": "#000000"},
    "tag_rarity_1": {"foreground": "#0000CD"}, # Medium Blue
    "tag_rarity_2": {"foreground": "#B8860B"},
    "tag_rarity_3": {"foreground": "#FF8C00"}, # Dark Orange (Keep)
    "tag_rarity_4": {"foreground": "#008080"}, # Teal (Keep)
    "tag_rarity_5": {"foreground": "#555555"}, # Darker Grey
    "tag_rarity_6": {"foreground": "#800080"}, # Purple (Keep)
    "tag_rarity_9": {"foreground": "#8B4513"}, # Saddle Brown (Keep)
    "tag_divine_good": {"foreground": "#006400", "font": ("Segoe UI", 10, "bold")}, # Changed Font
    "tag_divine_medium": {"foreground": "#B8860B", "font": ("Segoe UI", 10)},
    "tag_divine_bad": {"foreground": "#CC0000", "font": ("Segoe UI", 10)}, # Brighter Red
    "tag_divine_max": {"foreground": "#E07000", "font": ("Segoe UI", 10, "bold")}, # Brighter Orange
    "tag_divine_unknown": {"foreground": "#606060", "font": ("Segoe UI", 10)},
    "tag_divine_no_text": {"foreground": "#808080", "font": ("Segoe UI", 10)},
    # Treeview Row Tags - Light Mode
    "tree_worth_good_bg": "#C8E6C9",
    "tree_worth_medium_bg": "#FFF9C4",
    "tree_worth_bad_bg": "#FFCDD2",
    "tree_not_worth_bg": "#FFFFFF",
}
DARK_COLORS = {
    "bg": "#2E3440",  # Nord Polar Night base
    "fg": "#ECEFF4",  # Nord Snow Storm text
    "widget_bg": "#3B4252", # Nord Polar Night slightly lighter
    "widget_fg": "#ECEFF4",
    "tree_bg": "#3B4252",
    "tree_fg": "#ECEFF4",
    "tree_heading_bg": "#434C5E",
    "tree_heading_fg": "#ECEFF4",
    "tree_selected_bg": "#5E81AC", # Nord Frost blue selection
    "tree_selected_fg": "#ECEFF4",
    "log_bg": "#292E39", # Slightly darker for logs
    "log_fg": "#D8DEE9",
    "status_bg": "#3B4252",
    "status_fg": "#D8DEE9",
    "button_bg": "#4C566A",
    "button_fg": "#ECEFF4",
    "labelframe_fg": "#A3BE8C", # Nord Aurora Green for headers
    # Text Tags - Dark Mode (Nord Theme Colors)
    "tag_title": {"font": ("Helvetica", 11, "bold"), "foreground": "#E5E9F0"},
    "tag_header": {"font": ("Helvetica", 10, "bold"), "foreground": "#A3BE8C"}, # Green Header
    "tag_error": {"foreground": "#BF616A"}, # Red
    "tag_info": {"foreground": "#88C0D0"}, # Light Blue
    "tag_debug": {"foreground": "#6c7a94"}, # Greyish Blue
    "tag_mod_implicit": {"foreground": "#B48EAD"}, # Purple
    "tag_mod_explicit": {"foreground": "#81A1C1"}, # Blue
    "tag_link": {"foreground": "#88C0D0", "underline": 1}, # Light Blue Link
    "tag_rarity_0": {"foreground": "#ECEFF4"}, # Default Text
    "tag_rarity_1": {"foreground": "#81A1C1"}, # Blue
    "tag_rarity_2": {"foreground": "#EBCB8B"}, # Yellow
    "tag_rarity_3": {"foreground": "#D08770"}, # Orange
    "tag_rarity_4": {"foreground": "#8FBCBB"}, # Teal
    "tag_rarity_5": {"foreground": "#B0B8C4"}, # Lighter Grey
    "tag_rarity_6": {"foreground": "#B48EAD"}, # Purple
    "tag_rarity_9": {"foreground": "#A3BE8C"}, # Green (Relic color choice?)
    "tag_divine_good": {"foreground": "#A3BE8C", "font": ("Segoe UI", 10, "bold")}, # Green
    "tag_divine_medium": {"foreground": "#EBCB8B", "font": ("Segoe UI", 10)}, # Yellow
    "tag_divine_bad": {"foreground": "#BF616A", "font": ("Segoe UI", 10)}, # Red
    "tag_divine_max": {"foreground": "#D08770", "font": ("Segoe UI", 10, "bold")}, # Orange
    "tag_divine_unknown": {"foreground": "#6c7a94", "font": ("Segoe UI", 10)},
    "tag_divine_no_text": {"foreground": "#808a9c", "font": ("Segoe UI", 10)}, # Slightly lighter grey/blue
    # Treeview Row Tags - Dark Mode
    "tree_worth_good_bg": "#435243",
    "tree_worth_medium_bg": "#54503B",
    "tree_worth_bad_bg": "#5E4347",
    "tree_not_worth_bg": "#3B4252", # Same as tree background
}

class PoeTracker:
    def __init__(self, root):
        self.root = root
        # --- Variáveis Globais (Configuração, Tema) ---
        self.poesessid = tk.StringVar()
        self.cf_clearance = tk.StringVar()
        self.useragent = tk.StringVar(value="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36")
        self.dark_mode_enabled = tk.BooleanVar(value=False)
        self.style = ttk.Style(root)
        self.sort_column = None # Coluna de ordenação ativa (global)
        self.sort_reverse = False # Direção da ordenação (global)
        
        # --- Nova variável para controlar o modo de visualização de DPS ---
        self.dps_display_mode = tk.StringVar(value="Both") # "DPS", "PDPS", ou "Both"

        # --- Gerenciamento de Abas de Busca ---
        self.search_tabs_data = {} # Dicionário principal: {tab_id: {data...}, ...}
        self.search_notebook = None # Referência ao Notebook interno das buscas
        self.active_tab_id = None # ID da aba atualmente visível

        # --- Título e Geometria ---
        self.root.title("Path of Exile 2 - Item Tracker (v41.0 - Abas Múltiplas)") # Título Atualizado
        self.root.geometry("1550x850") # Aumentado para acomodar melhor

        self.create_ui()
        self.load_config()
        self.apply_theme() # Aplica tema inicial

    def create_ui(self):
        # --- Notebook Principal (Configuração | Rastreador) ---
        main_notebook = ttk.Notebook(self.root, style='TNotebook')
        main_notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        config_frame = ttk.Frame(main_notebook, style='TFrame')
        main_notebook.add(config_frame, text="Configuração")
        tracker_base_frame = ttk.Frame(main_notebook, style='TFrame') # Frame base para a aba Rastreador
        main_notebook.add(tracker_base_frame, text="Rastreador PoE 2")

        # --- Conteúdo da Aba Configuração ---
        auth_frame = ttk.LabelFrame(config_frame, text="Autenticação (Cookies)", style='TLabelframe')
        auth_frame.pack(fill=tk.X, padx=10, pady=5, ipady=5)
        ttk.Label(auth_frame, text="POESESSID:", style='TLabel').grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        ttk.Entry(auth_frame, textvariable=self.poesessid, width=80, style='TEntry').grid(row=0, column=1, sticky=tk.EW, padx=5, pady=5)
        ttk.Label(auth_frame, text="cf_clearance:", style='TLabel').grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        ttk.Entry(auth_frame, textvariable=self.cf_clearance, width=80, style='TEntry').grid(row=1, column=1, sticky=tk.EW, padx=5, pady=5)
        ttk.Label(auth_frame, text="User-Agent:", style='TLabel').grid(row=2, column=0, sticky=tk.W, padx=5, pady=5)
        ttk.Entry(auth_frame, textvariable=self.useragent, width=80, style='TEntry').grid(row=2, column=1, sticky=tk.EW, padx=5, pady=5)
        auth_frame.columnconfigure(1, weight=1)
        button_frame_auth = ttk.Frame(auth_frame, style='TFrame')
        button_frame_auth.grid(row=3, column=0, columnspan=2, sticky=tk.W, pady=5)
        ttk.Button(button_frame_auth, text="Salvar Configuração", command=self.save_config, style='TButton').pack(side=tk.LEFT, padx=5)
        # O botão de instruções agora só foca na aba, o widget de texto está abaixo
        ttk.Button(button_frame_auth, text="Ver Instruções Cookies", command=self.show_browser_instructions, style='TButton').pack(side=tk.LEFT, padx=5)

        instruction_frame = ttk.LabelFrame(config_frame, text="Como Obter os Cookies (POESESSID e cf_clearance)", style='TLabelframe')
        instruction_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        instructions_text = """
1. Abra o site oficial de trade do Path of Exile 2 no seu navegador (Chrome, Firefox, etc.).
   https://www.pathofexile.com/trade/search/poe2/Standard  (ou a liga que você joga)
2. Faça login na sua conta do PoE no site.
3. Abra as Ferramentas de Desenvolvedor do navegador (geralmente pressionando F12).
4. Vá para a aba "Application" (Chrome/Edge) ou "Storage" (Firefox).
5. No painel esquerdo, procure por "Cookies" e selecione o domínio "https://www.pathofexile.com".
6. Encontre os seguintes cookies na lista:
   - POESESSID: Copie o valor completo que aparece na coluna "Value" ou "Cookie Value".
   - cf_clearance: Copie o valor completo deste cookie também.
7. Cole os valores copiados nos campos correspondentes acima nesta aba de configuração.
8. O User-Agent padrão geralmente funciona, mas se tiver problemas, você pode copiá-lo do seu navegador:
   - No console das Ferramentas de Desenvolvedor (aba "Console"), digite: navigator.userAgent
   - Copie a string exibida e cole no campo "User-Agent".
9. Clique em "Salvar Configuração".

IMPORTANTE:
- Mantenha seus cookies SEGUROS! Não compartilhe o POESESSID com ninguém.
- Os cookies podem expirar. Se o rastreador parar de funcionar (erros 401/403), repita os passos para obter novos cookies.
- O 'cf_clearance' é do Cloudflare e pode mudar com mais frequência.
        """
        self.instructions_widget = scrolledtext.ScrolledText(instruction_frame, wrap=tk.WORD, height=10, relief=tk.FLAT, bd=0, font=("Segoe UI", 9))
        self.instructions_widget.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.instructions_widget.insert(tk.END, instructions_text)
        self.instructions_widget.config(state=tk.DISABLED)


        # --- Conteúdo da Aba Rastreador (Agora com Gerenciador de Abas) ---
        tracker_base_frame.rowconfigure(1, weight=1) # Linha para o notebook de buscas expandir
        tracker_base_frame.columnconfigure(0, weight=1)

        # Frame para botões de controle das abas de busca
        tab_control_frame = ttk.Frame(tracker_base_frame, style='TFrame')
        tab_control_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 2))

        add_tab_button = ttk.Button(tab_control_frame, text="+ Nova Busca", command=self.add_search_tab, style='TButton')
        add_tab_button.pack(side=tk.LEFT, padx=5)

        remove_tab_button = ttk.Button(tab_control_frame, text="- Fechar Busca Atual", command=self.remove_search_tab, style='TButton')
        remove_tab_button.pack(side=tk.LEFT, padx=5)

        rename_tab_button = ttk.Button(tab_control_frame, text="Renomear Busca", command=self.rename_search_tab, style='TButton')
        rename_tab_button.pack(side=tk.LEFT, padx=5)

        # --- Controles para Modo de DPS ---
        dps_mode_frame = ttk.Frame(tab_control_frame, style='TFrame')
        dps_mode_frame.pack(side=tk.RIGHT, padx=10)
        ttk.Label(dps_mode_frame, text="Modo DPS:", style='TLabel').pack(side=tk.LEFT, padx=(0, 5))
        ttk.Radiobutton(dps_mode_frame, text="DPS", variable=self.dps_display_mode, value="DPS", 
                     command=self.update_dps_display).pack(side=tk.LEFT)
        ttk.Radiobutton(dps_mode_frame, text="PDPS", variable=self.dps_display_mode, value="PDPS", 
                     command=self.update_dps_display).pack(side=tk.LEFT)
        ttk.Radiobutton(dps_mode_frame, text="Ambos", variable=self.dps_display_mode, value="Both", 
                     command=self.update_dps_display).pack(side=tk.LEFT)

        # Notebook interno para as abas de busca
        self.search_notebook = ttk.Notebook(tracker_base_frame, style='TNotebook')
        self.search_notebook.grid(row=1, column=0, sticky="nsew", padx=10, pady=(2, 10))
        self.search_notebook.bind("<<NotebookTabChanged>>", self.on_tab_change) # Evento para saber qual aba está ativa

        # --- Status Bar Global --- (Movido para fora do notebook de buscas)
        self.status_frame = ttk.Frame(self.root, relief=tk.SUNKEN, borderwidth=1, style='Status.TFrame') # Anexado à raiz
        self.status_frame.pack(side=tk.BOTTOM, fill=tk.X, padx=10, pady=(0,5)) # Pack no final
        self.status_label = ttk.Label(self.status_frame, text="Pronto", anchor=tk.W, style='Status.TLabel')
        self.status_label.pack(side=tk.LEFT, padx=5, pady=2, fill=tk.X, expand=True)
        self.dark_mode_button = ttk.Checkbutton(self.status_frame, text="Modo Escuro", variable=self.dark_mode_enabled, command=self.toggle_dark_mode, style='Toolbutton')
        self.dark_mode_button.pack(side=tk.RIGHT, padx=5, pady=1)

        # Adiciona a primeira aba de busca ao iniciar
        if not self.search_tabs_data:
             self.add_search_tab() # Nome padrão será gerado

    def add_search_tab(self, tab_name=None):
        """Adiciona uma nova aba de busca ao notebook."""
        tab_id = str(uuid.uuid4()) # ID único para a aba
        if not tab_name:
            tab_name = f"Busca {len(self.search_tabs_data) + 1}"

        # Frame que conterá tudo dentro da nova aba
        tab_frame = ttk.Frame(self.search_notebook, style='TFrame')
        tab_frame.pack(fill=tk.BOTH, expand=True) # Pack dentro do notebook

        # --- Criação do dicionário de dados da aba ---
        self.search_tabs_data[tab_id] = {
            'tab_frame': tab_frame, # Referência ao Frame da aba
            'name': tab_name,       # Nome visível da aba
            'selected_category': tk.StringVar(),
            'selected_currency': tk.StringVar(value="divine"),
            'price_min': tk.StringVar(),
            'price_max': tk.StringVar(),
            'dps_min': tk.StringVar(),
            'pdps_min': tk.StringVar(),
            'polling_interval': tk.StringVar(value="30"),
            'stat_entries': [],     # Lista de StringVars para nomes de stats
            'stat_min_values': [],  # Lista de StringVars para min values
            'stat_max_values': [],  # Lista de StringVars para max values
            'is_polling': False,
            'polling_thread': None,
            'stop_polling_flag': threading.Event(),
            '_item_details_cache': {},
            'query_id': None,       # ID da última busca da aba
            'log_messages': [],     # Opcional: Log por aba
            # Referências aos widgets importantes da aba (serão preenchidas em _setup_tab_widgets)
            'category_combo_widget': None,
            'stats_frame_container_widget': None,
            'add_stat_button': None,
            'results_tree': None,
            'details_text': None,
            'analysis_text': None,
            'start_polling_button': None,
            'stop_polling_button': None,
        }

        # Chama a função para criar a UI dentro da aba
        self._setup_tab_widgets(tab_frame, tab_id)

        # --- Adiciona a aba ao Notebook ---
        self.search_notebook.add(tab_frame, text=tab_name)
        self.search_notebook.select(tab_frame) # Seleciona a nova aba
        # self.active_tab_id é atualizado pelo evento on_tab_change

        self.apply_theme() # Aplica tema aos novos widgets
        self.log_message(f"Nova aba de busca '{tab_name}' criada.", "info", use_global_log=True)


    def _setup_tab_widgets(self, tab_frame, tab_id):
        """Cria e posiciona os widgets dentro do frame de uma aba de busca."""
        tab_data = self.search_tabs_data[tab_id]

        # --- Configuração da UI dentro da aba ---
        tab_frame.rowconfigure(1, weight=1) # Linha dos resultados/detalhes expande
        tab_frame.columnconfigure(0, weight=3); tab_frame.columnconfigure(1, weight=2); tab_frame.columnconfigure(2, weight=2)

        # Container superior para filtros e controles de stat
        top_controls_frame = ttk.Frame(tab_frame, style='TFrame')
        top_controls_frame.grid(row=0, column=0, columnspan=3, sticky="nsew", padx=10, pady=(10, 5))
        top_controls_frame.columnconfigure(0, weight=2); top_controls_frame.columnconfigure(1, weight=1)

        # -- Frame de Filtros Gerais --
        filters_frame = ttk.LabelFrame(top_controls_frame, text="Filtros de Busca", style='TLabelframe')
        filters_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 5), ipady=5)

        # Categoria com Autocomplete
        ttk.Label(filters_frame, text="Categoria:", style='TLabel').grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        category_combo = ttk.Combobox(filters_frame, textvariable=tab_data['selected_category'], width=30, style='TCombobox')
        category_combo.grid(row=0, column=1, columnspan=5, sticky=tk.EW, padx=5, pady=2)
        tab_data['category_combo_widget'] = category_combo # Guarda referência
        self._update_category_list_for_tab(tab_id) # Popula inicialmente
        category_combo.current(0)
        category_combo.bind('<KeyRelease>', lambda e, tid=tab_id: self._filter_category_combo_event_tab(e, tid))
        category_combo.bind('<Button-1>', lambda e, tid=tab_id: self._restore_category_list_event_tab(e, tid))
        category_combo.bind('<FocusOut>', lambda e, tid=tab_id: self._restore_category_list_event_tab(e, tid))

        # Moeda e Preço
        ttk.Label(filters_frame, text="Moeda:", style='TLabel').grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        currency_combo = ttk.Combobox(filters_frame, textvariable=tab_data['selected_currency'], width=12, style='TCombobox', values=CURRENCIES)
        currency_combo.grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        try: currency_combo.current(CURRENCIES.index("divine"))
        except ValueError: currency_combo.current(0)
        ttk.Label(filters_frame, text="Preço Min:", style='TLabel').grid(row=1, column=2, sticky=tk.W, padx=(15, 2), pady=2)
        ttk.Entry(filters_frame, textvariable=tab_data['price_min'], width=8, style='TEntry').grid(row=1, column=3, sticky=tk.W, padx=2, pady=2)
        ttk.Label(filters_frame, text="Max:", style='TLabel').grid(row=1, column=4, sticky=tk.W, padx=(10, 2), pady=2)
        ttk.Entry(filters_frame, textvariable=tab_data['price_max'], width=8, style='TEntry').grid(row=1, column=5, sticky=tk.W, padx=2, pady=2)

        # DPS/PDPS
        ttk.Label(filters_frame, text="DPS Min:", style='TLabel').grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        ttk.Entry(filters_frame, textvariable=tab_data['dps_min'], width=8, style='TEntry').grid(row=2, column=1, sticky=tk.W, padx=5, pady=2)
        ttk.Label(filters_frame, text="PDPS Min:", style='TLabel').grid(row=2, column=2, sticky=tk.W, padx=(15,2), pady=2)
        ttk.Entry(filters_frame, textvariable=tab_data['pdps_min'], width=8, style='TEntry').grid(row=2, column=3, sticky=tk.W, padx=2, pady=2)
        filters_frame.columnconfigure(1, weight=1); filters_frame.columnconfigure(3, weight=1); filters_frame.columnconfigure(5, weight=1)

        # Botões de Ação da Aba
        control_frame = ttk.Frame(filters_frame, style='TFrame')
        control_frame.grid(row=3, column=0, columnspan=6, pady=(10, 2), sticky="w")
        ttk.Button(control_frame, text="Buscar Itens", command=lambda tid=tab_id: self.search_items(tid), style='TButton').pack(side=tk.LEFT, padx=5)
        tab_data['start_polling_button'] = ttk.Button(control_frame, text="Monitorar", command=lambda tid=tab_id: self.start_polling(tid), style='TButton')
        tab_data['start_polling_button'].pack(side=tk.LEFT, padx=5)
        tab_data['stop_polling_button'] = ttk.Button(control_frame, text="Parar", command=lambda tid=tab_id: self.stop_polling(tid), state=tk.DISABLED, style='TButton')
        tab_data['stop_polling_button'].pack(side=tk.LEFT, padx=5)
        ttk.Label(control_frame, text="Intervalo (s):", style='TLabel').pack(side=tk.LEFT, padx=(15, 0))
        ttk.Entry(control_frame, textvariable=tab_data['polling_interval'], width=5, style='TEntry').pack(side=tk.LEFT, padx=(2, 5))

        # -- Frame de Filtros de Stats Específicos --
        stats_frame_container = ttk.LabelFrame(top_controls_frame, text="Filtros de Stats", style='TLabelframe')
        stats_frame_container.grid(row=0, column=1, sticky="nsew", padx=5, ipady=5)
        tab_data['stats_frame_container_widget'] = stats_frame_container # Guarda referência
        num_initial_stat_rows = 3
        for i in range(num_initial_stat_rows):
            self._add_stat_filter_widget(tab_id, i) # Adiciona linha de stat à UI da aba
        tab_data['add_stat_button'] = ttk.Button(stats_frame_container, text="+ Stat", style='TButton', command=lambda tid=tab_id: self._handle_add_stat_click_tab(tid))
        # A posição do botão é gerenciada em _add_stat_filter_widget e _handle_add_stat_click_tab
        tab_data['add_stat_button'].grid(row=num_initial_stat_rows, column=0, columnspan=7, padx=5, pady=(5,0), sticky="ew")


        # --- Área de Resultados (Treeview) ---
        results_frame = ttk.LabelFrame(tab_frame, text="Itens Encontrados", style='TLabelframe')
        results_frame.grid(row=1, column=0, sticky="nsew", padx=(10, 5), pady=5)
        results_frame.grid_rowconfigure(0, weight=1); results_frame.grid_columnconfigure(0, weight=1)
        columns = ('nome', 'preco', 'dps', 'vendedor', 'data_listagem', 'whisper')
        results_tree = ttk.Treeview(results_frame, columns=columns, show='headings', style='Treeview')
        tab_data['results_tree'] = results_tree # Armazena a referência
        # Configuração das colunas e headings
        results_tree.heading('nome', text='Nome', command=lambda c='nome': self.sort_treeview(c))
        results_tree.heading('preco', text='Preço', command=lambda c='preco': self.sort_treeview(c))
        results_tree.heading('dps', text='DPS/PDPS', command=lambda c='dps': self.sort_treeview(c))
        results_tree.heading('vendedor', text='Vendedor', command=lambda c='vendedor': self.sort_treeview(c))
        results_tree.heading('data_listagem', text='Listado em', command=lambda c='data_listagem': self.sort_treeview(c))
        results_tree.heading('whisper', text='Whisper', command=lambda: messagebox.showinfo("Ajuda - Whisper", "Clique duplo na linha de um item (na coluna 'Whisper' ou outra) para copiar a mensagem de compra."))
        results_tree.column('nome', width=250, anchor=tk.W); results_tree.column('preco', width=110, anchor=tk.E); results_tree.column('dps', width=90, anchor=tk.CENTER); results_tree.column('vendedor', width=130, anchor=tk.W); results_tree.column('data_listagem', width=100, anchor=tk.CENTER); results_tree.column('whisper', width=60, anchor=tk.CENTER)
        # Scrollbars
        vsb = ttk.Scrollbar(results_frame, orient=tk.VERTICAL, command=results_tree.yview, style='Vertical.TScrollbar')
        hsb = ttk.Scrollbar(results_frame, orient=tk.HORIZONTAL, command=results_tree.xview, style='Horizontal.TScrollbar')
        results_tree.configure(yscroll=vsb.set, xscroll=hsb.set)
        results_tree.grid(row=0, column=0, sticky='nsew'); vsb.grid(row=0, column=1, sticky='ns'); hsb.grid(row=1, column=0, sticky='ew')
        results_tree.bind("<Double-1>", lambda e, tid=tab_id: self.on_item_double_click(e, tid)) # Passa o tab_id

        # --- Área de Detalhes / Log da Aba ---
        details_frame = ttk.LabelFrame(tab_frame, text="Detalhes do Item / Log da Busca", style='TLabelframe')
        details_frame.grid(row=1, column=1, sticky="nsew", padx=5, pady=5)
        details_frame.rowconfigure(0, weight=1); details_frame.columnconfigure(0, weight=1)
        details_text = scrolledtext.ScrolledText(details_frame, wrap=tk.WORD, width=55, font=("Segoe UI", 10), relief=tk.FLAT, bd=0)
        details_text.grid(row=0, column=0, sticky="nsew", padx=2, pady=2)
        tab_data['details_text'] = details_text # Armazena referência
        details_text.config(state=tk.DISABLED)

        # --- Área de Análise (Divine Orb) ---
        analysis_frame = ttk.LabelFrame(tab_frame, text="Potencial do Item (Divine Orb)", style='TLabelframe')
        analysis_frame.grid(row=1, column=2, sticky="nsew", padx=(5, 10), pady=5)
        analysis_frame.rowconfigure(0, weight=1); analysis_frame.columnconfigure(0, weight=1)
        analysis_text = scrolledtext.ScrolledText(analysis_frame, wrap=tk.WORD, width=50, font=("Segoe UI", 10), relief=tk.FLAT, bd=0)
        analysis_text.grid(row=0, column=0, sticky="nsew", padx=2, pady=2)
        tab_data['analysis_text'] = analysis_text # Armazena referência
        analysis_text.config(state=tk.DISABLED)

    def _add_stat_filter_widget(self, tab_id, row_index):
        """Adiciona os widgets para uma linha de filtro de stat na UI da aba especificada."""
        if tab_id not in self.search_tabs_data: return
        tab_data = self.search_tabs_data[tab_id]
        parent_frame = tab_data.get('stats_frame_container_widget')
        if not parent_frame: return # Segurança

        stat_var = tk.StringVar()
        min_value_var = tk.StringVar()
        max_value_var = tk.StringVar()

        # Adiciona as variáveis às listas da aba
        tab_data['stat_entries'].append(stat_var)
        tab_data['stat_min_values'].append(min_value_var)
        tab_data['stat_max_values'].append(max_value_var)

        # Cria os widgets
        ttk.Label(parent_frame, text=f"Stat {row_index+1}:", style='TLabel').grid(row=row_index, column=0, sticky=tk.W, padx=5, pady=2)
        stat_combo = ttk.Combobox(parent_frame, textvariable=stat_var, width=25, style='TCombobox', values=[""] + sorted(list(STAT_MAP.keys())))
        stat_combo.grid(row=row_index, column=1, columnspan=2, sticky=tk.EW, padx=5, pady=2)
        ttk.Label(parent_frame, text="Min:", style='TLabel').grid(row=row_index, column=3, sticky=tk.W, padx=(10,2))
        ttk.Entry(parent_frame, textvariable=min_value_var, width=6, style='TEntry').grid(row=row_index, column=4, sticky=tk.W, padx=2)
        ttk.Label(parent_frame, text="Max:", style='TLabel').grid(row=row_index, column=5, sticky=tk.W, padx=2)
        ttk.Entry(parent_frame, textvariable=max_value_var, width=6, style='TEntry').grid(row=row_index, column=6, sticky=tk.W, padx=(2,5))
        parent_frame.columnconfigure(1, weight=1)

    def _handle_add_stat_click_tab(self, tab_id):
        """Adiciona uma nova linha de filtro de stat na aba especificada."""
        if tab_id not in self.search_tabs_data: return
        tab_data = self.search_tabs_data[tab_id]
        add_button = tab_data.get('add_stat_button')
        if not add_button: return # Segurança

        current_row_count = len(tab_data['stat_entries'])
        self._add_stat_filter_widget(tab_id, current_row_count)
        # Move o botão '+ Stat' para baixo
        add_button.grid(row=current_row_count + 1, column=0, columnspan=7, padx=5, pady=(5,0), sticky="ew")

    def remove_search_tab(self):
        """Remove a aba de busca atualmente ativa."""
        if not self.active_tab_id:
            messagebox.showinfo("Info", "Nenhuma aba de busca selecionada.")
            return

        if len(self.search_tabs_data) <= 1:
            messagebox.showwarning("Aviso", "Não é possível fechar a última aba de busca.")
            return

        tab_to_remove_id = self.active_tab_id
        tab_data = self.search_tabs_data[tab_to_remove_id]
        tab_name = tab_data['name']

        # Verifica se está monitorando
        is_polling_active = tab_data.get('is_polling', False)
        if is_polling_active:
            if messagebox.askyesno("Parar Monitoramento?", f"A busca '{tab_name}' está sendo monitorada.\nDeseja parar o monitoramento e fechar a aba?"):
                self.stop_polling(tab_to_remove_id, join_thread=True) # Tenta parar e aguardar thread
                # Re-verifica se parou (pode ter sido cancelado pelo usuário no join implícito)
                if self.search_tabs_data[tab_to_remove_id].get('is_polling', False):
                     return # Não parou, não remove
            else:
                return # Usuário cancelou

        # Procede com a remoção
        try:
             # Para o notebook esquecer o frame da aba
             self.search_notebook.forget(tab_data['tab_frame'])
             # Remove os dados da aba do dicionário
             del self.search_tabs_data[tab_to_remove_id]
             self.log_message(f"Aba de busca '{tab_name}' removida.", "info", use_global_log=True)
             # O evento <<NotebookTabChanged>> deve atualizar o active_tab_id,
             # mas podemos forçar a seleção da primeira aba restante se necessário.
             if self.search_tabs_data:
                 # Seleciona a primeira aba restante (índice 0)
                 first_remaining_tab_id = list(self.search_tabs_data.keys())[0]
                 self.search_notebook.select(self.search_tabs_data[first_remaining_tab_id]['tab_frame'])
             else:
                 self.active_tab_id = None # Nenhuma aba restante

        except Exception as e:
             self.log_message(f"Erro ao remover aba '{tab_name}': {e}", "error", use_global_log=True)
             messagebox.showerror("Erro", f"Não foi possível remover a aba:\n{e}")

    def rename_search_tab(self):
         """ Permite renomear a aba ativa """
         if not self.active_tab_id:
             messagebox.showinfo("Info", "Nenhuma aba selecionada para renomear.")
             return

         tab_data = self.search_tabs_data[self.active_tab_id]
         old_name = tab_data['name']

         new_name = simpledialog.askstring("Renomear Aba", f"Digite o novo nome para '{old_name}':", parent=self.root)

         if new_name and new_name.strip():
             new_name = new_name.strip()
             tab_data['name'] = new_name
             self.search_notebook.tab(tab_data['tab_frame'], text=new_name) # Atualiza texto da aba no notebook
             self.log_message(f"Aba '{old_name}' renomeada para '{new_name}'.", "info", use_global_log=True)
         elif new_name is not None: # Se clicou OK mas deixou vazio
             messagebox.showwarning("Nome Inválido", "O nome da aba não pode ser vazio.")

    def on_tab_change(self, event):
        """Callback quando a aba ativa do notebook de buscas muda."""
        try:
            # `select()` retorna o path do widget do frame da aba selecionada
            selected_widget_path = self.search_notebook.select()
            if not selected_widget_path: # Pode acontecer durante a remoção
                 self.active_tab_id = None
                 return

            # Encontra o tab_id cujo frame corresponde ao path selecionado
            new_active_id = None
            for tid, tdata in self.search_tabs_data.items():
                # Compara o path string do widget frame da aba
                if str(tdata.get('tab_frame')) == selected_widget_path:
                    new_active_id = tid
                    break

            if new_active_id:
                self.active_tab_id = new_active_id
                # Opcional: Atualizar status global
                # active_tab_name = self.search_tabs_data[self.active_tab_id]['name']
                # self.update_status(f"Aba ativa: {active_tab_name}")
            else:
                # Isso não deveria acontecer em operação normal
                # self.log_message("Não foi possível identificar a aba ativa após mudança.", "warning", use_global_log=True)
                self.active_tab_id = None # Garante que não fique com ID inválido

        except Exception as e:
            # Pode dar erro tk.TclError: invalid command name ".!notebook.!frame2.!notebook.!frame..." se a aba for destruída rapidamente
            # É geralmente seguro ignorar aqui.
            # self.log_message(f"Erro ao processar mudança de aba: {e}", "warning", use_global_log=True)
            self.active_tab_id = None # Reseta em caso de erro
            pass

    # --- Nova Função para Atualizar o Display de DPS/PDPS ---
    def update_dps_display(self):
        """Atualiza a exibição de DPS/PDPS em todas as abas com base no modo selecionado."""
        mode = self.dps_display_mode.get()
        
        # Itera por todas as abas e atualiza o display do DPS/PDPS
        for tab_id, tab_data in self.search_tabs_data.items():
            tree = tab_data.get('results_tree')
            if not tree or not tree.winfo_exists():
                continue
                
            # Atualiza o cabeçalho da coluna
            if mode == "DPS":
                tree.heading('dps', text='DPS')
            elif mode == "PDPS":
                tree.heading('dps', text='PDPS')
            else: # Both
                tree.heading('dps', text='DPS/PDPS')
                
            # Atualiza os valores nas linhas
            for item_id in tree.get_children():
                item_details = tab_data['_item_details_cache'].get(item_id)
                if not item_details:
                    continue
                    
                dps_num = item_details.get('dps')
                pdps_num = item_details.get('pdps')
                
                # Define o texto baseado no modo
                if mode == "DPS":
                    dps_display = f"{dps_num:.1f}" if dps_num is not None else "-"
                    tree.set(item_id, 'dps', dps_display)
                elif mode == "PDPS":
                    pdps_display = f"{pdps_num:.1f}" if pdps_num is not None else "-"
                    tree.set(item_id, 'dps', pdps_display)
                else: # Both
                    dps_display = f"{dps_num:.1f}" if dps_num is not None else "-"
                    pdps_display = f"{pdps_num:.1f}" if pdps_num is not None else "-"
                    dps_pdps_str = f"{dps_display}"
                    if pdps_display != "-" and pdps_display != dps_display:
                        dps_pdps_str += f" / {pdps_display}"
                    tree.set(item_id, 'dps', dps_pdps_str)
        
        # Opcional: Reordenar a lista se estiver ordenando por DPS
        if self.sort_column == 'dps' and self.active_tab_id:
            self.sort_treeview('dps', self.active_tab_id)

    # --- Funções de Autocomplete Adaptadas para Abas ---
    def _update_category_list_for_tab(self, tab_id, filter_text=""):
        """Atualiza a lista de valores do combobox de categoria da aba especificada."""
        if tab_id not in self.search_tabs_data: return
        tab_data = self.search_tabs_data[tab_id]
        category_combo = tab_data.get('category_combo_widget')
        if not category_combo or not category_combo.winfo_exists(): return

        filter_text = filter_text.lower().strip()
        all_categories = sorted(list(ITEM_CATEGORIES.keys()))
        if not filter_text:
            current_values = tuple([""] + all_categories)
        else:
            filtered = [cat for cat in all_categories if cat.lower().startswith(filter_text)]
            current_values = tuple([""] + filtered)

        # Evita redefinir se a lista não mudou (melhora performance)
        if category_combo['values'] != current_values:
            category_combo['values'] = current_values

    def _filter_category_combo_event_tab(self, event, tab_id):
        """Callback KeyRelease para combobox de categoria da aba."""
        if tab_id not in self.search_tabs_data: return
        tab_data = self.search_tabs_data[tab_id]
        category_combo = tab_data.get('category_combo_widget')
        if not category_combo or not category_combo.winfo_exists(): return

        # Ignora teclas que não modificam o texto
        ignore_keys = ('Shift_L', 'Shift_R', 'Control_L', 'Control_R', 'Alt_L', 'Alt_R',
                       'Up', 'Down', 'Left', 'Right', 'Tab', 'Caps_Lock', 'Num_Lock',
                       'Home', 'End', 'Page_Up', 'Page_Down', 'Insert', 'Delete', 'Escape',
                       'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12')
        if event.keysym in ignore_keys:
             return
        # Se pressionou Enter ou Tab, talvez restaurar a lista completa? (Opcional)
        # if event.keysym in ('Return', 'KP_Enter', 'Tab'):
        #      self.root.after(100, lambda tid=tab_id: self._update_category_list_for_tab(tid))
        #      return

        current_text = tab_data['selected_category'].get()
        self._update_category_list_for_tab(tab_id, current_text)

        # Força a abertura da lista suspensa após um pequeno delay
        # para permitir que a atualização de 'values' seja processada
        def open_dropdown():
            if category_combo.winfo_exists():
                # Tenta gerar o evento para abrir. Pode não funcionar 100% em todos os OS/themes.
                # Uma alternativa é definir o foco e depois gerar <Down>, mas pode ser intrusivo.
                 try:
                    # category_combo.focus_set() # Pode tirar o foco de onde o usuário estava digitando
                    category_combo.event_generate('<Button-1>') # Simula clique para abrir
                    category_combo.event_generate('<Down>')     # Move para a primeira opção
                 except tk.TclError: pass # Ignora erro se widget for destruído
        self.root.after(50, open_dropdown)


    def _restore_category_list_event_tab(self, event, tab_id):
         """Callback para restaurar lista completa da categoria da aba (Click, FocusOut)."""
         # Delay para permitir a seleção antes de restaurar a lista completa
         self.root.after(150, lambda tid=tab_id: self._update_category_list_for_tab(tid))

    def load_config(self):
        """Carrega configurações globais (cookies, tema)."""
        if os.path.exists(CONFIG_FILE):
            config = configparser.ConfigParser()
            try:
                config.read(CONFIG_FILE)
                if 'Authentication' in config:
                    self.poesessid.set(config['Authentication'].get('poesessid', ''))
                    self.cf_clearance.set(config['Authentication'].get('cf_clearance', ''))
                    default_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
                    self.useragent.set(config['Authentication'].get('useragent', default_ua))
                    self.log_message("Configuração de autenticação carregada.", "info", use_global_log=True)
                else:
                     self.log_message(f"Seção [Authentication] não encontrada.", "warning", use_global_log=True)

                if 'Preferences' in config:
                    dark_mode_pref = config['Preferences'].getboolean('DarkMode', False)
                    self.dark_mode_enabled.set(dark_mode_pref)
                    self.log_message(f"Preferência de tema carregada (Modo Escuro: {dark_mode_pref}).", "info", use_global_log=True)

                # Opcional: Carregar estado das abas (mais complexo, não implementado aqui)
                # Ex: Ler seções [Busca1], [Busca2] e recriar as abas com seus filtros

            except Exception as e:
                messagebox.showerror("Erro ao Carregar", f"Falha ao ler arquivo de configuração:\n{e}")
                self.log_message(f"Falha ao carregar config: {e}", "error", use_global_log=True)
        else:
            self.log_message(f"Arquivo '{CONFIG_FILE}' não encontrado. Usando padrões.", "info", use_global_log=True)

    def save_config(self):
        """Salva configurações globais (cookies, tema)."""
        config = configparser.ConfigParser()
        if os.path.exists(CONFIG_FILE):
            try: config.read(CONFIG_FILE) # Preserva outras seções
            except Exception as e_read:
                self.log_message(f"Aviso: Não foi possível ler config existente ao salvar: {e_read}", "warning", use_global_log=True)

        if 'Authentication' not in config: config['Authentication'] = {}
        config['Authentication']['poesessid'] = self.poesessid.get()
        config['Authentication']['cf_clearance'] = self.cf_clearance.get()
        config['Authentication']['useragent'] = self.useragent.get()

        if 'Preferences' not in config: config['Preferences'] = {}
        config['Preferences']['DarkMode'] = str(self.dark_mode_enabled.get())

        # Opcional: Salvar estado das abas (filtros, nomes)
        # Ex: Iterar por self.search_tabs_data e criar seções [Busca_ID] ou [Busca_Nome]

        try:
            with open(CONFIG_FILE, 'w') as configfile:
                config.write(configfile)
            # Não mostra messagebox ao salvar no fechamento, apenas log
            self.log_message("Configuração salva.", "info", use_global_log=True)
        except Exception as e:
            messagebox.showerror("Erro ao Salvar", f"Falha ao salvar configuração:\n{e}")
            self.log_message(f"Falha ao salvar config: {e}", "error", use_global_log=True)

    def show_browser_instructions(self):
        """Foca na aba de configuração para mostrar as instruções."""
        try:
            if not self.root.winfo_exists(): return
            # Acha o notebook principal (assumindo ser o primeiro filho da raiz)
            main_notebook = self.root.winfo_children()[0]
            if isinstance(main_notebook, ttk.Notebook):
                # Tenta encontrar o índice da aba "Configuração"
                config_tab_index = -1
                for i, tab_id_widget in enumerate(main_notebook.tabs()):
                     tab_info = main_notebook.tab(tab_id_widget)
                     if tab_info and tab_info.get("text") == "Configuração":
                          config_tab_index = i
                          break
                if config_tab_index != -1:
                     main_notebook.select(config_tab_index) # Seleciona a aba
                else: # Fallback
                     messagebox.showinfo("Instruções Cookies", "Vá para a aba 'Configuração' para ver as instruções (não foi possível focar automaticamente).")
            else: messagebox.showinfo("Instruções Cookies", "Vá para a aba 'Configuração' (erro ao encontrar notebook principal).")
        except Exception as e:
             if self.root.winfo_exists():
                  messagebox.showinfo("Instruções Cookies", f"Vá para a aba 'Configuração'.\n(Erro ao focar: {e})")

    def update_status(self, message):
        """Atualiza a barra de status global."""
        def _update():
            try:
                if hasattr(self, 'status_label') and self.status_label.winfo_exists():
                    self.status_label.config(text=message)
            except tk.TclError: pass
            except AttributeError: pass
        if hasattr(self, 'root') and self.root.winfo_exists():
            self.root.after(0, _update)

    def log_message(self, message, level="info", tab_id=None, use_global_log=False):
        """Loga mensagem no painel de detalhes da aba ativa/especificada ou globalmente (console)."""
        log_widget = None

        # Determina onde logar
        if use_global_log:
            # Log global vai para o console
            print(f"LOG GLOBAL ({level}): {message}")
            return # Não tenta logar em widget de aba

        # Se não for global, tenta logar na aba especificada ou ativa
        target_tab_id = tab_id if tab_id else self.active_tab_id
        if target_tab_id and target_tab_id in self.search_tabs_data:
            tab_data = self.search_tabs_data[target_tab_id]
            log_widget = tab_data.get('details_text')
        else:
            # Se não achou aba válida, loga no console com aviso
            print(f"LOG ({level}) [Aba:{target_tab_id or 'N/A(Ativa?)'} - Inválida/Widget Nulo]: {message}")
            return

        # Se achou o widget da aba, loga nele
        if not log_widget: # Double check (deve ter sido pego acima)
            print(f"LOG ({level}) [Aba:{target_tab_id} - Widget Nulo 2]: {message}")
            return

        # Garante que a atualização da UI ocorra na thread principal (lógica igual)
        def _log_to_widget():
            if not log_widget or not log_widget.winfo_exists():
                # Fallback se widget sumiu entre a chamada e a execução do after()
                print(f"LOG UI ({level}) [Aba:{target_tab_id}] - Widget não existe mais: {message}")
                return
            try:
                colors = DARK_COLORS if self.dark_mode_enabled.get() else LIGHT_COLORS
                # Usa tag de nível ou fallback para 'info'
                tag = level if f"tag_{level}" in colors else "info"
                original_state = str(log_widget.cget('state'))
                if original_state == tk.DISABLED:
                    log_widget.config(state=tk.NORMAL)

                now = datetime.now().strftime("%H:%M:%S")
                log_widget.insert(tk.END, f"[{now}] ", ("debug",)) # Timestamp sempre debug
                log_widget.insert(tk.END, f"{message}\n", (tag,)) # Mensagem com tag de nível

                log_widget.see(tk.END) # Rola para o final
                if original_state == tk.DISABLED:
                    log_widget.config(state=tk.DISABLED)
            except tk.TclError: # Ignora erro se janela fechada durante o processo
                # print(f"LOG UI ({level}) [Aba:{target_tab_id}] - TclError: {message}") # Verboso demais
                pass
            except Exception as e:
                print(f"Erro ao logar na UI [Aba:{target_tab_id}]: {e}\nMensagem ({level}): {message}")

        if hasattr(self, 'root') and self.root.winfo_exists():
            self.root.after(0, _log_to_widget)


    def build_search_payload(self, tab_id):
        """Constrói o payload da API usando os filtros da aba especificada."""
        if tab_id not in self.search_tabs_data:
             self.log_message(f"Erro: Tentando construir payload para aba inexistente ID {tab_id}", "error", use_global_log=True)
             return None
        tab_data = self.search_tabs_data[tab_id]
        tab_name = tab_data['name'] # Para logs

        payload = {
            "query": {
                "status": {"option": "online"},
                "stats": [{"type": "and", "filters": []}],
                "filters": {}
            },
            "sort": {"price": "asc"}
        }
        stat_filters_list = payload["query"]["stats"][0]["filters"]

        # Filtro de Categoria
        category_key = tab_data['selected_category'].get()
        if category_key and category_key in ITEM_CATEGORIES:
            category_value = ITEM_CATEGORIES[category_key]
            if category_value != "any":
                if "type_filters" not in payload["query"]["filters"]:
                    payload["query"]["filters"]["type_filters"] = {"filters": {}}
                payload["query"]["filters"]["type_filters"]["filters"]["category"] = {"option": category_value}
        elif category_key:
            messagebox.showwarning("Categoria Inválida", f"Categoria '{category_key}' não encontrada. Removendo filtro.")
            payload["query"]["filters"].pop("type_filters", None)

        # Filtro de Preço
        price_filter = {"option": tab_data['selected_currency'].get()}
        price_min_val, price_max_val = None, None
        try:
            if tab_data['price_min'].get():
                price_min_val = float(tab_data['price_min'].get())
                price_filter["min"] = price_min_val
            if tab_data['price_max'].get():
                price_max_val = float(tab_data['price_max'].get())
                price_filter["max"] = price_max_val
            if price_min_val is not None or price_max_val is not None:
                if "trade_filters" not in payload["query"]["filters"]:
                    payload["query"]["filters"]["trade_filters"] = {"filters": {}}
                payload["query"]["filters"]["trade_filters"]["filters"]["price"] = price_filter
        except ValueError:
            messagebox.showerror("Erro de Valor", "Valor inválido para Preço Mínimo ou Máximo.")
            self.log_message("Erro de valor em Preço.", "error", tab_id=tab_id)
            return None

        # Filtros DPS/PDPS
        try:
            dps_min_val = float(tab_data['dps_min'].get()) if tab_data['dps_min'].get() else None
            pdps_min_val = float(tab_data['pdps_min'].get()) if tab_data['pdps_min'].get() else None
            equipment_filters_dict = {}
            if dps_min_val is not None:
                equipment_filters_dict["dps"] = {"min": dps_min_val}
                self.log_message(f"Filtro API: dps >= {dps_min_val}", "debug", tab_id=tab_id)
            if pdps_min_val is not None:
                equipment_filters_dict["pdps"] = {"min": pdps_min_val}
                self.log_message(f"Filtro API: pdps >= {pdps_min_val}", "debug", tab_id=tab_id)
            if equipment_filters_dict:
                if "filters" not in payload["query"]: payload["query"]["filters"] = {}
                if "equipment_filters" not in payload["query"]["filters"]:
                    payload["query"]["filters"]["equipment_filters"] = {"filters": {}}
                payload["query"]["filters"]["equipment_filters"]["filters"].update(equipment_filters_dict)
        except ValueError:
            messagebox.showerror("Erro de Valor", "Valor inválido para DPS Mínimo ou PDPS Mínimo.")
            self.log_message("Erro de valor em DPS/PDPS.", "error", tab_id=tab_id)
            return None

        # Filtros de Stats Específicos
        for stat_var, min_var, max_var in zip(tab_data['stat_entries'], tab_data['stat_min_values'], tab_data['stat_max_values']):
            stat_name = stat_var.get()
            min_str = min_var.get()
            max_str = max_var.get()
            if stat_name and (min_str or max_str):
                stat_id = STAT_MAP.get(stat_name)
                if stat_id:
                    value_filter = {}
                    try:
                        if min_str: value_filter["min"] = float(min_str)
                        if max_str: value_filter["max"] = float(max_str)
                        if value_filter:
                            stat_filters_list.append({"id": stat_id, "value": value_filter, "disabled": False})
                            self.log_message(f"Filtro API: {stat_name} ({stat_id}) = {value_filter}", "debug", tab_id=tab_id)
                    except ValueError:
                        messagebox.showerror("Erro de Valor", f"Valor inválido para Mín/Máx de '{stat_name}'.")
                        self.log_message(f"Erro de valor em Stat: {stat_name}", "error", tab_id=tab_id)
                        return None
                else:
                    self.log_message(f"Aviso: ID da API não encontrado para stat '{stat_name}'. Filtro ignorado.", "warning", tab_id=tab_id)

        # Remove a chave "stats" se nenhuma filtro de stat foi adicionado
        if not stat_filters_list:
            payload["query"].pop("stats", None)

        self.log_message("Payload construído.", "debug", tab_id=tab_id)
        # print(json.dumps(payload, indent=2)) # DEBUG: Imprime o payload
        return payload

    def search_items(self, tab_id):
        """Executa a busca de itens para a aba especificada."""
        if tab_id not in self.search_tabs_data:
             self.log_message(f"Tentativa de busca em aba inválida: {tab_id}", "error", use_global_log=True)
             return
        tab_data = self.search_tabs_data[tab_id]
        tab_name = tab_data['name']

        # Verifica cookies globais
        if not self.poesessid.get() or not self.cf_clearance.get():
            messagebox.showerror("Erro de Autenticação", "POESESSID e/ou cf_clearance não configurados. Verifique a aba 'Configuração'.")
            return

        # Limpa a interface DA ABA antes da busca
        self.update_status(f"[{tab_name}] Limpando resultados...") # Status global indica a aba
        try:
            results_tree = tab_data.get('results_tree')
            if results_tree and results_tree.winfo_exists():
                for item in results_tree.get_children():
                    results_tree.delete(item)
            tab_data['_item_details_cache'].clear() # Limpa cache da aba

            colors = DARK_COLORS if self.dark_mode_enabled.get() else LIGHT_COLORS
            for widget_key in ['details_text', 'analysis_text']:
                widget = tab_data.get(widget_key)
                if widget and widget.winfo_exists():
                    try:
                        widget.config(state=tk.NORMAL, bg=colors["log_bg"])
                        widget.delete(1.0, tk.END)
                        widget.config(state=tk.DISABLED)
                    except Exception as e: print(f"Erro limpando {widget_key} na aba {tab_id}: {e}")
        except Exception as e_clear:
            self.log_message(f"Erro ao limpar UI da aba: {e_clear}", "error", tab_id=tab_id)

        # Garante que a limpeza seja visível antes de construir o payload
        if hasattr(self, 'root') and self.root.winfo_exists(): self.root.update_idletasks()

        self.update_status(f"[{tab_name}] Construindo payload...")
        payload = self.build_search_payload(tab_id) # Passa o ID da aba
        if payload is None:
            self.update_status(f"[{tab_name}] Pronto (Falha payload)")
            return

        headers = {
            'Content-Type': 'application/json',
            'User-Agent': self.useragent.get(), # Global
            'Accept': 'application/json'
        }
        cookies = {
            'POESESSID': self.poesessid.get(), # Global
            'cf_clearance': self.cf_clearance.get() # Global
        }
        league = "Standard" # TODO: Tornar configurável (global ou por aba?)
        search_url = f"https://www.pathofexile.com/api/trade2/search/poe2/{league}"

        self.log_message(f"Enviando busca para: {search_url}", "info", tab_id=tab_id)
        self.update_status(f"[{tab_name}] Enviando requisição...")
        try:
            # --- Requisição POST para obter IDs ---
            search_response = requests.post(search_url, headers=headers, cookies=cookies, json=payload, timeout=45)
            self.log_message(f"Resposta da busca recebida (Status: {search_response.status_code})", "info", tab_id=tab_id)

            # Tratamento de Erros da Requisição de Busca
            if search_response.status_code != 200:
                error_msg = f"Erro API busca ({search_response.status_code})."
                try:
                    error_details = search_response.json()
                    api_error_msg = error_details.get("error", {}).get("message", "")
                    if api_error_msg: error_msg += f"\nAPI: {api_error_msg}"
                    self.log_message(f"Detalhes erro API (busca): {json.dumps(error_details, indent=2)}", "error", tab_id=tab_id)
                except json.JSONDecodeError:
                    error_msg += f"\nResposta não JSON: {search_response.text[:200]}"
                    self.log_message(f"Resposta não JSON (busca {search_response.status_code}): {search_response.text}", "error", tab_id=tab_id)
                # Adiciona dicas baseadas no status code
                if search_response.status_code == 400: error_msg += "\nVerifique os filtros (payload inválido?)."
                elif search_response.status_code in [401, 403]: error_msg += "\nErro autenticação. Verifique os Cookies."
                elif search_response.status_code == 429: error_msg += "\nLimite de requisições (Rate Limit). Aguarde."
                elif search_response.status_code >= 500: error_msg += "\nErro no servidor da GGG."

                self.update_status(f"[{tab_name}] Erro {search_response.status_code} busca")
                messagebox.showerror(f"Erro {search_response.status_code} - Busca", error_msg)
                return

            # --- Processamento da Resposta da Busca ---
            search_data = search_response.json()
            query_id = search_data.get("id")
            item_ids = search_data.get("result", [])
            total_results = search_data.get("total", 0)

            if not query_id:
                self.log_message("Erro: Resposta da busca sem ID da query.", "error", tab_id=tab_id)
                self.update_status(f"[{tab_name}] Erro: Resposta API inválida")
                return

            tab_data['query_id'] = query_id # GUARDA O ID DA BUSCA NA ABA
            self.update_status(f"[{tab_name}] ID: {query_id[:8]}.. Total: {total_results}. Buscando detalhes...")
            self.log_message(f"ID Query: {query_id}. Total API: {total_results}", "info", tab_id=tab_id)

            if not item_ids:
                self.update_status(f"[{tab_name}] Nenhum item encontrado.")
                self.log_message("Nenhum resultado encontrado.", "info", tab_id=tab_id)
                return

            # --- Requisições GET para buscar detalhes em lotes ---
            items_processed = 0
            max_items_to_fetch = 100 # Limite (pode ser configurável)
            fetch_delay = 1.1 # Aumentar ligeiramente o delay
            item_ids_to_fetch = item_ids[:max_items_to_fetch]
            if total_results > max_items_to_fetch:
                self.log_message(f"Limitando detalhes aos primeiros {max_items_to_fetch} de {total_results} itens.", "warning", tab_id=tab_id)
                self.update_status(f"[{tab_name}] ID: {query_id[:8]}.. Total: {total_results}. Buscando {max_items_to_fetch}...")

            stop_flag = tab_data.get('stop_polling_flag', threading.Event()) # Pega a flag da aba

            for i in range(0, len(item_ids_to_fetch), 10): # Lotes de 10
                if stop_flag.is_set():
                    self.log_message("Busca interrompida pelo usuário.", "info", tab_id=tab_id)
                    break

                batch = item_ids_to_fetch[i:i + 10]
                batch_ids_str = ",".join(batch)
                fetch_url = f"https://www.pathofexile.com/api/trade2/fetch/{batch_ids_str}?query={tab_data['query_id']}&realm=poe2" # Usa query_id da aba
                self.update_status(f"[{tab_name}] Buscando detalhes {i + 1}-{min(i + 10, len(item_ids_to_fetch))}...")

                if i > 0: time.sleep(fetch_delay) # Delay entre lotes

                self.log_message(f"Enviando GET fetch: {fetch_url[:150]}...", "debug", tab_id=tab_id)
                try:
                    fetch_response = requests.get(fetch_url, headers=headers, cookies=cookies, timeout=30)
                except requests.exceptions.Timeout:
                    self.log_message(f"Timeout ao buscar detalhes lote {i // 10 + 1}.", "error", tab_id=tab_id)
                    continue
                except requests.exceptions.RequestException as fetch_req_err:
                    self.log_message(f"Erro rede buscar detalhes lote {i // 10 + 1}: {fetch_req_err}.", "error", tab_id=tab_id)
                    continue

                self.log_message(f"Resposta fetch recebida ({fetch_response.status_code}) - Lote {i // 10 + 1}", "debug", tab_id=tab_id)

                if fetch_response.status_code != 200:
                    self.log_message(f"Erro {fetch_response.status_code} buscar detalhes lote {i // 10 + 1}.", "error", tab_id=tab_id)
                    try:
                        error_details = fetch_response.json()
                        self.log_message(f"Detalhes erro fetch: {json.dumps(error_details)}", "error", tab_id=tab_id)
                    except:
                        self.log_message(f"Resposta erro fetch (não JSON): {fetch_response.text[:200]}", "error", tab_id=tab_id)

                    # Erros críticos param a busca da aba
                    if fetch_response.status_code in [401, 403, 429]:
                        msg = f"Erro crítico {fetch_response.status_code} ao buscar detalhes. Verifique cookies ou aguarde (Rate Limit)."
                        messagebox.showerror(f"Erro Crítico {fetch_response.status_code} - Fetch", msg)
                        self.update_status(f"[{tab_name}] Erro {fetch_response.status_code} - Busca Abortada")
                        # Se estiver no polling, para o polling da aba
                        if tab_data.get('is_polling', False):
                             self.stop_polling(tab_id)
                        return # Para a busca atual
                    continue # Continua para próximo lote se não for erro crítico

                # --- Processamento dos Detalhes do Lote ---
                try:
                    fetch_data = fetch_response.json()
                except json.JSONDecodeError:
                    self.log_message(f"Erro decodificar JSON fetch lote {i // 10 + 1}.", "error", tab_id=tab_id)
                    continue

                items = fetch_data.get("result", [])
                if not items:
                    self.log_message(f"Lote {i // 10 + 1} não retornou itens nos detalhes.", "warning", tab_id=tab_id)
                    continue

                for item_detail in items:
                     if stop_flag.is_set(): break
                     if not item_detail:
                          self.log_message(f"Item nulo/vazio no lote {i // 10 + 1}.", "warning", tab_id=tab_id)
                          continue
                     # Chama process_item PASSANDO O TAB_ID
                     self.process_item(item_detail, tab_data['query_id'], tab_id)
                     items_processed += 1
                if stop_flag.is_set(): break # Sai do loop de lotes se interrompido

            # --- Finalização da Busca ---
            final_status_msg = f"Busca concluída. {items_processed} itens exibidos."
            if items_processed < total_results:
                 if items_processed >= max_items_to_fetch:
                      final_status_msg += f" (Limite {max_items_to_fetch} de {total_results} totais)"
                 else:
                      final_status_msg += f" (de {total_results} totais)"
            # Atualiza status apenas se o polling não estiver ativo (evita sobrescrever msg de espera)
            if not tab_data.get('is_polling', False) or stop_flag.is_set():
                self.update_status(f"[{tab_name}] {final_status_msg}")
            self.log_message(final_status_msg, "info", tab_id=tab_id)

            # Reordena o treeview DA ABA se uma coluna estava selecionada globalmente
            if self.sort_column:
                 # A função sort_treeview precisa saber qual treeview ordenar
                 self.sort_treeview(self.sort_column, tab_id) # Passa tab_id
                 
            # Atualiza a exibição de DPS/PDPS
            self.update_dps_display()

        except requests.exceptions.RequestException as req_err:
            self.update_status(f"[{tab_name}] Erro de Rede")
            self.log_message(f"Erro de rede: {req_err}", "error", tab_id=tab_id)
            messagebox.showerror("Erro de Rede", f"Falha na comunicação com a API:\n{req_err}")
        except Exception as e:
            self.update_status(f"[{tab_name}] Erro Inesperado na Busca")
            self.log_message(f"Erro inesperado search_items: {e}\n{traceback.format_exc()}", "error", tab_id=tab_id)
            messagebox.showerror("Erro Inesperado", f"Ocorreu um erro inesperado:\n{e}\nVerifique o log da aba para detalhes.")

    # --- calculate_dps (Função global, sem mudanças) ---
    def calculate_dps(self, item_info):
        properties = item_info.get("properties", [])
        extended = item_info.get("extended", {})
        dps_val = extended.get("dps")
        pdps_val = extended.get("pdps")
        edps_val = extended.get("edps")
        dps_num = float(dps_val) if isinstance(dps_val, (int, float)) else None
        pdps_num = float(pdps_val) if isinstance(pdps_val, (int, float)) else None
        edps_num = float(edps_val) if isinstance(edps_val, (int, float)) else None
        # Fallback calculation if pdps is missing
        if pdps_num is None:
            phys_dmg_min, phys_dmg_max, atk_speed = None, None, None
            for prop in properties:
                if not isinstance(prop, dict): continue
                prop_name = prop.get("name", "")
                values = prop.get("values", [])
                if values and isinstance(values, list) and len(values) > 0 and \
                  isinstance(values[0], list) and len(values[0]) > 0:
                    prop_val_str = str(values[0][0])
                    # Physical Damage check
                    if "physical damage" in prop_name.lower() or \
                      ("damage" in prop_name.lower() and not any(x in prop_name.lower() for x in ["elemental", "chaos", "spell"])):
                        try:
                            if '-' in prop_val_str:
                                dmg_range = prop_val_str.split("-")
                                phys_dmg_min, phys_dmg_max = map(float, dmg_range)
                            else:
                                phys_dmg_min = phys_dmg_max = float(prop_val_str)
                        except (ValueError, TypeError): pass
                    # Attack Speed check
                    elif "attacks per second" in prop_name.lower() or \
                         ("attack speed" in prop_name.lower()):
                        try:
                            atk_speed = float(prop_val_str.replace('+',''))
                        except (ValueError, TypeError): pass
            if phys_dmg_min is not None and phys_dmg_max is not None and atk_speed is not None and atk_speed > 0:
                pdps_num = round(((phys_dmg_min + phys_dmg_max) / 2) * atk_speed, 1)
                # self.log_message(f"PDPS calculado manualmente: {pdps_num}", "debug", tab_id=?) # Precisa do tab_id aqui
        # Fallback total DPS calculation
        if dps_num is None and pdps_num is not None and edps_num is not None:
             dps_num = round(pdps_num + edps_num, 1)
             # self.log_message(f"DPS total calculado (PDPS+EDPS): {dps_num}", "debug", tab_id=?)
        elif dps_num is None and pdps_num is not None:
             dps_num = pdps_num # If only PDPS is available, use it as DPS
        return dps_num, pdps_num, edps_num

    # --- Versão melhorada de analyze_divine_worth ---
    def analyze_divine_worth(self, item_data):
        """Analisa o potencial de melhoria com Divine Orb, priorizando mods que afetam DPS."""
        item = item_data.get("item", {})
        explicit_mods_text = item.get("explicitMods", []) if isinstance(item.get("explicitMods"), list) else []
        implicit_mods_text = item.get("implicitMods", []) if isinstance(item.get("implicitMods"), list) else []
        extended_data = item.get("extended", {})
        extended_mods = extended_data.get("mods", {})
        extended_hashes = extended_data.get("hashes", {})
        analysis_results = []
        processed_text_indices = {"explicit": set(), "implicit": set()}
        current_value_regex = re.compile(r'([-+]?\d+(?:.\d+)?)')
        adds_value_regex = re.compile(r'[aA]dds\s+([-+]?\d+(?:.\d+)?)\s+to\s+([-+]?\d+(?:.\d+)?)')

        def format_range_display(min_vals, max_vals):
            range_parts = []
            if not isinstance(min_vals, list) or not isinstance(max_vals, list) or len(min_vals) != len(max_vals):
                return "[Erro Range]"
            for r_idx in range(len(min_vals)):
                try:
                    min_v, max_v = min_vals[r_idx], max_vals[r_idx]
                    min_d = f"{min_v:.1f}".rstrip('0').rstrip('.') if isinstance(min_v, float) and not min_v.is_integer() else str(int(min_v))
                    max_d = f"{max_v:.1f}".rstrip('0').rstrip('.') if isinstance(max_v, float) and not max_v.is_integer() else str(int(max_v))
                    range_parts.append(f"{min_d}–{max_d}")
                except (TypeError, ValueError): range_parts.append("?–?")
            if len(range_parts) == 2: return f"[{range_parts[0]} to {range_parts[1]}]"
            elif range_parts: return f"[{' / '.join(range_parts)}]"
            else: return "[N/A]"

        def format_current_display(values):
            current_display_parts = []
            if not isinstance(values, list): return "?"
            for val in values:
                try:
                    display = f"{val:.1f}".rstrip('0').rstrip('.') if isinstance(val, float) and not val.is_integer() else str(int(val))
                    current_display_parts.append(display)
                except: current_display_parts.append("?")
            return ", ".join(current_display_parts) if current_display_parts else "?"

        # Verifica se a mod afeta dano
        def is_damage_mod(mod_name):
            for damage_mod in DAMAGE_MODS:
                if damage_mod.lower() in mod_name.lower():
                    return True
            return False

        idx_to_details = {"explicit": {}, "implicit": {}}
        if extended_mods and isinstance(extended_mods, dict):
             for scope in ["explicit", "implicit"]:
                  scope_mods = extended_mods.get(scope)
                  if isinstance(scope_mods, list):
                       idx_to_details[scope] = {i: mod for i, mod in enumerate(scope_mods)}

        all_scopes = {"explicit": explicit_mods_text, "implicit": implicit_mods_text}
        if extended_hashes and isinstance(extended_hashes, dict):
             for scope, text_list in all_scopes.items():
                  scope_hashes = extended_hashes.get(scope)
                  if not isinstance(scope_hashes, list): continue
                  for hash_entry in scope_hashes:
                       summed_min_vals, summed_max_vals, current_values = [], [], []
                       component_tiers = []; mod_text_display = "Mod Desconhecido"; tier_str = ""; tag = "divine_unknown"
                       range_found, text_found, calculation_valid = False, False, False
                       potential_pct = None; status = "init"; num_magnitudes_expected = 0
                       try:
                            if not isinstance(hash_entry, (list, tuple)) or len(hash_entry) != 2: continue
                            stat_hash, component_indices = hash_entry
                            if not stat_hash or not isinstance(component_indices, list) or not component_indices: continue
                            component_details = [idx_to_details[scope].get(idx) for idx in component_indices if idx_to_details[scope].get(idx)]
                            if not component_details:
                                continue

                            # Verifica se este mod afeta dano
                            affects_damage = False
                            for detail in component_details:
                                mod_name = detail.get("name", "")
                                if is_damage_mod(mod_name):
                                    affects_damage = True
                                    break

                            first_comp_mags = None; is_first_comp = True; valid_range_sum = True
                            for detail_part in component_details:
                                magnitudes = detail_part.get("magnitudes")
                                if not isinstance(magnitudes, list):
                                    valid_range_sum = False; break
                                tier = detail_part.get("tier"); tier_match = re.match(r'^[SP]?(\d+)$', str(tier))
                                if tier_match: component_tiers.append(f"T{tier_match.group(1)}")
                                comp_mags_for_hash = [mag for mag in magnitudes if mag.get("hash") == stat_hash]
                                if not comp_mags_for_hash: continue

                                if is_first_comp:
                                     num_magnitudes_expected = len(comp_mags_for_hash)
                                     if num_magnitudes_expected == 0: valid_range_sum = False; break
                                     summed_min_vals = [0.0] * num_magnitudes_expected
                                     summed_max_vals = [0.0] * num_magnitudes_expected
                                     is_first_comp = False
                                elif len(comp_mags_for_hash) != num_magnitudes_expected:
                                     valid_range_sum = False; break

                                for i, mag in enumerate(comp_mags_for_hash):
                                     try:
                                          min_v, max_v = float(mag.get("min")), float(mag.get("max"))
                                          if math.isnan(min_v) or math.isnan(max_v): raise ValueError("NaN")
                                          summed_min_vals[i] += min_v; summed_max_vals[i] += max_v
                                     except (ValueError, TypeError, AttributeError, KeyError, IndexError) as e_mag:
                                          valid_range_sum = False; break
                                if not valid_range_sum: break
                            if not valid_range_sum or is_first_comp: status = "no_range"; continue

                            range_found = True
                            tier_str = f" ({'/'.join(sorted(list(set(component_tiers))))})" if component_tiers else ""

                            found_match = None
                            for text_idx, text_line in enumerate(text_list):
                                 if text_idx in processed_text_indices[scope]: continue
                                 temp_current_values = []
                                 try:
                                     adds_match_txt = adds_value_regex.search(text_line)
                                     current_matches_txt = list(current_value_regex.finditer(text_line))
                                     if adds_match_txt and len(current_matches_txt) >= 2 and num_magnitudes_expected == 2:
                                          temp_current_values = [float(adds_match_txt.group(1)), float(adds_match_txt.group(2))]
                                     elif len(current_matches_txt) == num_magnitudes_expected:
                                          parsed_vals = []
                                          for match in current_matches_txt:
                                               start, end = match.span(1)
                                               precedes = text_line[start-1:start] if start > 0 else " "
                                               follows = text_line[end:end+1] if end < len(text_line) else " "
                                               # Basic context check
                                               if (precedes.isspace() or precedes in '+-') and (follows.isspace() or follows in '%'):
                                                    parsed_vals.append(float(match.group(1)))
                                          if len(parsed_vals) == num_magnitudes_expected: temp_current_values = parsed_vals
                                          else: continue
                                     else: continue
                                 except (ValueError, IndexError): continue

                                 values_in_summed_range = True
                                 if len(temp_current_values) == num_magnitudes_expected:
                                      for val_idx, current_val in enumerate(temp_current_values):
                                           try:
                                                min_bound = min(summed_min_vals[val_idx], summed_max_vals[val_idx]) - 1e-6
                                                max_bound = max(summed_min_vals[val_idx], summed_max_vals[val_idx]) + 1e-6
                                                if not (min_bound <= current_val <= max_bound): values_in_summed_range = False; break
                                           except IndexError: values_in_summed_range = False; break
                                 else: values_in_summed_range = False

                                 if values_in_summed_range:
                                     found_match = {"text": text_line, "values": temp_current_values, "index": text_idx}
                                     break
                            if found_match:
                                 mod_text_display = found_match["text"]; current_values = found_match["values"]
                                 processed_text_indices[scope].add(found_match["index"])
                                 text_found = True; status = 'ok'
                            else:
                                 mod_text_display = component_details[0].get("name", f"Stat: {stat_hash}")
                                 if mod_text_display == stat_hash and tier_str: mod_text_display += tier_str
                                 status = 'no_text_match'

                            chance_str = "N/A"; current_display = "?"; range_display = "[N/A]"; tag = "divine_unknown"
                            
                            # Só calcula o potencial se o mod afeta o dano
                            if range_found and affects_damage:
                                range_display = format_range_display(summed_min_vals, summed_max_vals)
                                if text_found and current_values:
                                     current_display = format_current_display(current_values)
                                     calculation_valid = True
                                     total_percentage_potential = 0.0; num_calc = len(current_values)
                                     is_maxed = True; all_fixed = True
                                     for idx in range(num_calc):
                                          try:
                                               current, min_v, max_v = current_values[idx], summed_min_vals[idx], summed_max_vals[idx]
                                          except IndexError: calculation_valid = False; break
                                          if not isinstance(current,(int,float)) or not isinstance(min_v,(int,float)) or not isinstance(max_v,(int,float)) or math.isnan(current) or math.isnan(min_v) or math.isnan(max_v):
                                               calculation_valid = False; break
                                          range_diff = max_v - min_v; tolerance = 1e-6
                                          is_range_zero = abs(range_diff) < tolerance
                                          if not is_range_zero:
                                               all_fixed = False
                                               if current < max_v - tolerance:
                                                    percent_from_max = max(0, ((max_v - current) / range_diff)) * 100
                                                    total_percentage_potential += percent_from_max
                                                    is_maxed = False
                                     if not calculation_valid:
                                          chance_str, tag, status = "Erro Calc", "error", "calc_error"; potential_pct = None
                                     elif is_maxed:
                                          chance_str, tag = ("FIXO" if all_fixed else "MAX"), "divine_max"
                                          potential_pct = 0 if not all_fixed else None # None for fixed, 0 for maxed non-fixed
                                     else:
                                          avg_potential_from_max = total_percentage_potential / num_calc if num_calc > 0 else 0
                                          potential_pct = min(avg_potential_from_max, 100.0)
                                          chance_str = f"{potential_pct:.1f}%"
                                          if potential_pct >= 65: tag = "divine_good"
                                          elif potential_pct >= 35: tag = "divine_medium"
                                          else: tag = "divine_bad"
                                else: 
                                     chance_str = "N/A"; tag = "divine_no_text"; status = 'no_text_match'; potential_pct = None; current_display = "?"
                            elif range_found:
                                range_display = format_range_display(summed_min_vals, summed_max_vals)
                                current_display = "?" if not text_found else format_current_display(current_values) if current_values else "?"
                                chance_str, tag = "Não DPS", "divine_unknown"
                                status = 'non_dps' if affects_damage == False else 'no_text_match'
                                potential_pct = None
                            else: # No range found
                                chance_str, tag, status = "N/A", "divine_unknown", "no_range"; potential_pct = None; range_display = "[N/A]"; current_display = "?"

                            analysis_results.append({
                                'scope': scope, 'text': mod_text_display, 'current_str': current_display,
                                'range_str': range_display, 'tier_str': tier_str,
                                'potential_str': chance_str, 'potential_pct': potential_pct,
                                'tag': tag, 'status': status, 'hash': stat_hash,
                                'affects_damage': affects_damage
                            })
                       except Exception as e_hash_proc:
                            stat_hash_err = hash_entry[0] if isinstance(hash_entry, (list, tuple)) and len(hash_entry)>0 else "Desconhecido"
                            print(f"Erro CRÍTICO processando hash {stat_hash_err}: {e_hash_proc}\n{traceback.format_exc()}")
                            analysis_results.append({'scope': scope, 'text': f"Erro análise stat {stat_hash_err}", 'tag': 'error', 'status':'error_processing', 'hash': stat_hash_err})

        # Add unprocessed text mods
        for scope, text_list in all_scopes.items():
             for idx, text in enumerate(text_list):
                  if idx not in processed_text_indices[scope]:
                      current_matches_txt = list(current_value_regex.finditer(text))
                      adds_match_txt = adds_value_regex.search(text)
                      numeric_values = []
                      try:
                          if adds_match_txt and len(current_matches_txt) >= 2: numeric_values = [float(adds_match_txt.group(1)), float(adds_match_txt.group(2))]
                          elif current_matches_txt: numeric_values = [float(match.group(1)) for match in current_matches_txt]
                      except ValueError: pass
                      
                      # Verifica se o texto do mod pode afetar dano
                      affects_damage = any(damage_mod.lower() in text.lower() for damage_mod in DAMAGE_MODS)
                      
                      analysis_results.append({
                           'scope': scope, 'text': text, 'current_str': format_current_display(numeric_values) if numeric_values else "?",
                           'range_str': "[N/A]", 'tier_str': "", 'potential_str': "Não Estimado" if affects_damage else "Não DPS",
                           'potential_pct': None, 'tag': 'divine_unknown', 'status': 'unmatched_text', 'hash': None,
                           'affects_damage': affects_damage
                      })

        # Calculate Overall Worth & Sort (Apenas com base em mods que afetam danos)
        worth_divining = False; max_overall_chance = 0.0; dps_valid_chances = []
        for res in analysis_results:
             potential = res.get('potential_pct')
             affects_damage = res.get('affects_damage', False)
             if isinstance(potential, (int, float)) and res.get('status') == 'ok' and affects_damage:
                  dps_valid_chances.append(potential)
                  if potential > 15.0: worth_divining = True
        if dps_valid_chances: max_overall_chance = max(dps_valid_chances)

        def sort_key(res):
            # Ordem de prioridade: affeta_dano -> escopo -> status -> potencial
            affects_damage = 0 if res.get('affects_damage', False) else 1
            scope_order = 0 if res.get('scope') == 'implicit' else (1 if res.get('scope') == 'explicit' else 2)
            status_prio = 0 if res.get('status') == 'ok' else (1 if res.get('status') == 'no_text_match' else (2 if res.get('status') == 'unmatched_text' else ( 3 if res.get('status') != 'error' else 4)))
            potential = res.get('potential_pct', -1)
            if potential is None: potential = -2
            return (affects_damage, scope_order, status_prio, -potential) # Sort afeta_dano, scope, status, potencial (desc)
            
        analysis_results.sort(key=sort_key)

        return worth_divining, max_overall_chance, analysis_results


    def process_item(self, item_data, query_id, tab_id):
        """Processa um item e o adiciona ao Treeview da aba correta."""
        if tab_id not in self.search_tabs_data:
             self.log_message(f"Erro: Tentando processar item para aba inexistente {tab_id}", "error", use_global_log=True)
             return
        tab_data = self.search_tabs_data[tab_id]
        results_tree = tab_data.get('results_tree')
        item_cache = tab_data.get('_item_details_cache')
        if not results_tree or item_cache is None:
            self.log_message(f"Erro: Treeview ou cache não encontrados para aba {tab_id} em process_item", "error", use_global_log=True)
            return # Segurança

        try:
            item_info = item_data.get("item", {})
            listing_info = item_data.get("listing", {})
            item_id = item_data.get("id", f"no_id_{time.time()}")

            # Extrair informações básicas
            item_name = item_info.get("name", "")
            item_type = item_info.get("typeLine", "")
            full_name = f"{item_name} {item_type}".strip()
            if item_name and item_type and item_name in item_type: full_name = item_type
            elif not item_name and item_type: full_name = item_type
            elif item_name and not item_type: full_name = item_name
            if not full_name: full_name = item_info.get("baseType", "Item Desconhecido")

            price_info = listing_info.get("price", {})
            price_text = "Sem preço"
            price_amount = price_info.get("amount"); price_currency = price_info.get("currency")
            if price_amount and price_currency:
                try:
                    price_amount_float = float(price_amount)
                    price_num_str = f"{int(price_amount_float):,}" if price_amount_float == int(price_amount_float) else f"{price_amount_float:,.2f}".rstrip('0').rstrip('.')
                    price_text = f"{price_num_str} {price_currency}"
                except (ValueError, TypeError): price_text = f"{price_amount} {price_currency}"

            seller = listing_info.get("account", {}).get("name", "Desconhecido")
            listing_date_str = listing_info.get("indexed", "")
            listing_date_display, listing_timestamp = "N/A", None
            if listing_date_str:
                try:
                    dt_obj = None
                    fmts = ["%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S+00:00", "%Y-%m-%dT%H:%M:%S.%f+00:00"]
                    for fmt in fmts:
                        try:
                            dt_obj = datetime.strptime(listing_date_str, fmt).replace(tzinfo=timezone.utc)
                            break
                        except ValueError: continue
                    if dt_obj:
                        listing_timestamp = dt_obj.astimezone(None) # Converte para local
                        listing_date_display = listing_timestamp.strftime('%d/%m %H:%M')
                    else:
                        listing_date_display = listing_date_str.split('T')[0] if 'T' in listing_date_str else listing_date_str[:10]
                except Exception as e_date:
                    listing_date_display = "Data Inv."
                    self.log_message(f"Erro ao parsear data '{listing_date_str}': {e_date}", "warning", tab_id=tab_id)

            whisper = listing_info.get("whisper", "N/A")

            # Calcula DPS e Divine Worth (funções globais)
            dps_num, pdps_num, _ = self.calculate_dps(item_info)
            worth_divining, max_chance, divine_analysis_results = self.analyze_divine_worth(item_data)

            # Monta link e valores para o Treeview
            league_url_part = "poe2/Standard" # Pode ser configurável
            item_link = f"https://www.pathofexile.com/trade/search/{league_url_part}/{query_id}/{item_id}" # Usa query_id da aba
            
            # Display de DPS de acordo com o modo selecionado
            dps_mode = self.dps_display_mode.get()
            if dps_mode == "DPS":
                dps_display = f"{dps_num:.1f}" if dps_num is not None else "-"
                dps_pdps_str = dps_display
            elif dps_mode == "PDPS":
                pdps_display = f"{pdps_num:.1f}" if pdps_num is not None else "-"
                dps_pdps_str = pdps_display
            else: # "Both"
                dps_display = f"{dps_num:.1f}" if dps_num is not None else "-"
                pdps_display = f"{pdps_num:.1f}" if pdps_num is not None else "-"
                dps_pdps_str = f"{dps_display}"
                if pdps_display != "-" and pdps_display != dps_display:
                    dps_pdps_str += f" / {pdps_display}"
            
            tree_values = (full_name, price_text, dps_pdps_str, seller, listing_date_display, "Copiar" if whisper != "N/A" else "-")

            # Define a tag da linha baseado no divine worth
            row_tag = 'not_worth'
            if worth_divining:
                 if max_chance >= 65: row_tag = 'worth_good'
                 elif max_chance >= 35: row_tag = 'worth_medium'
                 else: row_tag = 'worth_bad'

            # Função para atualizar o Treeview DA ABA CORRETA na thread principal
            def _update_treeview():
                try:
                    # Re-verifica se a aba e o treeview ainda existem
                    if tab_id not in self.search_tabs_data: return
                    current_tab_data = self.search_tabs_data[tab_id]
                    current_tree = current_tab_data.get('results_tree')
                    if not current_tree or not current_tree.winfo_exists(): return

                    # Configura a tag se não existir (importante após troca de tema)
                    current_tree.tag_configure(row_tag) # Cria/atualiza a tag
                    display_tag = row_tag

                    if not current_tree.exists(item_id):
                        current_tree.insert("", tk.END, iid=item_id, values=tree_values, tags=(display_tag,))
                    else:
                        current_tree.item(item_id, values=tree_values, tags=(display_tag,))
                except tk.TclError as e_tcl:
                     if "invalid command name" not in str(e_tcl): self.log_message(f"Erro Tcl Treeview: {e_tcl}", "warning", tab_id=tab_id)
                except Exception as e_tree:
                     self.log_message(f"Erro Treeview genérico: {e_tree}", "error", tab_id=tab_id)

            if hasattr(self, 'root') and self.root.winfo_exists(): self.root.after(0, _update_treeview)

            # Armazena detalhes no cache DA ABA
            item_details = {
                "id": item_id, "name": full_name, "price": price_text, "seller": seller,
                "listing_date": listing_date_display, "listing_timestamp": listing_timestamp,
                "whisper": whisper, "link": item_link,
                "properties": item_info.get("properties", []),
                "mods": item_info.get("explicitMods", []),
                "implicit_mods": item_info.get("implicitMods", []),
                "item_level": item_info.get("ilvl", "?"),
                "rarity": item_info.get("rarity", "normal").capitalize(),
                "frameType": item_info.get("frameType", 0),
                "dps": dps_num, "pdps": pdps_num,
                "worth_divining": worth_divining,
                "max_divine_chance": max_chance,
                "divine_analysis": divine_analysis_results,
                "raw_data": item_data # Guarda dados brutos se necessário
            }
            item_cache[item_id] = item_details

        except Exception as e_process:
             item_id_err = item_data.get("id", "ID_DESCONHECIDO") if isinstance(item_data, dict) else "ID_DESCONHECIDO"
             self.log_message(f"Erro crítico processando item {item_id_err}: {e_process}\n{traceback.format_exc()}", "error", tab_id=tab_id)

    def sort_treeview(self, column, tab_id=None):
         """ Ordena o treeview da aba especificada ou da ativa. """
         if not tab_id: tab_id = self.active_tab_id
         if not tab_id or tab_id not in self.search_tabs_data:
              # self.log_message("Tentativa de ordenar aba inválida.", "warning", use_global_log=True)
              return

         tab_data = self.search_tabs_data[tab_id]
         tree = tab_data.get('results_tree')
         item_cache = tab_data.get('_item_details_cache') # Necessário para ordenação por data

         if not tree or not item_cache or not tree.winfo_exists():
              # self.log_message("Treeview ou cache não encontrado para ordenar.", "warning", tab_id=tab_id)
              return

         # Determina a direção da ordenação
         reverse = False
         if self.sort_column == column: # Se clicou na mesma coluna
              reverse = not self.sort_reverse # Inverte a direção anterior
         # else: self.sort_reverse = False # Reseta direção se coluna diferente (já é False por padrão)

         # Pega os itens do treeview
         try:
             items = [(tree.set(k, column), k) for k in tree.get_children('')]
         except Exception as e_get:
             self.log_message(f"Erro ao obter itens do Treeview para ordenar: {e_get}", "error", tab_id=tab_id)
             return

         # Define a função de chave de ordenação
         sort_key_func = None
         if column == 'preco':
             def price_sort_key(item_tuple):
                 price_str = item_tuple[0]; parts = price_str.split(); amount = float('-inf'); currency = ""
                 if len(parts) >= 1:
                     currency = parts[-1].lower()
                     num_str = ''.join(filter(lambda c: c.isdigit() or c in '.-', parts[0])) # Permite . e -
                     try: amount = float(num_str) if num_str else float('-inf')
                     except ValueError: amount = float('-inf')
                     if currency not in CURRENCIES: currency = "" # Considera moeda desconhecida como última
                 currency_order = {c: i for i, c in enumerate(CURRENCIES)}
                 order = currency_order.get(currency, 999)
                 return (order, amount)
             sort_key_func = price_sort_key
         elif column == 'dps':
             def dps_sort_key(item_tuple):
                 dps_pdps_str = item_tuple[0]; parts = dps_pdps_str.split('/'); dps_str = parts[0].strip()
                 try: return float(dps_str)
                 except ValueError: return float('-inf')
             sort_key_func = dps_sort_key
         elif column == 'data_listagem':
             def date_sort_key(item_tuple):
                 item_iid = item_tuple[1]; details = item_cache.get(item_iid)
                 ts = details.get("listing_timestamp") if details else None
                 if ts and isinstance(ts, datetime):
                      try: return ts.astimezone(timezone.utc) # Compara em UTC
                      except Exception: pass
                 # Coloca itens sem data no final ao ordenar ascendente, início no descendente
                 return datetime.min.replace(tzinfo=timezone.utc) if not reverse else datetime.max.replace(tzinfo=timezone.utc)
             sort_key_func = date_sort_key
         else: # Default (nome, vendedor) - case-insensitive
             def default_sort_key(item_tuple): return str(item_tuple[0]).lower()
             sort_key_func = default_sort_key

         # Ordena os itens
         try:
             items.sort(key=sort_key_func, reverse=reverse)
         except TypeError as e_sort_type:
             self.log_message(f"Erro de tipo ao ordenar '{column}': {e_sort_type}.", "error", tab_id=tab_id)
             return
         except Exception as e_sort:
             self.log_message(f"Erro inesperado ao ordenar '{column}': {e_sort}", "error", tab_id=tab_id)
             return

         # Move itens no treeview DA ABA
         try:
             if not tree or not tree.winfo_exists(): return
             for index, (val, k) in enumerate(items):
                  tree.move(k, '', index)
         except tk.TclError as e_move:
             if "invalid command name" not in str(e_move): self.log_message(f"Erro Tcl ao mover item Treeview: {e_move}", "warning", tab_id=tab_id)
         except Exception as e_move_gen:
              self.log_message(f"Erro geral ao mover item Treeview: {e_move_gen}", "error", tab_id=tab_id)

         # Atualiza cabeçalhos no treeview DA ABA (indicador de ordenação)
         try:
             if not tree or not tree.winfo_exists(): return
             arrow = ' ▲' if reverse else ' ▼'
             for col in tree['columns']:
                  current_heading = tree.heading(col)
                  current_text = current_heading.get('text', '')
                  cleaned_text = current_text.replace(' ▼','').replace(' ▲','')
                  new_text = cleaned_text + (arrow if col == column else '')
                  tree.heading(col, text=new_text)
         except tk.TclError: pass # Ignora se UI fechada
         except Exception as e_head:
             self.log_message(f"Erro ao atualizar cabeçalho coluna: {e_head}", "error", tab_id=tab_id)

         # Atualiza estado global de ordenação
         self.sort_column = column
         self.sort_reverse = reverse


    def on_item_double_click(self, event, tab_id):
         """Callback para duplo clique no Treeview da aba especificada."""
         if tab_id not in self.search_tabs_data: return
         tab_data = self.search_tabs_data[tab_id]
         tree = tab_data.get('results_tree')
         item_cache = tab_data.get('_item_details_cache')
         if not tree or not item_cache or not tree.winfo_exists(): return

         selected_item_iid = tree.focus() # Pega o item selecionado (foco)
         if not selected_item_iid: return

         # Mostra detalhes na aba correta
         self.show_item_details(selected_item_iid, tab_id)

         # Verifica se o clique foi na coluna 'whisper' (índice 5) para copiar
         column_id = tree.identify_column(event.x)
         column_index = -1
         try: column_index = int(column_id.replace('#','')) - 1
         except ValueError: pass # Click fora de uma coluna válida

         if column_index == 5: # Coluna 'whisper'
             item_details = item_cache.get(selected_item_iid)
             if item_details:
                  whisper_text = item_details.get("whisper", "N/A")
                  if whisper_text != "N/A" and whisper_text:
                       try:
                            self.root.clipboard_clear()
                            self.root.clipboard_append(whisper_text)
                            original_status = self.status_label.cget("text") # Salva status atual
                            status_msg = f"[{tab_data['name']}] Whisper copiado!"
                            self.update_status(status_msg)
                            # Restaura status após 2 segundos SE A MENSAGEM AINDA FOR A MESMA
                            self.root.after(2000, lambda current_msg=status_msg, prev_status=original_status: self.update_status(prev_status) if self.status_label.cget("text") == current_msg else None)
                       except tk.TclError as e_clip:
                            messagebox.showerror("Erro Clipboard", f"Não foi possível acessar área de transferência:\n{e_clip}")
                            self.log_message(f"Erro clipboard: {e_clip}", "error", tab_id=tab_id)
                       except Exception as e_copy:
                            messagebox.showerror("Erro", f"Falha ao copiar whisper:\n{e_copy}")
                            self.log_message(f"Erro ao copiar whisper: {e_copy}", "error", tab_id=tab_id)
                  else:
                       messagebox.showwarning("Whisper Indisponível", "Não há mensagem de whisper para este item.")
             else:
                  messagebox.showerror("Erro Interno", "Detalhes do item não encontrados no cache desta aba.")
                  self.log_message(f"Cache miss em on_item_double_click para {selected_item_iid}", "warning", tab_id=tab_id)

    def show_item_details(self, item_id, tab_id):
        """Mostra os detalhes do item nos painéis da aba especificada."""
        if tab_id not in self.search_tabs_data:
            self.log_message(f"Tentando mostrar detalhes para aba inválida {tab_id}", "error", use_global_log=True)
            return
        tab_data = self.search_tabs_data[tab_id]
        item_cache = tab_data.get('_item_details_cache')
        details_widget = tab_data.get('details_text')
        analysis_widget = tab_data.get('analysis_text')

        if item_cache is None or not details_widget or not analysis_widget:
             self.log_message(f"Widgets ou cache ausentes para show_item_details na aba {tab_id}", "error", use_global_log=True)
             return

        item_details = item_cache.get(item_id)
        colors = DARK_COLORS if self.dark_mode_enabled.get() else LIGHT_COLORS

        # Limpa painéis se detalhes não encontrados
        if not item_details:
            self.log_message(f"Detalhes não encontrados cache para {item_id}", "warning", tab_id=tab_id)
            for widget in [details_widget, analysis_widget]:
                 if widget and widget.winfo_exists():
                      try:
                           widget.config(state=tk.NORMAL, bg=colors["log_bg"])
                           widget.delete(1.0, tk.END)
                           widget.config(state=tk.DISABLED)
                      except Exception: pass
            return

        # --- Painel Direito (Análise Divine) ---
        if analysis_widget.winfo_exists():
             try:
                  analysis_widget.config(state=tk.NORMAL, bg=colors["log_bg"])
                  analysis_widget.delete(1.0, tk.END)
                  
                  # Extrai DPS/PDPS e potencial máximo
                  dps_num = item_details.get('dps')
                  pdps_num = item_details.get('pdps')
                  worth_divining = item_details.get('worth_divining', False)
                  max_divine_chance = item_details.get('max_divine_chance', 0)
                  
                  # --- Resumo Visual no Topo ---
                  analysis_widget.insert(tk.END, "=== Resumo da Análise ===\n", ("title",))
                  
                  # Valores de DPS Atual/Máximo
                  if dps_num is not None or pdps_num is not None:
                      analysis_widget.insert(tk.END, "• Atual:", ("header",))
                      if dps_num is not None:
                          dps_str = f"{dps_num:.1f}"
                          analysis_widget.insert(tk.END, f" DPS: {dps_str}", ("divine_max" if max_divine_chance < 10 else "divine_bad"))
                      if pdps_num is not None and pdps_num != dps_num:
                          pdps_str = f"{pdps_num:.1f}"
                          analysis_widget.insert(tk.END, f" PDPS: {pdps_str}", ("divine_max" if max_divine_chance < 10 else "divine_bad"))
                      analysis_widget.insert(tk.END, "\n")
                      
                      # Valor máximo DPS estimado
                      if max_divine_chance > 0 and dps_num is not None:
                          # Estimativa simples - aumenta o DPS pela proporção máxima
                          max_dps_est = dps_num * (1 + (max_divine_chance / 100))
                          analysis_widget.insert(tk.END, "• Máximo estimado:", ("header",))
                          analysis_widget.insert(tk.END, f" {max_dps_est:.1f}", ("divine_good" if max_divine_chance >= 50 else "divine_medium"))
                          analysis_widget.insert(tk.END, "\n")
                          
                          # Ganho máximo
                          analysis_widget.insert(tk.END, "• Ganho de DPS Máximo:", ("header",))
                          tag = "divine_good" if max_divine_chance >= 50 else ("divine_medium" if max_divine_chance >= 30 else "divine_bad")
                          analysis_widget.insert(tk.END, f" +{max_divine_chance:.1f}%", (tag,))
                          analysis_widget.insert(tk.END, "\n")
                      
                  # Valor do Item (atual/estimado)
                  price_text = item_details.get('price', 'Sem preço')
                  analysis_widget.insert(tk.END, "\n=== Análise de Preço ===\n", ("title",))
                  analysis_widget.insert(tk.END, f"Preço Atual: {price_text}\n", ("header",))
                  
                  if worth_divining:
                      est_price = "Valor Aumentado" if max_divine_chance >= 50 else price_text
                      analysis_widget.insert(tk.END, f"Preço Estimado Após Divine: {est_price}\n", 
                                           ("divine_good" if max_divine_chance >= 50 else "divine_medium"))
                  else:
                      analysis_widget.insert(tk.END, f"Preço Estimado Após Divine: {price_text}\n", ("divine_unknown"))
                  
                  # --- Detalhes dos Modificadores ---
                  analysis_widget.insert(tk.END, "\n=== Detalhes dos Modificadores ===\n", ("title",))
                  analysis_results = item_details.get("divine_analysis", [])
                  if not analysis_results:
                       analysis_widget.insert(tk.END, "Nenhuma análise disponível.\n", ("divine_unknown",))
                  else:
                       mod_w = 36; cur_w = 10; range_w = 22; pot_w = 10
                       header_line = f"{'Modificador'.ljust(mod_w)} {'Atual'.ljust(cur_w)} {'Range'.ljust(range_w)} {'Potencial'.rjust(pot_w)}\n"
                       analysis_widget.insert(tk.END, header_line, ("header",))
                       separator = "-" * (mod_w + cur_w + range_w + pot_w + 3) + "\n"
                       analysis_widget.insert(tk.END, separator, ("debug",))
                       
                       # Filtra para mostrar primeiro os mods que afetam dano
                       dps_mods = [res for res in analysis_results if res.get('affects_damage', False)]
                       other_mods = [res for res in analysis_results if not res.get('affects_damage', False)]
                       
                       # Primeiro os mods que afetam DPS
                       current_scope_disp = None
                       if dps_mods:
                           for res in dps_mods:
                                scope = res.get('scope', '')
                                display_scope = "Implícitos" if scope == "implicit" else ("Explícitos" if scope == "explicit" else "Outros")
                                if display_scope != current_scope_disp:
                                     if current_scope_disp is not None: analysis_widget.insert(tk.END, "\n")
                                     analysis_widget.insert(tk.END, f"--- {display_scope} ---\n", ("header",))
                                     current_scope_disp = display_scope
    
                                mod_text_base = res.get('text', 'Erro Análise'); tier = res.get('tier_str', '')
                                full_mod_text = (mod_text_base + tier).strip()
                                display_mod_text = (full_mod_text[:mod_w-3] + '...') if len(full_mod_text) > mod_w else full_mod_text
                                display_mod_text = display_mod_text.ljust(mod_w)
                                current_val = res.get('current_str', '?')[:cur_w].ljust(cur_w)
                                range_val = res.get('range_str', 'N/A')[:rng_w].ljust(rng_w)
                                potential_val = res.get('potential_str', 'N/A')[:pot_w].rjust(pot_w)
                                tag = res.get('tag', 'divine_unknown')
                                if res.get('status') == 'unmatched_text': tag = 'divine_unknown'
    
                                # Verifica se a tag existe antes de usar
                                if not analysis_widget.tag_cget(tag, "foreground"):
                                     tag = "divine_unknown" # Fallback se tag não configurada
    
                                line = f"{display_mod_text} {current_val} {range_val} {potential_val}\n"
                                analysis_widget.insert(tk.END, line, (tag,))
                       
                       # Em seguida os outros mods (opcional - pode ser omitido)
                       if other_mods:
                           current_scope_disp = None
                           analysis_widget.insert(tk.END, "\n--- Outros Modificadores ---\n", ("header",))
                           # Opcional: mostrar alguns outros mods relevantes como resistências
                           for res in other_mods[:5]:  # Limita a 5 outros mods para economizar espaço
                                scope = res.get('scope', '')
                                mod_text = res.get('text', 'Mod Desconhecido')
                                tag = "tag_mod_implicit" if scope == "implicit" else "tag_mod_explicit"
                                analysis_widget.insert(tk.END, f"{mod_text}\n", (tag,))
                  
                  analysis_widget.config(state=tk.DISABLED)
             except tk.TclError: pass
             except Exception as e_analysis:
                  self.log_message(f"Erro exibir análise item {item_id}: {e_analysis}\n{traceback.format_exc()}", "error", tab_id=tab_id)
                  try:
                       if analysis_widget.winfo_exists():
                            if str(analysis_widget.cget('state')) == tk.DISABLED: analysis_widget.config(state=tk.NORMAL, bg=colors["log_bg"])
                            analysis_widget.delete(1.0, tk.END)
                            analysis_widget.insert(tk.END, f"\nErro exibir análise:\n{e_analysis}", ("error",))
                            analysis_widget.config(state=tk.DISABLED)
                  except Exception: pass

        # --- Painel Médio (Detalhes Item) ---
        if details_widget.winfo_exists():
            try:
                details_widget.config(state=tk.NORMAL, bg=colors["log_bg"])
                details_widget.delete(1.0, tk.END)
                rarity_map = {0: "Normal", 1: "Magic", 2: "Rare", 3: "Unique", 4: "Gem", 5:"Currency", 6:"Div Card", 9:"Relic"}
                frame_type = item_details.get('frameType', 0)
                rarity_str = rarity_map.get(frame_type, f"Desc ({frame_type})")
                rarity_tag = f"rarity_{frame_type}"
                # Garante que a tag de raridade exista
                if not details_widget.tag_cget(rarity_tag, "foreground"): rarity_tag = "rarity_0" # Fallback

                details_widget.insert(tk.END, f"=== {item_details['name']} ", ("title",))
                details_widget.insert(tk.END, f"({rarity_str})", (rarity_tag, "title"))
                details_widget.insert(tk.END, " ===\n", ("title",))
                # Resto dos detalhes
                details_widget.insert(tk.END, f"Preço: {item_details['price']}\n")
                details_widget.insert(tk.END, f"Vendedor: {item_details['seller']}\n")
                details_widget.insert(tk.END, f"Listado: {item_details['listing_date']}\n")
                details_widget.insert(tk.END, f"iLvl: {item_details['item_level']}\n")
                dps_str = f"{item_details['dps']:.1f}" if item_details.get('dps') is not None else "-"
                pdps_str = f"{item_details['pdps']:.1f}" if item_details.get('pdps') is not None else "-"
                if dps_str != "-" or pdps_str != "-":
                     dps_line = f"DPS: {dps_str}" + (f" / PDPS: {pdps_str}" if pdps_str != "-" and pdps_str != dps_str else "")
                     details_widget.insert(tk.END, dps_line + "\n")
                if item_details['whisper'] != "N/A":
                     details_widget.insert(tk.END, f"Whisper: {item_details['whisper']}\n")

                # Propriedades Base
                if item_details.get("properties"):
                    details_widget.insert(tk.END, "\n--- Propriedades Base ---\n", ("header",))
                    for prop in item_details["properties"]:
                         if not isinstance(prop, dict): continue
                         name = prop.get("name", ""); values = prop.get("values", []); display_type = prop.get("displayMode", 0)
                         value_str = ""
                         if values and isinstance(values[0], list) and values[0]:
                              value_str = str(values[0][0]); value_type = values[0][1] if len(values[0]) > 1 else 0
                              if '%' in name or value_type == 1: value_str += '%'
                         if name:
                              display_line = f"{name}: {value_str}"
                              # Lógica de displayMode (simplificada, pode precisar ajustes para todos os casos)
                              if display_type == 1: display_line = f"{value_str} {name}"
                              elif display_type == 3 and "%0" in name: display_line = name.replace("%0", value_str) if value_str else name.replace("%0","?")
                              # ... (outros display modes podem ser adicionados)
                              # Evita mostrar Quality 0% ou Stack Size 0
                              if not (("Quality" in name or "Stack Size" in name) and value_str in ['0', '0%']):
                                   details_widget.insert(tk.END, display_line + "\n")

                # Modificadores Implícitos e Explícitos
                if item_details.get("implicit_mods"):
                    details_widget.insert(tk.END, "\n--- Modificadores Implícitos ---\n", ("header",))
                    for mod in item_details["implicit_mods"]: details_widget.insert(tk.END, f"{mod}\n", ("mod_implicit",))
                if item_details.get("mods"): # Explicit mods
                    details_widget.insert(tk.END, "\n--- Modificadores Explícitos ---\n", ("header",))
                    for mod in item_details["mods"]: details_widget.insert(tk.END, f"{mod}\n", ("mod_explicit",))

                details_widget.insert(tk.END, f"\nLink: {item_details['link']}\n", ("link",))
                details_widget.config(state=tk.DISABLED)
            except tk.TclError: pass
            except Exception as e_details:
                self.log_message(f"Erro exibir detalhes item {item_id}: {e_details}\n{traceback.format_exc()}", "error", tab_id=tab_id)
                try:
                     if details_widget.winfo_exists():
                          if str(details_widget.cget('state')) == tk.DISABLED: details_widget.config(state=tk.NORMAL, bg=colors["log_bg"])
                          details_widget.delete(1.0, tk.END)
                          details_widget.insert(tk.END, f"Erro exibir detalhes:\n{e_details}", ("error",))
                          details_widget.config(state=tk.DISABLED)
                except Exception: pass

    def start_polling(self, tab_id=None):
         """Inicia o monitoramento para a aba especificada ou ativa."""
         if not tab_id: tab_id = self.active_tab_id
         if not tab_id or tab_id not in self.search_tabs_data:
              self.log_message("Tentativa de iniciar polling em aba inválida.", "warning", use_global_log=True)
              return
         tab_data = self.search_tabs_data[tab_id]
         tab_name = tab_data['name']

         if tab_data.get('is_polling', False):
             self.log_message("Monitoramento já ativo para esta aba.", "info", tab_id=tab_id)
             return

         # Valida intervalo
         interval = 5
         try:
             interval_input = int(tab_data['polling_interval'].get())
             if interval_input < 5:
                  messagebox.showwarning("Intervalo Baixo", "Intervalo mínimo 5s recomendado.")
                  interval = 5; tab_data['polling_interval'].set("5")
             else: interval = interval_input
         except ValueError:
             messagebox.showerror("Erro", "Intervalo inválido! Usando 5s.")
             tab_data['polling_interval'].set("5"); interval = 5

         # Valida cookies globais
         if not self.poesessid.get() or not self.cf_clearance.get():
              messagebox.showerror("Erro Autenticação", "Cookies POESESSID/cf_clearance não configurados.")
              return

         tab_data['is_polling'] = True
         tab_data['stop_polling_flag'].clear() # Reseta a flag DA ABA

         # Atualiza botões DA ABA
         try:
             start_btn = tab_data.get('start_polling_button')
             stop_btn = tab_data.get('stop_polling_button')
             if start_btn and start_btn.winfo_exists(): start_btn.config(state=tk.DISABLED)
             if stop_btn and stop_btn.winfo_exists(): stop_btn.config(state=tk.NORMAL)
         except tk.TclError: pass

         self.log_message(f"Iniciando monitoramento a cada {interval}s.", "info", tab_id=tab_id)
         self.update_status(f"[{tab_name}] Monitorando (Intervalo: {interval}s)...") # Status global

         # Inicia a thread de polling DA ABA
         tab_data['polling_thread'] = threading.Thread(target=self.polling_worker, args=(tab_id, interval,), daemon=True)
         tab_data['polling_thread'].start()


    def stop_polling(self, tab_id=None, join_thread=False):
        """Para o monitoramento da aba especificada ou ativa."""
        if not tab_id: tab_id = self.active_tab_id
        if not tab_id or tab_id not in self.search_tabs_data:
             # self.log_message("Tentativa de parar polling em aba inválida.", "warning", use_global_log=True)
             return
        tab_data = self.search_tabs_data[tab_id]
        tab_name = tab_data['name']

        if not tab_data.get('is_polling', False):
            # self.log_message("Monitoramento não estava ativo para esta aba.", "info", tab_id=tab_id)
            return

        # Sinaliza para a thread DA ABA parar
        stop_flag = tab_data.get('stop_polling_flag')
        if stop_flag: stop_flag.set()
        tab_data['is_polling'] = False # Seta imediatamente para UI refletir

        self.log_message("Sinal de parada enviado.", "info", tab_id=tab_id)
        self.update_status(f"[{tab_name}] Parando monitoramento...")

        # Opcional: Aguardar a thread finalizar (útil ao remover aba)
        thread_to_join = tab_data.get('polling_thread')
        if join_thread and thread_to_join and thread_to_join.is_alive():
            try:
                thread_to_join.join(timeout=2.0) # Espera até 2s
                if thread_to_join.is_alive():
                    self.log_message("Aviso: Thread de polling da aba não finalizou no tempo.", "warning", tab_id=tab_id)
            except Exception as e_join:
                self.log_message(f"Erro ao aguardar thread da aba: {e_join}", "error", tab_id=tab_id)

        # --- Atualiza botões e status via `after` para thread safety ---
        # É importante verificar se a aba ainda existe no momento da execução do after()
        def _update_ui_after_stop():
            if tab_id in self.search_tabs_data: # Verifica se aba ainda existe
                 current_tab_data = self.search_tabs_data[tab_id]
                 # Atualiza Status Global se esta aba era a ativa E o polling realmente parou
                 if self.active_tab_id == tab_id and not current_tab_data.get('is_polling', True): # Re-verifica is_polling
                      self.update_status(f"[{current_tab_data['name']}] Monitoramento parado.")
                 # Atualiza Botões da Aba
                 try:
                     start_btn = current_tab_data.get('start_polling_button')
                     stop_btn = current_tab_data.get('stop_polling_button')
                     if start_btn and start_btn.winfo_exists(): start_btn.config(state=tk.NORMAL)
                     if stop_btn and stop_btn.winfo_exists(): stop_btn.config(state=tk.DISABLED)
                 except tk.TclError: pass # Ignora erro se widget destruído
                 except AttributeError: pass # Ignora erro se widget não encontrado
            # else: Aba foi removida, não faz nada na UI

        if hasattr(self, 'root') and self.root.winfo_exists():
            self.root.after(50, _update_ui_after_stop) # Delay pequeno

    def polling_worker(self, tab_id, interval):
        """Worker da thread de polling para uma aba específica."""
        # Verifica se a aba existe no início
        if tab_id not in self.search_tabs_data:
             print(f"ERRO FATAL: polling_worker iniciado para tab_id inexistente {tab_id}")
             return
        tab_data = self.search_tabs_data[tab_id]
        tab_name = tab_data['name']
        stop_flag = tab_data['stop_polling_flag']

        self.log_message("Thread de monitoramento iniciada.", "debug", tab_id=tab_id)

        while not stop_flag.is_set():
            # Re-verifica a existência da aba a cada iteração
            if tab_id not in self.search_tabs_data:
                 self.log_message(f"Aba {tab_name} removida, finalizando thread.", "info", use_global_log=True)
                 break

            self.update_status(f"[{tab_name}] Monitorando: Buscando...")
            self.log_message("Iniciando busca.", "debug", tab_id=tab_id)
            try:
                 # Chama search_items para ESTA aba
                 self.search_items(tab_id)
            except Exception as search_err:
                 self.log_message(f"Erro durante busca no polling: {search_err}", "error", tab_id=tab_id)
                 if not stop_flag.is_set(): # Evita sleep se já pediu pra parar
                      time.sleep(min(interval, 5)) # Pequeno delay em caso de erro

            # Verifica parada logo após a busca
            if stop_flag.is_set():
                 self.log_message("Parada detectada após busca.", "debug", tab_id=tab_id)
                 break

            # Verifica novamente existência da aba antes de esperar
            if tab_id not in self.search_tabs_data:
                 self.log_message(f"Aba {tab_name} removida durante busca, finalizando thread.", "info", use_global_log=True)
                 break

            self.update_status(f"[{tab_name}] Monitorando: Aguardando {interval}s...")
            self.log_message(f"Aguardando {interval}s...", "debug", tab_id=tab_id)

            # Espera pelo intervalo ou pelo sinal de parada DA ABA
            stopped_during_wait = stop_flag.wait(timeout=interval)

            if stopped_during_wait:
                 self.log_message("Parada detectada durante espera.", "debug", tab_id=tab_id)
                 break

        # --- Finalização da Thread ---
        self.log_message("Thread de monitoramento finalizada.", "debug", tab_id=tab_id)
        # A função stop_polling agora é responsável por atualizar a UI via `after`
        # Não precisamos chamar `finalize_polling_state_tab` daqui explicitamente
        # A chamada a `stop_polling` (seja pelo botão ou no fechamento) cuidará disso.

    def apply_theme(self):
        """Aplica o tema a todos os widgets, incluindo os das abas."""
        colors = DARK_COLORS if self.dark_mode_enabled.get() else LIGHT_COLORS
        # --- Configure Root Window ---
        self.root.config(bg=colors["bg"])

        # --- Configure ttk Styles (global) ---
        self.style.configure('.', background=colors["bg"], foreground=colors["fg"], font=("Segoe UI", 9))
        self.style.configure('TFrame', background=colors["bg"])
        self.style.configure('TLabel', background=colors["bg"], foreground=colors["fg"])
        self.style.configure('TLabelframe', background=colors["bg"], bordercolor=colors.get("labelframe_fg", colors["fg"]))
        self.style.configure('TLabelframe.Label', background=colors["bg"], foreground=colors.get("labelframe_fg", colors["fg"]))
        self.style.configure('TButton', background=colors["button_bg"], foreground=colors["button_fg"], font=("Segoe UI", 9))
        self.style.map('TButton', background=[('active', colors["widget_bg"]), ('disabled', colors["button_bg"])]) # Handle disabled state
        self.style.configure('Toolbutton', background=colors["status_bg"], foreground=colors["fg"])
        self.style.map('Toolbutton', background=[('active', colors["widget_bg"])])
        self.style.configure('TEntry', fieldbackground=colors["widget_bg"], foreground=colors["widget_fg"], insertcolor=colors["fg"])
        self.style.configure('TCombobox', fieldbackground=colors["widget_bg"], foreground=colors["widget_fg"], selectbackground=colors["widget_bg"], selectforeground=colors["widget_fg"], insertcolor=colors["fg"])
        self.root.option_add('*TCombobox*List.background', colors["widget_bg"])
        self.root.option_add('*TCombobox*List.foreground', colors["widget_fg"])
        self.root.option_add('*TCombobox*List.selectBackground', colors["tree_selected_bg"])
        self.root.option_add('*TCombobox*List.selectForeground', colors["tree_selected_fg"])
        self.style.configure('TNotebook', background=colors["bg"], borderwidth=1)
        self.style.configure('TNotebook.Tab', background=colors["button_bg"], foreground=colors["button_fg"], padding=[5, 2])
        self.style.map('TNotebook.Tab', background=[('selected', colors["widget_bg"])], foreground=[('selected', colors["widget_fg"])])
        self.style.configure('Treeview', background=colors["tree_bg"], foreground=colors["tree_fg"], fieldbackground=colors["tree_bg"], rowheight=22)
        self.style.map('Treeview', background=[('selected', colors["tree_selected_bg"])], foreground=[('selected', colors["tree_selected_fg"])])
        self.style.configure('Treeview.Heading', background=colors["tree_heading_bg"], foreground=colors["tree_heading_fg"], font=("Segoe UI", 9, "bold"))
        self.style.configure('Vertical.TScrollbar', background=colors["button_bg"], troughcolor=colors["bg"])
        self.style.configure('Horizontal.TScrollbar', background=colors["button_bg"], troughcolor=colors["bg"])
        self.style.configure('Status.TFrame', background=colors["status_bg"])
        self.style.configure('Status.TLabel', background=colors["status_bg"], foreground=colors["status_fg"])

        # --- Configure Widgets Globais Específicos ---
        if hasattr(self, 'instructions_widget') and self.instructions_widget and self.instructions_widget.winfo_exists():
             self.instructions_widget.config(background=colors["log_bg"], foreground=colors["log_fg"], insertbackground=colors["log_fg"])

        # --- Itera sobre as abas de busca e aplica tema aos widgets ---
        for tab_id, tab_data in self.search_tabs_data.items():
             # Aplica a ScrolledText (Log, Análise)
             for widget_key in ['details_text', 'analysis_text']:
                  widget = tab_data.get(widget_key)
                  if widget and widget.winfo_exists():
                       widget.config(background=colors["log_bg"], foreground=colors["log_fg"], insertbackground=colors["log_fg"])
                       # Reconfigura tags de texto para estes widgets
                       for tag_name, tag_config in colors.items():
                            if tag_name.startswith("tag_"):
                                 clean_tag_name = tag_name.replace("tag_", "")
                                 try: # Tenta configurar, ignora se falhar (widget pode estar sendo destruído)
                                     widget.tag_configure(clean_tag_name, **tag_config)
                                 except tk.TclError: pass

             # Aplica a Treeview
             tree = tab_data.get('results_tree')
             if tree and tree.winfo_exists():
                  # Reconfigura tags de linha (importante!)
                  tree.tag_configure('worth_good', background=colors["tree_worth_good_bg"], foreground=colors["tree_fg"]) # Define foreground tbm
                  tree.tag_configure('worth_medium', background=colors["tree_worth_medium_bg"], foreground=colors["tree_fg"])
                  tree.tag_configure('worth_bad', background=colors["tree_worth_bad_bg"], foreground=colors["tree_fg"])
                  tree.tag_configure('not_worth', background=colors["tree_not_worth_bg"], foreground=colors["tree_fg"])
                  # Tenta forçar atualização visual (pode não ser necessário com styles)
                  # try: tree.update_idletasks()
                  # except tk.TclError: pass

        # Força atualização geral da UI para refletir mudanças de estilo
        if hasattr(self, 'root') and self.root.winfo_exists():
             self.root.update_idletasks()


    def toggle_dark_mode(self):
        """Alterna entre tema claro e escuro."""
        self.apply_theme()
        # Opcional: Salvar a preferência imediatamente
        # self.save_config()


    def on_closing(self):
         """Handler para fechar a janela, verifica polling em TODAS as abas."""
         active_polling_tabs = []
         for tab_id, tab_data in self.search_tabs_data.items():
              if tab_data.get('is_polling', False):
                   active_polling_tabs.append(tab_data.get('name', f'Aba {tab_id[:4]}'))

         do_exit = True
         if active_polling_tabs:
              tab_names = "\n - ".join(active_polling_tabs)
              if not messagebox.askokcancel("Sair?", f"Os seguintes monitoramentos estão ativos:\n - {tab_names}\n\nDeseja parar todos e sair?"):
                   do_exit = False # User cancelled exit

         if do_exit:
              self.update_status("Fechando aplicação...")
              # Para todos os pollings ativos
              threads_to_join = []
              tab_ids_to_stop = list(self.search_tabs_data.keys()) # Cria cópia das chaves
              for tab_id in tab_ids_to_stop:
                   if tab_id in self.search_tabs_data and self.search_tabs_data[tab_id].get('is_polling', False):
                        self.log_message(f"Parando polling da aba '{self.search_tabs_data[tab_id]['name']}' para sair.", "info", tab_id=tab_id)
                        self.stop_polling(tab_id) # Envia sinal de parada
                        thread = self.search_tabs_data[tab_id].get('polling_thread')
                        if thread and thread.is_alive():
                             threads_to_join.append((self.search_tabs_data[tab_id]['name'], thread))

              # Espera um pouco pelas threads finalizarem
              if threads_to_join:
                  self.update_status(f"Aguardando {len(threads_to_join)} monitoramentos finalizarem...")
                  join_timeout = 2.0 # Tempo máximo de espera total
                  start_join = time.time()
                  for tab_name, thread in threads_to_join:
                        remaining_time = max(0.1, join_timeout - (time.time() - start_join)) # Pelo menos 0.1s por thread
                        try:
                             # self.log_message(f"Aguardando thread da aba '{tab_name}'...", "debug", use_global_log=True)
                             thread.join(timeout=remaining_time)
                        except Exception as e_join:
                             self.log_message(f"Erro ao aguardar thread '{tab_name}': {e_join}", "error", use_global_log=True)

                  # Verifica se alguma ainda está viva
                  still_alive = [name for name, thread in threads_to_join if thread.is_alive()]
                  if still_alive:
                      self.log_message(f"Aviso: Threads das abas {', '.join(still_alive)} não finalizaram.", "warning", use_global_log=True)

              # Salva config e destrói a janela
              self.save_config()
              self.root.destroy()


# --- Bloco Principal de Execução ---
if __name__ == "__main__":
    try:
        root = tk.Tk()
        # --- Aplicação do Tema Base ttk ---
        try:
            style = ttk.Style(root)
            available_themes = style.theme_names()
            preferred_themes = ['clam', 'alt', 'default', 'vista', 'xpnative']
            theme_to_use = None
            for theme in preferred_themes:
                if theme in available_themes:
                    try:
                        style.theme_use(theme)
                        theme_to_use = theme
                        print(f"Usando tema ttk base: {theme}")
                        break
                    except tk.TclError: continue
            if not theme_to_use:
                print("Nenhum tema ttk base encontrado/aplicável. Usando padrão.")
        except Exception as e_theme:
            print(f"Não foi possível aplicar tema ttk base: {e_theme}")

        # Cria a instância da aplicação
        app = PoeTracker(root)

        # Define o handler para fechar a janela (chama o método da classe)
        root.protocol("WM_DELETE_WINDOW", app.on_closing)

        # Inicia o loop principal da interface gráfica
        root.mainloop()

    except Exception as main_e:
        # Mostra erro fatal no console e em uma messagebox (se possível)
        error_traceback = traceback.format_exc()
        print(f"ERRO FATAL NA APLICAÇÃO: {main_e}\n{error_traceback}")
        try:
            messagebox.showerror("Erro Crítico", f"Ocorreu um erro fatal na aplicação:\n\n{main_e}\n\nVerifique o console para detalhes.")
        except tk.TclError: # Caso a UI já esteja inutilizável
            pass
        except Exception as e_msgbox: # Outro erro ao mostrar messagebox
             print(f"Erro adicional ao tentar mostrar messagebox: {e_msgbox}")

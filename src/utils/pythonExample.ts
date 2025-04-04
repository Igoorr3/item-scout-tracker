
export const POE2_PYTHON_EXAMPLE = `
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

# ... resto do código da classe PoeTracker ...
# Este é um script Python muito extenso, o que está incluído acima são apenas os métodos iniciais.
# O script completo inclui funcionalidades para buscar itens no PoE2, analisar seus valores, 
# calcular DPS, e gerenciar múltiplas abas de busca.
# 
# Para usar este script, você precisaria:
# 1. Salvar o código completo como 'poe2_item_tracker.py'
# 2. Instalar as dependências Python necessárias (requests, tkinter, etc)
# 3. Executar o script com 'python poe2_item_tracker.py'
# 4. Os cookies de autenticação serão armazenados em 'poe2_config.ini'

# O script completo tem mais de 2000 linhas de código e 
# implementa uma interface completa para rastrear itens no Path of Exile 2.

if __name__ == "__main__":
    try:
        root = tk.Tk()
        app = PoeTracker(root)
        root.protocol("WM_DELETE_WINDOW", app.on_closing)
        root.mainloop()
    except Exception as main_e:
        error_traceback = traceback.format_exc()
        print(f"ERRO FATAL NA APLICAÇÃO: {main_e}\\n{error_traceback}")
        try:
            messagebox.showerror("Erro Crítico", f"Ocorreu um erro fatal na aplicação:\\n\\n{main_e}\\n\\nVerifique o console para detalhes.")
        except tk.TclError:
            pass
`;


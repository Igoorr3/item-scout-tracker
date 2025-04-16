
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

# Lista de mods que afetam diretamente o DPS
DPS_AFFECTING_STATS = [
    "explicit.stat_1509134228",  # Increased Physical Damage
    "explicit.stat_2901986750",  # Increased Physical Damage (local)
    "explicit.stat_1940865751",  # Adds Physical Damage
    "explicit.stat_210067635",   # Attack Speed
    "explicit.stat_2923486259",  # Attack Speed (local)
    "explicit.stat_2628039082",  # Critical Strike Chance
    "explicit.stat_2311243048",  # Critical Strike Multiplier
    "explicit.stat_2301191210",  # Critical Strike Multiplier
    "explicit.stat_709508406",   # Adds Fire Damage
    "explicit.stat_1999113824",  # Adds Cold Damage
    "explicit.stat_737908626",   # Adds Lightning Damage
    "explicit.stat_1202301673",  # +# to Level of all Projectile Skills
]

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

# Base de dados das armas do PoE2 (adicionado com base nas informações fornecidas)
WEAPON_BASES = {
    # Quarterstaffs
    "Sinister Quarterstaff": {
        "physDamageMin": 55, "physDamageMax": 92,
        "critChance": 11.5, "attacksPerSecond": 1.4, "weaponRange": 1.3
    },
    "Lunar Quarterstaff": {
        "physDamageMin": 50, "physDamageMax": 103,
        "critChance": 10.0, "attacksPerSecond": 1.5, "weaponRange": 1.3
    },
    "Striking Quarterstaff": {
        "physDamageMin": 53, "physDamageMax": 111,
        "critChance": 10.0, "attacksPerSecond": 1.4, "weaponRange": 1.3,
        "implicitMod": "16% increased Melee Strike Range with this weapon"
    },
    "Bolting Quarterstaff": {
        "physDamageMin": 0, "physDamageMax": 0,
        "eleDamageMin": 43, "eleDamageMax": 172, "eleDamageType": "lightning",
        "critChance": 10.0, "attacksPerSecond": 1.4, "weaponRange": 1.3,
        "implicitMod": "100% of Physical Damage Converted to Lightning Damage"
    },
    "Aegis Quarterstaff": {
        "physDamageMin": 58, "physDamageMax": 97,
        "critChance": 10.0, "attacksPerSecond": 1.4, "weaponRange": 1.3,
        "implicitMod": "+(10–15)% to Block chance"
    },
    "Razor Quarterstaff": {
        "physDamageMin": 65, "physDamageMax": 108,
        "critChance": 10.0, "attacksPerSecond": 1.4, "weaponRange": 1.3
    },
    "Quarterstaff": {
        "physDamageMin": 50, "physDamageMax": 90,
        "critChance": 10.0, "attacksPerSecond": 1.4, "weaponRange": 1.3
    },
    
    # Two-handed Maces
    "Anvil Maul": {
        "physDamageMin": 112, "physDamageMax": 151,
        "critChance": 5.0, "attacksPerSecond": 1.05, "weaponRange": 1.3
    },
    "Sacred Maul": {
        "physDamageMin": 76, "physDamageMax": 158,
        "critChance": 5.0, "attacksPerSecond": 1.2, "weaponRange": 1.3
    },
    "Ironwood Greathammer": {
        "physDamageMin": 94, "physDamageMax": 174,
        "critChance": 5.0, "attacksPerSecond": 1.05, "weaponRange": 1.3,
        "implicitMod": "Causes (30–50)% increased Stun Buildup"
    },
    "Fanatic Greathammer": {
        "physDamageMin": 89, "physDamageMax": 120,
        "critChance": 5.0, "attacksPerSecond": 1.05, "weaponRange": 1.3,
        "implicitMod": "Strikes deal Splash damage to targets within 1.5 metres"
    },
    "Ruination Maul": {
        "physDamageMin": 113, "physDamageMax": 138,
        "critChance": 5.0, "attacksPerSecond": 1.1, "weaponRange": 1.3,
        "implicitMod": "Causes Enemies to Explode on Critical kill, for 10% of their Life as Physical Damage"
    },
    "Massive Greathammer": {
        "physDamageMin": 119, "physDamageMax": 161,
        "critChance": 5.0, "attacksPerSecond": 1.1, "weaponRange": 1.3
    },
    
    # Crossbows
    "Stout Crossbow": {
        "physDamageMin": 30, "physDamageMax": 119,
        "critChance": 5.0, "attacksPerSecond": 1.55, "reloadTime": 0.75
    },
    "Engraved Crossbow": {
        "physDamageMin": 31, "physDamageMax": 124,
        "critChance": 5.0, "attacksPerSecond": 1.6, "reloadTime": 0.8
    },
    "Flexed Crossbow": {
        "physDamageMin": 32, "physDamageMax": 127,
        "critChance": 5.0, "attacksPerSecond": 1.6, "reloadTime": 0.85,
        "implicitMod": "(20–30)% increased Bolt Speed"
    },
    "Gemini Crossbow": {
        "physDamageMin": 28, "physDamageMax": 112,
        "critChance": 5.0, "attacksPerSecond": 1.6, "reloadTime": 1.1,
        "implicitMod": "Loads an additional bolt"
    },
    "Siege Crossbow": {
        "physDamageMin": 29, "physDamageMax": 115,
        "critChance": 5.0, "attacksPerSecond": 1.65, "reloadTime": 0.75,
        "implicitMod": "Grenade Skills Fire an additional Projectile"
    },
    "Desolate Crossbow": {
        "physDamageMin": 33, "physDamageMax": 132,
        "critChance": 5.0, "attacksPerSecond": 1.6, "reloadTime": 0.8
    },
    
    # Bows
    "Ironwood Shortbow": {
        "physDamageMin": 41, "physDamageMax": 76,
        "critChance": 5.0, "attacksPerSecond": 1.25
    },
    "Cavalry Bow": {
        "physDamageMin": 49, "physDamageMax": 82,
        "critChance": 5.0, "attacksPerSecond": 1.2
    },
    "Guardian Bow": {
        "physDamageMin": 53, "physDamageMax": 80,
        "critChance": 5.0, "attacksPerSecond": 1.15,
        "implicitMod": "(20–30)% chance to Chain an additional time"
    },
    "Gemini Bow": {
        "physDamageMin": 39, "physDamageMax": 73,
        "critChance": 5.0, "attacksPerSecond": 1.2,
        "implicitMod": "Bow Attacks fire an additional Arrow"
    },
    "Fanatic Bow": {
        "physDamageMin": 0, "physDamageMax": 0,
        "eleDamageMin": 52, "eleDamageMax": 87, "eleDamageType": "chaos",
        "critChance": 5.0, "attacksPerSecond": 1.2,
        "implicitMod": "100% of Physical Damage Converted to Chaos Damage"
    },
    "Warmonger Bow": {
        "physDamageMin": 56, "physDamageMax": 84,
        "critChance": 5.0, "attacksPerSecond": 1.2
    },
    
    # Spears
    "Orichalcum Spear": {
        "physDamageMin": 38, "physDamageMax": 70,
        "critChance": 5.0, "attacksPerSecond": 1.6, "weaponRange": 1.5,
        "implicitMod": "Grants Skill: Spear Throw"
    },
    "Pronged Spear": {
        "physDamageMin": 40, "physDamageMax": 75,
        "critChance": 5.0, "attacksPerSecond": 1.6, "weaponRange": 1.5,
        "implicitMod": "Grants Skill: Spear Throw"
    },
    "Stalking Spear": {
        "physDamageMin": 44, "physDamageMax": 82,
        "critChance": 5.0, "attacksPerSecond": 1.55, "weaponRange": 1.5,
        "implicitMod": "Grants Skill: Spear Throw\n(15–25)% chance to Maim on Hit"
    },
    "Flying Spear": {
        "physDamageMin": 41, "physDamageMax": 76,
        "critChance": 5.0, "attacksPerSecond": 1.6, "weaponRange": 1.5,
        "implicitMod": "Grants Skill: Spear Throw\n(25–35)% increased Projectile Speed with this Weapon"
    },
    "Grand Spear": {
        "physDamageMin": 46, "physDamageMax": 85,
        "critChance": 5.0, "attacksPerSecond": 1.5, "weaponRange": 1.5,
        "implicitMod": "Grants Skill: Spear Throw"
    },
    "Spiked Spear": {
        "physDamageMin": 41, "physDamageMax": 76,
        "critChance": 6.5, "attacksPerSecond": 1.6, "weaponRange": 1.5,
        "implicitMod": "Grants Skill: Spear Throw"
    },
    
    # One-handed Maces
    "Flanged Mace": {
        "physDamageMin": 45, "physDamageMax": 67,
        "critChance": 5.0, "attacksPerSecond": 1.55, "weaponRange": 1.1
    },
    "Crown Mace": {
        "physDamageMin": 43, "physDamageMax": 89,
        "critChance": 5.0, "attacksPerSecond": 1.4, "weaponRange": 1.1
    },
    "Molten Hammer": {
        "physDamageMin": 30.5, "physDamageMax": 50.5,
        "eleDamageMin": 30.5, "eleDamageMax": 50.5, "eleDamageType": "fire",
        "critChance": 5.0, "attacksPerSecond": 1.45, "weaponRange": 1.1,
        "implicitMod": "50% of Physical Damage Converted to Fire Damage"
    },
    "Strife Pick": {
        "physDamageMin": 49, "physDamageMax": 66,
        "critChance": 7.0, "attacksPerSecond": 1.45, "weaponRange": 1.1,
        "implicitMod": "+(10–15)% to Critical Damage Bonus"
    },
    "Fortified Hammer": {
        "physDamageMin": 60, "physDamageMax": 73,
        "critChance": 5.0, "attacksPerSecond": 1.4, "weaponRange": 1.1,
        "implicitMod": "Causes Daze buildup equal to 100% of Damage dealt"
    },
    "Marauding Mace": {
        "physDamageMin": 51, "physDamageMax": 84,
        "critChance": 5.0, "attacksPerSecond": 1.45, "weaponRange": 1.1
    }
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
        
        # Preferência para visualização de DPS/PDPS (nova opção)
        self.dps_display_mode = tk.StringVar(value="both")  # 'dps', 'pdps', ou 'both'

        # --- Gerenciamento de Abas de Busca ---
        self.search_tabs_data = {} # Dicionário principal: {tab_id: {data...}, ...}
        self.search_notebook = None # Referência ao Notebook interno das buscas
        self.active_tab_id = None # ID da aba atualmente visível

        # --- Título e Geometria ---
        self.root.title("Path of Exile 2 - Item Tracker (v42.0 - Análise de DPS Melhorada)") # Título Atualizado
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
        
        # Adicionando controle para modo de visualização DPS/PDPS
        ttk.Label(tab_control_frame, text="Modo de DPS:", style='TLabel').pack(side=tk.LEFT, padx=(20, 5))
        dps_mode_combo = ttk.Combobox(tab_control_frame, textvariable=self.dps_display_mode, width=10, style='TCombobox', 
                                      values=["both", "dps", "pdps"])
        dps_mode_combo.pack(side=tk.LEFT, padx=5)
        dps_mode_combo.current(0)  # Valor padrão "both"
        self.dps_display_mode.trace_add("write", self.on_dps_mode_change)


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

    def on_dps_mode_change(self, *args):
        """Callback quando o modo de visualização DPS/PDPS muda"""
        mode = self.dps_display_mode.get()
        self.log_message(f"Modo de visualização alterado para: {mode}", "info", use_global_log=True)
        
        # Reordenar o treeview da aba ativa se existir
        if self.active_tab_id and self.sort_column:
            self.sort_treeview(self.sort_column, self.active_tab_id)
            
        # Forçar atualização da UI para refletir a mudança de modo
        if hasattr(self, 'root') and self.root.winfo_exists():
            self.root.update_idletasks()

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

        # DPS/PDPS - Separados visualmente 
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
        
        # MODIFICADO: Colunas separadas para DPS e PDPS
        columns = ('nome', 'preco', 'dps', 'pdps', 'vendedor', 'data_listagem', 'whisper')
        results_tree = ttk.Treeview(results_frame, columns=columns, show='headings', style='Treeview')
        tab_data['results_tree'] = results_tree # Armazena a referência
        
        # Configuração das colunas e headings
        results_tree.heading('nome', text='Nome', command=lambda c='nome': self.sort_treeview(c))
        results_tree.heading('preco', text='Preço', command=lambda c='preco': self.sort_treeview(c))
        results_tree.heading('dps', text='DPS', command=lambda c='dps': self.sort_treeview(c))
        results_tree.heading('pdps', text='PDPS', command=lambda c='pdps': self.sort_treeview(c))
        results_tree.heading('vendedor', text='Vendedor', command=lambda c='vendedor': self.sort_treeview(c))
        results_tree.heading('data_listagem', text='Listado em', command=lambda c='data_listagem': self.sort_treeview(c))
        results_tree.heading('whisper', text='Whisper', command=lambda: messagebox.showinfo("Ajuda - Whisper", "Clique duplo na linha de um item (na coluna 'Whisper' ou outra) para copiar a mensagem de compra."))
        
        # Ajuste das larguras das colunas
        results_tree.column('nome', width=240, anchor=tk.W)
        results_tree.column('preco', width=100, anchor=tk.E)
        results_tree.column('dps', width=70, anchor=tk.CENTER)
        results_tree.column('pdps', width=70, anchor=tk.CENTER)
        results_tree.column('vendedor', width=120, anchor=tk.W)
        results_tree.column('data_listagem', width=100, anchor=tk.CENTER)
        results_tree.column('whisper', width=60, anchor=tk.CENTER)
        
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

        # --- Área de Análise (Divine Orb) - Modificada para mostrar resumo mais compacto ---
        analysis_frame = ttk.LabelFrame(tab_frame, text="Potencial do Item (Divine Orb)", style='TLabelframe')
        analysis_frame.grid(row=1, column=2, sticky="nsew", padx=(5, 10), pady=5)
        analysis_frame.rowconfigure(0, weight=1); analysis_frame.columnconfigure(0, weight=1)
        analysis_text = scrolledtext.ScrolledText(analysis_frame, wrap=tk.WORD, width=50, font=("Segoe UI", 10), relief=tk.FLAT, bd=0)
        analysis_text.grid(row=0, column=0, sticky="nsew", padx=2, pady=2)
        tab_data['analysis_text'] = analysis_text # Armazena referência
        analysis_text.config(state=tk.DISABLED)

    # ... keep existing code (o restante das funções da classe PoeTracker)

    def find_weapon_base(self, item_name):
        """Encontra a base da arma pelo nome ou correspondência parcial."""
        # Tentar correspondência exata primeiro
        if item_name in WEAPON_BASES:
            return WEAPON_BASES[item_name]
        
        # Tentar encontrar por correspondência parcial
        for base_name, base_data in WEAPON_BASES.items():
            if base_name in item_name:
                return base_data
        
        # Verificar categorias comuns como fallback
        if "quarterstaff" in item_name.lower():
            return WEAPON_BASES.get("Quarterstaff")
        elif "bow" in item_name.lower() and "cross" not in item_name.lower():
            return WEAPON_BASES.get("Cavalry Bow")
        elif "crossbow" in item_name.lower():
            return WEAPON_BASES.get("Engraved Crossbow")
        elif "spear" in item_name.lower():
            return WEAPON_BASES.get("Pronged Spear")
        elif "maul" in item_name.lower() or ("hammer" in item_name.lower() and "great" in item_name.lower()):
            return WEAPON_BASES.get("Sacred Maul")
        elif "mace" in item_name.lower() or ("hammer" in item_name.lower() and "great" not in item_name.lower()):
            return WEAPON_BASES.get("Crown Mace")
        
        # Nenhuma correspondência encontrada
        return None

    def calculate_dps(self, item_info):
        """Calcula o DPS/PDPS usando informações da base da arma se disponível."""
        # Verificar se temos o typeLine (base do item)
        type_line = item_info.get("typeLine", "")
        base_type = item_info.get("baseType", type_line)
        
        # Tenta encontrar a base da arma em nossa base de dados
        base_data = self.find_weapon_base(base_type)
        
        # Valores padrão das propriedades da arma
        properties = item_info.get("properties", [])
        extended = item_info.get("extended", {})
        
        # Verificar se o extended.dps já contém o valor calculado da API
        dps_val = extended.get("dps")
        pdps_val = extended.get("pdps")
        edps_val = extended.get("edps")
        
        # Inicializar com valores da API se disponíveis
        dps_num = float(dps_val) if isinstance(dps_val, (int, float)) else None
        pdps_num = float(pdps_val) if isinstance(pdps_val, (int, float)) else None
        edps_num = float(edps_val) if isinstance(edps_val, (int, float)) else None
        
        # Se não tivermos o valor da API ou for uma arma com base conhecida, calculamos manualmente
        if (pdps_num is None or dps_num is None) and base_data:
            # Extrair modificadores do item
            all_mods = item_info.get("explicitMods", []) + item_info.get("implicitMods", [])
            
            # Variáveis para os modificadores
            inc_phys_dmg_pct = 0
            added_phys_min = 0
            added_phys_max = 0
            added_ele_min = 0
            added_ele_max = 0
            inc_attack_speed_pct = 0
            
            # Processa cada modificador
            for mod in all_mods:
                # Increased Physical Damage
                if "increased Physical Damage" in mod:
                    match = re.search(r'(\d+)%', mod)
                    if match:
                        inc_phys_dmg_pct = int(match.group(1))
                
                # Added Physical Damage
                if "Adds" in mod and "to" in mod and "Physical Damage" in mod:
                    match = re.search(r'Adds (\d+) to (\d+) Physical Damage', mod)
                    if match:
                        added_phys_min = int(match.group(1))
                        added_phys_max = int(match.group(2))
                
                # Added Elemental Damage (todos os tipos)
                if "Adds" in mod and "to" in mod and any(dmg_type in mod for dmg_type in ["Fire Damage", "Cold Damage", "Lightning Damage", "Chaos Damage"]):
                    match = re.search(r'Adds (\d+) to (\d+)', mod)
                    if match:
                        added_ele_min += int(match.group(1))
                        added_ele_max += int(match.group(2))
                
                # Increased Attack Speed
                if "increased Attack Speed" in mod:
                    match = re.search(r'(\d+)%', mod)
                    if match:
                        inc_attack_speed_pct = int(match.group(1))
            
            # Cálculo de dano físico
            base_phys_min = base_data.get("physDamageMin", 0)
            base_phys_max = base_data.get("physDamageMax", 0)
            phys_dmg_mult = 1 + (inc_phys_dmg_pct / 100)
            
            # Dano físico total
            total_phys_min = (base_phys_min * phys_dmg_mult) + added_phys_min
            total_phys_max = (base_phys_max * phys_dmg_mult) + added_phys_max
            avg_phys_dmg = (total_phys_min + total_phys_max) / 2
            
            # Velocidade de ataque
            base_aps = base_data.get("attacksPerSecond", 1.3)
            total_aps = base_aps * (1 + (inc_attack_speed_pct / 100))
            
            # Dano elemental base + adicionado
            base_ele_min = base_data.get("eleDamageMin", 0)
            base_ele_max = base_data.get("eleDamageMax", 0)
            total_ele_min = base_ele_min + added_ele_min
            total_ele_max = base_ele_max + added_ele_max
            avg_ele_dmg = (total_ele_min + total_ele_max) / 2
            
            # Cálculo dos DPS
            if pdps_num is None:
                pdps_num = avg_phys_dmg * total_aps
            
            ele_dps = avg_ele_dmg * total_aps
            
            if dps_num is None:
                dps_num = pdps_num + ele_dps
            
            # Separar dps elemental
            if edps_num is None and ele_dps > 0:
                edps_num = ele_dps
                
        # Se ainda não temos um valor de DPS, fazemos o cálculo de fallback tradicional
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
        
        # Fallback para DPS total
        if dps_num is None and pdps_num is not None and edps_num is not None:
             dps_num = round(pdps_num + edps_num, 1)
        elif dps_num is None and pdps_num is not None:
             dps_num = pdps_num # Se só temos PDPS, usamos como DPS
             
        return dps_num, pdps_num, edps_num

    def analyze_divine_worth(self, item_data):
        """Análise de valor Divine com foco em mods que afetam o DPS."""
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
            # ... (lógica igual) ...
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
            # ... (lógica igual) ...
            current_display_parts = []
            if not isinstance(values, list): return "?"
            for val in values:
                try:
                    display = f"{val:.1f}".rstrip('0').rstrip('.') if isinstance(val, float) and not val.is_integer() else str(int(val))
                    current_display_parts.append(display)
                except: current_display_parts.append("?")
            return ", ".join(current_display_parts) if current_display_parts else "?"

        idx_to_details = {"explicit": {}, "implicit": {}}
        if extended_mods and isinstance(extended_mods, dict):
             for scope in ["explicit", "implicit"]:
                  scope_mods = extended_mods.get(scope)
                  if isinstance(scope_mods, list):
                       idx_to_details[scope] = {i: mod for i, mod in enumerate(scope_mods)}

        all_scopes = {"explicit": explicit_mods_text, "implicit": implicit_mods_text}
        
        # Lista para armazenar apenas as análises de stats que afetam DPS
        dps_affecting_analyses = []
        
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
                                # self.log_message(f"Aviso: Nenhum detalhe mod para índices {component_indices} escopo {scope} (Hash: {stat_hash})", "debug", tab_id=?)
                                continue

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
                            if range_found:
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
                                else: # Range found, no text match
                                     chance_str = "N/A"; tag = "divine_no_text"; status = 'no_text_match'; potential_pct = None; current_display = "?"
                            else: # No range found
                                chance_str, tag, status = "N/A", "divine_unknown", "no_range"; potential_pct = None; range_display = "[N/A]"; current_display = "?"

                            # Verificar se este stat afeta o DPS
                            affects_dps = stat_hash in DPS_AFFECTING_STATS
                            
                            analysis_result = {
                                'scope': scope, 'text': mod_text_display, 'current_str': current_display,
                                'range_str': range_display, 'tier_str': tier_str,
                                'potential_str': chance_str, 'potential_pct': potential_pct,
                                'tag': tag, 'status': status, 'hash': stat_hash,
                                'affects_dps': affects_dps  # Adicionar flag para indicar se afeta DPS
                            }
                            
                            analysis_results.append(analysis_result)
                            
                            # Se afetar DPS, adicionar à lista especial
                            if affects_dps and status == 'ok' and potential_pct is not None:
                                dps_affecting_analyses.append(analysis_result)
                            
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
                      
                      # Verificar se este é um mod de DPS por keywords
                      affects_dps = (
                          ("Physical Damage" in text and "taken" not in text) or
                          "Attack Speed" in text or
                          (("Critical" in text) and ("Chance" in text or "Multiplier" in text)) or
                          (text.lower().startswith("adds") and
                           any(x in text for x in ["Fire Damage", "Cold Damage", "Lightning Damage", "Chaos Damage"])) or
                          "to Level of all" in text
                      )
                      
                      result = {
                           'scope': scope, 'text': text, 'current_str': format_current_display(numeric_values) if numeric_values else "?",
                           'range_str': "[N/A]", 'tier_str': "", 'potential_str': "N/A", 'potential_pct': None,
                           'tag': 'divine_unknown', 'status': 'unmatched_text', 'hash': None,
                           'affects_dps': affects_dps
                      }
                      
                      analysis_results.append(result)

        # Calculate Overall Worth & Sort
        worth_divining = False
        max_overall_chance = 0.0
        max_dps_chance = 0.0
        valid_chances = []
        valid_dps_chances = []
        
        for res in analysis_results:
            potential = res.get('potential_pct')
            if isinstance(potential, (int, float)) and res.get('status') == 'ok':
                valid_chances.append(potential)
                if res.get('affects_dps', False):
                    valid_dps_chances.append(potential)
                    if potential > 0.1:
                        worth_divining = True  # Só vale a pena com Divine se tiver um mod DPS que melhora
        
        if valid_chances:
            max_overall_chance = max(valid_chances)
        
        if valid_dps_chances:
            max_dps_chance = max(valid_dps_chances)

        def sort_key(res):
            # Ordenação: primeiro os mods que afetam DPS
            dps_affecting = 0 if res.get('affects_dps', False) else 1
            scope_order = 0 if res.get('scope') == 'implicit' else (1 if res.get('scope') == 'explicit' else 2)
            status_prio = 0 if res.get('status') == 'ok' else (1 if res.get('status') == 'no_text_match' else (2 if res.get('status') == 'unmatched_text' else ( 3 if res.get('status') != 'error' else 4)))
            potential = res.get('potential_pct', -1)
            if potential is None: potential = -2
            return (dps_affecting, scope_order, status_prio, -potential) # Sort DPS first, then scope, status, then descending potential
            
        analysis_results.sort(key=sort_key)

        return worth_divining, max_dps_chance, analysis_results, dps_affecting_analyses

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
            dps_num, pdps_num, edps_num = self.calculate_dps(item_info)
            worth_divining, max_chance, divine_analysis_results, dps_affecting_analyses = self.analyze_divine_worth(item_data)

            # Calcula potencial máximo de ganho para DPS/PDPS
            dps_gain_pct = 0
            pdps_gain_pct = 0
            
            # Calcular o potencial máximo de DPS com Divine
            # Só considera os mods que realmente afetam o DPS
            if dps_num and worth_divining and dps_affecting_analyses:
                # Estimamos que cada 10% de melhoria em mods que afetam dano = ~3% de ganho total
                # É uma aproximação, mas dá uma ideia do potencial
                max_mod_potential = max([a.get('potential_pct', 0) for a in dps_affecting_analyses if a.get('status') == 'ok']) if dps_affecting_analyses else 0
                dps_gain_pct = max_mod_potential * 0.3  # Aproximação
                pdps_gain_pct = dps_gain_pct  # Simplificação, pode ser refinada

            # Monta link e valores para o Treeview
            league_url_part = "poe2/Standard" # Pode ser configurável
            item_link = f"https://www.pathofexile.com/trade/search/{league_url_part}/{query_id}/{item_id}" # Usa query_id da aba
            
            # Formatação dos valores de DPS/PDPS - Agora separados
            dps_display = f"{dps_num:.1f}" if dps_num is not None else "-"
            pdps_display = f"{pdps_num:.1f}" if pdps_num is not None else "-"
            
            # Modo de exibição (esconde colunas se necessário)
            display_mode = self.dps_display_mode.get()
            
            # Define os valores para o Treeview (separados DPS e PDPS)
            tree_values = (full_name, price_text, dps_display, pdps_display, seller, listing_date_display, "Copiar" if whisper != "N/A" else "-")
            
            # Define a tag da linha baseado no divine worth (agora só considera mods DPS)
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
                "dps": dps_num, "pdps": pdps_num, "edps": edps_num,
                "worth_divining": worth_divining,
                "max_divine_chance": max_chance,
                "dps_gain_pct": dps_gain_pct,
                "pdps_gain_pct": pdps_gain_pct,
                "divine_analysis": divine_analysis_results,
                "dps_affecting_analyses": dps_affecting_analyses,
                "raw_data": item_data # Guarda dados brutos se necessário
            }
            item_cache[item_id] = item_details

        except Exception as e_process:
             item_id_err = item_data.get("id", "ID_DESCONHECIDO") if isinstance(item_data, dict) else "ID_DESCONHECIDO"
             self.log_message(f"Erro crítico processando item {item_id_err}: {e_process}\n{traceback.format_exc()}", "error", tab_id=tab_id)

    def sort_treeview(self, column, tab_id=None):
         """Ordena o treeview da aba especificada ou da ativa."""
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
         elif column == 'dps' or column == 'pdps':
             def dps_sort_key(item_tuple):
                 dps_str = item_tuple[0]
                 # Verificar o modo de visualização
                 display_mode = self.dps_display_mode.get()
                 if display_mode != 'both':
                     # Se estamos priorizando um tipo específico de DPS, consideramos o potencial de melhoria
                     item_details = item_cache.get(item_tuple[1])
                     if item_details:
                         # Ordena por potencial de ganho se estiver em um modo DPS específico
                         if column == 'dps' and display_mode == 'dps' and 'dps_gain_pct' in item_details:
                             return (float(item_details.get('dps_gain_pct', 0)), float(dps_str if dps_str != '-' else '-inf'))
                         elif column == 'pdps' and display_mode == 'pdps' and 'pdps_gain_pct' in item_details:
                             return (float(item_details.get('pdps_gain_pct', 0)), float(dps_str if dps_str != '-' else '-inf'))
                 # Fallback: ordenar pelo valor numérico
                 try: return float(dps_str if dps_str != '-' else '-inf')
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

        # --- Painel Direito (Análise Divine) - REDESENHADO para foco em DPS ---
        if analysis_widget.winfo_exists():
             try:
                  analysis_widget.config(state=tk.NORMAL, bg=colors["log_bg"])
                  analysis_widget.delete(1.0, tk.END)
                  
                  # Mostrar título com resumo geral do item
                  analysis_widget.insert(tk.END, "=== Análise de Divine Orb ===\n", ("title",))
                  
                  # Resumo do DPS
                  dps = item_details.get('dps')
                  pdps = item_details.get('pdps')
                  edps = item_details.get('edps')
                  dps_gain = item_details.get('dps_gain_pct', 0)
                  pdps_gain = item_details.get('pdps_gain_pct', 0)
                  
                  if dps or pdps:
                      analysis_widget.insert(tk.END, "\n=== Resumo do DPS ===\n", ("header",))
                      
                      # DPS Total
                      if dps:
                          # Estimativa de DPS máximo possível
                          max_dps = dps * (1 + dps_gain/100) if dps_gain else dps
                          analysis_widget.insert(tk.END, f"• DPS Total: {dps:.1f}", ("tag_mod_explicit", "tag_divine_unknown"))
                          
                          if dps_gain > 0:
                              gain_tag = "tag_divine_good" if dps_gain >= 20 else ("tag_divine_medium" if dps_gain >= 10 else "tag_divine_bad")
                              analysis_widget.insert(tk.END, f" → Máximo: {max_dps:.1f} (+{dps_gain:.1f}%)\n", (gain_tag,))
                          else:
                              analysis_widget.insert(tk.END, "\n")
                      
                      # PDPS (Dano Físico)
                      if pdps:
                          # Estimativa de PDPS máximo possível
                          max_pdps = pdps * (1 + pdps_gain/100) if pdps_gain else pdps
                          analysis_widget.insert(tk.END, f"• PDPS (Físico): {pdps:.1f}", ("tag_mod_explicit", "tag_divine_unknown"))
                          
                          if pdps_gain > 0:
                              gain_tag = "tag_divine_good" if pdps_gain >= 20 else ("tag_divine_medium" if pdps_gain >= 10 else "tag_divine_bad")
                              analysis_widget.insert(tk.END, f" → Máximo: {max_pdps:.1f} (+{pdps_gain:.1f}%)\n", (gain_tag,))
                          else:
                              analysis_widget.insert(tk.END, "\n")
                      
                      # EDPS (Dano Elemental) se existir
                      if edps and edps > 0:
                          analysis_widget.insert(tk.END, f"• EDPS (Elemental): {edps:.1f}\n", ("tag_mod_explicit",))
                  
                  # Recomendação de Divine baseada apenas em mods que afetam DPS
                  dps_affecting_analyses = item_details.get("dps_affecting_analyses", [])
                  
                  # Se o item tem mods que afetam DPS com potencial de melhoria
                  if dps_affecting_analyses and any(a.get('potential_pct', 0) > 0 for a in dps_affecting_analyses):
                      max_potential = max([a.get('potential_pct', 0) for a in dps_affecting_analyses if a.get('status') == 'ok'])
                      
                      analysis_widget.insert(tk.END, "\n=== Recomendação de Divine ===\n", ("header",))
                      
                      # Formatação da recomendação baseada no potencial
                      if max_potential >= 40:
                          analysis_widget.insert(tk.END, f"RECOMENDADO! Potencial de {max_potential:.1f}% em mods DPS\n", ("tag_divine_good",))
                          if dps_gain >= 10:
                              analysis_widget.insert(tk.END, f"Ganho estimado: +{dps_gain:.1f}% DPS Total\n", ("tag_divine_good",))
                      elif max_potential >= 20:
                          analysis_widget.insert(tk.END, f"Considere usar Divine. Potencial de {max_potential:.1f}% em mods DPS\n", ("tag_divine_medium",))
                          if dps_gain >= 5:
                              analysis_widget.insert(tk.END, f"Ganho estimado: +{dps_gain:.1f}% DPS Total\n", ("tag_divine_medium",))
                      else:
                          analysis_widget.insert(tk.END, f"Não recomendado. Potencial baixo de {max_potential:.1f}%\n", ("tag_divine_bad",))
                  else:
                      analysis_widget.insert(tk.END, "\nDivine não recomendado para este item.\n", ("tag_divine_bad",))
                  
                  # Destaca apenas os modificadores que afetam o DPS
                  if dps_affecting_analyses:
                      analysis_widget.insert(tk.END, "\n=== Mods que Afetam DPS ===\n", ("header",))
                      
                      # Ordenar por potencial de melhoria
                      dps_mods_sorted = sorted(dps_affecting_analyses, 
                                             key=lambda x: (x.get('potential_pct', 0) or 0), 
                                             reverse=True)
                      
                      for mod in dps_mods_sorted:
                          text = mod.get('text', 'Desconhecido')
                          current = mod.get('current_str', '?')
                          range_str = mod.get('range_str', '[N/A]')
                          potential = mod.get('potential_pct')
                          potential_str = mod.get('potential_str', 'N/A')
                          
                          # Definir a tag baseada no potencial
                          if potential is None or mod.get('status') != 'ok':
                              tag = "tag_divine_unknown"
                          elif potential >= 40:
                              tag = "tag_divine_good"
                          elif potential >= 20:
                              tag = "tag_divine_medium"
                          elif potential > 0:
                              tag = "tag_divine_bad"
                          else:
                              tag = "tag_divine_max"
                          
                          # Mostrar o modificador com seu potencial
                          analysis_widget.insert(tk.END, f"{text}\n", ("tag_mod_explicit",))
                          analysis_widget.insert(tk.END, f"   Atual: {current}   Range: {range_str}\n", ("tag_divine_unknown",))
                          analysis_widget.insert(tk.END, f"   Potencial: {potential_str}\n\n", (tag,))
                  
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
                
                # DPS details - formato melhorado
                dps = item_details.get('dps')
                pdps = item_details.get('pdps')
                edps = item_details.get('edps')
                
                if dps is not None or pdps is not None or edps is not None:
                    details_widget.insert(tk.END, "\n--- Valores de DPS ---\n", ("header",))
                    if dps is not None:
                        details_widget.insert(tk.END, f"DPS Total: {dps:.1f}\n")
                    if pdps is not None:
                        details_widget.insert(tk.END, f"DPS Físico: {pdps:.1f}\n")
                    if edps is not None and edps > 0:
                        details_widget.insert(tk.END, f"DPS Elemental: {edps:.1f}\n")
                
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

# ... keep existing code (o restante das funções da classe PoeTracker)

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

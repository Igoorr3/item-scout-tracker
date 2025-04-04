
export const POE2_PYTHON_EXAMPLE = `
import requests
import json
import time
import os
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import threading
import configparser
import re
from datetime import datetime, timezone
import traceback
import math
import uuid

# --- Constantes ---
CONFIG_FILE = 'poe2_config.ini'
STAT_MAP = {
    "Maximum Life": "explicit.stat_3299347043", 
    "Increased Life": "explicit.stat_1671376347",
    "Maximum Mana": "explicit.stat_1050105434", 
    "Increased Mana": "explicit.stat_4220027924",
    "Fire Resistance": "explicit.stat_3372524247", 
    "Cold Resistance": "explicit.stat_3642289083",
    "Lightning Resistance": "explicit.stat_1010850144", 
    "Chaos Resistance": "explicit.stat_3795704793",
    "Increased Physical Damage": "explicit.stat_1509134228",
    "Increased Elemental Damage": "explicit.stat_2974417149",
    "Increased Spell Damage": "explicit.stat_1368271171", 
    "Attack Speed": "explicit.stat_210067635",
    "Cast Speed": "explicit.stat_4277795662", 
    "Critical Strike Chance": "explicit.stat_2628039082",
    "Critical Strike Multiplier": "explicit.stat_2301191210",
}

ITEM_CATEGORIES = {
    "Any": "any", "Any Weapon": "weapon", "Claw": "weapon.claw", "Dagger": "weapon.dagger", 
    "One-Handed Sword": "weapon.onesword", "One-Handed Axe": "weapon.oneaxe",
    "One-Handed Mace": "weapon.onemace", "Spear": "weapon.spear", "Flail": "weapon.flail", 
    "Two-Handed Sword": "weapon.twosword", "Two-Handed Axe": "weapon.twoaxe", 
    "Two-Handed Mace": "weapon.twomace", "Quarterstaff": "weapon.warstaff",
    "Bow": "weapon.bow", "Crossbow": "weapon.crossbow", "Wand": "weapon.wand", 
    "Sceptre": "weapon.sceptre", "Staff": "weapon.staff",
    "Helmet": "armour.helmet", "Body Armour": "armour.chest", "Gloves": "armour.gloves", 
    "Boots": "armour.boots", "Quiver": "armour.quiver", "Shield": "armour.shield",
    "Amulet": "accessory.amulet", "Belt": "accessory.belt", "Ring": "accessory.ring",
}

CURRENCIES = ["divine", "exalted", "chaos", "alchemy", "alteration", "vaal", "regal"]

# --- Classe Principal ---
class PoeTracker:
    def __init__(self, root):
        self.root = root
        self.root.title("Path of Exile 2 - Item Tracker")
        self.root.geometry("1200x800")
        
        # Variáveis para autenticação
        self.poesessid = tk.StringVar()
        self.cf_clearance = tk.StringVar()
        self.useragent = tk.StringVar(value="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36")
        
        # Variáveis para filtros
        self.selected_category = tk.StringVar()
        self.selected_currency = tk.StringVar(value="divine")
        self.price_min = tk.StringVar()
        self.price_max = tk.StringVar()
        self.dps_min = tk.StringVar()
        self.pdps_min = tk.StringVar()
        
        # Variáveis para polling
        self.is_polling = False
        self.polling_interval = tk.StringVar(value="30")
        self.polling_thread = None
        self.stop_polling_flag = threading.Event()
        
        # Cache de detalhes de itens
        self._item_details_cache = {}
        
        # Carregar configuração
        self.load_config()
        
        # Criar interface
        self.create_ui()
    
    def create_ui(self):
        # ... código da interface ...
        pass
    
    def search_items(self):
        # Verificar autenticação
        if not self.poesessid.get():
            messagebox.showerror("Erro", "POESESSID não configurado!")
            return
        
        # Construir payload
        payload = self.build_search_payload()
        
        try:
            # Fazer requisição
            search_response = requests.post(
                "https://www.pathofexile.com/api/trade2/search/poe2/Standard",
                headers=self.build_headers(),
                cookies=self.build_cookies(),
                json=payload
            )
            
            # Processar resposta
            # ... código de processamento ...
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro na busca: {e}")
    
    def analyze_divine_worth(self, item_data):
        # Lógica para analisar o valor de divine
        # ... código de análise ...
        pass
    
    def build_headers(self):
        return {
            'Content-Type': 'application/json',
            'User-Agent': self.useragent.get(),
            'Accept': '*/*',
            'Origin': 'https://www.pathofexile.com',
            'Referer': 'https://www.pathofexile.com/trade2/search/poe2/Standard',
        }
    
    def build_cookies(self):
        cookies = {}
        if self.poesessid.get():
            cookies['POESESSID'] = self.poesessid.get()
        if self.cf_clearance.get():
            cookies['cf_clearance'] = self.cf_clearance.get()
        return cookies
    
    def build_search_payload(self):
        # ... código para construir payload ...
        payload = {
            "query": {
                "status": {"option": "online"},
                "stats": [{"type": "and", "filters": []}],
                "filters": {}
            },
            "sort": {"price": "asc"}
        }
        
        return payload

# --- Inicialização ---
if __name__ == "__main__":
    root = tk.Tk()
    app = PoeTracker(root)
    root.mainloop()
`;

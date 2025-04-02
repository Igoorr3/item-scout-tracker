
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

type ItemType = {
  category: string;
  items: Array<{
    name: string;
    value: string;
  }>;
};

const ITEM_TYPES: ItemType[] = [
  {
    category: "Weapons",
    items: [
      { name: "Qualquer Arma", value: "weapon" },
      { name: "Qualquer Arma Corpo-a-Corpo de Uma Mão", value: "weapon.onehanded" },
      { name: "Arma Desarmada", value: "weapon.unarmed" },
      { name: "Garra", value: "weapon.claw" },
      { name: "Adaga", value: "weapon.dagger" },
      { name: "Espada de Uma Mão", value: "weapon.onesword" },
      { name: "Machado de Uma Mão", value: "weapon.oneaxe" },
      { name: "Maça de Uma Mão", value: "weapon.onemace" },
      { name: "Lança", value: "weapon.spear" },
      { name: "Mangual", value: "weapon.flail" },
      { name: "Qualquer Arma Corpo-a-Corpo de Duas Mãos", value: "weapon.twohanded" },
      { name: "Espada de Duas Mãos", value: "weapon.twosword" },
      { name: "Machado de Duas Mãos", value: "weapon.twoaxe" },
      { name: "Maça de Duas Mãos", value: "weapon.twomace" },
      { name: "Cajado de Guerra", value: "weapon.quarterstaff" },
      { name: "Qualquer Arma à Distância", value: "weapon.ranged" },
      { name: "Arco", value: "weapon.bow" },
      { name: "Besta", value: "weapon.crossbow" },
      { name: "Qualquer Arma de Conjurador", value: "weapon.caster" },
      { name: "Varinha", value: "weapon.wand" },
      { name: "Cetro", value: "weapon.sceptre" },
      { name: "Cajado", value: "weapon.staff" },
      { name: "Vara de Pescar", value: "weapon.fishingrod" }
    ]
  },
  {
    category: "Armaduras",
    items: [
      { name: "Qualquer Armadura", value: "armour" },
      { name: "Capacete", value: "armour.helmet" },
      { name: "Armadura do Torso", value: "armour.chest" },
      { name: "Luvas", value: "armour.gloves" },
      { name: "Botas", value: "armour.boots" },
      { name: "Aljava", value: "armour.quiver" },
      { name: "Escudo", value: "armour.shield" },
      { name: "Foco", value: "armour.focus" },
      { name: "Broquel", value: "armour.buckler" }
    ]
  },
  {
    category: "Acessórios",
    items: [
      { name: "Qualquer Acessório", value: "accessory" },
      { name: "Amuleto", value: "accessory.amulet" },
      { name: "Cinto", value: "accessory.belt" },
      { name: "Anel", value: "accessory.ring" }
    ]
  },
  {
    category: "Gemas",
    items: [
      { name: "Qualquer Gema", value: "gem" },
      { name: "Gema de Habilidade", value: "gem.skill" },
      { name: "Gema de Suporte", value: "gem.support" },
      { name: "Meta Gema", value: "gem.meta" }
    ]
  },
  {
    category: "Outros",
    items: [
      { name: "Qualquer Joia", value: "jewel" },
      { name: "Qualquer Frasco", value: "flask" },
      { name: "Frasco de Vida", value: "flask.life" },
      { name: "Frasco de Mana", value: "flask.mana" },
      { name: "Qualquer Item de Endgame", value: "map" },
      { name: "Pedra de Caminho", value: "map.waystone" },
      { name: "Fragmento de Mapa", value: "map.fragment" },
      { name: "Livro de Registros", value: "map.logbook" },
      { name: "Pedra de Brecha", value: "map.breachstone" },
      { name: "Barya", value: "map.barya" },
      { name: "Chave Primordial", value: "map.pinnacle" },
      { name: "Chave de Ultimato", value: "map.ultimatum" },
      { name: "Tábua", value: "map.tablet" },
      { name: "Carta de Adivinhação", value: "divination" },
      { name: "Relíquia", value: "relic" },
      { name: "Qualquer Moeda", value: "currency" },
      { name: "Presságio", value: "currency.omen" },
      { name: "Qualquer Item Encaixável", value: "socketable" },
      { name: "Runa", value: "socketable.rune" },
      { name: "Núcleo de Alma", value: "socketable.soulcore" }
    ]
  }
];

interface ItemTypeSelectProps {
  onSelect: (value: string) => void;
  value?: string;
}

const ItemTypeSelect = ({ onSelect, value }: ItemTypeSelectProps) => {
  return (
    <Select value={value} onValueChange={onSelect}>
      <SelectTrigger className="w-full bg-muted border-border">
        <SelectValue placeholder="Selecione um tipo de item" />
      </SelectTrigger>
      <SelectContent className="bg-card border-border">
        {ITEM_TYPES.map((category) => (
          <SelectGroup key={category.category}>
            <SelectLabel className="text-primary">{category.category}</SelectLabel>
            {category.items.map((item) => (
              <SelectItem 
                key={item.value} 
                value={item.value}
                className="hover:bg-muted hover:text-primary cursor-pointer"
              >
                {item.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ItemTypeSelect;

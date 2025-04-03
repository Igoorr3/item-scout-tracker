
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Estas são as categorias corretas aceitas pela API do PoE2
const ITEM_TYPES = [
  { name: "Qualquer", value: "weapon" },
  // Armas
  { name: "Qualquer Arma", value: "weapon" },
  { name: "Arma Corpo a Corpo de Uma Mão", value: "weapon.one" },
  { name: "Desarmado", value: "weapon.unarmed" },
  { name: "Garra", value: "weapon.claw" },
  { name: "Adaga", value: "weapon.dagger" },
  { name: "Espada de Uma Mão", value: "weapon.onesword" },
  { name: "Machado de Uma Mão", value: "weapon.oneaxe" },
  { name: "Maça de Uma Mão", value: "weapon.onemace" },
  { name: "Lança", value: "weapon.spear" },
  { name: "Mangual", value: "weapon.flail" },
  { name: "Arma Corpo a Corpo de Duas Mãos", value: "weapon.two" },
  { name: "Espada de Duas Mãos", value: "weapon.twosword" },
  { name: "Machado de Duas Mãos", value: "weapon.twoaxe" },
  { name: "Maça de Duas Mãos", value: "weapon.twomace" },
  { name: "Bastão", value: "weapon.staff" },
  { name: "Arma à Distância", value: "weapon.ranged" },
  { name: "Arco", value: "weapon.bow" },
  { name: "Besta", value: "weapon.crossbow" },
  { name: "Arma de Lançador", value: "weapon.caster" },
  { name: "Varinha", value: "weapon.wand" },
  { name: "Cetro", value: "weapon.sceptre" },
  { name: "Cajado", value: "weapon.staff" },
  // Armaduras
  { name: "Qualquer Armadura", value: "armour" },
  { name: "Capacete", value: "armour.helmet" },
  { name: "Armadura Corporal", value: "armour.chest" },
  { name: "Luvas", value: "armour.gloves" },
  { name: "Botas", value: "armour.boots" },
  { name: "Aljava", value: "armour.quiver" },
  { name: "Escudo", value: "armour.shield" },
  { name: "Foco", value: "armour.focus" },
  { name: "Broquel", value: "armour.buckler" },
  // Acessórios
  { name: "Qualquer Acessório", value: "accessory" },
  { name: "Amuleto", value: "accessory.amulet" },
  { name: "Cinto", value: "accessory.belt" },
  { name: "Anel", value: "accessory.ring" },
  // Gemas
  { name: "Qualquer Gema", value: "gem" },
  { name: "Gema de Habilidade", value: "gem.skill" },
  { name: "Gema de Suporte", value: "gem.support" },
  // Joias
  { name: "Qualquer Joia", value: "jewel" },
  // Frascos
  { name: "Qualquer Frasco", value: "flask" },
  { name: "Frasco de Vida", value: "flask.life" },
  { name: "Frasco de Mana", value: "flask.mana" },
  // Itens de End-Game
  { name: "Qualquer Item de Fim de Jogo", value: "map" },
  { name: "Pedra de Caminho", value: "map.waystone" },
  { name: "Fragmento de Mapa", value: "map.fragment" },
  // Outros
  { name: "Carta de Adivinhação", value: "card" },
  { name: "Relíquia", value: "relic" },
  { name: "Moeda", value: "currency" },
  // Socketáveis
  { name: "Qualquer Encaixável", value: "socket" },
  { name: "Runa", value: "socket.rune" },
  { name: "Núcleo de Alma", value: "socket.soulcore" },
];

interface ItemTypeSelectProps {
  value: string;
  onSelect: (value: string) => void;
}

const ItemTypeSelect = ({ value, onSelect }: ItemTypeSelectProps) => {
  return (
    <Select value={value} onValueChange={onSelect}>
      <SelectTrigger className="w-full bg-muted border-border">
        <SelectValue placeholder="Selecione um tipo de item" />
      </SelectTrigger>
      <SelectContent className="bg-card border-border max-h-[300px]">
        {ITEM_TYPES.map((type) => (
          <SelectItem 
            key={type.value} 
            value={type.value}
            className="hover:bg-muted hover:text-primary cursor-pointer"
          >
            {type.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ItemTypeSelect;

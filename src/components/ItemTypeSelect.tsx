
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
  items: string[];
};

const ITEM_TYPES: ItemType[] = [
  {
    category: "Weapons",
    items: [
      "Any Weapon",
      "Any One-Handed Melee Weapon",
      "Unarmed",
      "Claw",
      "Dagger",
      "One-Handed Sword",
      "One-Handed Axe",
      "One-Handed Mace",
      "Spear",
      "Flail",
      "Any Two-Handed Melee Weapon",
      "Two-Handed Sword",
      "Two-Handed Axe",
      "Two-Handed Mace",
      "Quarterstaff",
      "Any Ranged Weapon",
      "Bow",
      "Crossbow",
      "Any Caster Weapon",
      "Wand",
      "Sceptre",
      "Staff",
      "Fishing Rod",
    ]
  },
  {
    category: "Armour",
    items: [
      "Any Armour",
      "Helmet",
      "Body Armour",
      "Gloves",
      "Boots",
      "Quiver",
      "Shield",
      "Focus",
      "Buckler",
    ]
  },
  {
    category: "Accessories",
    items: [
      "Any Accessory",
      "Amulet",
      "Belt",
      "Ring",
    ]
  },
  {
    category: "Gems",
    items: [
      "Any Gem",
      "Skill Gem",
      "Support Gem",
      "Meta Gem",
    ]
  },
  {
    category: "Other",
    items: [
      "Any Jewel",
      "Any Flask",
      "Life Flask",
      "Mana Flask",
      "Any Endgame Item",
      "Waystone",
      "Map Fragment",
      "Logbook",
      "Breachstone",
      "Barya",
      "Pinnacle Key",
      "Ultimatum Key",
      "Tablet",
      "Divination Card",
      "Relic",
      "Any Currency",
      "Omen",
      "Any Socketable",
      "Rune",
      "Soul Core",
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
                key={item} 
                value={item}
                className="hover:bg-muted hover:text-primary cursor-pointer"
              >
                {item}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ItemTypeSelect;

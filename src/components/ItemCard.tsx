
import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Item } from '@/types/items';
import { ArrowUpDown, DollarSign, Target } from 'lucide-react';

interface ItemCardProps {
  item: Item;
}

const ItemCard = ({ item }: ItemCardProps) => {
  // Determina a cor do fundo baseado na raridade do item
  const getBadgeVariant = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'unique': return 'destructive';
      case 'rare': return 'default';
      case 'magic': return 'secondary';
      default: return 'outline';
    }
  };

  // Verifica se o preço é uma boa oferta (menos que o preço previsto)
  const isGoodDeal = item.price < item.expectedPrice;

  return (
    <Card className="poe-item">
      <CardContent className="p-3 pb-0">
        <div className="flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <Badge variant={getBadgeVariant(item.rarity)} className="mr-2">
                {item.category}
              </Badge>
              <h3 className={`font-bold text-lg ${item.rarity === 'unique' ? 'poe-item-unique' : item.rarity === 'rare' ? 'poe-item-rare' : ''}`}>
                {item.name}
              </h3>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="poe-price flex items-center">
                    <DollarSign size={16} className="mr-1" />
                    {item.price} <span className="ml-1 poe-divine">divines</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <div className="mb-1">Preço listado: {item.price} divines</div>
                    <div className="mb-1">Preço previsto: {item.expectedPrice.toFixed(2)} divines</div>
                    <div>Preço médio: {item.averagePrice.toFixed(2)} divines</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-1 mb-3">
            {item.stats.map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="poe-stat">{stat.name}:</span>
                <span className="poe-value">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-3 py-2 border-t border-border">
        <div className="w-full flex justify-between items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <ArrowUpDown size={16} className="mr-1" />
                  <span className={isGoodDeal ? 'text-green-500' : 'text-red-500'}>
                    {isGoodDeal 
                      ? `${((1 - item.price / item.expectedPrice) * 100).toFixed(0)}% abaixo` 
                      : `${((item.price / item.expectedPrice - 1) * 100).toFixed(0)}% acima`}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isGoodDeal 
                  ? `Este item está ${((1 - item.price / item.expectedPrice) * 100).toFixed(0)}% abaixo do preço esperado` 
                  : `Este item está ${((item.price / item.expectedPrice - 1) * 100).toFixed(0)}% acima do preço esperado`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className={`${isGoodDeal ? 'poe-fire-icon' : ''} text-sm`}>
            {isGoodDeal ? 'Boa oferta!' : 'Preço normal'}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ItemCard;


import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Item } from '@/types/items';
import { ArrowUpDown, DollarSign, Target, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";

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
  
  // Calcula a porcentagem de diferença para o preço esperado
  const priceDiffPercentage = isGoodDeal 
    ? ((1 - item.price / item.expectedPrice) * 100).toFixed(0)
    : ((item.price / item.expectedPrice - 1) * 100).toFixed(0);
  
  // Determina classes CSS baseadas na diferença de preço
  const getPriceDiffClasses = () => {
    if (isGoodDeal) {
      const diff = parseFloat(priceDiffPercentage);
      if (diff >= 30) return "text-green-500 font-bold";
      if (diff >= 15) return "text-green-400";
      return "text-green-300";
    } else {
      return "text-red-400";
    }
  };

  // Abre o link de trade direto no site
  const openTradeLink = () => {
    if (item.tradeUrl) {
      window.open(item.tradeUrl, '_blank');
    }
  };

  return (
    <Card className={`poe-item transition-all duration-200 ${isGoodDeal ? 'border-green-500/40' : 'border-border'} hover:shadow-lg`}>
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
                  <span className={getPriceDiffClasses()}>
                    {isGoodDeal 
                      ? `${priceDiffPercentage}% abaixo` 
                      : `${priceDiffPercentage}% acima`}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isGoodDeal 
                  ? `Este item está ${priceDiffPercentage}% abaixo do preço esperado` 
                  : `Este item está ${priceDiffPercentage}% acima do preço esperado`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="flex items-center gap-2">
            {item.tradeUrl && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-muted-foreground hover:text-primary"
                onClick={openTradeLink}
              >
                <ExternalLink size={14} className="mr-1" />
                Ver
              </Button>
            )}
            
            <div className={`${isGoodDeal ? 'poe-fire-icon' : ''} text-sm ${isGoodDeal && parseInt(priceDiffPercentage) >= 20 ? 'font-bold text-green-500' : ''}`}>
              {isGoodDeal ? parseInt(priceDiffPercentage) >= 30 ? 'Excelente oferta!' : 'Boa oferta!' : 'Preço normal'}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ItemCard;


import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpDown, 
  Axe, 
  BadgeDollarSign, 
  Clock, 
  ExternalLink, 
  ThumbsUp, 
  ThumbsDown,
  ShieldAlert,
  TrendingUp,
  Star,
  DollarSign
} from "lucide-react";
import { Item, DivineAnalysis } from "@/types/items";
import { getStatLabel } from '@/data/statIds';

interface ItemCardProps {
  item: Item;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (price: number, currency: string) => {
    return `${price} ${currency}`;
  };

  // Organiza as estatísticas em categorias
  const baseStats = item.stats.filter(stat => !stat.isAffix);
  const affixes = item.stats.filter(stat => stat.isAffix);
  
  // Verifica se há recomendação para usar Divine
  const hasDivineRecommendation = item.divineAnalysis && 
    item.divineAnalysis.some(analysis => analysis.worthDivine);
    
  // Encontra o maior potencial de ganho entre os mods
  const maxPotentialGain = item.divineAnalysis && item.divineAnalysis.length > 0 
    ? Math.max(...item.divineAnalysis.map(a => a.potentialGain)) 
    : 0;
    
  // Determina a classe de cor baseada no potencial
  const getPotentialClass = (gain: number) => {
    if (gain >= 50) return "text-green-600 dark:text-green-400 font-bold";
    if (gain >= 30) return "text-amber-600 dark:text-amber-400 font-semibold";
    if (gain >= 15) return "text-blue-600 dark:text-blue-400";
    return "text-muted-foreground";
  };

  return (
    <Card className="w-full bg-card border border-primary/20 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-primary">{item.name}</h3>
            <p className="text-sm text-muted-foreground">{item.category}</p>
          </div>
          <Badge 
            variant={item.rarity === 'unique' ? 'destructive' : item.rarity === 'rare' ? 'default' : 'outline'}
            className="uppercase"
          >
            {item.rarity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-3 space-y-3">
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <Badge variant="secondary" className="flex gap-1 items-center">
            <BadgeDollarSign size={14} /> 
            {formatCurrency(item.price, item.currency)}
          </Badge>
          
          {item.expectedPrice && item.expectedPrice > item.price && (
            <Badge variant="outline" className="flex gap-1 items-center text-green-600 dark:text-green-400">
              <TrendingUp size={14} /> 
              Potencial: {formatCurrency(item.expectedPrice, item.currency)}
            </Badge>
          )}
          
          {item.seller && (
            <Badge variant="outline" className="flex gap-1 items-center text-muted-foreground">
              @{item.seller}
            </Badge>
          )}
          
          {item.listedTime && (
            <Badge variant="outline" className="flex gap-1 items-center text-muted-foreground">
              <Clock size={14} /> 
              {item.listedTime}
            </Badge>
          )}
        </div>

        {/* DPS Indicators with Max Potential */}
        <div className="flex flex-wrap gap-2">
          {item.totalDps && (
            <Badge className="bg-amber-600">
              DPS: {item.totalDps}
              {item.maxDps && item.maxDps > item.totalDps && (
                <span className="ml-1 text-white/90">(→ {item.maxDps})</span>
              )}
            </Badge>
          )}
          
          {item.physicalDps && (
            <Badge className="bg-slate-600">
              pDPS: {item.physicalDps}
              {item.maxPdps && item.maxPdps > item.physicalDps && (
                <span className="ml-1 text-white/90">(→ {item.maxPdps})</span>
              )}
            </Badge>
          )}
          
          {item.elementalDps && (
            <Badge className="bg-blue-600">
              eDPS: {item.elementalDps}
            </Badge>
          )}
        </div>
        
        {/* Divine Orb Recommendation */}
        {hasDivineRecommendation && (
          <div className={`flex items-center mt-1 p-2 rounded text-sm ${getPotentialClass(maxPotentialGain)} bg-muted/40`}>
            <Star size={16} className="mr-2" />
            <span>
              Divine Recomendado! Potencial de ganho: <strong>{maxPotentialGain}%</strong>
              {item.expectedPrice && item.expectedPrice > item.price && (
                <span className="ml-1">(Preço estimado: {formatCurrency(item.expectedPrice, item.currency)})</span>
              )}
            </span>
          </div>
        )}

        {/* Base Stats */}
        {baseStats.length > 0 && (
          <div className="mt-2 text-sm">
            <h4 className="font-medium mb-1 text-muted-foreground">Propriedades Base:</h4>
            <div className="space-y-1">
              {baseStats.map((stat, idx) => (
                <div key={`base-${idx}`} className="flex justify-between">
                  <span>{stat.name}:</span> 
                  <span className="font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expand/Collapse for affixes */}
        {affixes.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">Modificadores:</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setExpanded(!expanded)} 
                className="h-6 px-2 text-xs"
              >
                {expanded ? "Recolher" : "Expandir"}
              </Button>
            </div>

            {expanded && (
              <div className="space-y-2 mt-2">
                {affixes.map((stat, idx) => {
                  const statId = Object.keys(item.stats)
                    .find(key => getStatLabel(key) === stat.name);
                  
                  const analysis = item.divineAnalysis?.find(a => 
                    a.statName === stat.name || a.statId === statId);
                  
                  return (
                    <div key={`affix-${idx}`} className="text-sm">
                      <div className="flex justify-between">
                        <span>{stat.name}:</span>
                        <div>
                          <span className="font-medium">{stat.value}</span>
                          {stat.min !== undefined && stat.max !== undefined && (
                            <span className="text-muted-foreground text-xs ml-1">
                              [{stat.min}–{stat.max}]
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {analysis && (
                        <div className={`text-xs mt-0.5 ${getPotentialClass(analysis.potentialGain)}`}>
                          <div className="flex items-center">
                            {analysis.worthDivine ? (
                              <ThumbsUp size={12} className="mr-1" />
                            ) : (
                              <ThumbsDown size={12} className="mr-1" />
                            )}
                            <span>
                              Roll atual: {analysis.currentPercentile}% do máximo
                              {analysis.potentialGain > 0 && (
                                <span className="ml-1">(Potencial: +{analysis.potentialGain}%)</span>
                              )}
                            </span>
                          </div>
                          <div className="mt-0.5">
                            {analysis.recommendation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {!expanded && affixes.length > 3 && (
              <div className="text-sm space-y-1">
                {affixes.slice(0, 3).map((stat, idx) => (
                  <div key={`affix-preview-${idx}`} className="flex justify-between">
                    <span>{stat.name}:</span>
                    <div>
                      <span className="font-medium">{stat.value}</span>
                      {stat.min !== undefined && stat.max !== undefined && (
                        <span className="text-muted-foreground text-xs ml-1">
                          [{stat.min}–{stat.max}]
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground italic">
                  +{affixes.length - 3} mais modificadores...
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 py-2 bg-muted/30 border-t border-border flex justify-between">
        <div>
          {maxPotentialGain > 0 && (
            <div className={`text-xs ${getPotentialClass(maxPotentialGain)}`}>
              <span className="flex items-center">
                <DollarSign size={12} className="mr-1" />
                Potencial Divine: {maxPotentialGain}%
              </span>
            </div>
          )}
        </div>
        {item.tradeUrl && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => window.open(item.tradeUrl, '_blank')}
          >
            <ExternalLink size={14} className="mr-1" />
            Ver no Site
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ItemCard;

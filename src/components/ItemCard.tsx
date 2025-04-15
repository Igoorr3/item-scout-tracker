
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
  DollarSign,
  Sword,
  Zap
} from "lucide-react";
import { Item, DivineAnalysis } from "@/types/items";
import { getStatLabel } from '@/data/statIds';

interface ItemCardProps {
  item: Item;
  displayMode?: 'dps' | 'pdps' | 'both'; // Added display mode to control what DPS to highlight
}

const ItemCard: React.FC<ItemCardProps> = ({ item, displayMode = 'both' }) => {
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
    
  // Find DPS-affecting mods and their potential gain
  const dpsAffectingMods = item.divineAnalysis?.filter(a => a.affectsDps) || [];
  const hasDpsImprovingMods = dpsAffectingMods.some(a => a.worthDivine);
    
  // Calculate maximum potential gains for different aspects
  const maxPotentialGain = item.divineAnalysis && item.divineAnalysis.length > 0 
    ? Math.max(...item.divineAnalysis.map(a => a.potentialGain)) 
    : 0;
    
  const maxDpsPotentialGain = dpsAffectingMods.length > 0
    ? Math.max(...dpsAffectingMods.map(a => a.potentialGain)) 
    : 0;
    
  // Determine which DPS improvement to display based on displayMode
  const dpsGainPercentage = item.dpsGainPotential || 0;
  const pdpsGainPercentage = item.pdpsGainPotential || 0;
  
  // Determine the color class based on potential gain
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
            <p className="text-sm text-muted-foreground">{item.baseType || item.category}</p>
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

        {/* Separate DPS and PDPS Indicators with Max Potential */}
        <div className="flex flex-wrap gap-2">
          {/* Total DPS display */}
          {item.totalDps && (displayMode === 'both' || displayMode === 'dps') && (
            <Badge className="bg-amber-600">
              <Zap size={14} className="mr-1" />
              DPS: {item.totalDps.toFixed(1)}
              {item.maxDps && item.maxDps > item.totalDps && (
                <span className="ml-1 text-white/90">(→ {item.maxDps.toFixed(1)})</span>
              )}
              {dpsGainPercentage > 0 && (
                <span className="ml-1 text-white">+{dpsGainPercentage.toFixed(1)}%</span>
              )}
            </Badge>
          )}
          
          {/* Physical DPS display */}
          {item.physicalDps && (displayMode === 'both' || displayMode === 'pdps') && (
            <Badge className="bg-slate-600">
              <Sword size={14} className="mr-1" />
              pDPS: {item.physicalDps.toFixed(1)}
              {item.maxPdps && item.maxPdps > item.physicalDps && (
                <span className="ml-1 text-white/90">(→ {item.maxPdps.toFixed(1)})</span>
              )}
              {pdpsGainPercentage > 0 && (
                <span className="ml-1 text-white">+{pdpsGainPercentage.toFixed(1)}%</span>
              )}
            </Badge>
          )}
          
          {/* Elemental DPS display if it exists */}
          {item.elementalDps && item.elementalDps > 0 && (
            <Badge className="bg-blue-600">
              <Zap size={14} className="mr-1" />
              eDPS: {item.elementalDps.toFixed(1)}
            </Badge>
          )}
        </div>
        
        {/* Divine Orb Recommendation */}
        {hasDivineRecommendation && (
          <div className={`flex items-center mt-1 p-2 rounded text-sm ${getPotentialClass(maxPotentialGain)} bg-muted/40`}>
            <Star size={16} className="mr-2" />
            <div>
              <div>
                Divine Recomendado! Potencial de ganho total: <strong>{maxPotentialGain.toFixed(1)}%</strong>
              </div>
              
              {hasDpsImprovingMods && (
                <div className="mt-1">
                  <span>Ganho potencial de DPS: <strong>{dpsGainPercentage.toFixed(1)}%</strong></span>
                  {displayMode === 'pdps' && pdpsGainPercentage > 0 && (
                    <span className="ml-2">pDPS: <strong>{pdpsGainPercentage.toFixed(1)}%</strong></span>
                  )}
                </div>
              )}
              
              {item.expectedPrice && item.expectedPrice > item.price && (
                <div className="mt-1">
                  Preço estimado: <strong>{formatCurrency(item.expectedPrice, item.currency)}</strong>
                  <span className="ml-1">(+{((item.expectedPrice / item.price - 1) * 100).toFixed(1)}%)</span>
                </div>
              )}
            </div>
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
                  
                  // Highlight DPS affecting mods
                  const isDpsAffectingMod = analysis?.affectsDps === true;
                  
                  return (
                    <div key={`affix-${idx}`} className={`text-sm ${isDpsAffectingMod ? "border-l-2 border-amber-500 pl-2" : ""}`}>
                      <div className="flex justify-between">
                        <span>{isDpsAffectingMod && <Sword size={12} className="inline mr-1 text-amber-500" />}{stat.name}:</span>
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
                                <span className="ml-1">(Potencial: +{analysis.potentialGain.toFixed(1)}%)</span>
                              )}
                              {isDpsAffectingMod && (
                                <span className="ml-1 text-amber-500">• Afeta DPS</span>
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
                {affixes.slice(0, 3).map((stat, idx) => {
                  const analysis = item.divineAnalysis?.find(a => a.statName === stat.name);
                  const isDpsAffectingMod = analysis?.affectsDps === true;
                  
                  return (
                    <div key={`affix-preview-${idx}`} className="flex justify-between">
                      <span>
                        {isDpsAffectingMod && <Sword size={12} className="inline mr-1 text-amber-500" />}
                        {stat.name}:
                      </span>
                      <div>
                        <span className="font-medium">{stat.value}</span>
                        {stat.min !== undefined && stat.max !== undefined && (
                          <span className="text-muted-foreground text-xs ml-1">
                            [{stat.min}–{stat.max}]
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
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
          {displayMode === 'dps' && dpsGainPercentage > 0 && (
            <div className={`text-xs ${getPotentialClass(dpsGainPercentage)}`}>
              <span className="flex items-center">
                <Zap size={12} className="mr-1" />
                Potencial DPS: +{dpsGainPercentage.toFixed(1)}%
              </span>
            </div>
          )}
          
          {displayMode === 'pdps' && pdpsGainPercentage > 0 && (
            <div className={`text-xs ${getPotentialClass(pdpsGainPercentage)}`}>
              <span className="flex items-center">
                <Sword size={12} className="mr-1" />
                Potencial pDPS: +{pdpsGainPercentage.toFixed(1)}%
              </span>
            </div>
          )}
          
          {displayMode === 'both' && maxPotentialGain > 0 && (
            <div className={`text-xs ${getPotentialClass(maxPotentialGain)}`}>
              <span className="flex items-center">
                <DollarSign size={12} className="mr-1" />
                Potencial Divine: {maxPotentialGain.toFixed(1)}%
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

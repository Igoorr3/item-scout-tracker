
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item } from '@/types/items';
import ItemCard from './ItemCard';
import { AlertTriangle, Loader2, ExternalLink, Sword, Zap, LayoutGrid } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ItemListProps {
  title: string;
  items: Item[];
  isLoading?: boolean;
  error?: string;
}

const ItemList = ({ title, items, isLoading = false, error }: ItemListProps) => {
  // State for display mode (DPS vs PDPS)
  const [displayMode, setDisplayMode] = useState<'dps' | 'pdps' | 'both'>('both');
  
  // Function to sort items based on the current display mode
  const getSortedItems = () => {
    if (displayMode === 'pdps') {
      // Sort by PDPS potential when in PDPS mode
      return [...items].sort((a, b) => (b.pdpsGainPotential || 0) - (a.pdpsGainPotential || 0));
    } else if (displayMode === 'dps') {
      // Sort by total DPS potential when in DPS mode
      return [...items].sort((a, b) => (b.dpsGainPotential || 0) - (a.dpsGainPotential || 0));
    } else {
      // Default sorting by overall Divine worth
      return [...items];
    }
  };
  
  // Find items with good deals
  const sortedItems = getSortedItems();
  
  // Identify items with good DPS potential based on the current mode
  const goodDpsItems = displayMode === 'pdps' 
    ? sortedItems.filter(item => (item.pdpsGainPotential || 0) >= 30)
    : sortedItems.filter(item => (item.dpsGainPotential || 0) >= 30);
    
  // Find good price deals
  const goodPriceDeals = sortedItems.filter(item => item.price <= (item.expectedPrice || 0) * 0.7);

  // Function to open URL of trade
  const openTradeUrl = (url?: string, item?: Item) => {
    if (url) {
      window.open(url, '_blank');
      if (item) {
        toast.info(`Abrindo item ${item.name} no site de trade`);
      }
    } else {
      toast.error("URL de trade não disponível para este item");
    }
  };
  
  return (
    <Card className="bg-card border-primary/20 shadow-lg">
      <CardHeader className="border-b border-border pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-primary flex items-center">
            <div>
              {title} {items.length > 0 && <span className="text-sm font-normal ml-2">({items.length} items)</span>}
              {goodPriceDeals.length > 0 && <span className="text-sm font-normal text-green-500 ml-2">• {goodPriceDeals.length} boas ofertas!</span>}
            </div>
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* DPS/PDPS Toggle Group */}
            <ToggleGroup type="single" value={displayMode} onValueChange={(value) => value && setDisplayMode(value as 'dps' | 'pdps' | 'both')}>
              <ToggleGroupItem value="dps" aria-label="Mostrar DPS total" title="Mostrar DPS total">
                <Zap className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="pdps" aria-label="Mostrar DPS físico" title="Mostrar DPS físico">
                <Sword className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="both" aria-label="Mostrar ambos" title="Mostrar ambos">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            
            {/* Trade Site Link */}
            {items.length > 0 && items[0].tradeUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openTradeUrl(items[0].tradeUrl, items[0])}
                className="flex items-center gap-1 text-xs h-7 px-2"
              >
                Ver no site <ExternalLink size={12} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Buscando itens...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertTriangle className="h-8 w-8" />
            <p className="mt-2">{error}</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum item encontrado para os critérios atuais.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar os filtros ou aguarde novas listagens.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Show items with high DPS potential first */}
            {goodDpsItems.length > 0 && (
              <>
                <div className="col-span-1 md:col-span-2 mb-2">
                  <h3 className="text-amber-500 font-medium border-b border-amber-500/20 pb-1 flex items-center justify-between">
                    <span>
                      {displayMode === 'pdps' ? (
                        <><Sword className="inline h-4 w-4 mr-1" /> Alto Potencial pDPS</>
                      ) : (
                        <><Zap className="inline h-4 w-4 mr-1" /> Alto Potencial DPS</>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      30%+ potencial de melhoria com Divine
                    </span>
                  </h3>
                </div>
                {goodDpsItems.map((item) => (
                  <ItemCard key={`dps-${item.id}`} item={item} displayMode={displayMode} />
                ))}
                
                {sortedItems.length > goodDpsItems.length && (
                  <div className="col-span-1 md:col-span-2 mt-4 mb-2">
                    <h3 className="text-muted-foreground font-medium border-b border-border pb-1">Outros Itens</h3>
                  </div>
                )}
              </>
            )}
            
            {/* Then other items, excluding those already shown */}
            {sortedItems
              .filter(item => !goodDpsItems.includes(item))
              .map((item) => (
                <ItemCard key={item.id} item={item} displayMode={displayMode} />
              ))
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ItemList;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item } from '@/types/items';
import ItemCard from './ItemCard';
import { AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

interface ItemListProps {
  title: string;
  items: Item[];
  isLoading?: boolean;
  error?: string;
}

const ItemList = ({ title, items, isLoading = false, error }: ItemListProps) => {
  // Encontrar itens com boas ofertas (30% ou mais abaixo do preço esperado)
  const goodDeals = items.filter(item => item.price <= item.expectedPrice * 0.7);

  // Função para abrir URL de trade
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
      <CardHeader className="border-b border-border">
        <CardTitle className="text-primary flex items-center justify-between">
          <div>
            {title} {items.length > 0 && <span className="text-sm font-normal ml-2">({items.length} items)</span>}
            {goodDeals.length > 0 && <span className="text-sm font-normal text-green-500 ml-2">• {goodDeals.length} boas ofertas!</span>}
          </div>
          
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
        </CardTitle>
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
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum item encontrado para os critérios atuais.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar os filtros ou aguarde novas listagens.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goodDeals.length > 0 && (
              <>
                <div className="col-span-1 md:col-span-2 mb-2">
                  <h3 className="text-green-500 font-medium border-b border-green-500/20 pb-1 flex items-center justify-between">
                    <span>Melhores Ofertas</span>
                    <span className="text-xs text-muted-foreground">30% abaixo do preço médio</span>
                  </h3>
                </div>
                {goodDeals.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
                
                {items.length > goodDeals.length && (
                  <div className="col-span-1 md:col-span-2 mt-4 mb-2">
                    <h3 className="text-muted-foreground font-medium border-b border-border pb-1">Outros Itens</h3>
                  </div>
                )}
              </>
            )}
            
            {items
              .filter(item => !goodDeals.includes(item))
              .map((item) => (
                <ItemCard key={item.id} item={item} />
              ))
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ItemList;

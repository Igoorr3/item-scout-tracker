
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item } from '@/types/items';
import ItemCard from './ItemCard';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ItemListProps {
  title: string;
  items: Item[];
  isLoading?: boolean;
  error?: string;
}

const ItemList = ({ title, items, isLoading = false, error }: ItemListProps) => {
  // Encontrar itens com boas ofertas (30% ou mais abaixo do preço esperado)
  const goodDeals = items.filter(item => item.price <= item.expectedPrice * 0.7);
  
  return (
    <Card className="bg-card border-primary/20 shadow-lg">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-primary">
          {title} {items.length > 0 && <span className="text-sm font-normal ml-2">({items.length} items)</span>}
          {goodDeals.length > 0 && <span className="text-sm font-normal text-green-500 ml-2">• {goodDeals.length} boas ofertas!</span>}
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
                  <h3 className="text-green-500 font-medium border-b border-green-500/20 pb-1">Melhores Ofertas</h3>
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

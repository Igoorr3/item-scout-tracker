
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles } from 'lucide-react';

interface TrackerHeaderProps {
  onCreateTracker: () => void;
}

const TrackerHeader = ({ onCreateTracker }: TrackerHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 mt-2 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Sparkles className="mr-2 h-8 w-8" />
          Item Scout Tracker
        </h1>
        <p className="text-muted-foreground mt-1">
          Rastreie e analise itens do mercado do Path of Exile 2
        </p>
      </div>
      
      <Button 
        onClick={onCreateTracker} 
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Novo Rastreador
      </Button>
    </div>
  );
};

export default TrackerHeader;


import { Button } from '@/components/ui/button';
import { Target, Plus, Download, ChevronLeft } from 'lucide-react'; 
import { useIsMobile } from '@/hooks/use-mobile';
import ApiConfigDialog from './ApiConfigDialog';
import { Link, useLocation } from 'react-router-dom'; 

interface TrackerHeaderProps {
  onTrackingClick: () => void;
  apiConfigured: boolean;
}

const TrackerHeader = ({ onTrackingClick, apiConfigured }: TrackerHeaderProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isPythonPage = location.pathname.includes('/python');

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 py-4 border-b">
      <div className="flex items-center gap-3">
        {isPythonPage && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2" 
            asChild
          >
            <Link to="/">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </Button>
        )}
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">PoE2 Item Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Monitore itens do mercado de Path of Exile 2
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!isPythonPage && !isMobile && (
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-1"
            asChild
          >
            <Link to="/python">
              <Download className="h-4 w-4 mr-1" />
              Integração Python
            </Link>
          </Button>
        )}
        {!isPythonPage && (
          <Button
            variant={apiConfigured ? "outline" : "default"}
            size="sm"
            onClick={onTrackingClick}
          >
            {isMobile ? (
              <Plus className="h-4 w-4" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Nova Busca
              </>
            )}
          </Button>
        )}
        <ApiConfigDialog 
          open={false}
          onOpenChange={() => {}}
          apiConfig={{
            poesessid: '',
            cfClearance: [],
            useragent: '',
            isConfigured: false,
            useProxy: false,
            debugMode: false
          }}
          onSaveConfig={() => {}}
        />
      </div>
    </div>
  );
};

export default TrackerHeader;

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConnectionStatusBannerProps {
  onRetry: () => void;
}

/**
 * Banner that appears when user loses internet connection
 * Allows for retry connection and informs about offline mode
 */
export const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({ 
  onRetry 
}) => {
  return (
    <Alert variant="destructive" className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Brak połączenia z internetem. Twoje zmiany zostaną zapisane lokalnie i zsynchronizowane po przywróceniu połączenia.
        </AlertDescription>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRetry}
        className="bg-background hover:bg-background/90 ml-2 shrink-0"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Spróbuj ponownie
      </Button>
    </Alert>
  );
}; 
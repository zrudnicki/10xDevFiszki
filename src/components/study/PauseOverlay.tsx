import React from 'react';
import { Play, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PauseOverlayProps {
  onResume: () => void;
  onEnd: () => void;
}

/**
 * Overlay displayed when the study session is paused
 * Provides options to resume or end the session
 */
export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  onResume,
  onEnd
}) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="bg-card border rounded-lg shadow-lg p-8 max-w-md text-center space-y-6">
        <h2 className="text-2xl font-semibold">Sesja wstrzymana</h2>
        
        <p className="text-muted-foreground">
          Twoja sesja nauki została wstrzymana. Możesz ją wznowić lub zakończyć.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={onEnd} 
            className="flex items-center gap-2"
          >
            <StopCircle className="h-4 w-4" />
            Zakończ sesję
          </Button>
          
          <Button 
            onClick={onResume} 
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Wznów naukę
          </Button>
        </div>
      </div>
    </div>
  );
}; 
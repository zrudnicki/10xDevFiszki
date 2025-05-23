import { useState, useEffect } from "react";
import { Play, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasSavedSession } from "@/lib/utils/localStorageSync";

interface ResumeSessionBannerProps {
  onResumeSession: () => void;
  onDismiss: () => void;
}

export const ResumeSessionBanner = ({
  onResumeSession,
  onDismiss
}: ResumeSessionBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Check for a saved session when component mounts
  useEffect(() => {
    const savedSessionExists = hasSavedSession();
    setIsVisible(savedSessionExists);
  }, []);
  
  // If no saved session or already dismissed, don't render
  if (!isVisible) {
    return null;
  }
  
  const handleResume = () => {
    setIsVisible(false);
    onResumeSession();
  };
  
  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 text-blue-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          
          <div>
            <h3 className="font-medium text-blue-900 mb-1">
              Masz niezakończoną sesję nauki
            </h3>
            <p className="text-blue-700 text-sm">
              Chcesz kontynuować poprzednią sesję nauki? Jeśli nie, zostanie ona usunięta.
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleDismiss} 
          className="text-blue-500 hover:text-blue-700 p-1"
          aria-label="Zamknij"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="mt-3 flex gap-3 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-blue-700 hover:bg-blue-100 hover:text-blue-800"
        >
          Rozpocznij nową
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={handleResume}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"
        >
          <Play className="h-3.5 w-3.5" />
          Kontynuuj sesję
        </Button>
      </div>
    </div>
  );
}; 
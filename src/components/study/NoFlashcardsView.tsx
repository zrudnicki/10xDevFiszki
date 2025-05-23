import { FileText, Home, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo } from "react";

interface NoFlashcardsViewProps {
  onCreateFlashcards: () => void;
  onBackToDashboard: () => void;
}

/**
 * Component displayed when there are no flashcards due for review
 * Provides options to create new flashcards or return to dashboard
 */
export const NoFlashcardsView = memo(({
  onCreateFlashcards,
  onBackToDashboard
}: NoFlashcardsViewProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      
      <h2 className="text-2xl font-semibold mb-2">Brak fiszek do nauki</h2>
      
      <p className="mb-8 text-muted-foreground max-w-md">
        Nie masz żadnych fiszek do powtórki w tym momencie. Utwórz nowe fiszki lub wróć później.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={onCreateFlashcards}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Utwórz nowe fiszki
        </Button>
        
        <Button 
          onClick={onBackToDashboard}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Wróć do pulpitu
        </Button>
      </div>
    </div>
  );
});

NoFlashcardsView.displayName = "NoFlashcardsView"; 
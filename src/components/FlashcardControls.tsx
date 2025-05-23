import { Button } from "@/components/ui/button";
import { Check, ArrowUp, Loader2 } from "lucide-react";
import { memo } from "react";

interface FlashcardControlsProps {
  isSubmitting: boolean;
  onMarkAsLearned: () => void;
  onMarkForReview: () => void;
  showKeyboardShortcuts?: boolean;
}

export const FlashcardControls = memo(({
  isSubmitting,
  onMarkAsLearned,
  onMarkForReview,
  showKeyboardShortcuts = true
}: FlashcardControlsProps) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Controls description */}
      <div className="text-center text-sm text-muted-foreground">
        Jak dobrze znasz tę fiszkę?
      </div>
      
      {/* Control buttons */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          size="lg" 
          className="flex-1 max-w-[180px] border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 focus-visible:ring-red-500"
          disabled={isSubmitting}
          onClick={onMarkForReview}
        >
          <div className="flex flex-col items-center">
            <ArrowUp className="h-5 w-5 mb-1 rotate-180" />
            <span>Wymaga powtórki</span>
            {showKeyboardShortcuts && (
              <span className="text-xs mt-1 opacity-70">← strzałka w lewo</span>
            )}
          </div>
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="flex-1 max-w-[180px] border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 focus-visible:ring-green-500"
          disabled={isSubmitting}
          onClick={onMarkAsLearned}
        >
          <div className="flex flex-col items-center">
            <Check className="h-5 w-5 mb-1" />
            <span>Przyswojone</span>
            {showKeyboardShortcuts && (
              <span className="text-xs mt-1 opacity-70">→ strzałka w prawo</span>
            )}
          </div>
        </Button>
      </div>
      
      {/* Loading indicator */}
      {isSubmitting && (
        <div className="flex justify-center mt-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
});

FlashcardControls.displayName = "FlashcardControls"; 
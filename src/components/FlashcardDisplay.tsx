import { useState, useEffect } from "react";
import { type SessionFlashcardViewModel } from "@/types";
import { cn } from "@/lib/utils";

interface FlashcardDisplayProps {
  flashcard: SessionFlashcardViewModel;
  isFlipped: boolean;
  onFlip: () => void;
  className?: string;
}

/**
 * Flashcard display component with 3D flip animation
 * Shows front and back of a flashcard with smooth transition between them
 */
export const FlashcardDisplay = ({
  flashcard,
  isFlipped,
  onFlip,
  className
}: FlashcardDisplayProps) => {
  // Track if flip animation is in progress to prevent multiple rapid flips
  const [isFlipping, setIsFlipping] = useState(false);
  
  // Reset flipping state when flashcard changes
  useEffect(() => {
    setIsFlipping(false);
  }, [flashcard.id]);

  const handleFlip = () => {
    if (!isFlipping) {
      setIsFlipping(true);
      onFlip();
      
      // Reset flipping state after animation completes
      setTimeout(() => {
        setIsFlipping(false);
      }, 400); // Duration slightly longer than animation
    }
  };
  
  return (
    <div 
      className={cn(
        "relative w-full h-64 md:h-80 perspective-[1000px] cursor-pointer",
        className
      )}
      onClick={handleFlip}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? "Kliknij, aby zobaczyć pytanie" : "Kliknij, aby zobaczyć odpowiedź"}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleFlip();
          e.preventDefault();
        }
      }}
    >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-300 transform-style-preserve-3d",
          isFlipped ? "rotate-y-180" : ""
        )}
      >
        {/* Front side */}
        <div 
          className={cn(
            "absolute w-full h-full backface-hidden bg-card rounded-lg border p-6 shadow-sm flex flex-col"
          )}
        >
          {/* Category/Collection labels */}
          {(flashcard.collection_name || flashcard.category_name) && (
            <div className="text-xs text-muted-foreground mb-2 flex flex-wrap gap-2">
              {flashcard.collection_name && (
                <span className="bg-primary/10 px-2 py-0.5 rounded-full">
                  {flashcard.collection_name}
                </span>
              )}
              {flashcard.category_name && (
                <span className="bg-secondary/10 px-2 py-0.5 rounded-full">
                  {flashcard.category_name}
                </span>
              )}
            </div>
          )}
          
          {/* Front content */}
          <div className="flex-1 flex items-center justify-center overflow-auto">
            <p className="text-lg text-center font-medium">{flashcard.front}</p>
          </div>
          
          {/* Flip indicator */}
          <div className="text-xs text-center text-muted-foreground mt-4">
            Kliknij, aby odwrócić
          </div>
        </div>
        
        {/* Back side */}
        <div
          className={cn(
            "absolute w-full h-full backface-hidden bg-card rounded-lg border p-6 shadow-sm rotate-y-180 flex flex-col"
          )}
        >
          {/* Back content */}
          <div className="flex-1 flex items-center justify-center overflow-auto">
            <p className="text-center">{flashcard.back}</p>
          </div>
          
          {/* Flip indicator */}
          <div className="text-xs text-center text-muted-foreground mt-4">
            Kliknij, aby odwrócić
          </div>
        </div>
      </div>
    </div>
  );
};

// Add utility class styles to tailwind.config.js:
// perspective-1000: { perspective: '1000px' }
// transform-style-3d: { transformStyle: 'preserve-3d' }
// backface-hidden: { backfaceVisibility: 'hidden' }
// rotate-y-180: { transform: 'rotateY(180deg)' } 
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GeneratorFlashcardViewModel } from "@/types";

interface FlashcardReviewCardProps {
  flashcard: GeneratorFlashcardViewModel;
  onFlip?: () => void;
  className?: string;
}

export function FlashcardReviewCard({
  flashcard,
  onFlip,
  className,
}: FlashcardReviewCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
    onFlip?.();
  };

  return (
    <div
      className={cn(
        "relative h-[200px] w-full perspective-1000 cursor-pointer",
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? "Show question" : "Show answer"}
    >
      <div
        className={cn(
          "absolute h-full w-full transition-transform duration-500 preserve-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front */}
        <Card
          className={cn(
            "absolute h-full w-full backface-hidden p-6",
            "flex items-center justify-center text-center"
          )}
        >
          <p className="text-lg">{flashcard.front}</p>
        </Card>

        {/* Back */}
        <Card
          className={cn(
            "absolute h-full w-full backface-hidden rotate-y-180 p-6",
            "flex items-center justify-center text-center"
          )}
        >
          <p className="text-lg">{flashcard.back}</p>
        </Card>
      </div>
    </div>
  );
} 
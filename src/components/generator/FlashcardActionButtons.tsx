import { Button } from "@/components/ui/button";
import { Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratorFlashcardViewModel } from "@/types";

interface FlashcardActionButtonsProps {
  flashcard: GeneratorFlashcardViewModel;
  onAccept: (flashcard: GeneratorFlashcardViewModel) => void;
  onReject: (flashcard: GeneratorFlashcardViewModel) => void;
  onEdit: (flashcard: GeneratorFlashcardViewModel) => void;
  className?: string;
}

export function FlashcardActionButtons({
  flashcard,
  onAccept,
  onReject,
  onEdit,
  className,
}: FlashcardActionButtonsProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onAccept(flashcard)}
        className={cn(
          "h-8 w-8",
          flashcard.status === "accepted" && "bg-green-500 text-white hover:bg-green-600"
        )}
        aria-label="Accept flashcard"
      >
        <Check className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onEdit(flashcard)}
        className="h-8 w-8"
        aria-label="Edit flashcard"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onReject(flashcard)}
        className={cn(
          "h-8 w-8",
          flashcard.status === "rejected" && "bg-red-500 text-white hover:bg-red-600"
        )}
        aria-label="Reject flashcard"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
} 
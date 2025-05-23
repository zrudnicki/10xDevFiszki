import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GeneratorLayout } from "./GeneratorLayout";
import { GeneratorHeader } from "./GeneratorHeader";
import { FlashcardReviewCard } from "./FlashcardReviewCard";
import { FlashcardActionButtons } from "./FlashcardActionButtons";
import { FlashcardEditModal } from "./FlashcardEditModal";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  status: "pending" | "accepted" | "rejected";
}

interface FlashcardReviewPageProps {
  flashcards: Flashcard[];
  onSave: (flashcards: Flashcard[]) => void;
  onBack: () => void;
}

export function FlashcardReviewPage({
  flashcards: initialFlashcards,
  onSave,
  onBack,
}: FlashcardReviewPageProps) {
  const [flashcards, setFlashcards] = useState(initialFlashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const currentFlashcard = flashcards[currentIndex];
  const isLastCard = currentIndex === flashcards.length - 1;

  const handleAccept = () => {
    setFlashcards((prev) =>
      prev.map((card, index) =>
        index === currentIndex ? { ...card, status: "accepted" } : card
      )
    );
    if (!isLastCard) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleReject = () => {
    setFlashcards((prev) =>
      prev.map((card, index) =>
        index === currentIndex ? { ...card, status: "rejected" } : card
      )
    );
    if (!isLastCard) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (front: string, back: string) => {
    setFlashcards((prev) =>
      prev.map((card, index) =>
        index === currentIndex ? { ...card, front, back } : card
      )
    );
  };

  const handleNext = () => {
    if (isLastCard) {
      const acceptedFlashcards = flashcards.filter(
        (card) => card.status === "accepted"
      );
      onSave(acceptedFlashcards);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const acceptedCount = flashcards.filter(
    (card) => card.status === "accepted"
  ).length;
  const rejectedCount = flashcards.filter(
    (card) => card.status === "rejected"
  ).length;

  return (
    <GeneratorLayout currentStep={2} totalSteps={3}>
      <GeneratorHeader
        title="Review Generated Flashcards"
        description="Review each flashcard and decide whether to accept, reject, or edit it."
        currentStep={2}
        totalSteps={3}
      />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} of {flashcards.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Accepted: {acceptedCount} | Rejected: {rejectedCount}
          </div>
        </div>

        <FlashcardReviewCard
          front={currentFlashcard.front}
          back={currentFlashcard.back}
          className="mx-auto max-w-2xl"
        />

        <div className="flex justify-center gap-4">
          <FlashcardActionButtons
            onAccept={handleAccept}
            onReject={handleReject}
            onEdit={handleEdit}
            isAccepted={currentFlashcard.status === "accepted"}
            isRejected={currentFlashcard.status === "rejected"}
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext}>
            {isLastCard ? "Save Flashcards" : "Next"}
          </Button>
        </div>
      </div>

      <FlashcardEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        initialFront={currentFlashcard.front}
        initialBack={currentFlashcard.back}
      />
    </GeneratorLayout>
  );
} 
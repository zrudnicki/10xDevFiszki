import { useState } from "react";
import { GeneratorInputPage } from "./GeneratorInputPage";
import { FlashcardReviewPage } from "./FlashcardReviewPage";
import { GeneratorSummaryPage } from "./GeneratorSummaryPage";
import { CategoryDto, CollectionDto } from "@/types";

type Step = "input" | "review" | "summary";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  status: "pending" | "accepted" | "rejected";
}

export function GeneratorPage() {
  const [currentStep, setCurrentStep] = useState<Step>("input");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const handleGenerate = async (text: string) => {
    try {
      // TODO: Implement API call to generate flashcards
      const generatedFlashcards: Flashcard[] = [
        {
          id: "1",
          front: "Sample front 1",
          back: "Sample back 1",
          status: "pending",
        },
        {
          id: "2",
          front: "Sample front 2",
          back: "Sample back 2",
          status: "pending",
        },
      ];
      setFlashcards(generatedFlashcards);
      setCurrentStep("review");
    } catch (error) {
      console.error("Failed to generate flashcards:", error);
      // TODO: Show error notification
    }
  };

  const handleSaveFlashcards = async (acceptedFlashcards: Flashcard[]) => {
    try {
      // TODO: Implement API call to save flashcards
      setFlashcards(acceptedFlashcards);
      setCurrentStep("summary");
    } catch (error) {
      console.error("Failed to save flashcards:", error);
      // TODO: Show error notification
    }
  };

  const handleStartStudy = () => {
    window.location.href = "/study";
  };

  const handleBack = () => {
    if (currentStep === "review") {
      setCurrentStep("input");
    } else if (currentStep === "summary") {
      setCurrentStep("review");
    }
  };

  const handleCreateCollection = async (name: string): Promise<CollectionDto> => {
    // TODO: Implement API call to create collection
    return { id: "new-collection", name };
  };

  const handleCreateCategory = async (name: string): Promise<CategoryDto> => {
    // TODO: Implement API call to create category
    return { id: "new-category", name };
  };

  return (
    <div className="container mx-auto py-8">
      {currentStep === "input" && (
        <GeneratorInputPage
          onGenerate={handleGenerate}
          selectedCollectionId={selectedCollectionId}
          selectedCategoryId={selectedCategoryId}
          onCollectionChange={setSelectedCollectionId}
          onCategoryChange={setSelectedCategoryId}
          onCreateCollection={handleCreateCollection}
          onCreateCategory={handleCreateCategory}
        />
      )}

      {currentStep === "review" && (
        <FlashcardReviewPage
          flashcards={flashcards}
          onSave={handleSaveFlashcards}
          onBack={handleBack}
        />
      )}

      {currentStep === "summary" && (
        <GeneratorSummaryPage
          flashcards={flashcards}
          onStartStudy={handleStartStudy}
          onBack={handleBack}
        />
      )}
    </div>
  );
} 
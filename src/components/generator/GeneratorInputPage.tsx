import { useState } from "react";
import { type CategoryDto, type CollectionDto, type GenerateFlashcardsDto } from "@/types";
import { GeneratorLayout } from "./GeneratorLayout";
import { GeneratorHeader } from "./GeneratorHeader";
import { TextareaWithCounter } from "./TextareaWithCounter";
import { GeneratorOptionsForm } from "./GeneratorOptionsForm";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface GeneratorInputPageProps {
  collections: CollectionDto[];
  categories: CategoryDto[];
  onSubmit: (data: GenerateFlashcardsDto) => Promise<void>;
  onCreateCollection?: () => void;
  onCreateCategory?: () => void;
}

export function GeneratorInputPage({
  collections,
  categories,
  onSubmit,
  onCreateCollection,
  onCreateCategory,
}: GeneratorInputPageProps) {
  const [text, setText] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (text.length < 1000 || text.length > 10000) {
      setError("Tekst musi mieć między 1000 a 10000 znaków");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        text,
        collection_id: selectedCollectionId,
        category_id: selectedCategoryId,
      });
    } catch (err) {
      setError("Wystąpił błąd podczas generowania fiszek");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GeneratorLayout currentStep={1} totalSteps={3}>
      <GeneratorHeader
        title="Generowanie fiszek"
        description="Wprowadź tekst, na podstawie którego zostaną wygenerowane fiszki"
        currentStep={1}
        totalSteps={3}
      />

      <div className="space-y-6">
        <TextareaWithCounter
          value={text}
          onChange={setText}
          minLength={1000}
          maxLength={10000}
          placeholder="Wprowadź tekst do analizy (1000-10000 znaków)..."
          error={error}
        />

        <GeneratorOptionsForm
          selectedCollectionId={selectedCollectionId}
          selectedCategoryId={selectedCategoryId}
          collections={collections}
          categories={categories}
          onCollectionChange={setSelectedCollectionId}
          onCategoryChange={setSelectedCategoryId}
          onCreateCollection={onCreateCollection}
          onCreateCategory={onCreateCategory}
        />

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generuj fiszki
          </Button>
        </div>
      </div>
    </GeneratorLayout>
  );
} 
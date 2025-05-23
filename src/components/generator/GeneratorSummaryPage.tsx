import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { GeneratorFlashcardViewModel, CollectionDto, CategoryDto } from "../../types";

interface GeneratorSummaryPageProps {
  flashcards: GeneratorFlashcardViewModel[];
  collections: CollectionDto[];
  categories: CategoryDto[];
  onSave: (collectionId: string, categoryId: string | null) => Promise<void>;
  onCreateCollection: () => void;
  onCreateCategory: () => void;
}

export function GeneratorSummaryPage({
  flashcards,
  collections,
  categories,
  onSave,
  onCreateCollection,
  onCreateCategory
}: GeneratorSummaryPageProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedCollectionId) {
      alert("Wybierz kolekcję, do której chcesz zapisać fiszki.");
      return;
    }

    try {
      setIsSaving(true);
      await onSave(selectedCollectionId, selectedCategoryId);
    } catch (error) {
      console.error("Error saving flashcards:", error);
      alert("Wystąpił błąd podczas zapisywania fiszek. Spróbuj ponownie.");
    } finally {
      setIsSaving(false);
    }
  };

  const acceptedCount = flashcards.length;
  const editedCount = flashcards.filter(card => card.was_edited).length;

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Podsumowanie</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Liczba zaakceptowanych fiszek</p>
            <p className="text-2xl font-bold">{acceptedCount}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Liczba edytowanych fiszek</p>
            <p className="text-2xl font-bold">{editedCount}</p>
          </div>
        </div>
      </Card>

      {/* Collection and Category Selection */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Wybierz kolekcję i kategorię</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="collection" className="text-sm font-medium">
              Kolekcja
            </label>
            <div className="flex gap-2">
              <Select
                value={selectedCollectionId}
                onValueChange={setSelectedCollectionId}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Wybierz kolekcję" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={onCreateCollection}
              >
                Nowa
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Kategoria (opcjonalnie)
            </label>
            <div className="flex gap-2">
              <Select
                value={selectedCategoryId || ""}
                onValueChange={(value) => setSelectedCategoryId(value || null)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Brak kategorii</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={onCreateCategory}
              >
                Nowa
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Preview Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Podgląd fiszek</h2>
        <div className="space-y-4">
          {flashcards.map((card, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Fiszka {index + 1}</h3>
                {card.was_edited && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Edytowana
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Przód</p>
                  <p className="text-sm">{card.front}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tył</p>
                  <p className="text-sm">{card.back}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || !selectedCollectionId}
          className="w-full md:w-auto"
        >
          {isSaving ? "Zapisywanie..." : "Zapisz fiszki"}
        </Button>
      </div>
    </div>
  );
} 
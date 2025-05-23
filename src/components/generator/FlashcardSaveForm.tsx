import { useState } from "react";
import type { CollectionDto, CategoryDto } from "@/types";

interface FlashcardSaveFormProps {
  flashcards: Array<{
    front: string;
    back: string;
  }>;
  collections: CollectionDto[];
  categories: CategoryDto[];
}

export function FlashcardSaveForm({ flashcards, collections, categories }: FlashcardSaveFormProps) {
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selectedCollection) {
      setError("Please select a collection");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/flashcards/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcards: flashcards.map((card) => ({
            ...card,
            collection_id: selectedCollection,
            category_id: selectedCategory || null,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save flashcards");
      }

      // Redirect to collection view
      window.location.href = `/collections/${selectedCollection}`;
    } catch (error) {
      console.error("Error saving flashcards:", error);
      setError("Failed to save flashcards. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <label htmlFor="collection" className="block text-sm font-medium mb-1">
            Collection
          </label>
          <select
            id="collection"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isSaving}
          >
            <option value="">Select a collection</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category (optional)
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isSaving}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => window.location.href = "/generator/review"}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
          disabled={isSaving}
        >
          Back to Review
        </button>

        <div className="space-x-4">
          <button
            onClick={() => window.location.href = "/collections/new"}
            className="px-4 py-2 text-blue-600 hover:text-blue-800"
            disabled={isSaving}
          >
            New Collection
          </button>
          <button
            onClick={() => window.location.href = "/categories/new"}
            className="px-4 py-2 text-blue-600 hover:text-blue-800"
            disabled={isSaving}
          >
            New Category
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !selectedCollection}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Flashcards"}
          </button>
        </div>
      </div>
    </div>
  );
} 
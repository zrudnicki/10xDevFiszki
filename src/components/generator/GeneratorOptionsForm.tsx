import { type CategoryDto, type CollectionDto } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface GeneratorOptionsFormProps {
  selectedCollectionId: string | null;
  selectedCategoryId: string | null;
  collections: CollectionDto[];
  categories: CategoryDto[];
  onCollectionChange: (id: string | null) => void;
  onCategoryChange: (id: string | null) => void;
  onCreateCollection?: () => void;
  onCreateCategory?: () => void;
}

export function GeneratorOptionsForm({
  selectedCollectionId,
  selectedCategoryId,
  collections,
  categories,
  onCollectionChange,
  onCategoryChange,
  onCreateCollection,
  onCreateCategory,
}: GeneratorOptionsFormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium">Kolekcja</label>
        <div className="flex gap-2">
          <Select value={selectedCollectionId ?? ""} onValueChange={onCollectionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz kolekcję" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Brak</SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onCreateCollection && (
            <Button variant="outline" size="icon" onClick={onCreateCollection}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Kategoria</label>
        <div className="flex gap-2">
          <Select value={selectedCategoryId ?? ""} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz kategorię" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Brak</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onCreateCategory && (
            <Button variant="outline" size="icon" onClick={onCreateCategory}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 
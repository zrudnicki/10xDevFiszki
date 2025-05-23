import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import type { GeneratorFlashcardViewModel } from "../../types";

interface FlashcardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (flashcard: GeneratorFlashcardViewModel) => void;
  flashcard: GeneratorFlashcardViewModel;
}

export function FlashcardEditModal({
  isOpen,
  onClose,
  onSave,
  flashcard,
}: FlashcardEditModalProps) {
  const [front, setFront] = useState(flashcard.front);
  const [back, setBack] = useState(flashcard.back);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFront(flashcard.front);
    setBack(flashcard.back);
  }, [flashcard]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave({
        ...flashcard,
        front,
        back,
        was_edited: true,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save flashcard:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="front">Front (Question)</Label>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Enter the front of the flashcard"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {front.length}/200 characters
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="back">Back (Answer)</Label>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Enter the back of the flashcard"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {back.length}/500 characters
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
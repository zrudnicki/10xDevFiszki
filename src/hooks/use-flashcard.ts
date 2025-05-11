import { useState } from "react"
import { useApi } from "./use-api"
import { useToast } from "./use-toast"

interface Flashcard {
  id: number
  question: string
  answer: string
  collectionId: number
}

interface UseFlashcardProps {
  collectionId: number
  onDelete?: () => void
}

export function useFlashcard({ collectionId, onDelete }: UseFlashcardProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const { toast } = useToast()
  const { execute: executeApi, isLoading } = useApi<Flashcard[]>({
    onSuccess: (data) => {
      setFlashcards(data)
    },
  })

  const deleteFlashcard = async (id: number) => {
    try {
      await executeApi(
        fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
        }).then((res) => res.json())
      )
      toast({
        title: "Sukces",
        description: "Fiszka została usunięta",
      })
      onDelete?.()
    } catch (error) {
      // Error is handled by useApi
    }
  }

  const createFlashcard = async (question: string, answer: string) => {
    try {
      await executeApi(
        fetch("/api/flashcards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question, answer, collectionId }),
        }).then((res) => res.json())
      )
      toast({
        title: "Sukces",
        description: "Fiszka została utworzona",
      })
    } catch (error) {
      // Error is handled by useApi
    }
  }

  const updateFlashcard = async (
    id: number,
    question: string,
    answer: string
  ) => {
    try {
      await executeApi(
        fetch(`/api/flashcards/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question, answer }),
        }).then((res) => res.json())
      )
      toast({
        title: "Sukces",
        description: "Fiszka została zaktualizowana",
      })
    } catch (error) {
      // Error is handled by useApi
    }
  }

  const generateFlashcards = async (text: string) => {
    try {
      await executeApi(
        fetch("/api/flashcards/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, collectionId }),
        }).then((res) => res.json())
      )
      toast({
        title: "Sukces",
        description: "Fiszki zostały wygenerowane",
      })
    } catch (error) {
      // Error is handled by useApi
    }
  }

  return {
    flashcards,
    isLoading,
    deleteFlashcard,
    createFlashcard,
    updateFlashcard,
    generateFlashcards,
  }
} 
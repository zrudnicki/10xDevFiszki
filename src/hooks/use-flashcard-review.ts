import { useState } from "react"

interface Flashcard {
  id: number
  question: string
  answer: string
}

interface UseFlashcardReviewProps {
  flashcards: Flashcard[]
  onComplete?: () => void
}

type ReviewStatus = "correct" | "almost" | "incorrect"

export function useFlashcardReview({
  flashcards,
  onComplete,
}: UseFlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewedCards, setReviewedCards] = useState<{
    [key: number]: ReviewStatus
  }>({})

  const currentCard = flashcards[currentIndex]
  const isLastCard = currentIndex === flashcards.length - 1
  const remainingCards = flashcards.length - currentIndex

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleReview = (status: ReviewStatus) => {
    setReviewedCards((prev) => ({
      ...prev,
      [currentCard.id]: status,
    }))

    if (isLastCard) {
      onComplete?.()
    } else {
      setCurrentIndex((prev) => prev + 1)
      setIsFlipped(false)
    }
  }

  const reset = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setReviewedCards({})
  }

  return {
    currentCard,
    isFlipped,
    handleFlip,
    handleReview,
    reset,
    remainingCards,
    reviewedCards,
  }
} 
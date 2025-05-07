"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { updateCardReview } from "@/lib/card-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Database } from "@/types/supabase"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Home } from "lucide-react"
import Link from "next/link"

type CardSet = Database["public"]["Tables"]["card_sets"]["Row"]
type FlashCard = Database["public"]["Tables"]["flash_cards"]["Row"]

interface StudySessionProps {
  cardSet: CardSet
  cards: FlashCard[]
  sessionId: string
  userId: string
  isReviewMode: boolean
}

export function StudySession({ cardSet, cards, sessionId, userId, isReviewMode }: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [completed, setCompleted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // End the session when the component unmounts or when completed
    return () => {
      if (sessionId) {
        endSession()
      }
    }
  }, [])

  async function endSession() {
    await supabase
      .from("study_sessions")
      .update({
        ended_at: new Date().toISOString(),
        cards_studied: currentIndex,
      })
      .eq("id", sessionId)
  }

  async function handleRating(rating: number) {
    if (!cards[currentIndex]) return

    try {
      await updateCardReview(userId, cards[currentIndex].id, rating, sessionId)

      // Move to next card or complete
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setIsFlipped(false)
      } else {
        await endSession()
        setCompleted(true)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update card review",
        variant: "destructive",
      })
    }
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">No cards to study</h1>
        <p className="text-muted-foreground mb-6">
          {isReviewMode
            ? "You don't have any cards due for review in this set."
            : "This card set doesn't have any cards yet."}
        </p>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Study Session Completed!</h1>
        <p className="text-muted-foreground mb-6">You've studied {cards.length} cards in this session.</p>
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href={`/card-set/${cardSet.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Card Set
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{cardSet.title}</h1>
        <p className="text-muted-foreground">
          {isReviewMode ? "Review Mode" : "Study Mode"} - Card {currentIndex + 1} of {cards.length}
        </p>
      </div>

      <div className="perspective-1000 w-full mb-8">
        <div
          className={`relative transition-transform duration-500 transform-style-3d w-full ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          <Card className="backface-hidden min-h-[300px] flex flex-col">
            <CardContent className="flex flex-col items-center justify-center p-6 h-full">
              <div className="text-center space-y-4 flex-1 flex flex-col justify-center">
                <h3 className="text-xl font-medium">Question:</h3>
                <p className="text-lg">{currentCard.question}</p>
              </div>
              <Button variant="ghost" onClick={() => setIsFlipped(true)} className="mt-auto">
                Show Answer
              </Button>
            </CardContent>
          </Card>

          <Card className="backface-hidden rotate-y-180 absolute inset-0 min-h-[300px] flex flex-col">
            <CardContent className="flex flex-col items-center justify-center p-6 h-full">
              <div className="text-center space-y-4 flex-1 flex flex-col justify-center">
                <h3 className="text-xl font-medium">Answer:</h3>
                <p className="text-lg">{currentCard.answer}</p>
              </div>
              <Button variant="ghost" onClick={() => setIsFlipped(false)} className="mt-auto">
                Show Question
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {isReviewMode && isFlipped && (
        <div className="space-y-4">
          <p className="text-center font-medium">How well did you know this?</p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="border-red-300 hover:bg-red-50" onClick={() => handleRating(1)}>
              Didn't Know
            </Button>
            <Button variant="outline" className="border-yellow-300 hover:bg-yellow-50" onClick={() => handleRating(3)}>
              Somewhat Knew
            </Button>
            <Button variant="outline" className="border-green-300 hover:bg-green-50" onClick={() => handleRating(5)}>
              Knew Well
            </Button>
          </div>
        </div>
      )}

      {(!isReviewMode || !isFlipped) && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Exit
          </Button>

          {!isReviewMode && (
            <Button
              onClick={() => {
                if (currentIndex < cards.length - 1) {
                  setCurrentIndex(currentIndex + 1)
                  setIsFlipped(false)
                } else {
                  endSession()
                  setCompleted(true)
                }
              }}
            >
              {currentIndex < cards.length - 1 ? "Next Card" : "Finish"}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

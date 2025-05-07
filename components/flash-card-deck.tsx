"use client"

import { useState } from "react"
import type { FlashCard } from "@/components/flash-card-generator"
import { FlashCardItem } from "@/components/flash-card-item"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface FlashCardDeckProps {
  cards: FlashCard[]
}

export function FlashCardDeck({ cards }: FlashCardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToNextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length)
  }

  const goToPrevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
  }

  return (
    <div className="relative">
      <div className="flex justify-center items-center min-h-[300px]">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`absolute transition-opacity duration-300 w-full ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 -z-10"
            }`}
          >
            <FlashCardItem card={card} />
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" size="icon" onClick={goToPrevCard} disabled={cards.length <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-sm text-slate-500">
          Card {currentIndex + 1} of {cards.length}
        </div>

        <Button variant="outline" size="icon" onClick={goToNextCard} disabled={cards.length <= 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

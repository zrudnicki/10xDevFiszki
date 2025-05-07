"use client"

import { useState } from "react"
import type { FlashCard } from "@/components/flash-card-generator"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface FlashCardItemProps {
  card: FlashCard
}

export function FlashCardItem({ card }: FlashCardItemProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="perspective-1000 w-full">
      <div
        className={`relative transition-transform duration-500 transform-style-3d w-full ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        <Card className="backface-hidden min-h-[300px] flex flex-col">
          <CardContent className="flex flex-col items-center justify-center p-6 h-full">
            <div className="text-center space-y-4 flex-1 flex flex-col justify-center">
              <h3 className="text-xl font-medium">Question:</h3>
              <p className="text-lg">{card.question}</p>
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
              <p className="text-lg">{card.answer}</p>
            </div>
            <Button variant="ghost" onClick={() => setIsFlipped(false)} className="mt-auto">
              Show Question
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

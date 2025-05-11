import * as React from "react"
import { cn } from "../lib/utils"

interface FlashcardProps {
  question: string
  answer: string
  className?: string
}

export function Flashcard({ question, answer, className }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = React.useState(false)

  return (
    <div
      className={cn(
        "relative h-[400px] w-full cursor-pointer perspective-1000",
        className
      )}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={cn(
          "relative h-full w-full transition-transform duration-500 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front of card */}
        <div className="absolute inset-0 backface-hidden">
          <div className="flex h-full items-center justify-center rounded-lg border bg-card p-6 text-center shadow-sm">
            <p className="text-xl">{question}</p>
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 rotate-y-180 backface-hidden">
          <div className="flex h-full items-center justify-center rounded-lg border bg-card p-6 text-center shadow-sm">
            <p className="text-xl">{answer}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 
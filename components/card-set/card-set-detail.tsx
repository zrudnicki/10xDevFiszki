"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ArrowLeft, BookOpen, Calendar, Clock } from "lucide-react"
import Link from "next/link"

type CardSet = Database["public"]["Tables"]["card_sets"]["Row"]
type FlashCard = Database["public"]["Tables"]["flash_cards"]["Row"]
type SpacedRepetition = Database["public"]["Tables"]["spaced_repetition"]["Row"]

interface CardSetDetailProps {
  cardSet: CardSet
  cards: FlashCard[]
  spacedRepStats: SpacedRepetition[]
}

export function CardSetDetail({ cardSet, cards, spacedRepStats }: CardSetDetailProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const router = useRouter()

  // Count due cards
  const dueCards = spacedRepStats.filter((stat) => new Date(stat.due_date) <= new Date()).length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <h1 className="text-3xl font-bold">{cardSet.title}</h1>
        <p className="text-muted-foreground">{cardSet.topic}</p>

        {cardSet.description && <p className="mt-2">{cardSet.description}</p>}

        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            <span>Created {formatDistanceToNow(new Date(cardSet.created_at), { addSuffix: true })}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-4 w-4" />
            <span>{cards.length} cards</span>
          </div>
          {dueCards > 0 && (
            <div className="flex items-center text-sm text-green-600 font-medium">
              <span>{dueCards} cards due for review</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button asChild>
            <Link href={`/study/${cardSet.id}`}>
              <BookOpen className="mr-2 h-4 w-4" />
              Study All Cards
            </Link>
          </Button>
          {dueCards > 0 && (
            <Button asChild variant="outline">
              <Link href={`/study/${cardSet.id}?mode=review`}>Review Due Cards</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Flash Cards</h2>

        <div className="space-y-4">
          {cards.map((card) => {
            const spacedRepData = spacedRepStats.find((stat) => stat.flash_card_id === card.id)
            const isDue = spacedRepData && new Date(spacedRepData.due_date) <= new Date()

            return (
              <Card key={card.id} className={isDue ? "border-green-200" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{card.question}</CardTitle>
                  {isDue && <CardDescription className="text-green-600">Due for review</CardDescription>}
                </CardHeader>
                <CardContent>
                  {expandedCard === card.id ? (
                    <p>{card.answer}</p>
                  ) : (
                    <p className="text-muted-foreground">Click to reveal answer</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}>
                    {expandedCard === card.id ? "Hide Answer" : "Show Answer"}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

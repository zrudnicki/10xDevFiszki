"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Clock } from "lucide-react"

interface DueCard {
  id: string
  user_id: string
  flash_card_id: string
  due_date: string
  flash_cards: {
    id: string
    question: string
    answer: string
    card_set_id: string
    card_sets: {
      id: string
      title: string
    }
  }
}

interface DueCardsListProps {
  dueCards: DueCard[]
}

export function DueCardsList({ dueCards }: DueCardsListProps) {
  if (dueCards.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">You don't have any cards due for review.</p>
        </CardContent>
      </Card>
    )
  }

  // Group cards by card set
  const cardsBySet = dueCards.reduce(
    (acc, card) => {
      const setId = card.flash_cards.card_sets.id
      const setTitle = card.flash_cards.card_sets.title

      if (!acc[setId]) {
        acc[setId] = {
          id: setId,
          title: setTitle,
          cards: [],
        }
      }

      acc[setId].cards.push(card)
      return acc
    },
    {} as Record<string, { id: string; title: string; cards: DueCard[] }>,
  )

  return (
    <div className="space-y-4">
      {Object.values(cardsBySet).map((set) => (
        <Card key={set.id}>
          <CardHeader>
            <CardTitle>{set.title}</CardTitle>
            <CardDescription>{set.cards.length} cards due for review</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {set.cards.slice(0, 3).map((card) => (
                <li key={card.id} className="text-sm">
                  <div className="font-medium">{card.flash_cards.question}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>Due {formatDistanceToNow(new Date(card.due_date), { addSuffix: true })}</span>
                  </div>
                </li>
              ))}
              {set.cards.length > 3 && (
                <li className="text-sm text-muted-foreground">+{set.cards.length - 3} more cards</li>
              )}
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href={`/study/${set.id}?mode=review`}>Review Now</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

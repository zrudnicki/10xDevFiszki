"use client"

import type { Database } from "@/types/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { BookOpen, Clock } from "lucide-react"

type CardSet = Database["public"]["Tables"]["card_sets"]["Row"]

interface CardSetListProps {
  cardSets: CardSet[]
}

export function CardSetList({ cardSets }: CardSetListProps) {
  if (cardSets.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">You haven't created any card sets yet.</p>
          <Button asChild className="mt-4">
            <Link href="/create">Create Your First Set</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {cardSets.map((set) => (
        <Card key={set.id}>
          <CardHeader>
            <CardTitle>{set.title}</CardTitle>
            <CardDescription>{set.topic}</CardDescription>
          </CardHeader>
          <CardContent>
            {set.description && <p>{set.description}</p>}
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <Clock className="mr-1 h-4 w-4" />
              <span>Created {formatDistanceToNow(new Date(set.created_at), { addSuffix: true })}</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button asChild variant="outline" size="sm">
              <Link href={`/study/${set.id}`}>
                <BookOpen className="mr-2 h-4 w-4" />
                Study
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/card-set/${set.id}`}>View Details</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

"use server"

import { createServerClient } from "@/lib/supabase-server"
import type { FlashCard } from "@/components/flash-card-generator"
import { getInitialSpacedRepetitionData } from "@/lib/spaced-repetition"
import { revalidatePath } from "next/cache"

interface SaveCardSetParams {
  userId: string
  title: string
  topic: string
  description?: string
  flashCards: FlashCard[]
}

export async function saveCardSet({
  userId,
  title,
  topic,
  description,
  flashCards,
}: SaveCardSetParams): Promise<string> {
  const supabase = createServerClient()

  // Insert card set
  const { data: cardSet, error: cardSetError } = await supabase
    .from("card_sets")
    .insert({
      user_id: userId,
      title,
      topic,
      description,
    })
    .select()
    .single()

  if (cardSetError) {
    console.error("Error creating card set:", cardSetError)
    throw new Error("Failed to create card set")
  }

  // Insert flash cards
  const flashCardsToInsert = flashCards.map((card) => ({
    card_set_id: cardSet.id,
    question: card.question,
    answer: card.answer,
  }))

  const { data: insertedCards, error: cardsError } = await supabase
    .from("flash_cards")
    .insert(flashCardsToInsert)
    .select()

  if (cardsError) {
    console.error("Error creating flash cards:", cardsError)
    throw new Error("Failed to create flash cards")
  }

  // Initialize spaced repetition data for each card
  const initialData = getInitialSpacedRepetitionData()
  const spacedRepetitionData = insertedCards.map((card) => ({
    user_id: userId,
    flash_card_id: card.id,
    ease_factor: initialData.easeFactor,
    interval: initialData.interval,
    repetitions: initialData.repetitions,
    due_date: initialData.dueDate.toISOString(),
    last_reviewed: initialData.lastReviewed.toISOString(),
  }))

  const { error: spacedRepError } = await supabase.from("spaced_repetition").insert(spacedRepetitionData)

  if (spacedRepError) {
    console.error("Error initializing spaced repetition data:", spacedRepError)
    throw new Error("Failed to initialize spaced repetition data")
  }

  revalidatePath("/dashboard")

  return cardSet.id
}

export async function updateCardReview(userId: string, flashCardId: string, rating: number, sessionId?: string) {
  const supabase = createServerClient()

  // Get current spaced repetition data
  const { data: currentData, error: fetchError } = await supabase
    .from("spaced_repetition")
    .select("*")
    .eq("user_id", userId)
    .eq("flash_card_id", flashCardId)
    .single()

  if (fetchError) {
    console.error("Error fetching spaced repetition data:", fetchError)
    throw new Error("Failed to fetch spaced repetition data")
  }

  // Calculate new spaced repetition data
  const { calculateNextReview } = await import("@/lib/spaced-repetition")
  const newData = calculateNextReview(rating as 0 | 1 | 2 | 3 | 4 | 5, {
    easeFactor: currentData.ease_factor,
    interval: currentData.interval,
    repetitions: currentData.repetitions,
    dueDate: new Date(currentData.due_date),
    lastReviewed: new Date(currentData.last_reviewed),
  })

  // Update spaced repetition data
  const { error: updateError } = await supabase
    .from("spaced_repetition")
    .update({
      ease_factor: newData.easeFactor,
      interval: newData.interval,
      repetitions: newData.repetitions,
      due_date: newData.dueDate.toISOString(),
      last_reviewed: newData.lastReviewed.toISOString(),
    })
    .eq("user_id", userId)
    .eq("flash_card_id", flashCardId)

  if (updateError) {
    console.error("Error updating spaced repetition data:", updateError)
    throw new Error("Failed to update spaced repetition data")
  }

  // If session ID is provided, record the review in the session
  if (sessionId) {
    const { error: sessionError } = await supabase.from("session_cards").insert({
      session_id: sessionId,
      flash_card_id: flashCardId,
      rating,
      time_spent: 0, // This could be tracked in the UI
    })

    if (sessionError) {
      console.error("Error recording session card:", sessionError)
      // Don't throw here, as the main update was successful
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/study/[id]")

  return true
}

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { CardSetDetail } from "@/components/card-set/card-set-detail"

interface CardSetPageProps {
  params: {
    id: string
  }
}

export default async function CardSetPage({ params }: CardSetPageProps) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/sign-in")
  }

  // Get card set with cards
  const { data: cardSet, error: cardSetError } = await supabase
    .from("card_sets")
    .select("*")
    .eq("id", params.id)
    .single()

  if (cardSetError || !cardSet) {
    redirect("/dashboard")
  }

  // Check if user owns the card set
  if (cardSet.user_id !== session.user.id) {
    redirect("/dashboard")
  }

  // Get cards for the set
  const { data: cards } = await supabase.from("flash_cards").select("*").eq("card_set_id", params.id)

  // Get spaced repetition stats
  const { data: spacedRepStats } = await supabase
    .from("spaced_repetition")
    .select("*")
    .eq("user_id", session.user.id)
    .in("flash_card_id", cards?.map((card) => card.id) || [])

  return (
    <div className="container py-8">
      <CardSetDetail cardSet={cardSet} cards={cards || []} spacedRepStats={spacedRepStats || []} />
    </div>
  )
}

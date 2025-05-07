import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { StudySession } from "@/components/study/study-session"

interface StudyPageProps {
  params: {
    id: string
  }
  searchParams: {
    mode?: string
  }
}

export default async function StudyPage({ params, searchParams }: StudyPageProps) {
  const supabase = createServerClient()
  const isReviewMode = searchParams.mode === "review"

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/sign-in")
  }

  // Get card set
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

  let cards

  if (isReviewMode) {
    // Get due cards for review
    const { data: dueCards } = await supabase
      .from("spaced_repetition")
      .select(`
        *,
        flash_cards(*)
      `)
      .eq("user_id", session.user.id)
      .lte("due_date", new Date().toISOString())
      .eq("flash_cards.card_set_id", params.id)
      .order("due_date", { ascending: true })

    cards = dueCards?.map((card) => card.flash_cards) || []
  } else {
    // Get all cards for the set
    const { data: allCards } = await supabase.from("flash_cards").select("*").eq("card_set_id", params.id)

    cards = allCards || []
  }

  // Create a study session
  const { data: studySession } = await supabase
    .from("study_sessions")
    .insert({
      user_id: session.user.id,
      card_set_id: params.id,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  return (
    <div className="container py-8">
      <StudySession
        cardSet={cardSet}
        cards={cards}
        sessionId={studySession?.id}
        userId={session.user.id}
        isReviewMode={isReviewMode}
      />
    </div>
  )
}

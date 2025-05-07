import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CardSetList } from "@/components/dashboard/card-set-list"
import { DueCardsList } from "@/components/dashboard/due-cards-list"

export default async function DashboardPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/sign-in")
  }

  // Get user's card sets
  const { data: cardSets } = await supabase.from("card_sets").select("*").order("created_at", { ascending: false })

  // Get user's due cards
  const { data: dueCards } = await supabase
    .from("spaced_repetition")
    .select(`
      *,
      flash_cards(
        id,
        question,
        answer,
        card_set_id,
        card_sets(
          id,
          title
        )
      )
    `)
    .eq("user_id", session.user.id)
    .lte("due_date", new Date().toISOString())
    .order("due_date", { ascending: true })

  return (
    <div className="container py-8">
      <DashboardHeader user={session.user} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Card Sets</h2>
          <CardSetList cardSets={cardSets || []} />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Cards Due for Review</h2>
          <DueCardsList dueCards={dueCards || []} />
        </div>
      </div>
    </div>
  )
}

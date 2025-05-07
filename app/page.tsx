import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { FlashCardGenerator } from "@/components/flash-card-generator"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Home() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-24 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">AI Flash Card Generator</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Generate study flash cards on any topic using AI. Enter a subject and get a set of question-answer pairs to
            help you learn.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <Button asChild>
              <Link href="/auth/sign-up">Sign Up</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
        <FlashCardGenerator />
      </div>
    </main>
  )
}

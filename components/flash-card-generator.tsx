"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { generateFlashCards } from "@/lib/actions"
import { saveCardSet } from "@/lib/card-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FlashCardDeck } from "@/components/flash-card-deck"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export type FlashCard = {
  question: string
  answer: string
}

export function FlashCardGenerator() {
  const [topic, setTopic] = useState("")
  const [title, setTitle] = useState("")
  const [numCards, setNumCards] = useState("5")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [flashCards, setFlashCards] = useState<FlashCard[]>([])
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  async function handleGenerateCards() {
    if (!topic.trim()) {
      setError("Please enter a topic")
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const cards = await generateFlashCards(topic, Number.parseInt(numCards), additionalInfo)
      setFlashCards(cards)

      // Auto-generate a title if not provided
      if (!title) {
        setTitle(`${topic} Flash Cards`)
      }
    } catch (err) {
      setError("Failed to generate flash cards. Please try again.")
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSaveCardSet() {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save your flash cards",
        variant: "destructive",
      })
      router.push("/auth/sign-in")
      return
    }

    if (flashCards.length === 0) {
      setError("No flash cards to save")
      return
    }

    setIsSaving(true)

    try {
      const cardSetId = await saveCardSet({
        userId: user.id,
        title: title || `${topic} Flash Cards`,
        topic,
        description: additionalInfo,
        flashCards,
      })

      toast({
        title: "Success!",
        description: "Your flash cards have been saved",
      })

      router.push(`/card-set/${cardSetId}`)
    } catch (err) {
      setError("Failed to save flash cards. Please try again.")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Flash Cards</CardTitle>
          <CardDescription>Enter a topic and our AI will generate study flash cards for you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Card Set Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Biology 101 Flash Cards"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic or Subject</Label>
            <Input
              id="topic"
              placeholder="e.g., Photosynthesis, World War II, JavaScript Basics"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numCards">Number of Cards</Label>
            <Select value={numCards} onValueChange={setNumCards}>
              <SelectTrigger>
                <SelectValue placeholder="Select number of cards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Cards</SelectItem>
                <SelectItem value="5">5 Cards</SelectItem>
                <SelectItem value="10">10 Cards</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
            <Textarea
              id="additionalInfo"
              placeholder="Add specific details or focus areas"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateCards} disabled={isGenerating || !topic.trim()} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Cards...
              </>
            ) : (
              "Generate Flash Cards"
            )}
          </Button>
        </CardFooter>
      </Card>

      {flashCards.length > 0 && (
        <div className="pt-8">
          <h2 className="text-2xl font-bold mb-4">Your Flash Cards</h2>
          <FlashCardDeck cards={flashCards} />

          <div className="mt-6 flex justify-center gap-4">
            <Button variant="outline" onClick={() => setFlashCards([])} className="mr-2">
              Clear Cards
            </Button>
            <Button onClick={handleGenerateCards} disabled={isGenerating}>
              Regenerate Cards
            </Button>
            <Button onClick={handleSaveCardSet} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Card Set"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

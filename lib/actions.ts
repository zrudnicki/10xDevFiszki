"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { FlashCard } from "@/components/flash-card-generator"

export async function generateFlashCards(topic: string, numCards = 5, additionalInfo = ""): Promise<FlashCard[]> {
  try {
    const prompt = `
      Generate ${numCards} flash cards for studying the topic: "${topic}".
      ${additionalInfo ? `Additional context: ${additionalInfo}` : ""}
      
      Each flash card should have a question and an answer.
      The questions should be clear and specific.
      The answers should be concise but comprehensive.
      
      Format the response as a valid JSON array with objects containing "question" and "answer" properties.
      Example: [{"question": "What is photosynthesis?", "answer": "The process by which plants convert light energy into chemical energy."}]
    `

    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    // Extract the JSON part from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response")
    }

    const flashCards: FlashCard[] = JSON.parse(jsonMatch[0])
    return flashCards
  } catch (error) {
    console.error("Error generating flash cards:", error)
    throw new Error("Failed to generate flash cards")
  }
}

import type { GeneratedFlashcardDto, GenerateFlashcardsResponseDto } from "../../types";
import { generateUUID } from "../utils/uuid";

/**
 * Generate flashcards from text using AI
 *
 * @param text - The text to generate flashcards from (1000-10000 characters)
 * @param collection_id - Optional collection ID to associate the flashcards with
 * @param category_id - Optional category ID to associate the flashcards with
 * @returns Promise<GeneratedFlashcardDto[]> - An array of generated flashcards
 */
export async function generateFlashcards(
  text: string,
  collection_id: string | null = null,
  category_id: string | null = null
): Promise<GeneratedFlashcardDto[]> {
  try {
    // Configuration for external AI API
    const API_KEY = import.meta.env.OPENROUTER_API_KEY;
    const API_URL = "https://openrouter.ai/api/v1/chat/completions";

    // Prepare prompt for AI
    const prompt = `
      Generate educational flashcards based on the text below.
      Each flashcard should have a "question" on the front and an "answer" on the back.
      Front of flashcard should not exceed 200 characters.
      Back of flashcard should not exceed 500 characters.
      Generate between 5 and 15 flashcards that best summarize the most important information from the text.
      
      Text:
      ${text}
      
      Response format should be a JSON array of objects with "front" and "back" fields.
    `;

    // Call AI API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-pro",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices[0].message.content;

    // Parse AI response
    let flashcards: { front: string; back: string }[];
    try {
      // Try to extract JSON from response text
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || aiContent.match(/\[([\s\S]*?)\]/);

      const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
      flashcards = JSON.parse(jsonString);

      // If parsing succeeded but result is not an array
      if (!Array.isArray(flashcards)) {
        throw new Error("AI response is not an array");
      }
    } catch (e) {
      console.error("Error parsing AI response:", e);
      throw new Error("Failed to parse AI-generated flashcards");
    }

    // Validate and transform flashcards
    const validatedFlashcards: GeneratedFlashcardDto[] = flashcards
      .filter((card) => card.front && card.front.length <= 200 && card.back && card.back.length <= 500)
      .map((card) => ({
        id: generateUUID(),
        front: card.front,
        back: card.back,
        collection_id,
        category_id,
      }));

    // Check if we have enough flashcards
    if (validatedFlashcards.length < 5) {
      throw new Error("AI generated too few valid flashcards");
    }

    // Limit to maximum 15 flashcards
    return validatedFlashcards.slice(0, 15);
  } catch (error) {
    console.error("Error in generateFlashcards service:", error);
    throw error;
  }
}

/**
 * Creates a properly formatted response DTO with generated flashcards
 *
 * @param flashcards - The array of generated flashcards
 * @returns GenerateFlashcardsResponseDto - The formatted response object
 */
export function createFlashcardsResponse(flashcards: GeneratedFlashcardDto[]): GenerateFlashcardsResponseDto {
  return {
    data: flashcards,
  };
}

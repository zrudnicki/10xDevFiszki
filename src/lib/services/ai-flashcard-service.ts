import type { GeneratedFlashcardDto, GenerateFlashcardsResponseDto } from "../../types";
import { generateUUID } from "../utils/uuid";
import { GoogleGenerativeAI } from "@google/generative-ai";

// // Dane testowe do trybu rozwojowego
// const MOCK_FLASHCARDS = [
//   {
//     front: "Co to jest Astro?",
//     back: "Astro to framework do budowania stron, który pozwala na server-side rendering (SSR) oraz client-side rendering. Umożliwia wykorzystanie wielu frameworków UI jednocześnie i optymalizację wydajności.",
//   },
//   {
//     front: "Co to jest Tailwind CSS?",
//     back: "Tailwind CSS to framework CSS typu utility-first, który pozwala na szybkie tworzenie interfejsów użytkownika poprzez stosowanie gotowych klas bezpośrednio w HTML. Nie wymaga pisania własnego CSS.",
//   },
//   {
//     front: "Co to jest fiszka?",
//     back: "Fiszka to narzędzie edukacyjne w formie karty z pytaniem na jednej stronie i odpowiedzią na drugiej, używane w procesie aktywnej nauki i powtórek.",
//   },
//   {
//     front: "Jakie są zalety nauki z wykorzystaniem fiszek?",
//     back: "Zalety to: aktywne uczenie się, wykorzystanie efektu testowania, spaced repetition (powtórki w odstępach czasowych), możliwość personalizacji materiału, mobilność i wygoda użycia.",
//   },
//   {
//     front: "Czym jest spaced repetition?",
//     back: "To technika uczenia się polegająca na powtarzaniu materiału w rosnących odstępach czasowych. Gdy materiał jest dobrze zapamiętany, odstęp między powtórkami wydłuża się, co zwiększa efektywność nauki.",
//   },
//   {
//     front: "Co to jest React?",
//     back: "React to biblioteka JavaScript do budowania interfejsów użytkownika, oparta na komponentach. Pozwala na efektywne aktualizowanie widoku poprzez wirtualny DOM.",
//   },
//   {
//     front: "Czym jest TypeScript?",
//     back: "TypeScript to typowany nadzbiór JavaScript, który kompiluje się do czystego JavaScript. Dodaje opcjonalne typy statyczne, klasy i interfejsy, poprawiając wykrywanie błędów podczas rozwoju aplikacji.",
//   },
// ];

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
    // Configuration for Google Gemini API
    const API_KEY = import.meta.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      console.error("Brak klucza API dla Gemini");
      throw new Error("AI API error: Brak klucza API");
    }

    // Inicjalizacja API Gemini
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
      Ensure the response is a valid JSON array. Do not include any additional text or formatting.
    `;

    // Call AI API with proper structure
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    });
    const aiContent = result.response.text();
    
    // Parse AI response
    let flashcards: { front: string; back: string }[];
    try {
      // Try to extract JSON from response text
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || aiContent.match(/\[([\s\S]*?)\]/);
      
      const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
      flashcards = JSON.parse(jsonString.trim());

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

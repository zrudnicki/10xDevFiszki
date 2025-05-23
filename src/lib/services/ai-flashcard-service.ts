import type { GeneratedFlashcardDto, GenerateFlashcardsResponseDto } from "../../types";
import { generateUUID } from "../utils/uuid";

/**
 * Represents a cached entry of generated flashcards
 * @interface CacheEntry
 * @property {number} timestamp - The timestamp when the cache entry was created (milliseconds since epoch)
 * @property {GeneratedFlashcardDto[]} flashcards - The array of generated flashcards
 */
interface CacheEntry {
  timestamp: number;
  flashcards: GeneratedFlashcardDto[];
}

/**
 * Cache configuration constants
 */
const CACHE_TTL = 3600000; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 100; // Maximum number of items in cache

/**
 * In-memory cache for storing generated flashcard results to improve performance
 * and reduce redundant AI API calls for similar or identical input text
 */
const responseCache = new Map<string, CacheEntry>();

/**
 * Generates a unique cache key from the input text using a simple hashing algorithm
 * 
 * @param {string} text - The input text to hash
 * @returns {string} A unique cache key for the input text
 * 
 * @example
 * // Returns something like "flashcards_-237462378"
 * const cacheKey = generateCacheKey("Some input text for flashcard generation");
 */
function generateCacheKey(text: string): string {
  // Create a simple hash from the text to use as cache key
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `flashcards_${hash}`;
}

/**
 * Cleans the flashcard cache by removing expired entries and keeping the cache within size limits
 * Removes entries that are older than CACHE_TTL first, then removes oldest entries if the cache 
 * is still larger than MAX_CACHE_SIZE
 * 
 * @returns {void}
 * 
 * @example
 * // Periodically clean the cache (e.g., after every 10th request)
 * if (Math.random() < 0.1) {
 *   cleanCache();
 * }
 */
function cleanCache(): void {
  const now = Date.now();
  let entriesDeleted = 0;

  // Remove expired entries first
  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      responseCache.delete(key);
      entriesDeleted++;
    }
  }

  // If we still have too many entries, remove oldest ones based on timestamp
  if (responseCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = [...responseCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);

    const entriesToDelete = sortedEntries.slice(0, sortedEntries.length - MAX_CACHE_SIZE);
    for (const [key] of entriesToDelete) {
      responseCache.delete(key);
      entriesDeleted++;
    }
  }

  if (entriesDeleted > 0) {
    console.log(`Cache cleaned: ${entriesDeleted} entries removed. Current size: ${responseCache.size}`);
  }
}

/**
 * Generates educational flashcards from text using the Gemini AI model
 * The function attempts to create 5-15 high-quality flashcards with question/answer format
 * based on the most important information from the provided text.
 *
 * @param {string} text - The text to generate flashcards from (should be 1000-10000 characters)
 * @param {string|null} [collection_id=null] - Optional collection ID to associate the flashcards with
 * @param {string|null} [category_id=null] - Optional category ID to associate the flashcards with
 * @param {boolean} [skipCache=false] - Whether to skip cache lookup and force new generation
 * @returns {Promise<GeneratedFlashcardDto[]>} - An array of generated flashcards (5-15 items)
 * @throws {Error} - Throws an error if AI API fails, response parsing fails, or not enough flashcards are generated
 * 
 * @example
 * // Basic usage with text only
 * try {
 *   const flashcards = await generateFlashcards(
 *     "Lorem ipsum dolor sit amet, consectetur adipiscing elit...", // 1000+ character text
 *     null, 
 *     null
 *   );
 *   console.log(`Generated ${flashcards.length} flashcards`);
 * } catch (error) {
 *   console.error("Failed to generate flashcards:", error);
 * }
 * 
 * @example
 * // With collection and category
 * try {
 *   const flashcards = await generateFlashcards(
 *     "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
 *     "550e8400-e29b-41d4-a716-446655440000", // collection UUID
 *     "f47ac10b-58cc-4372-a567-0e02b2c3d479", // category UUID
 *     true // skip cache
 *   );
 *   console.log(`Generated ${flashcards.length} flashcards`);
 * } catch (error) {
 *   console.error("Failed to generate flashcards:", error);
 * }
 */
export async function generateFlashcards(
  text: string,
  collection_id: string | null = null,
  category_id: string | null = null,
  skipCache = false
): Promise<GeneratedFlashcardDto[]> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Generating flashcards for text of length ${text.length}`);

    // Optionally use cache for identical text inputs
    if (!skipCache) {
      const cacheKey = generateCacheKey(text);
      const cachedResult = responseCache.get(cacheKey);

      if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
        console.log(`[${requestId}] Cache hit for key ${cacheKey}`);

        // Modify cached flashcards to include provided collection and category
        return cachedResult.flashcards.map((card) => ({
          ...card,
          id: generateUUID(), // Generate new IDs to avoid conflicts
          collection_id: collection_id,
          category_id: category_id,
        }));
      }
    }

    // Clean cache occasionally (with 10% probability)
    if (Math.random() < 0.1) {
      cleanCache();
    }

    // Configuration for Gemini API
    const API_KEY = import.meta.env.GEMINI_API_KEY;
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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

    console.log(`[${requestId}] Sending request to Gemini API`);

    // Call Gemini API
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2, // Lower temperature for more consistent results
          topP: 0.8,
          topK: 40,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Gemini API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const aiResponse = await response.json();

    // The response format from Gemini is different
    const aiContent = aiResponse.candidates[0].content.parts[0].text;
    console.log(`[${requestId}] Received response from Gemini API`);

    // Parse AI response
    let flashcards: { front: string; back: string }[];
    try {
      // Try to extract JSON from response text
      const jsonMatch =
        aiContent.match(/```json\n([\s\S]*?)\n```/) ||
        aiContent.match(/```\n([\s\S]*?)\n```/) ||
        aiContent.match(/\[([\s\S]*?)\]/);

      const jsonString = jsonMatch ? jsonMatch[1] : aiContent;

      try {
        flashcards = JSON.parse(jsonString);
      } catch {
        // Second attempt: try parsing the entire response if the regex failed
        console.log(`[${requestId}] First JSON parse failed, trying with full response`);
        flashcards = JSON.parse(aiContent);
      }

      // If parsing succeeded but result is not an array
      if (!Array.isArray(flashcards)) {
        console.error(`[${requestId}] AI response is not an array:`, flashcards);
        throw new Error("AI response is not an array");
      }
    } catch (e) {
      console.error(`[${requestId}] Error parsing AI response:`, e, "Content:", aiContent);
      throw new Error("Failed to parse AI-generated flashcards");
    }

    // Validate and transform flashcards
    const validatedFlashcards: GeneratedFlashcardDto[] = flashcards
      .filter((card) => card.front && card.front.length <= 200 && card.back && card.back.length <= 500)
      .map((card) => ({
        id: generateUUID(),
        front: card.front.trim(),
        back: card.back.trim(),
        collection_id,
        category_id,
      }));

    console.log(
      `[${requestId}] Generated ${validatedFlashcards.length} valid flashcards from ${flashcards.length} total`
    );

    // Check if we have enough flashcards
    if (validatedFlashcards.length < 5) {
      throw new Error("AI generated too few valid flashcards");
    }

    // Store in cache (original flashcards without collection/category)
    if (!skipCache) {
      const cacheKey = generateCacheKey(text);
      // Store base flashcards without collection/category to make them reusable for different collections
      const baseFlashcards = validatedFlashcards.map((card) => ({
        ...card,
        collection_id: null,
        category_id: null,
      }));
      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        flashcards: baseFlashcards,
      });
      console.log(`[${requestId}] Cached result with key ${cacheKey}`);
    }

    // Limit to maximum 15 flashcards (as specified in requirements)
    return validatedFlashcards.slice(0, 15);
  } catch (error) {
    console.error("Error in generateFlashcards service:", error);
    throw error;
  }
}

/**
 * Creates a properly formatted response DTO with generated flashcards
 * Wraps the flashcards array in the standard API response format
 * 
 * @param {GeneratedFlashcardDto[]} flashcards - The array of generated flashcards
 * @returns {GenerateFlashcardsResponseDto} - The formatted response object following the API standard
 * 
 * @example
 * // Create a formatted response for the API
 * const flashcards = await generateFlashcards(text, collection_id, category_id);
 * const response = createFlashcardsResponse(flashcards);
 * return new Response(JSON.stringify(response), {
 *   status: 200,
 *   headers: { "Content-Type": "application/json" }
 * });
 */
export function createFlashcardsResponse(flashcards: GeneratedFlashcardDto[]): GenerateFlashcardsResponseDto {
  return {
    data: flashcards,
  };
}

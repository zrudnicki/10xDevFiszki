# API Endpoint Implementation Plan: Generate AI Flashcards

## 1. Endpoint Overview

The `/api/ai/generate-flashcards` endpoint is used to generate educational flashcards from provided text using AI models. The user inputs text between 1000-10000 characters, and the endpoint returns a list of generated flashcard candidates (minimum 5, maximum 15). Generated flashcards can be assigned to a specific collection and/or category if the appropriate identifiers are provided.

## 2. Request Details

- **HTTP Method**: POST
- **URL**: `/api/ai/generate-flashcards`
- **Parameters**:
  - **Required**: No URL parameters
  - **Optional**: No URL parameters
- **Request Body**:
  ```json
  {
    "text": "string",
    "collection_id": "uuid | null",
    "category_id": "uuid | null"
  }
  ```
- **Validation**:
  - `text`: Required, length between 1000 and 10000 characters
  - `collection_id`: Optional, valid UUID of an existing collection belonging to the user
  - `category_id`: Optional, valid UUID of an existing category belonging to the user

## 3. Used Types

- **Request DTO**: `GenerateFlashcardsDto`
  ```typescript
  interface GenerateFlashcardsDto {
    text: string;
    collection_id?: string | null;
    category_id?: string | null;
  }
  ```

- **Response DTO**: 
  ```typescript
  interface GenerateFlashcardsResponseDto {
    flashcards: GeneratedFlashcardDto[];
  }
  
  interface GeneratedFlashcardDto {
    id: string;
    front: string;
    back: string;
    collection_id: string | null;
    category_id: string | null;
  }
  ```

- **Validation Schema**:
  ```typescript
  const generateFlashcardsSchema = z.object({
    text: z.string().min(1000).max(10000),
    collection_id: z.string().uuid().nullable().optional(),
    category_id: z.string().uuid().nullable().optional(),
  });
  ```

## 4. Response Details

- **Status 200 OK**:
  ```json
  {
    "flashcards": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "collection_id": "uuid | null",
        "category_id": "uuid | null"
      }
    ]
  }
  ```

- **Status 400 Bad Request**:
  ```json
  {
    "error": "Invalid request body",
    "details": [
      {
        "path": ["text"],
        "message": "Text must be between 1000 and 10000 characters"
      }
    ]
  }
  ```

- **Status 401 Unauthorized**:
  ```json
  {
    "error": "Unauthorized"
  }
  ```

- **Status 403 Forbidden**:
  ```json
  {
    "error": "Forbidden",
    "details": "You do not have access to this resource"
  }
  ```

- **Status 404 Not Found** (if a non-existing collection or category is provided):
  ```json
  {
    "error": "Resource not found",
    "details": "Collection with ID {id} not found"
  }
  ```

- **Status 500 Internal Server Error**:
  ```json
  {
    "error": "Internal server error",
    "requestId": "uuid"
  }
  ```

- **Status 503 Service Unavailable**:
  ```json
  {
    "error": "Service unavailable",
    "details": "AI service is currently unavailable",
    "requestId": "uuid"
  }
  ```

## 5. Data Flow

1. **Input Data Validation**:
   - Check if the text has the appropriate length (1000-10000 characters)
   - Optionally: Validate UUIDs for collection and category

2. **Authorization**:
   - Verify that the user is logged in
   - If collection_id or category_id is provided, check if they belong to the user

3. **Processing**:
   - Send text to external AI API (Gemini API) to generate flashcards
   - Transform AI response to flashcard format
   - Validate generated flashcards (length of `front` ≤ 200 characters, length of `back` ≤ 500 characters)
   - Create unique identifiers for generated flashcards

4. **Update Statistics**:
   - Update the `flashcard_generation_stats` table with newly generated flashcards
   - Update the `last_generation_at` field to the current timestamp

5. **Return Response**:
   - Return the list of generated flashcards

## 6. Security Considerations

1. **Authentication**:
   - User authentication required via Supabase Auth
   - JWT token must be valid and not expired

2. **Authorization**:
   - Check if the user has access to the specified collection and category using Row Level Security (RLS) in Supabase

3. **Data Validation**:
   - Sanitize input text before sending to AI API
   - Validate input text length
   - Validate UUIDs for collection and category
   - Validate generated flashcards for unwanted content

4. **CORS**:
   - Proper CORS configuration for the endpoint

5. **Rate Limiting**:
   - Implementation of rate limiting for AI API requests per user

## 7. Error Handling

1. **Validation Errors**:
   - Text too short or too long -> 400 Bad Request
   - Invalid UUID -> 400 Bad Request
   - Missing required text -> 400 Bad Request

2. **Authorization Errors**:
   - Missing JWT token -> 401 Unauthorized
   - Invalid JWT token -> 401 Unauthorized
   - User doesn't have access to the specified collection/category -> 403 Forbidden

3. **Resource Errors**:
   - Collection doesn't exist -> 404 Not Found
   - Category doesn't exist -> 404 Not Found

4. **External API Errors**:
   - AI API timeout -> 503 Service Unavailable
   - AI API error -> 500 Internal Server Error
   - Invalid response from AI API -> 500 Internal Server Error

5. **General Errors**:
   - Unexpected server error -> 500 Internal Server Error with unique requestId for logging

## 8. Performance Considerations

1. **Optimization of AI API Requests**:
   - Caching similar queries
   - Buffering responses for popular topics
   - Optimizing prompts for AI API to minimize tokens

2. **Resource Management**:
   - Monitoring and limiting concurrent requests to AI API
   - Asynchronous request processing for better scalability

3. **Database Optimization**:
   - Indexing the `flashcard_generation_stats` table for faster access
   - Efficient statistic updates with a high number of requests

4. **Caching**:
   - Implementation of caching mechanisms for frequently generated topics
   - Using Redis or similar solution for fast cache access

## 9. Implementation Steps

1. **Environment Configuration**:
   - Ensure API keys for external AI service are available in environment variables

2. **File Structure Creation**:
   - Create file `/src/pages/api/ai/generate-flashcards.ts` for the endpoint
   - Create service `/src/lib/services/ai-flashcard-service.ts` for business logic

3. **Validation Implementation**:
   - Create Zod schema for validating input data in the endpoint
   - Add helper functions to check access to collections and categories

4. **AI Service Implementation**:
   - Create functions to communicate with external AI API
   - Implement logic for transforming text to flashcards
   - Add functions to validate generated flashcards

5. **Endpoint Implementation**:
   - Implement POST handler for `/api/ai/generate-flashcards`
   - Add authentication and authorization handling
   - Connect with AI service and error handling

6. **Statistics Implementation**:
   - Add functions to update `flashcard_generation_stats` table
   - Integrate statistics update with main data flow

7. **Testing**:
   - Write unit tests for AI service
   - Write integration tests for the entire endpoint
   - Test various error scenarios

8. **Deployment and Monitoring**:
   - Deploy endpoint to test environment
   - Configure monitoring for endpoint, especially for AI API communication
   - Create dashboard to track flashcard generation statistics

## 10. Example Implementation (skeleton)

### Endpoint (`/src/pages/api/ai/generate-flashcards.ts`):

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { generateFlashcards } from "../../../lib/services/ai-flashcard-service";
import { updateFlashcardGenerationStats } from "../../../lib/services/stats-service";
import { validateUserAccess } from "../../../lib/services/auth-service";
import type { GenerateFlashcardsResponseDto } from "../../../types";

export const prerender = false;

// Validation schema
const generateFlashcardsSchema = z.object({
  text: z.string().min(1000).max(10000),
  collection_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if user is logged in
    const supabase = locals.supabase;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse input data
    const body = await request.json();
    
    // Validate input data
    const result = generateFlashcardsSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body", 
          details: result.error.format() 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const { text, collection_id, category_id } = result.data;
    
    // Check access to collection and category
    if (collection_id) {
      const hasCollectionAccess = await validateUserAccess(
        supabase, user.id, "collections", collection_id
      );
      
      if (!hasCollectionAccess) {
        return new Response(
          JSON.stringify({ 
            error: "Resource not found", 
            details: `Collection with ID ${collection_id} not found` 
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    if (category_id) {
      const hasCategoryAccess = await validateUserAccess(
        supabase, user.id, "categories", category_id
      );
      
      if (!hasCategoryAccess) {
        return new Response(
          JSON.stringify({ 
            error: "Resource not found", 
            details: `Category with ID ${category_id} not found` 
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    // Generate flashcards
    const flashcards = await generateFlashcards(text, collection_id, category_id);
    
    // Update statistics
    await updateFlashcardGenerationStats(supabase, user.id, flashcards.length);
    
    // Return generated flashcards
    const response: GenerateFlashcardsResponseDto = { flashcards };
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error generating flashcards:", error);
    const requestId = crypto.randomUUID();
    console.error(`RequestID ${requestId}:`, error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("AI API error")) {
        return new Response(
          JSON.stringify({ 
            error: "Service unavailable", 
            details: "AI service is currently unavailable", 
            requestId 
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ error: "Internal server error", requestId }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### Serwis AI (`/src/lib/services/ai-flashcard-service.ts`):

```typescript
import type { GeneratedFlashcardDto } from "../../../types";
import { generateUUID } from "../utils/uuid";

export async function generateFlashcards(
  text: string,
  collection_id: string | null = null,
  category_id: string | null = null
): Promise<GeneratedFlashcardDto[]> {
  try {
    // Konfiguracja dla zewnętrznego API AI
    const API_KEY = import.meta.env.OPENROUTER_API_KEY;
    const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    
    // Przygotowanie promptu dla AI
    const prompt = `
      Wygeneruj fiszki edukacyjne na podstawie poniższego tekstu.
      Każda fiszka powinna mieć format: "pytanie" na przedzie i "odpowiedź" na tyle.
      Front fiszki nie powinien przekraczać 200 znaków.
      Back fiszki nie powinien przekraczać 500 znaków.
      Wygeneruj od 5 do 15 fiszek, które najlepiej podsumowują najważniejsze informacje z tekstu.
      
      Tekst:
      ${text}
      
      Format odpowiedzi powinien być tablicą JSON obiektów z polami "front" i "back".
    `;
    
    // Wywołanie API AI
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "google/gemini-pro",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }
    
    const aiResponse = await response.json();
    const aiContent = aiResponse.choices[0].message.content;
    
    // Parsowanie odpowiedzi AI
    let flashcards: Array<{front: string, back: string}>;
    try {
      // Próba wyciągnięcia JSON z tekstu odpowiedzi
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || 
                        aiContent.match(/\[([\s\S]*?)\]/);
                        
      const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
      flashcards = JSON.parse(jsonString);
      
      // Jeśli parsowanie powiodło się, ale wynik nie jest tablicą
      if (!Array.isArray(flashcards)) {
        throw new Error("AI response is not an array");
      }
    } catch (e) {
      console.error("Error parsing AI response:", e);
      throw new Error("Failed to parse AI-generated flashcards");
    }
    
    // Walidacja i transformacja fiszek
    const validatedFlashcards: GeneratedFlashcardDto[] = flashcards
      .filter(card => 
        card.front && card.front.length <= 200 && 
        card.back && card.back.length <= 500
      )
      .map(card => ({
        id: generateUUID(),
        front: card.front,
        back: card.back,
        collection_id,
        category_id
      }));
    
    // Sprawdzenie czy mamy wystarczającą liczbę fiszek
    if (validatedFlashcards.length < 5) {
      throw new Error("AI generated too few valid flashcards");
    }
    
    // Limit do maksymalnie 15 fiszek
    return validatedFlashcards.slice(0, 15);
    
  } catch (error) {
    console.error("Error in generateFlashcards service:", error);
    throw error;
  }
}
```

### Serwis statystyk (`/src/lib/services/stats-service.ts`):

```typescript
import type { SupabaseClient } from "../../../db/supabase.client";

export async function updateFlashcardGenerationStats(
  supabase: SupabaseClient,
  userId: string,
  generatedCount: number
): Promise<void> {
  try {
    // Sprawdź czy rekord statystyk istnieje
    const { data: existingStats } = await supabase
      .from("flashcard_generation_stats")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (existingStats) {
      // Aktualizuj istniejący rekord
      await supabase
        .from("flashcard_generation_stats")
        .update({
          total_generated: existingStats.total_generated + generatedCount,
          last_generation_at: new Date().toISOString()
        })
        .eq("user_id", userId);
    } else {
      // Utwórz nowy rekord
      await supabase
        .from("flashcard_generation_stats")
        .insert({
          user_id: userId,
          total_generated: generatedCount,
          total_accepted_direct: 0,
          total_accepted_edited: 0,
          last_generation_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error("Error updating flashcard generation stats:", error);
    // Nie rzucaj błędu, ponieważ to nie jest krytyczna funkcjonalność
  }
}
</rewritten_file> 
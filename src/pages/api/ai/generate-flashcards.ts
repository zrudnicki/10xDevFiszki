/**
 * @fileoverview API endpoint for generating AI flashcards from text
 * This endpoint uses Gemini API to generate educational flashcards from supplied text
 * 
 * @example
 * // Example client request:
 * const response = await fetch('/api/ai/generate-flashcards', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     text: "...long educational text (1000-10000 characters)...",
 *     collection_id: "550e8400-e29b-41d4-a716-446655440000", // optional
 *     category_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479" // optional
 *   })
 * });
 * 
 * const data = await response.json();
 * // data.data contains array of generated flashcards if successful
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { generateFlashcards, createFlashcardsResponse } from "../../../lib/services/ai-flashcard-service";
import { updateFlashcardGenerationStats } from "../../../lib/services/stats-service";
import { validateUserAccess } from "../../../lib/services/auth-service";
import { checkRateLimit } from "../../../lib/services/rate-limit-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const prerender = false;

/**
 * Zod validation schema for flashcard generation request
 * 
 * @remarks
 * - text: Required, must be between 1000 and 10000 characters
 * - collection_id: Optional UUID of the collection to associate flashcards with
 * - category_id: Optional UUID of the category to associate flashcards with
 */
const generateFlashcardsSchema = z.object({
  text: z
    .string()
    .min(1000, "Text must be at least 1000 characters long")
    .max(10000, "Text must not exceed 10000 characters"),
  collection_id: z.string().uuid("Invalid collection ID format").nullable().optional(),
  category_id: z.string().uuid("Invalid category ID format").nullable().optional(),
});

/**
 * Flashcard generation endpoint - POST handler
 *
 * @description 
 * Generates educational flashcards from text using AI models.
 * The endpoint performs the following steps:
 * 1. Authenticates the user (auto-login in dev environment)
 * 2. Validates rate limits to prevent abuse
 * 3. Validates input data (text length, UUID format)
 * 4. Checks user access to specified collection/category
 * 5. Calls AI service to generate flashcards
 * 6. Updates user statistics
 * 7. Returns generated flashcards
 *
 * @returns {Promise<Response>} JSON response with generated flashcards or error details
 * 
 * @example
 * // Example successful response:
 * {
 *   "data": [
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "front": "What is photosynthesis?",
 *       "back": "The process by which plants convert light energy into chemical energy",
 *       "collection_id": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
 *       "category_id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
 *     },
 *     // More flashcards...
 *   ]
 * }
 * 
 * @example
 * // Example error response (400 Bad Request):
 * {
 *   "error": "Invalid request body",
 *   "details": { "path": ["text"], "message": "Text must be at least 1000 characters" },
 *   "requestId": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p"
 * }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // Get Supabase client
    const supabase = await getSupabaseServerClient(cookies);
    
    // Check if user is logged in
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[${requestId}] Authentication error:`, authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(supabase, user.id);
    const responseHeaders = {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
      "X-RateLimit-Limit": rateLimitResult.limit.toString(),
      "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
    };

    if (rateLimitResult.isLimited) {
      console.warn(`[${requestId}] Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({
          error: "Too Many Requests",
          details: "You have exceeded the rate limit for flashcard generation",
          requestId,
        }),
        {
          status: 429,
          headers: responseHeaders,
        },
      );
    }

    // Parse input data
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error(`[${requestId}] Error parsing request body:`, error);
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: "Request body must be valid JSON",
          requestId,
        }),
        { status: 400, headers: responseHeaders },
      );
    }

    // Validate input data
    const result = generateFlashcardsSchema.safeParse(body);
    if (!result.success) {
      console.error(`[${requestId}] Validation error:`, result.error.format());
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: result.error.format(),
          requestId,
        }),
        { status: 400, headers: responseHeaders },
      );
    }

    const { text, collection_id, category_id } = result.data;

    // Check access to collection and category
    if (collection_id) {
      const hasCollectionAccess = await validateUserAccess(supabase, user.id, "collections", collection_id);
      if (!hasCollectionAccess) {
        return new Response(
          JSON.stringify({
            error: "Resource not found",
            details: `Collection with ID ${collection_id} not found`,
            requestId,
          }),
          { status: 404, headers: responseHeaders },
        );
      }
    }

    if (category_id) {
      const hasCategoryAccess = await validateUserAccess(supabase, user.id, "categories", category_id);
      if (!hasCategoryAccess) {
        return new Response(
          JSON.stringify({
            error: "Resource not found",
            details: `Category with ID ${category_id} not found`,
            requestId,
          }),
          { status: 404, headers: responseHeaders },
        );
      }
    }

    // Generate flashcards
    let flashcards;
    try {
      console.log(`[${requestId}] Starting flashcard generation`);
      flashcards = await generateFlashcards(text, collection_id, category_id);

      if (flashcards.length < 5) {
        throw new Error("Generated too few valid flashcards");
      }
      console.log(`[${requestId}] Successfully generated ${flashcards.length} flashcards`);
    } catch (error) {
      console.error(`[${requestId}] Error generating flashcards:`, error);

      if (error instanceof Error) {
        if (error.message.includes("AI API error")) {
          return new Response(
            JSON.stringify({
              error: "Service unavailable",
              details: "AI service is currently unavailable",
              requestId,
            }),
            { status: 503, headers: responseHeaders },
          );
        } else if (error.message.includes("too few")) {
          return new Response(
            JSON.stringify({
              error: "Processing error",
              details: "Could not generate enough valid flashcards from the provided text. Try with different content.",
              requestId,
            }),
            { status: 422, headers: responseHeaders },
          );
        }
      }

      return new Response(
        JSON.stringify({
          error: "Internal server error",
          details: "Failed to generate flashcards",
          requestId,
        }),
        { status: 500, headers: responseHeaders },
      );
    }

    // Update user statistics
    try {
      await updateFlashcardGenerationStats(supabase, user.id, flashcards.length, {
        averageFlashcardFrontLength: Math.round(
          flashcards.reduce((sum, card) => sum + card.front.length, 0) / flashcards.length,
        ),
        averageFlashcardBackLength: Math.round(
          flashcards.reduce((sum, card) => sum + card.back.length, 0) / flashcards.length,
        ),
        textInputLength: text.length,
      });
    } catch (error) {
      console.error(`[${requestId}] Error updating flashcard generation stats:`, error);
    }

    // Return generated flashcards
    const response = createFlashcardsResponse(flashcards);
    const endTime = performance.now();
    const processingTime = Math.round(endTime - startTime);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...responseHeaders,
        "X-Processing-Time": processingTime.toString(),
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        requestId,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      },
    );
  }
};

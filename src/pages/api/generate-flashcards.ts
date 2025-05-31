import type { APIRoute } from "astro";

import type { AIGenerationResponse, ErrorResponse, RateLimitResponse } from "../../types";
import { AIGenerationSchema, formatValidationError } from "../../lib/validation";
import { rateLimiter } from "../../lib/rate-limiter";
import { openRouterClient } from "../../lib/openrouter-client";
import type { Database } from "../../db/database.types";

/**
 * POST /api/generate-flashcards
 *
 * AI-powered flashcard generation endpoint with:
 * - Authentication required
 * - Rate limiting (10 requests/minute per user)
 * - Input validation (text: 1000-10000 chars)
 * - Collection context support
 * - Statistics tracking for MVP metrics
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();

  try {
    // 1. Authentication Check
    const supabase = locals.supabase as import("@supabase/supabase-js").SupabaseClient<Database>;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        } as ErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Rate Limiting Check
    if (!rateLimiter.isAllowed(user.id)) {
      const retryAfter = rateLimiter.getRetryAfter(user.id);

      return new Response(
        JSON.stringify({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many generation requests. Please wait before trying again.",
            details: {
              limit: 10,
              window: "1 minute",
              retry_after: retryAfter,
            },
          },
        } as RateLimitResponse),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    // 3. Input Validation
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_JSON",
            message: "Invalid JSON in request body",
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validationResult = AIGenerationSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: formatValidationError(validationResult.error),
        } as ErrorResponse),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { text, collection_id, max_cards } = validationResult.data;

    // 4. Collection Context (if provided)
    let collectionContext;
    if (collection_id) {
      const { data: collection, error: collectionError } = await supabase
        .from("collections")
        .select("name, description")
        .eq("id", collection_id)
        .eq("user_id", user.id)
        .single();

      if (collectionError || !collection) {
        return new Response(
          JSON.stringify({
            error: {
              code: "COLLECTION_NOT_FOUND",
              message: "Collection not found or access denied",
            },
          } as ErrorResponse),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      collectionContext = {
        collection_name: collection.name,
        collection_description: collection.description || undefined,
      };
    }

    // 5. AI Generation
    let candidates;
    try {
      candidates = await openRouterClient.generateFlashcards({
        text,
        maxCards: max_cards,
        context: collectionContext,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("AI generation failed:", error);

      return new Response(
        JSON.stringify({
          error: {
            code: "AI_GENERATION_FAILED",
            message: "Failed to generate flashcards. Please try again.",
          },
        } as ErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 6. Update Generation Statistics
    try {
      await supabase
        .from("flashcard_generation_stats")
        .upsert(
          {
            user_id: user.id,
            total_generated: candidates.length,
            last_generation_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
            ignoreDuplicates: false,
          }
        );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to update generation stats:", error);
      // Don't fail the request if stats update fails
    }

    // 7. Response Formation
    const processingTime = Date.now() - startTime;

    const response: AIGenerationResponse = {
      data: {
        candidates,
        generated_count: candidates.length,
        processing_time_ms: processingTime,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in generate-flashcards:", error);

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      } as ErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

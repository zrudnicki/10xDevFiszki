import type { APIRoute } from "astro";
import { z } from "zod";
import { updateFlashcardAcceptanceStats } from "../../../../lib/services/stats-service";
import { checkRateLimit } from "../../../../lib/services/rate-limit-service";
import { generateUUID } from "../../../../lib/utils/uuid";
import type { AcceptFlashcardsDto, AcceptFlashcardsResponseDto, FlashcardDto } from "../../../../types";

export const prerender = false;

// Validation schema for a single flashcard
const acceptFlashcardSchema = z.object({
  id: z.string().optional(), // Generated flashcards may have temporary IDs
  front: z.string().max(200, "Front of flashcard must not exceed 200 characters"),
  back: z.string().max(500, "Back of flashcard must not exceed 500 characters"),
  collection_id: z.string().uuid("Invalid collection ID format").nullable().optional(),
  category_id: z.string().uuid("Invalid category ID format").nullable().optional(),
  was_edited: z.boolean().default(false),
});

// Validation schema for the entire request
const acceptFlashcardsSchema = z.object({
  flashcards: z.array(acceptFlashcardSchema).min(1, "At least one flashcard must be provided"),
});

/**
 * Accept flashcards endpoint
 *
 * Accepts generated flashcards and saves them to the database
 * Updates flashcard acceptance statistics
 * Requires authentication
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] POST /api/ai/flashcards/accept - Start`);

  const startTime = performance.now();

  try {
    // Get Supabase client
    const supabase = locals.supabase;

    // In development, auto-login as test user
    if (import.meta.env.DEV) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: "test@test.pl",
        password: "testtest",
      });

      if (signInError) {
        console.error(`[${requestId}] Dev auto-login failed:`, signInError);
      } else {
        console.log(`[${requestId}] Dev auto-login successful as test@test.pl`);
      }
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[${requestId}] Authentication error:`, authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      });
    }

    console.log(`[${requestId}] Authenticated user: ${user.id}`);

    // Check rate limit - use a lower limit for accept endpoint
    const rateLimitResult = checkRateLimit(user.id);

    // Add rate limit headers to all responses
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
          details: "You have exceeded the rate limit for flashcard operations",
          requestId,
        }),
        {
          status: 429,
          headers: responseHeaders,
        }
      );
    }

    // Parse input data
    let body: AcceptFlashcardsDto;
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
        { status: 400, headers: responseHeaders }
      );
    }

    // Validate input data
    const result = acceptFlashcardsSchema.safeParse(body);
    if (!result.success) {
      console.error(`[${requestId}] Validation error:`, result.error.format());
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: result.error.format(),
          requestId,
        }),
        { status: 400, headers: responseHeaders }
      );
    }

    const { flashcards } = result.data;

    console.log(`[${requestId}] Processing ${flashcards.length} flashcards to accept`);

    // Process flashcards
    try {
      // Count direct vs edited flashcards
      const directAccepted = flashcards.filter((card) => !card.was_edited).length;
      const editedAccepted = flashcards.filter((card) => card.was_edited).length;

      console.log(`[${requestId}] Flashcard stats: direct=${directAccepted}, edited=${editedAccepted}`);

      // Update acceptance statistics
      await updateFlashcardAcceptanceStats(supabase, user.id, directAccepted, editedAccepted);

      // Prepare flashcards for insertion
      const flashcardsToInsert = flashcards.map((card) => ({
        id: card.id || generateUUID(),
        front: card.front,
        back: card.back,
        collection_id: card.collection_id || null,
        category_id: card.category_id || null,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Insert flashcards into database
      const { data: insertedFlashcards, error: insertError } = await supabase
        .from("flashcards")
        .insert(flashcardsToInsert)
        .select();

      if (insertError) {
        console.error(`[${requestId}] Error inserting flashcards:`, insertError);
        return new Response(
          JSON.stringify({
            error: "Database Error",
            details: "Failed to save flashcards to database",
            requestId,
          }),
          { status: 500, headers: responseHeaders }
        );
      }

      console.log(`[${requestId}] Successfully inserted ${insertedFlashcards.length} flashcards`);

      // Prepare response
      const response: AcceptFlashcardsResponseDto = {
        data: insertedFlashcards as FlashcardDto[],
        stats: {
          total_accepted: flashcards.length,
          total_accepted_direct: directAccepted,
          total_accepted_edited: editedAccepted,
        },
      };

      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);

      console.info(
        `[${requestId}] Successfully accepted ${flashcards.length} flashcards for user ${user.id} in ${processingTime}ms`
      );

      // Return response
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...responseHeaders,
          "X-Processing-Time": processingTime.toString(),
        },
      });
    } catch (error) {
      console.error(`[${requestId}] Error processing flashcards:`, error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          details: "Failed to process flashcards",
          requestId,
        }),
        { status: 500, headers: responseHeaders }
      );
    }
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
      }
    );
  }
};

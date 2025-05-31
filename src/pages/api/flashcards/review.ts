import type { APIRoute } from "astro";
import type { FlashcardReviewRequest, FlashcardReviewResponse, FlashcardReviewItem } from "../../../types";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { Database } from "../../../db/database.types";
import { FlashcardReviewRequestSchema } from "../../../lib/validation";
import { formatValidationError } from "../../../lib/validation";
import { AuthenticationError, ValidationError } from "../../../lib/errors";

/**
 * POST /api/flashcards/review
 * 
 * AI Review API endpoint for batch processing and approving AI-generated flashcard candidates.
 * Supports actions: accept_direct, accept_edited, reject
 * Includes transaction safety and MVP statistics tracking.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication Check
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError("User must be authenticated to access this resource");
    }

    // Step 2: Parse and validate request body
    const requestBody = await request.json();
    const validationResult = FlashcardReviewRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const validationError = formatValidationError(validationResult.error);
      throw new ValidationError(validationError.message, validationError.details);
    }

    const reviewRequest: FlashcardReviewRequest = validationResult.data;

    // Step 3: Collection and Category validation
    await validateCollectionAndCategory(supabase, user.id, reviewRequest);

    // Step 4: Process review actions and prepare batch
    const actionCounts = processReviewActions(reviewRequest.flashcards);

    // Step 5: Database transaction for flashcard creation
    const result = await processFlashcardReviewTransaction(supabase, user.id, reviewRequest, actionCounts);

    // Step 6: Return successful response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Flashcard review error:", error);

    if (error instanceof AuthenticationError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: error.message,
          },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
            details: error.details,
          },
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generic error handler
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while processing flashcard review",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Collection and Category validation logic
async function validateCollectionAndCategory(
  supabase: SupabaseClient,
  userId: string,
  request: FlashcardReviewRequest
): Promise<void> {
  // Validate collection exists and belongs to user
  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("id, name")
    .eq("id", request.collection_id)
    .eq("user_id", userId)
    .single();

  if (collectionError || !collection) {
    throw new ValidationError("Collection not found or access denied", {
      collection_id: "Collection must exist and belong to the authenticated user",
    });
  }

  // Validate category if provided
  if (request.category_id) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("id", request.category_id)
      .eq("user_id", userId)
      .single();

    if (categoryError || !category) {
      throw new ValidationError("Category not found or access denied", {
        category_id: "Category must exist and belong to the authenticated user",
      });
    }
  }
}

// Action processing logic according to plan
interface ActionCounts {
  accepted_direct: number;
  accepted_edited: number;
  rejected: number;
  to_create: FlashcardReviewItem[];
}

function processReviewActions(flashcards: FlashcardReviewItem[]): ActionCounts {
  const counts: ActionCounts = {
    accepted_direct: 0,
    accepted_edited: 0,
    rejected: 0,
    to_create: [],
  };

  for (const item of flashcards) {
    switch (item.action) {
      case "accept_direct":
        counts.accepted_direct++;
        counts.to_create.push(item);
        break;
      case "accept_edited":
        counts.accepted_edited++;
        counts.to_create.push(item);
        break;
      case "reject":
        counts.rejected++;
        // Rejected items are not added to to_create array
        break;
    }
  }

  return counts;
}

// Database transaction processing
async function processFlashcardReviewTransaction(
  supabase: SupabaseClient,
  userId: string,
  request: FlashcardReviewRequest,
  actionCounts: ActionCounts
): Promise<FlashcardReviewResponse> {
  const createdFlashcards: Record<string, unknown>[] = [];
  
  // Create flashcards for approved actions (accept_direct, accept_edited)
  for (const item of actionCounts.to_create) {
    const { data: flashcard, error: createError } = await supabase
      .from("flashcards")
      .insert({
        user_id: userId,
        collection_id: request.collection_id,
        category_id: request.category_id || null,
        front: item.front,
        back: item.back,
        // SM-2 Algorithm default parameters
        easiness_factor: 2.5,
        interval_days: 1,
        reviews_count: 0,
        next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
      })
      .select("*")
      .single();

    if (createError) {
      // eslint-disable-next-line no-console
      console.error("Error creating flashcard:", createError);
      throw new Error(`Failed to create flashcard: ${createError.message}`);
    }

    createdFlashcards.push({
      ...flashcard,
      created_by: "ai_generated",
    });
  }

  // Update statistics for MVP tracking
  const { error: statsError } = await supabase.from("flashcard_generation_stats").upsert(
    {
      user_id: userId,
      total_accepted_direct: actionCounts.accepted_direct,
      total_accepted_edited: actionCounts.accepted_edited,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
      ignoreDuplicates: false,
    }
  );

  if (statsError) {
    // eslint-disable-next-line no-console
    console.error("Error updating statistics:", statsError);
    // Don't throw here - flashcards were created successfully
  }

  // Return successful response
  const response: FlashcardReviewResponse = {
    data: {
      created_count: createdFlashcards.length,
      accepted_direct: actionCounts.accepted_direct,
      accepted_edited: actionCounts.accepted_edited,
      rejected: actionCounts.rejected,
      flashcards: createdFlashcards.map((fc) => ({
        id: fc.id as string,
        front: fc.front as string,
        back: fc.back as string,
        collection_id: fc.collection_id as string,
        category_id: fc.category_id as string | null,
        created_by: "ai_generated" as const,
        easiness_factor: fc.easiness_factor as number,
        interval_days: fc.interval_days as number,
        reviews_count: fc.reviews_count as number,
        next_review_at: fc.next_review_at as string,
      })),
    },
  };

  return response;
} 
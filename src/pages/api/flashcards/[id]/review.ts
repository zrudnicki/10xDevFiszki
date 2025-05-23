import type { APIRoute } from "astro";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { calculateNextReview } from "@/lib/services/spaced-repetition.service";
import { checkRateLimit } from "@/lib/services/rate-limit-service";
import type { FlashcardReviewStatus } from "@/types";

export const prerender = false;

// Validation schema for flashcard review
const flashcardReviewSchema = z.object({
  status: z.enum(["learned", "review"], {
    invalid_type_error: "Status must be either 'learned' or 'review'",
    required_error: "Status is required",
  }),
});

// Schema for validating request body
const reviewRequestSchema = z.object({
  status: z.enum(["learned", "review"])
});

/**
 * POST /api/flashcards/:id/review
 *
 * Mark a flashcard as learned or requiring review, implementing spaced repetition
 * 
 * The endpoint:
 * 1. Updates the flashcard status
 * 2. Calculates the next review date using the SM-2 algorithm
 * 3. Increments the review count
 * 4. Updates the easiness factor based on performance
 * 5. Returns updated review information
 */
export const POST: APIRoute = async ({ request, params, cookies }) => {
  try {
    // Get authenticated Supabase client
    const supabaseClient = getSupabaseServerClient(cookies);
    
    // Get user ID from session
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const userId = session.user.id;
    
    // Get flashcard ID from params
    const flashcardId = params.id;
    if (!flashcardId) {
      return new Response(JSON.stringify({ error: "Flashcard ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Parse request body
    const { status } = await request.json() as { status: FlashcardReviewStatus };
    if (!status || (status !== "learned" && status !== "review")) {
      return new Response(JSON.stringify({ error: "Invalid review status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Get current flashcard data
    const { data: flashcard, error: fetchError } = await supabaseClient
      .from("flashcards")
      .select("id, reviews_count, easiness_factor, interval_days")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching flashcard:", fetchError);
      return new Response(JSON.stringify({ error: "Flashcard not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Calculate next review date using SM-2 algorithm
    const quality = status === "learned" ? 5 : 2; // 5 = perfect, 2 = difficult
    const {
      nextReviewDate,
      easinessFactor,
      intervalDays,
      reviewsCount
    } = calculateNextReview({
      quality,
      currentEasinessFactor: flashcard.easiness_factor || 2.5,
      currentIntervalDays: flashcard.interval_days || 0,
      reviewsCount: flashcard.reviews_count || 0
    });
    
    // Update flashcard with new spaced repetition data
    const { data: updatedFlashcard, error: updateError } = await supabaseClient
      .from("flashcards")
      .update({
        next_review_at: nextReviewDate.toISOString(),
        easiness_factor: easinessFactor,
        interval_days: intervalDays,
        reviews_count: reviewsCount,
        last_reviewed_at: new Date().toISOString()
      })
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating flashcard review status:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update flashcard" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Insert review record
    const { error: insertError } = await supabaseClient
      .from("flashcard_reviews")
      .insert({
        flashcard_id: flashcardId,
        user_id: userId,
        status,
        quality,
        next_review_at: nextReviewDate.toISOString()
      });
    
    if (insertError) {
      console.error("Error inserting review record:", insertError);
      // Continue despite error in inserting review record
    }
    
    // Return updated flashcard data
    return new Response(JSON.stringify({
      id: updatedFlashcard.id,
      status,
      next_review_at: updatedFlashcard.next_review_at
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error in /api/flashcards/[id]/review:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}; 
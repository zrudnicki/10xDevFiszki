import type { SupabaseClient } from "../../db/supabase.client";
import type { FlashcardDto, FlashcardDueDto, FlashcardReviewDto, FlashcardReviewResponseDto } from "../../types";
import { getFlashcardById } from "./flashcard-service";

/**
 * Calculate the next review date based on the review count and status
 * Implements a simple spaced repetition algorithm
 * 
 * @param reviewCount - Number of times the flashcard has been reviewed
 * @param status - Status of the flashcard (learned or review)
 * @returns Date | null - Next review date or null if the flashcard is marked as learned
 */
function calculateNextReviewDate(reviewCount: number, status: "learned" | "review"): Date | null {
  // If the flashcard is marked as learned, no further review is needed
  if (status === "learned") {
    return null;
  }

  // Simple spaced repetition algorithm
  // Initial review: 1 day
  // Second review: 3 days
  // Third review: 7 days
  // Fourth review: 14 days
  // Fifth review: 30 days
  // After fifth review: 60 days
  const now = new Date();
  let daysToAdd = 1;

  switch (reviewCount) {
    case 0:
      daysToAdd = 1;
      break;
    case 1:
      daysToAdd = 3;
      break;
    case 2:
      daysToAdd = 7;
      break;
    case 3:
      daysToAdd = 14;
      break;
    case 4:
      daysToAdd = 30;
      break;
    default:
      daysToAdd = 60;
      break;
  }

  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);
  return nextReviewDate;
}

/**
 * Review a flashcard, updating its status and next review date
 * 
 * @param supabase - Supabase client instance
 * @param userId - ID of the user reviewing the flashcard
 * @param flashcardId - ID of the flashcard to review
 * @param review - Review data (status)
 * @returns Promise<FlashcardReviewResponseDto> - Updated review information
 */
export async function reviewFlashcard(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: string,
  review: FlashcardReviewDto
): Promise<FlashcardReviewResponseDto> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Reviewing flashcard ${flashcardId} for user ${userId}`);

    // Validate that the flashcard exists and belongs to the user
    await getFlashcardById(supabase, userId, flashcardId);

    // Get current review data if it exists
    const { data: existingReview, error: fetchError } = await supabase
      .from("flashcard_reviews")
      .select("*")
      .eq("flashcard_id", flashcardId)
      .eq("user_id", userId)
      .single();

    const now = new Date();
    const reviewCount = existingReview ? existingReview.review_count + 1 : 1;
    const nextReviewDate = calculateNextReviewDate(reviewCount, review.status);

    if (existingReview) {
      // Update existing review
      const { data, error } = await supabase
        .from("flashcard_reviews")
        .update({
          status: review.status,
          next_review_at: nextReviewDate?.toISOString() || null,
          review_count: reviewCount,
          last_reviewed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", existingReview.id)
        .select()
        .single();

      if (error) {
        console.error(`[${requestId}] Error updating flashcard review:`, error);
        throw new Error(`Failed to update flashcard review: ${error.message}`);
      }

      console.log(`[${requestId}] Updated review for flashcard ${flashcardId}`);
      return {
        id: flashcardId,
        status: data.status as "learned" | "review",
        next_review_at: data.next_review_at,
      };
    } else {
      // Create new review
      const { data, error } = await supabase
        .from("flashcard_reviews")
        .insert({
          flashcard_id: flashcardId,
          user_id: userId,
          status: review.status,
          next_review_at: nextReviewDate?.toISOString() || null,
          review_count: 1,
          last_reviewed_at: now.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(`[${requestId}] Error creating flashcard review:`, error);
        throw new Error(`Failed to create flashcard review: ${error.message}`);
      }

      console.log(`[${requestId}] Created review for flashcard ${flashcardId}`);
      return {
        id: flashcardId,
        status: data.status as "learned" | "review",
        next_review_at: data.next_review_at,
      };
    }
  } catch (error) {
    console.error(`Error in reviewFlashcard service:`, error);
    throw error;
  }
}

/**
 * Get all flashcards due for review for the current user
 * 
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param options - Query options
 * @returns Promise<{ data: FlashcardDueDto[], total: number }> - Flashcards due for review and total count
 */
export async function getFlashcardsDueForReview(
  supabase: SupabaseClient,
  userId: string,
  options: {
    limit?: number;
    collectionId?: string | null;
    categoryId?: string | null;
  } = {}
): Promise<{ data: FlashcardDueDto[]; total: number }> {
  try {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Getting flashcards due for review for user ${userId}`);

    const { limit = 20, collectionId = null, categoryId = null } = options;
    const now = new Date().toISOString();

    // Get flashcards with reviews that are due for review (next_review_at <= now)
    const query = supabase
      .from("flashcards")
      .select(
        `
        *,
        flashcard_reviews!inner(
          id,
          status,
          next_review_at,
          review_count,
          last_reviewed_at
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .eq("flashcard_reviews.user_id", userId)
      .eq("flashcard_reviews.status", "review")
      .lte("flashcard_reviews.next_review_at", now);

    // Apply filters
    if (collectionId) {
      query.eq("collection_id", collectionId);
    }

    if (categoryId) {
      query.eq("category_id", categoryId);
    }

    // Get total count
    const { count, error: countError } = await query;

    if (countError) {
      console.error(`[${requestId}] Error getting flashcard count:`, countError);
      throw new Error(`Failed to get flashcard count: ${countError.message}`);
    }

    // Get flashcards with pagination
    const { data, error } = await query.limit(limit);

    if (error) {
      console.error(`[${requestId}] Error getting flashcards due for review:`, error);
      throw new Error(`Failed to get flashcards due for review: ${error.message}`);
    }

    // Map to DTOs
    const flashcardDtos: FlashcardDueDto[] = data.map((item) => {
      // Extract review data
      const reviewData = item.flashcard_reviews[0];
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_id, flashcard_reviews, ...flashcardData } = item;

      return {
        ...flashcardData,
        next_review_at: reviewData.next_review_at,
      };
    });

    console.log(
      `[${requestId}] Retrieved ${flashcardDtos.length} flashcards due for review for user ${userId}`
    );

    return {
      data: flashcardDtos,
      total: count || 0,
    };
  } catch (error) {
    console.error(`Error in getFlashcardsDueForReview service:`, error);
    throw error;
  }
} 
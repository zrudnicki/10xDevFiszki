import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlashcardGenerationStatsDto } from "../../types";

/**
 * Updates flashcard generation statistics when new flashcards are generated
 * Creates a new stats record if one doesn't exist for the user
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user generating flashcards
 * @param generatedCount - Number of flashcards generated
 */
export async function updateFlashcardGenerationStats(
  supabase: SupabaseClient,
  userId: string,
  generatedCount: number
): Promise<void> {
  try {
    // Check if stats record exists
    const { data: existingStats, error: fetchError } = await supabase
      .from("flashcard_generation_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error
      console.error("Error fetching flashcard generation stats:", fetchError);
      return; // Don't throw error as this is non-critical functionality
    }

    if (existingStats) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("flashcard_generation_stats")
        .update({
          total_generated: existingStats.total_generated + generatedCount,
          last_generation_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating flashcard generation stats:", updateError);
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase.from("flashcard_generation_stats").insert({
        user_id: userId,
        total_generated: generatedCount,
        total_accepted_direct: 0,
        total_accepted_edited: 0,
        last_generation_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Error creating flashcard generation stats:", insertError);
      }
    }
  } catch (error) {
    console.error("Error in updateFlashcardGenerationStats service:", error);
    // Don't throw error as this is non-critical functionality
  }
}

/**
 * Get flashcard generation statistics for a user
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @returns Promise<FlashcardGenerationStatsDto> - User's flashcard generation statistics
 */
export async function getFlashcardGenerationStats(
  supabase: SupabaseClient,
  userId: string
): Promise<FlashcardGenerationStatsDto> {
  try {
    const { data: stats, error } = await supabase
      .from("flashcard_generation_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // Return default stats if no record exists
      return {
        total_generated: 0,
        total_accepted_direct: 0,
        total_accepted_edited: 0,
        acceptance_rate: 0,
        last_generation_at: null,
      };
    }

    // Calculate acceptance rate to avoid division by zero
    const acceptanceRate =
      stats.total_generated > 0
        ? (stats.total_accepted_direct + stats.total_accepted_edited) / stats.total_generated
        : 0;

    return {
      total_generated: stats.total_generated,
      total_accepted_direct: stats.total_accepted_direct,
      total_accepted_edited: stats.total_accepted_edited,
      acceptance_rate: acceptanceRate,
      last_generation_at: stats.last_generation_at,
    };
  } catch (error) {
    console.error("Error in getFlashcardGenerationStats service:", error);
    // Return default stats if error occurs
    return {
      total_generated: 0,
      total_accepted_direct: 0,
      total_accepted_edited: 0,
      acceptance_rate: 0,
      last_generation_at: null,
    };
  }
}

/**
 * Update flashcard acceptance statistics when generated flashcards are accepted
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user accepting flashcards
 * @param directAccepted - Number of flashcards accepted directly without edits
 * @param editedAccepted - Number of flashcards accepted after editing
 */
export async function updateFlashcardAcceptanceStats(
  supabase: SupabaseClient,
  userId: string,
  directAccepted: number,
  editedAccepted: number
): Promise<void> {
  try {
    // Check if stats record exists
    const { data: existingStats, error: fetchError } = await supabase
      .from("flashcard_generation_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching flashcard generation stats:", fetchError);
      return;
    }

    // Update statistics
    const { error: updateError } = await supabase
      .from("flashcard_generation_stats")
      .update({
        total_accepted_direct: existingStats.total_accepted_direct + directAccepted,
        total_accepted_edited: existingStats.total_accepted_edited + editedAccepted,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating flashcard acceptance stats:", updateError);
    }
  } catch (error) {
    console.error("Error in updateFlashcardAcceptanceStats service:", error);
    // Don't throw error as this is non-critical functionality
  }
}

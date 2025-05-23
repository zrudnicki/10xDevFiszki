/**
 * @fileoverview Service for managing flashcard generation statistics
 * Contains functions for tracking, updating, and retrieving statistics about the flashcard generation process
 * 
 * @example
 * // Example usage in an API endpoint
 * const stats = await getFlashcardGenerationStats(supabase, user.id);
 * console.log(`User has generated ${stats.total_generated} flashcards`);
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { FlashcardGenerationStatsDto } from "../../types";

/**
 * Additional metrics for flashcard generation process
 * Used to collect data about the quality and performance of generated flashcards
 * 
 * @interface FlashcardGenerationMetrics
 * @property {number} [averageFlashcardFrontLength] - Average length of the front side of generated flashcards
 * @property {number} [averageFlashcardBackLength] - Average length of the back side of generated flashcards
 * @property {number} [textInputLength] - Length of the input text used for generation
 * @property {number} [generationTime] - Time taken to generate flashcards in milliseconds
 * @property {string} [generateRequestId] - Unique identifier for the generation request for tracing
 */
export interface FlashcardGenerationMetrics {
  averageFlashcardFrontLength?: number;
  averageFlashcardBackLength?: number;
  textInputLength?: number;
  generationTime?: number;
  generateRequestId?: string;
}

/**
 * Updates flashcard generation statistics when new flashcards are generated
 * Creates a new stats record if one doesn't exist for the user
 * 
 * This function performs a non-critical update to user statistics, so it catches
 * and logs errors rather than letting them propagate to the caller.
 *
 * @param {SupabaseClient} supabase - Supabase client instance from locals.supabase
 * @param {string} userId - ID of the user generating flashcards
 * @param {number} generatedCount - Number of flashcards generated in this session
 * @param {FlashcardGenerationMetrics} [metrics] - Optional additional metrics about the generation process
 * @returns {Promise<void>} - Promise that resolves when operation completes
 * 
 * @example
 * // Basic update with just the count
 * await updateFlashcardGenerationStats(supabase, user.id, 10);
 * 
 * @example
 * // Update with detailed metrics
 * await updateFlashcardGenerationStats(supabase, user.id, flashcards.length, {
 *   averageFlashcardFrontLength: 120,
 *   averageFlashcardBackLength: 320, 
 *   textInputLength: 2500,
 *   generationTime: endTime - startTime
 * });
 */
export async function updateFlashcardGenerationStats(
  supabase: SupabaseClient,
  userId: string,
  generatedCount: number,
  metrics?: FlashcardGenerationMetrics
): Promise<void> {
  try {
    const requestId = metrics?.generateRequestId || crypto.randomUUID();
    console.log(`[${requestId}] Updating stats for user ${userId} with ${generatedCount} generated flashcards`);

    // Additional metrics for analytics (log only)
    if (metrics) {
      console.log(`[${requestId}] Generation metrics:`, {
        userId,
        generatedCount,
        averageFrontLength: metrics.averageFlashcardFrontLength,
        averageBackLength: metrics.averageFlashcardBackLength,
        textLength: metrics.textInputLength,
        generationTime: metrics.generationTime,
      });
    }

    // Check if stats record exists
    const { data: existingStats, error: fetchError } = await supabase
      .from("flashcard_generation_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error
      console.error(`[${requestId}] Error fetching flashcard generation stats for user ${userId}:`, fetchError);
      return; // Don't throw error as this is non-critical functionality
    }

    // Prepare the update data
    const now = new Date().toISOString();

    if (existingStats) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("flashcard_generation_stats")
        .update({
          total_generated: existingStats.total_generated + generatedCount,
          last_generation_at: now,
          // Store optional metrics in metadata column if available
          ...(metrics && {
            metadata: {
              ...existingStats.metadata,
              last_generation: {
                timestamp: now,
                input_length: metrics.textInputLength,
                flashcards_count: generatedCount,
                avg_front_length: metrics.averageFlashcardFrontLength,
                avg_back_length: metrics.averageFlashcardBackLength,
                processing_time_ms: metrics.generationTime,
              },
            },
          }),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error(`[${requestId}] Error updating flashcard generation stats for user ${userId}:`, updateError);
      } else {
        console.log(`[${requestId}] Successfully updated flashcard stats for user ${userId}`);
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase.from("flashcard_generation_stats").insert({
        user_id: userId,
        total_generated: generatedCount,
        total_accepted_direct: 0,
        total_accepted_edited: 0,
        last_generation_at: now,
        // Store optional metrics in metadata column if available
        ...(metrics && {
          metadata: {
            last_generation: {
              timestamp: now,
              input_length: metrics.textInputLength,
              flashcards_count: generatedCount,
              avg_front_length: metrics.averageFlashcardFrontLength,
              avg_back_length: metrics.averageFlashcardBackLength,
              processing_time_ms: metrics.generationTime,
            },
          },
        }),
      });

      if (insertError) {
        console.error(`[${requestId}] Error creating flashcard generation stats for user ${userId}:`, insertError);
      } else {
        console.log(`[${requestId}] Successfully created new flashcard stats for user ${userId}`);
      }
    }
  } catch (error) {
    console.error(`Error in updateFlashcardGenerationStats for user ${userId}:`, error);
    // Don't throw error as this is non-critical functionality
  }
}

/**
 * Retrieves flashcard generation statistics for a specific user
 * If no statistics exist, returns default values with zeros
 * This is safe to call even for new users without statistics records
 *
 * @param {SupabaseClient} supabase - Supabase client instance from locals.supabase
 * @param {string} userId - ID of the user to get statistics for
 * @returns {Promise<FlashcardGenerationStatsDto>} - User's flashcard generation statistics
 * 
 * @example
 * // Get user statistics and display them
 * const stats = await getFlashcardGenerationStats(supabase, user.id);
 * console.log(`You have generated ${stats.total_generated} flashcards`);
 * console.log(`Acceptance rate: ${Math.round(stats.acceptance_rate * 100)}%`);
 * 
 * @example
 * // Using statistics in component rendering
 * const stats = await getFlashcardGenerationStats(supabase, user.id);
 * return (
 *   <StatsDisplay 
 *     totalGenerated={stats.total_generated}
 *     acceptanceRate={stats.acceptance_rate} 
 *     lastGeneration={stats.last_generation_at}
 *   />
 * );
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
      console.info(`No stats found for user ${userId}, returning default values`);
      // Return default stats if no record exists
      return {
        total_generated: 0,
        total_accepted_direct: 0,
        total_accepted_edited: 0,
        acceptance_rate: 0,
        last_generation_at: null,
        created_at: null,
        updated_at: null
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
      created_at: stats.created_at,
      updated_at: stats.updated_at
    };
  } catch (error) {
    console.error(`Error in getFlashcardGenerationStats for user ${userId}:`, error);
    // Return default stats if error occurs
    return {
      total_generated: 0,
      total_accepted_direct: 0,
      total_accepted_edited: 0,
      acceptance_rate: 0,
      last_generation_at: null,
      created_at: null,
      updated_at: null
    };
  }
}

/**
 * Updates statistics when a user accepts generated flashcards
 * Tracks both flashcards accepted as-is and those accepted after editing
 * Creates a new stats record if one doesn't exist for the user
 *
 * @param {SupabaseClient} supabase - Supabase client instance from locals.supabase
 * @param {string} userId - ID of the user accepting the flashcards
 * @param {number} directAccepted - Number of flashcards accepted directly without edits
 * @param {number} editedAccepted - Number of flashcards accepted after editing by the user
 * @returns {Promise<void>} - Promise that resolves when operation completes
 * 
 * @example
 * // After user confirms flashcard selection
 * const directlyAccepted = acceptedFlashcards.filter(f => !f.was_edited).length;
 * const editedAccepted = acceptedFlashcards.filter(f => f.was_edited).length;
 * 
 * await updateFlashcardAcceptanceStats(
 *   supabase,
 *   user.id,
 *   directlyAccepted,
 *   editedAccepted
 * );
 * 
 * // Later, you can fetch the updated stats with getFlashcardGenerationStats
 */
export async function updateFlashcardAcceptanceStats(
  supabase: SupabaseClient,
  userId: string,
  directAccepted: number,
  editedAccepted: number
): Promise<void> {
  try {
    const requestId = crypto.randomUUID();
    console.log(
      `[${requestId}] Updating acceptance stats for user ${userId}: direct=${directAccepted}, edited=${editedAccepted}`
    );

    // Check if stats record exists
    const { data: existingStats, error: fetchError } = await supabase
      .from("flashcard_generation_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error(`[${requestId}] Error fetching flashcard generation stats for user ${userId}:`, fetchError);

      // If no record exists, create a new one with the acceptance stats
      if (fetchError.code === "PGRST116") {
        const { error: insertError } = await supabase.from("flashcard_generation_stats").insert({
          user_id: userId,
          total_generated: 0, // We don't know how many were generated
          total_accepted_direct: directAccepted,
          total_accepted_edited: editedAccepted,
          last_generation_at: new Date().toISOString(),
          metadata: {
            last_acceptance: {
              timestamp: new Date().toISOString(),
              direct_accepted: directAccepted,
              edited_accepted: editedAccepted,
              total_accepted: directAccepted + editedAccepted,
            },
          },
        });

        if (insertError) {
          console.error(`[${requestId}] Error creating flashcard acceptance stats for user ${userId}:`, insertError);
        } else {
          console.log(`[${requestId}] Created new flashcard stats with acceptance data for user ${userId}`);
        }
      }
      return;
    }

    // Update statistics
    const timestamp = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("flashcard_generation_stats")
      .update({
        total_accepted_direct: existingStats.total_accepted_direct + directAccepted,
        total_accepted_edited: existingStats.total_accepted_edited + editedAccepted,
        metadata: {
          ...existingStats.metadata,
          last_acceptance: {
            timestamp,
            direct_accepted: directAccepted,
            edited_accepted: editedAccepted,
            total_accepted: directAccepted + editedAccepted,
          },
        },
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(`[${requestId}] Error updating flashcard acceptance stats for user ${userId}:`, updateError);
    } else {
      console.log(`[${requestId}] Successfully updated acceptance stats for user ${userId}`);
    }
  } catch (error) {
    console.error(`Error in updateFlashcardAcceptanceStats for user ${userId}:`, error);
    // Don't throw error as this is non-critical functionality
  }
}

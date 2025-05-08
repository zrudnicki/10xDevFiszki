import type { APIRoute } from "astro";
import { getFlashcardGenerationStats } from "../../../lib/services/stats-service";
import type { SupabaseClient } from "../../../db/supabase.client";

export const prerender = false;

/**
 * Flashcard generation statistics endpoint
 * 
 * Returns statistics about generated flashcards for the authenticated user
 * Requires authentication
 */
export const GET: APIRoute = async ({ locals }) => {
  const requestId = crypto.randomUUID();
  
  try {
    // Check if user is logged in
    const supabase = locals.supabase as SupabaseClient;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error(`[${requestId}] Authentication error:`, authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Get generation stats
    const stats = await getFlashcardGenerationStats(supabase, user.id);
    
    console.info(`[${requestId}] Successfully fetched generation stats for user ${user.id}`);
    
    // Return stats (already follows consistent naming since it uses FlashcardGenerationStatsDto)
    return new Response(
      JSON.stringify(stats),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error(`[${requestId}] Error fetching generation stats:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        requestId 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}; 
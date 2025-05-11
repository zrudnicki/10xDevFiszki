import type { APIRoute } from "astro";
import { getFlashcardGenerationStats } from "../../../lib/services/stats-service";
import type { SupabaseClient } from "../../../db/supabase.client";

export const prerender = false;

/**
 * @swagger
 * /stats/generation:
 *   get:
 *     summary: Get flashcard generation statistics for the authenticated user
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_generated:
 *                   type: integer
 *                   description: Total number of flashcards generated
 *                 total_generation_requests:
 *                   type: integer
 *                   description: Total number of generation requests
 *                 average_per_request:
 *                   type: number
 *                   format: float
 *                   description: Average number of flashcards per request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
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
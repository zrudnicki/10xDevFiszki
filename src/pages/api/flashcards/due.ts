import type { APIRoute } from "astro";
import { z } from "zod";
import type { SupabaseClient } from "../../../db/supabase.client";

export const prerender = false;

const queryParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  collection_id: z.string().uuid("Invalid collection ID format").optional(),
  category_id: z.string().uuid("Invalid category ID format").optional()
});

export const GET: APIRoute = async ({ request, locals }) => {
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

    // Parse query parameters
    const url = new URL(request.url);
    const queryResult = queryParamsSchema.safeParse(Object.fromEntries(url.searchParams));
    
    if (!queryResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid query parameters", 
          details: queryResult.error.format() 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { limit, collection_id, category_id } = queryResult.data;
    const now = new Date().toISOString();

    // Build query
    let query = supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .lte("next_review_at", now)
      .limit(limit);

    if (collection_id) {
      query = query.eq("collection_id", collection_id);
    }

    if (category_id) {
      query = query.eq("category_id", category_id);
    }

    // Get flashcards due for review
    const { data: flashcards, error } = await query;

    if (error) {
      console.error(`[${requestId}] Database error:`, error);
      return new Response(
        JSON.stringify({ error: "Internal server error", requestId }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ data: flashcards }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ error: "Internal server error", requestId }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

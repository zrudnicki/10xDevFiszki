import type { APIRoute } from "astro";
import { z } from "zod";
import type { SupabaseClient } from "../../../../db/supabase.client";

export const prerender = false;

const reviewSchema = z.object({
  status: z.enum(["learned", "review"], "Status must be either 'learned' or 'review'")
});

export const POST: APIRoute = async ({ params, request, locals }) => {
  const requestId = crypto.randomUUID();
  const id = params.id;
  
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

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: "Request body must be valid JSON"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = reviewSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: result.error.format()
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Calculate next review date
    const now = new Date();
    const next_review_at = result.data.status === "learned" ? null : new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours later

    // Update flashcard review status
    const { data: flashcard, error: updateError } = await supabase
      .from("flashcards")
      .update({ 
        status: result.data.status,
        next_review_at: next_review_at?.toISOString()
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, status, next_review_at")
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Flashcard not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      console.error(`[${requestId}] Database error:`, updateError);
      return new Response(
        JSON.stringify({ error: "Internal server error", requestId }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(flashcard),
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

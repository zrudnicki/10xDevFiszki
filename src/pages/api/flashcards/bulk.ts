import type { APIRoute } from "astro";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const prerender = false;

const createBulkFlashcardsSchema = z.object({
  flashcards: z.array(z.object({
    front: z.string().max(200, "Front text must not exceed 200 characters"),
    back: z.string().max(500, "Back text must not exceed 500 characters"),
    collection_id: z.string().uuid("Invalid collection ID format").nullable().optional(),
    category_id: z.string().uuid("Invalid category ID format").nullable().optional()
  })).min(1, "At least one flashcard must be provided")
});

export const POST: APIRoute = async ({ request, locals }) => {
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

    const result = createBulkFlashcardsSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: result.error.format()
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check all collection_ids and category_ids
    const uniqueCollectionIds = new Set(
      result.data.flashcards
        .map(f => f.collection_id)
        .filter((id): id is string => id !== null)
    );
    const uniqueCategoryIds = new Set(
      result.data.flashcards
        .map(f => f.category_id)
        .filter((id): id is string => id !== null)
    );

    // Validate collections
    if (uniqueCollectionIds.size > 0) {
      const { data: collections, error: collectionError } = await supabase
        .from("collections")
        .select("id")
        .in("id", Array.from(uniqueCollectionIds))
        .eq("user_id", user.id);

      if (collectionError) {
        console.error(`[${requestId}] Database error:`, collectionError);
        return new Response(
          JSON.stringify({ error: "Internal server error", requestId }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const foundCollectionIds = new Set(collections?.map(c => c.id));
      const missingCollectionIds = Array.from(uniqueCollectionIds)
        .filter(id => !foundCollectionIds.has(id));

      if (missingCollectionIds.length > 0) {
        return new Response(
          JSON.stringify({
            error: "Resource not found",
            details: `Collections with IDs ${missingCollectionIds.join(", ")} not found`
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Validate categories
    if (uniqueCategoryIds.size > 0) {
      const { data: categories, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .in("id", Array.from(uniqueCategoryIds))
        .eq("user_id", user.id);

      if (categoryError) {
        console.error(`[${requestId}] Database error:`, categoryError);
        return new Response(
          JSON.stringify({ error: "Internal server error", requestId }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const foundCategoryIds = new Set(categories?.map(c => c.id));
      const missingCategoryIds = Array.from(uniqueCategoryIds)
        .filter(id => !foundCategoryIds.has(id));

      if (missingCategoryIds.length > 0) {
        return new Response(
          JSON.stringify({
            error: "Resource not found",
            details: `Categories with IDs ${missingCategoryIds.join(", ")} not found`
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Create flashcards
    const flashcardsWithUserId = result.data.flashcards.map(flashcard => ({
      ...flashcard,
      user_id: user.id
    }));

    const { data: flashcards, error: createError } = await supabase
      .from("flashcards")
      .insert(flashcardsWithUserId)
      .select();

    if (createError) {
      console.error(`[${requestId}] Database error:`, createError);
      return new Response(
        JSON.stringify({ error: "Internal server error", requestId }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ data: flashcards }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ error: "Internal server error", requestId }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

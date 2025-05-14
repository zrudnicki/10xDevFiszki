import type { APIRoute } from "astro";
import { z } from "zod";
import type { SupabaseClient } from "../../../db/supabase.client";

export const prerender = false;

const createFlashcardSchema = z.object({
  front: z.string().max(200, "Front text must not exceed 200 characters"),
  back: z.string().max(500, "Back text must not exceed 500 characters"),
  collection_id: z.string().uuid("Invalid collection ID format").nullable().optional(),
  category_id: z.string().uuid("Invalid category ID format").nullable().optional()
});

const queryParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(["created_at", "front", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
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

    const { limit, offset, sort, order, collection_id, category_id } = queryResult.data;

    // Build query
    let query = supabase
      .from("flashcards")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (collection_id) {
      query = query.eq("collection_id", collection_id);
    }

    if (category_id) {
      query = query.eq("category_id", category_id);
    }

    // Get flashcards
    const { data: flashcards, error, count } = await query;

    if (error) {
      console.error(`[${requestId}] Database error:`, error);
      return new Response(
        JSON.stringify({ error: "Internal server error", requestId }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        data: flashcards,
        meta: {
          total: count,
          limit,
          offset
        }
      }),
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

    const result = createFlashcardSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: result.error.format()
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // If collection_id is provided, check if it exists and belongs to user
    if (result.data.collection_id) {
      const { data: collection, error: collectionError } = await supabase
        .from("collections")
        .select("id")
        .eq("id", result.data.collection_id)
        .eq("user_id", user.id)
        .single();

      if (collectionError || !collection) {
        return new Response(
          JSON.stringify({
            error: "Resource not found",
            details: `Collection with ID ${result.data.collection_id} not found`
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // If category_id is provided, check if it exists and belongs to user
    if (result.data.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", result.data.category_id)
        .eq("user_id", user.id)
        .single();

      if (categoryError || !category) {
        return new Response(
          JSON.stringify({
            error: "Resource not found",
            details: `Category with ID ${result.data.category_id} not found`
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Create flashcard
    const { data: flashcard, error: createError } = await supabase
      .from("flashcards")
      .insert([{ ...result.data, user_id: user.id }])
      .select()
      .single();

    if (createError) {
      console.error(`[${requestId}] Database error:`, createError);
      return new Response(
        JSON.stringify({ error: "Internal server error", requestId }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(flashcard),
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

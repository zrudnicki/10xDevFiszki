import type { APIRoute } from "astro";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const prerender = false;

const updateFlashcardSchema = z.object({
  front: z.string().max(200, "Front text must not exceed 200 characters"),
  back: z.string().max(500, "Back text must not exceed 500 characters"),
  collection_id: z.string().uuid("Invalid collection ID format").nullable().optional(),
  category_id: z.string().uuid("Invalid category ID format").nullable().optional()
});

export const GET: APIRoute = async ({ params, locals }) => {
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

    // Get flashcard
    const { data: flashcard, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Flashcard not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      
      console.error(`[${requestId}] Database error:`, error);
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

export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    const result = updateFlashcardSchema.safeParse(body);
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

    // Update flashcard
    const { data: flashcard, error: updateError } = await supabase
      .from("flashcards")
      .update(result.data)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
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

export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // Delete flashcard
    const { error: deleteError } = await supabase
      .from("flashcards")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error(`[${requestId}] Database error:`, deleteError);
      return new Response(
        JSON.stringify({ error: "Internal server error", requestId }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
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

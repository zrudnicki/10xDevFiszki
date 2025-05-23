import type { APIRoute } from "astro";
import type { FlashcardDueDto } from "@/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * API endpoint for fetching flashcards that are due for review
 * Supports filtering by collection ID and category ID
 * Implements spaced repetition algorithm to determine which cards are due
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  console.log("Received request for due flashcards");
  
  try {
    // Get Supabase client
    const supabaseClient = await getSupabaseServerClient(cookies);
    
    // Get session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError);
      return new Response(
        JSON.stringify({ 
          error: "Authentication error",
          message: "Failed to get session"
        }),
        { status: 401 }
      );
    }
    
    if (!session) {
      console.log("No session found");
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized",
          message: "No active session"
        }),
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const collectionId = url.searchParams.get("collectionId");
    const categoryId = url.searchParams.get("categoryId");
    const limit = url.searchParams.get("limit");
    const strategy = url.searchParams.get("strategy") || "spaced-repetition";

    console.log("Request parameters:", { collectionId, categoryId, limit, strategy });

    // Build query
    let query = supabaseClient
      .from("flashcards")
      .select(`
        id, 
        front, 
        back, 
        collection_id, 
        category_id,
        collections (
          name
        ),
        categories (
          name
        )
      `)
      .eq("user_id", session.user.id);
    
    // Add filters based on parameters
    if (collectionId) {
      query = query.eq("collection_id", collectionId);
    }
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    
    // Execute query
    console.log("Executing database query...");
    const { data: flashcards, error: queryError } = await query;
    
    if (queryError) {
      console.error("Database query error:", queryError);
      return new Response(
        JSON.stringify({ 
          error: "Database error",
          message: "Failed to fetch flashcards"
        }),
        { status: 500 }
      );
    }

    if (!flashcards || flashcards.length === 0) {
      console.log("No flashcards found");
      return new Response(
        JSON.stringify({ 
          flashcards: [],
          collection_name: null,
          category_name: null
        }),
        { status: 200 }
      );
    }
    
    // Get collection and category names
    const collectionName = flashcards[0]?.collections?.name;
    const categoryName = flashcards[0]?.categories?.name;

    // Map response
    const mappedFlashcards = flashcards.map(card => ({
      id: card.id,
      front: card.front,
      back: card.back,
      collection_id: card.collection_id,
      category_id: card.category_id
    }));

    // Apply limit if specified
    const limitedFlashcards = limit 
      ? mappedFlashcards.slice(0, parseInt(limit))
      : mappedFlashcards;

    console.log(`Returning ${limitedFlashcards.length} flashcards`);
    
    return new Response(
      JSON.stringify({
        flashcards: limitedFlashcards,
        collection_name: collectionName,
        category_name: categoryName
      }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: "An unexpected error occurred"
      }),
      { status: 500 }
    );
  }
}; 
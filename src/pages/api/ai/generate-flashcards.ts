import type { APIRoute } from "astro";
import { z } from "zod";
import { generateFlashcards, createFlashcardsResponse } from "../../../lib/services/ai-flashcard-service";
import { updateFlashcardGenerationStats } from "../../../lib/services/stats-service";
import { validateUserAccess } from "../../../lib/services/auth-service";
import type { GenerateFlashcardsResponseDto } from "../../../types";
import type { SupabaseClient } from "../../../db/supabase.client";

export const prerender = false;

// Validation schema
const generateFlashcardsSchema = z.object({
  text: z.string()
    .min(1000, "Text must be at least 1000 characters long")
    .max(10000, "Text must not exceed 10000 characters"),
  collection_id: z.string().uuid("Invalid collection ID format").nullable().optional(),
  category_id: z.string().uuid("Invalid category ID format").nullable().optional(),
});

/**
 * Flashcard generation endpoint
 * 
 * Generates educational flashcards from text using AI
 * Updates the user's flashcard generation statistics
 * Requires authentication
 */
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

    // Parse input data
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error(`[${requestId}] Error parsing request body:`, error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body", 
          details: "Request body must be valid JSON" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Validate input data
    const result = generateFlashcardsSchema.safeParse(body);
    if (!result.success) {
      console.error(`[${requestId}] Validation error:`, result.error.format());
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body", 
          details: result.error.format() 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const { text, collection_id, category_id } = result.data;
    
    // Check access to collection and category
    if (collection_id) {
      const hasCollectionAccess = await validateUserAccess(
        supabase, user.id, "collections", collection_id
      );
      
      if (!hasCollectionAccess) {
        console.error(`[${requestId}] Collection access error: User ${user.id} has no access to collection ${collection_id}`);
        return new Response(
          JSON.stringify({ 
            error: "Resource not found", 
            details: `Collection with ID ${collection_id} not found` 
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    if (category_id) {
      const hasCategoryAccess = await validateUserAccess(
        supabase, user.id, "categories", category_id
      );
      
      if (!hasCategoryAccess) {
        console.error(`[${requestId}] Category access error: User ${user.id} has no access to category ${category_id}`);
        return new Response(
          JSON.stringify({ 
            error: "Resource not found", 
            details: `Category with ID ${category_id} not found` 
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    // Generate flashcards
    let flashcards;
    try {
      flashcards = await generateFlashcards(text, collection_id, category_id);
      
      // Validate the number of generated flashcards
      if (flashcards.length < 5) {
        throw new Error("Generated too few valid flashcards");
      }
    } catch (error) {
      console.error(`[${requestId}] Error generating flashcards:`, error);
      
      if (error instanceof Error) {
        if (error.message.includes("AI API error")) {
          return new Response(
            JSON.stringify({ 
              error: "Service unavailable", 
              details: "AI service is currently unavailable", 
              requestId 
            }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        } else if (error.message.includes("too few")) {
          return new Response(
            JSON.stringify({ 
              error: "Processing error", 
              details: "Could not generate enough valid flashcards from the provided text. Try with different content.",
              requestId 
            }),
            { status: 422, headers: { "Content-Type": "application/json" } }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Internal server error", 
          details: "Failed to generate flashcards",
          requestId 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Update statistics
    try {
      await updateFlashcardGenerationStats(supabase, user.id, flashcards.length);
    } catch (error) {
      // Don't fail the request if stats update fails, just log the error
      console.error(`[${requestId}] Error updating flashcard generation stats:`, error);
    }
    
    // Return generated flashcards with consistent naming
    const response = createFlashcardsResponse(flashcards);
    console.info(`[${requestId}] Successfully generated ${flashcards.length} flashcards for user ${user.id}`);
    
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        requestId 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}; 
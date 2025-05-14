import type { APIRoute } from "astro";
import { z } from "zod";
import { validateUserAccess } from "../../../../lib/services/auth-service";
import { updateFlashcardAcceptanceStats } from "../../../../lib/services/stats-service";
import type { AcceptFlashcardDto, AcceptFlashcardsDto, AcceptFlashcardsResponseDto } from "../../../../types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const prerender = false;

// Validation schema for each flashcard
const flashcardSchema = z.object({
  id: z.string().uuid("Invalid flashcard ID format"),
  front: z.string().max(200, "Front text must not exceed 200 characters"),
  back: z.string().max(500, "Back text must not exceed 500 characters"),
  collection_id: z.string().uuid("Invalid collection ID format").nullable().optional(),
  category_id: z.string().uuid("Invalid category ID format").nullable().optional(),
  was_edited: z.boolean()
});

// Validation schema for the request body
const acceptFlashcardsSchema = z.object({
  flashcards: z.array(flashcardSchema).min(1, "At least one flashcard must be provided")
});

/**
 * Flashcard acceptance endpoint
 *
 * Accepts and persists AI-generated flashcards
 * Updates the user's flashcard acceptance statistics
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
    const result = acceptFlashcardsSchema.safeParse(body);
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
    
    const { flashcards } = result.data as AcceptFlashcardsDto;
    console.info(`[${requestId}] Processing ${flashcards.length} flashcards for user ${user.id}`);
    
    // Validate access to collections and categories
    for (const flashcard of flashcards) {
      if (flashcard.collection_id) {
        const hasAccess = await validateUserAccess(
          supabase, user.id, "collections", flashcard.collection_id
        );
        
        if (!hasAccess) {
          console.error(`[${requestId}] Collection access error: User ${user.id} has no access to collection ${flashcard.collection_id}`);
          return new Response(
            JSON.stringify({ 
              error: "Resource not found", 
              details: `Collection with ID ${flashcard.collection_id} not found`,
              requestId
            }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
      }
      
      if (flashcard.category_id) {
        const hasAccess = await validateUserAccess(
          supabase, user.id, "categories", flashcard.category_id
        );
        
        if (!hasAccess) {
          console.error(`[${requestId}] Category access error: User ${user.id} has no access to category ${flashcard.category_id}`);
          return new Response(
            JSON.stringify({ 
              error: "Resource not found", 
              details: `Category with ID ${flashcard.category_id} not found`,
              requestId
            }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
    
    // Count direct accepts and edited accepts
    const directAccepted = flashcards.filter(f => !f.was_edited).length;
    const editedAccepted = flashcards.filter(f => f.was_edited).length;
    
    // Insert flashcards into the database
    const { data: savedFlashcards, error: insertError } = await supabase
      .from("flashcards")
      .insert(
        flashcards.map(f => ({
          user_id: user.id,
          front: f.front,
          back: f.back,
          collection_id: f.collection_id,
          category_id: f.category_id
        }))
      )
      .select();
    
    if (insertError) {
      console.error(`[${requestId}] Database error saving flashcards:`, insertError);
      return new Response(
        JSON.stringify({ 
          error: "Database error", 
          details: "Failed to save flashcards to database",
          requestId
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (!savedFlashcards || savedFlashcards.length === 0) {
      console.error(`[${requestId}] No flashcards saved to database`);
      return new Response(
        JSON.stringify({ 
          error: "Database error", 
          details: "No flashcards were saved to the database",
          requestId
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Update acceptance statistics
    try {
      await updateFlashcardAcceptanceStats(
        supabase, 
        user.id,
        directAccepted,
        editedAccepted
      );
    } catch (error) {
      // Just log the error but continue with the response
      console.error(`[${requestId}] Error updating flashcard acceptance stats:`, error);
    }
    
    // Prepare response with consistent field naming
    const response: AcceptFlashcardsResponseDto = {
      data: savedFlashcards,
      stats: {
        total_accepted: flashcards.length,
        total_accepted_direct: directAccepted,
        total_accepted_edited: editedAccepted
      }
    };
    
    console.info(`[${requestId}] Successfully saved ${savedFlashcards.length} flashcards for user ${user.id}`);
    
    return new Response(
      JSON.stringify(response),
      { status: 201, headers: { "Content-Type": "application/json" } }
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
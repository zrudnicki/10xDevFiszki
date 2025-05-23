import type { APIRoute } from "astro";
import { z } from "zod";
import { getFlashcardById, updateFlashcard, deleteFlashcard } from "../../../lib/services/flashcard-service";

export const prerender = false;

// Validation schema for flashcard updates
const updateFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, "Front content is required")
    .max(1000, "Front content must not exceed 1000 characters")
    .optional(),
  back: z
    .string()
    .min(1, "Back content is required")
    .max(5000, "Back content must not exceed 5000 characters")
    .optional(),
  collection_id: z.string().uuid("Invalid collection ID format").nullable().optional(),
  category_id: z.string().uuid("Invalid category ID format").nullable().optional(),
});

/**
 * GET /api/flashcards/:id
 *
 * Get a specific flashcard by ID
 */
export const GET: APIRoute = async ({ params, locals }) => {
  const requestId = crypto.randomUUID();
  const flashcardId = params.id;

  if (!flashcardId) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        details: "Flashcard ID is required",
        requestId,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      }
    );
  }

  console.log(`[${requestId}] GET /api/flashcards/${flashcardId} - Start`);

  try {
    // Get Supabase client
    const supabase = locals.supabase;

    // In development, auto-login as test user
    if (import.meta.env.DEV) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: "test@test.pl",
        password: "testtest",
      });

      if (signInError) {
        console.error(`[${requestId}] Dev auto-login failed:`, signInError);
      } else {
        console.log(`[${requestId}] Dev auto-login successful as test@test.pl`);
      }
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[${requestId}] Authentication error:`, authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      });
    }

    console.log(`[${requestId}] Authenticated user: ${user.id}`);

    // Get flashcard by ID
    try {
      const flashcard = await getFlashcardById(supabase, user.id, flashcardId);

      return new Response(JSON.stringify(flashcard), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      });
    } catch (error) {
      // Check if it's a "not found" error
      if (error instanceof Error && error.message.includes("not found")) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            details: `Flashcard with ID ${flashcardId} not found`,
            requestId,
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "X-Request-ID": requestId,
            },
          }
        );
      }

      // Rethrow other errors to be caught by the outer catch block
      throw error;
    }
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        requestId,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      }
    );
  }
};

/**
 * PUT /api/flashcards/:id
 *
 * Update an existing flashcard
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const requestId = crypto.randomUUID();
  const flashcardId = params.id;

  if (!flashcardId) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        details: "Flashcard ID is required",
        requestId,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      }
    );
  }

  console.log(`[${requestId}] PUT /api/flashcards/${flashcardId} - Start`);

  try {
    // Get Supabase client
    const supabase = locals.supabase;

    // In development, auto-login as test user
    if (import.meta.env.DEV) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: "test@test.pl",
        password: "testtest",
      });

      if (signInError) {
        console.error(`[${requestId}] Dev auto-login failed:`, signInError);
      } else {
        console.log(`[${requestId}] Dev auto-login successful as test@test.pl`);
      }
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[${requestId}] Authentication error:`, authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      });
    }

    console.log(`[${requestId}] Authenticated user: ${user.id}`);

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error(`[${requestId}] Error parsing request body:`, error);
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: "Request body must be valid JSON",
          requestId,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId,
          },
        }
      );
    }

    // Validate request body
    const result = updateFlashcardSchema.safeParse(body);
    if (!result.success) {
      console.error(`[${requestId}] Validation error:`, result.error.format());
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: result.error.format(),
          requestId,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId,
          },
        }
      );
    }

    // Require at least one field to update
    if (Object.keys(result.data).length === 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: "At least one field must be provided for update",
          requestId,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId,
          },
        }
      );
    }

    // Update flashcard
    try {
      const flashcard = await updateFlashcard(supabase, user.id, flashcardId, result.data);

      return new Response(JSON.stringify(flashcard), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      });
    } catch (error) {
      // Check if it's a "not found" error
      if (error instanceof Error && error.message.includes("not found")) {
        // Check if it's a flashcard not found or related entity not found
        if (error.message.includes("Flashcard not found")) {
          return new Response(
            JSON.stringify({
              error: "Not Found",
              details: error.message,
              requestId,
            }),
            {
              status: 404,
              headers: {
                "Content-Type": "application/json",
                "X-Request-ID": requestId,
              },
            }
          );
        } else {
          // Collection or category not found
          return new Response(
            JSON.stringify({
              error: "Bad Request",
              details: error.message,
              requestId,
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "X-Request-ID": requestId,
              },
            }
          );
        }
      }

      // Rethrow other errors to be caught by the outer catch block
      throw error;
    }
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        requestId,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      }
    );
  }
};

/**
 * DELETE /api/flashcards/:id
 *
 * Delete a flashcard
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const requestId = crypto.randomUUID();
  const flashcardId = params.id;

  if (!flashcardId) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        details: "Flashcard ID is required",
        requestId,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      }
    );
  }

  console.log(`[${requestId}] DELETE /api/flashcards/${flashcardId} - Start`);

  try {
    // Get Supabase client
    const supabase = locals.supabase;

    // In development, auto-login as test user
    if (import.meta.env.DEV) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: "test@test.pl",
        password: "testtest",
      });

      if (signInError) {
        console.error(`[${requestId}] Dev auto-login failed:`, signInError);
      } else {
        console.log(`[${requestId}] Dev auto-login successful as test@test.pl`);
      }
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[${requestId}] Authentication error:`, authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      });
    }

    console.log(`[${requestId}] Authenticated user: ${user.id}`);

    // Delete flashcard
    try {
      await deleteFlashcard(supabase, user.id, flashcardId);

      return new Response(
        JSON.stringify({
          success: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId,
          },
        }
      );
    } catch (error) {
      // Check if it's a "not found" error
      if (error instanceof Error && error.message.includes("not found")) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            details: `Flashcard with ID ${flashcardId} not found`,
            requestId,
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "X-Request-ID": requestId,
            },
          }
        );
      }

      // Rethrow other errors to be caught by the outer catch block
      throw error;
    }
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        requestId,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      }
    );
  }
};

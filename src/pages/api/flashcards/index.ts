import type { APIRoute } from "astro";
import { z } from "zod";
import { getFlashcards, createFlashcard, createFlashcards } from "../../../lib/services/flashcard-service";

export const prerender = false;

// Validation schema for flashcard creation
const createFlashcardSchema = z.object({
  front: z.string().min(1, "Front content is required").max(1000, "Front content must not exceed 1000 characters"),
  back: z.string().min(1, "Back content is required").max(5000, "Back content must not exceed 5000 characters"),
  collection_id: z.string().uuid("Invalid collection ID format").nullable().optional(),
  category_id: z.string().uuid("Invalid category ID format").nullable().optional(),
});

// Validation schema for bulk flashcard creation
const createFlashcardsSchema = z.object({
  flashcards: z
    .array(createFlashcardSchema)
    .min(1, "At least one flashcard is required")
    .max(100, "Cannot create more than 100 flashcards at once"),
});

/**
 * GET /api/flashcards
 *
 * List all flashcards belonging to the authenticated user
 * Supports filtering by collection or category, pagination, and sorting
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] GET /api/flashcards - Start`);

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

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const sort = url.searchParams.get("sort") || "created_at";
    const order = (url.searchParams.get("order") || "desc") as "asc" | "desc";
    const collectionId = url.searchParams.get("collection_id");
    const categoryId = url.searchParams.get("category_id");
    const search = url.searchParams.get("search");

    // Get flashcards with pagination, sorting, and filtering
    const { data: flashcards, total } = await getFlashcards(supabase, user.id, {
      limit,
      offset,
      sort,
      order,
      collectionId,
      categoryId,
      search,
    });

    // Return flashcards and metadata
    const response = {
      data: flashcards,
      meta: {
        total,
        limit,
        offset,
        filters: {
          collection_id: collectionId,
          category_id: categoryId,
          search: search,
        },
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
    });
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
 * POST /api/flashcards
 *
 * Create a new flashcard or multiple flashcards at once
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] POST /api/flashcards - Start`);

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

    // Determine if it's a single flashcard or bulk creation
    if (Array.isArray(body.flashcards)) {
      // Bulk creation
      console.log(`[${requestId}] Bulk flashcard creation request with ${body.flashcards.length} flashcards`);

      // Validate request body
      const result = createFlashcardsSchema.safeParse(body);
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

      // Create flashcards
      try {
        const flashcards = await createFlashcards(supabase, user.id, result.data.flashcards);

        return new Response(
          JSON.stringify({
            data: flashcards,
            meta: {
              total: flashcards.length,
            },
          }),
          {
            status: 201,
            headers: {
              "Content-Type": "application/json",
              "X-Request-ID": requestId,
            },
          }
        );
      } catch (error) {
        // Handle specific validation errors
        if (
          error instanceof Error &&
          (error.message.includes("not found") || error.message.includes("not accessible"))
        ) {
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

        // Rethrow other errors to be caught by the outer catch block
        throw error;
      }
    } else {
      // Single flashcard creation
      console.log(`[${requestId}] Single flashcard creation request`);

      // Validate request body
      const result = createFlashcardSchema.safeParse(body);
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

      // Create flashcard
      try {
        const flashcard = await createFlashcard(supabase, user.id, result.data);

        return new Response(JSON.stringify(flashcard), {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId,
          },
        });
      } catch (error) {
        // Handle specific validation errors
        if (error instanceof Error && error.message.includes("not found")) {
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

        // Rethrow other errors to be caught by the outer catch block
        throw error;
      }
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

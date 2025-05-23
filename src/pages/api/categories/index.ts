import type { APIRoute } from "astro";
import { z } from "zod";
import { getCategories, createCategory } from "../../../lib/services/category-service";

export const prerender = false;

// Validation schema for category creation
const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  description: z.string().max(500, "Description must not exceed 500 characters").nullable().optional(),
});

/**
 * GET /api/categories
 *
 * List all categories belonging to the authenticated user
 * Supports pagination and sorting
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] GET /api/categories - Start`);

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

    // Get categories with pagination and sorting
    const { data: categories, total } = await getCategories(supabase, user.id, limit, offset, sort, order);

    // Return categories and metadata
    const response = {
      data: categories,
      meta: {
        total,
        limit,
        offset,
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
 * POST /api/categories
 *
 * Create a new category
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] POST /api/categories - Start`);

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
    const result = createCategorySchema.safeParse(body);
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

    // Create category
    try {
      const category = await createCategory(supabase, user.id, result.data);

      return new Response(JSON.stringify(category), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      });
    } catch (error) {
      // Check if it's a category name conflict
      if (error instanceof Error && error.message.includes("already exists")) {
        return new Response(
          JSON.stringify({
            error: "Conflict",
            details: error.message,
            requestId,
          }),
          {
            status: 409,
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

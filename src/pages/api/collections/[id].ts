import type { APIRoute } from "astro";
import { z } from "zod";
import { getCollectionById, updateCollection, deleteCollection } from "../../../lib/services/collection-service";

export const prerender = false;

// Validation schema for collection updates
const updateCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters").optional(),
  description: z.string().max(500, "Description must not exceed 500 characters").nullable().optional(),
});

/**
 * GET /api/collections/:id
 *
 * Get a specific collection by ID
 */
export const GET: APIRoute = async ({ params, locals }) => {
  const requestId = crypto.randomUUID();
  const collectionId = params.id;

  if (!collectionId) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        details: "Collection ID is required",
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

  console.log(`[${requestId}] GET /api/collections/${collectionId} - Start`);

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

    // Get collection by ID
    try {
      const collection = await getCollectionById(supabase, user.id, collectionId);

      return new Response(JSON.stringify(collection), {
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
            details: `Collection with ID ${collectionId} not found`,
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
 * PUT /api/collections/:id
 *
 * Update an existing collection
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const requestId = crypto.randomUUID();
  const collectionId = params.id;

  if (!collectionId) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        details: "Collection ID is required",
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

  console.log(`[${requestId}] PUT /api/collections/${collectionId} - Start`);

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
    const result = updateCollectionSchema.safeParse(body);
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

    // Update collection
    try {
      const collection = await updateCollection(supabase, user.id, collectionId, result.data);

      return new Response(JSON.stringify(collection), {
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
            details: `Collection with ID ${collectionId} not found`,
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
 * DELETE /api/collections/:id
 *
 * Delete a collection
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const requestId = crypto.randomUUID();
  const collectionId = params.id;

  if (!collectionId) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        details: "Collection ID is required",
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

  console.log(`[${requestId}] DELETE /api/collections/${collectionId} - Start`);

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

    // Delete collection
    try {
      await deleteCollection(supabase, user.id, collectionId);

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
            details: `Collection with ID ${collectionId} not found`,
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

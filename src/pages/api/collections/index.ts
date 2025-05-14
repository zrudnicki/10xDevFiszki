import type { APIRoute } from "astro";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const prerender = false;

const createCollectionSchema = z.object({
  name: z.string().max(100, "Name must not exceed 100 characters"),
  description: z.string().max(500, "Description must not exceed 500 characters").optional(),
});

const queryParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(["created_at", "name", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const GET: APIRoute = async ({ request, locals }) => {
  const requestId = crypto.randomUUID();

  try {
    // Check if user is logged in
    const supabase = locals.supabase as SupabaseClient;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[${requestId}] Authentication error:`, authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryResult = queryParamsSchema.safeParse(Object.fromEntries(url.searchParams));

    if (!queryResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: queryResult.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { limit, offset, sort, order } = queryResult.data;

    // Get collections
    const {
      data: collections,
      error,
      count,
    } = await supabase
      .from("collections")
      .select("*", { count: "exact" })
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`[${requestId}] Database error:`, error);
      return new Response(JSON.stringify({ error: "Internal server error", requestId }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        data: collections,
        meta: {
          total: count,
          limit,
          offset,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return new Response(JSON.stringify({ error: "Internal server error", requestId }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const requestId = crypto.randomUUID();

  try {
    // Check if user is logged in
    const supabase = locals.supabase as SupabaseClient;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[${requestId}] Authentication error:`, authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: "Request body must be valid JSON",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = createCollectionSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: result.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create collection
    const { data: collection, error: createError } = await supabase
      .from("collections")
      .insert([{ ...result.data, user_id: user.id }])
      .select()
      .single();

    if (createError) {
      console.error(`[${requestId}] Database error:`, createError);
      return new Response(JSON.stringify({ error: "Internal server error", requestId }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(collection), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return new Response(JSON.stringify({ error: "Internal server error", requestId }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

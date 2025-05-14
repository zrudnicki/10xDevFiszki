import type { APIRoute } from "astro";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const prerender = false;

const updateCategorySchema = z.object({
  name: z.string().max(50, "Name must not exceed 50 characters"),
  description: z.string().max(200, "Description must not exceed 200 characters").optional()
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

    // Get category
    const { data: category, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Category not found" }),
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
      JSON.stringify(category),
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

    const result = updateCategorySchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: result.error.format()
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update category
    const { data: category, error: updateError } = await supabase
      .from("categories")
      .update(result.data)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Category not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      if (updateError.code === "23505") { // Unique constraint violation
        return new Response(
          JSON.stringify({ 
            error: "Conflict", 
            details: "Category with this name already exists" 
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      console.error(`[${requestId}] Database error:`, updateError);
      return new Response(
        JSON.stringify({ error: "Internal server error", requestId }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(category),
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

    // Delete category
    const { error: deleteError } = await supabase
      .from("categories")
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

import type { APIRoute } from 'astro';
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseServerClient(cookies);
  
  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Clear any local storage data
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}; 
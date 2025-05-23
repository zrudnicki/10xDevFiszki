import { defineMiddleware } from "astro:middleware";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Lista ścieżek, które nie wymagają autoryzacji
const PUBLIC_PATHS = ["/login", "/register", "/create-user"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url }, next) => {
  // Initialize Supabase client
  const supabase = await getSupabaseServerClient(cookies);
  
  // Add Supabase client to locals
  locals.supabase = supabase as SupabaseClient<Database>;

  // Sprawdź czy ścieżka jest publiczna
  const isPublicPath = PUBLIC_PATHS.some(path => url.pathname.startsWith(path));
  
  if (!isPublicPath) {
    // Sprawdź sesję
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Przekieruj do logowania jeśli nie ma sesji
      return Response.redirect(new URL("/login", url));
    }
    
    // Dodaj użytkownika do locals
    locals.user = session.user;
  }

  // Continue with the request
  return next();
});

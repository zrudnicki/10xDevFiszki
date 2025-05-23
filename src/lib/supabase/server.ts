import { createClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import type { Database } from "@/types/supabase";

const STORAGE_KEY = "sb-access-token";

/**
 * Creates a Supabase client with server-side auth context from cookies
 * for use in API routes and server-side rendering
 */
export async function getSupabaseServerClient(cookies: AstroCookies) {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: STORAGE_KEY,
      storage: {
        getItem: (key) => {
          const cookie = cookies.get(key);
          if (cookie) {
            console.log("Getting session from cookie:", key);
            return cookie.value;
          }
          return null;
        },
        setItem: (key, value) => {
          console.log("Setting session in cookie:", key);
          cookies.set(key, value, {
            path: "/",
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7 // 1 week
          });
        },
        removeItem: (key) => {
          console.log("Removing session from cookie:", key);
          cookies.delete(key, { path: "/" });
        }
      }
    }
  });
} 
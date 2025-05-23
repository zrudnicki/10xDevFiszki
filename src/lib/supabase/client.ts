import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase configuration. Please check your .env file.");
  throw new Error("Missing Supabase configuration");
}

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!supabaseClient) {
    console.log("Creating Supabase client with URL:", supabaseUrl);
    
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        storageKey: "sb-access-token",
        storage: {
          getItem: (key) => {
            const value = localStorage.getItem(key);
            console.log("Getting session from storage:", value ? "Found" : "Not found");
            return value;
          },
          setItem: (key, value) => {
            console.log("Setting session in storage");
            localStorage.setItem(key, value);
          },
          removeItem: (key) => {
            console.log("Removing session from storage");
            localStorage.removeItem(key);
          },
        },
      },
      global: {
        headers: {
          "x-application-name": "10xDevFiszki",
        },
      },
    });

    // Add error handling
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session ? "Session exists" : "No session");
      
      if (event === "SIGNED_OUT") {
        clearSupabaseSession();
      }
    });

    // Initialize session from storage
    const storedSession = localStorage.getItem("sb-access-token");
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession?.access_token) {
          supabaseClient.auth.setSession({
            access_token: parsedSession.access_token,
            refresh_token: parsedSession.refresh_token,
          });
        }
      } catch (e) {
        console.error("Failed to recover session:", e);
        clearSupabaseSession();
      }
    }
  }
  return supabaseClient;
}

export function clearSupabaseSession() {
  if (supabaseClient) {
    supabaseClient.auth.signOut();
    supabaseClient = null;
  }
  localStorage.removeItem("sb-access-token");
  sessionStorage.clear();
}

export async function isAuthenticated() {
  const supabase = getSupabase();
  if (!supabase) return false;
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
}

export async function getCurrentUser() {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
} 
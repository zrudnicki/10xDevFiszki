import type { APIRoute } from "astro";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// Schema walidacji
const FlashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  collection_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = await getSupabaseServerClient(cookies);
    
    // Sprawdź autoryzację
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Pobierz dane z requestu
    const body = await request.json();
    const flashcards = body.flashcards;

    // Walidacja danych
    if (!Array.isArray(flashcards)) {
      return new Response(JSON.stringify({ error: "Invalid flashcards data" }), {
        status: 400,
      });
    }

    // Walidacja każdej fiszki
    for (const flashcard of flashcards) {
      try {
        FlashcardSchema.parse(flashcard);
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Invalid flashcard data", details: error }),
          { status: 400 }
        );
      }
    }

    // Zapisz fiszki do bazy
    const { data, error } = await supabase
      .from("flashcards")
      .insert(
        flashcards.map((card) => ({
          ...card,
          user_id: session.user.id,
        }))
      )
      .select();

    if (error) {
      console.error("Error saving flashcards:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save flashcards" }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    console.error("Error in save flashcards endpoint:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}; 
/**
 * @fileoverview API endpoint do oznaczania fiszek jako zrewidowanych/nauczonych
 * Ten endpoint pozwala na aktualizację statusu fiszki i planowanie kolejnych powtórek
 * 
 * @example
 * // Przykładowe żądanie klienta:
 * const response = await fetch('/api/flashcards/review', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     flashcard_id: "550e8400-e29b-41d4-a716-446655440000",
 *     status: "learned" // or "review"
 *   })
 * });
 * 
 * const data = await response.json();
 * // data zawiera informacje o zaktualizowanej fiszce, w tym datę następnej powtórki
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { checkRateLimit } from "../../../lib/services/rate-limit-service";
import { validateUserAccess } from "../../../lib/services/auth-service";
import type { FlashcardReviewDto, FlashcardReviewResponseDto, FlashcardReviewStatus } from "../../../types";

export const prerender = false;

/**
 * Schemat walidacji Zod dla żądania przeglądu fiszki
 * 
 * @remarks
 * - flashcard_id: Wymagane, UUID fiszki do zaktualizowania
 * - status: Wymagane, musi być "learned" lub "review"
 */
const reviewFlashcardSchema = z.object({
  flashcard_id: z.string().uuid("Nieprawidłowy format ID fiszki"),
  status: z.enum(["learned", "review"] as const, {
    errorMap: () => ({ message: "Status musi być 'learned' lub 'review'" })
  }),
});

/**
 * Oblicza datę następnej powtórki na podstawie statusu
 * Używa prostego algorytmu spaced repetition
 * 
 * @param status - Status fiszki: "learned" lub "review"
 * @param currentReviewCount - Bieżąca liczba powtórek (domyślnie 0)
 * @returns Data następnej powtórki lub null jeśli nie jest potrzebna
 */
function calculateNextReviewDate(status: FlashcardReviewStatus, currentReviewCount: number = 0): string | null {
  const now = new Date();
  
  if (status === "learned") {
    // Fiszka oznaczona jako nauczona - nie planujemy kolejnej powtórki
    return null;
  } else {
    // Fiszka oznaczona do powtórki - planujemy kolejną powtórkę w oparciu o algorytm spaced repetition
    // Proste obliczenie: 1 dzień, 3 dni, 7 dni, 14 dni, 30 dni, 90 dni
    const reviewIntervals = [1, 3, 7, 14, 30, 90];
    const interval = reviewIntervals[Math.min(currentReviewCount, reviewIntervals.length - 1)];
    
    const nextReview = new Date(now);
    nextReview.setDate(now.getDate() + interval);
    
    return nextReview.toISOString();
  }
}

/**
 * Endpoint do oznaczania fiszek jako zrewidowanych/nauczonych - handler POST
 *
 * @description 
 * Aktualizuje status fiszki i oblicza datę następnej powtórki.
 * Endpoint wykonuje następujące kroki:
 * 1. Uwierzytelnia użytkownika
 * 2. Waliduje dane wejściowe
 * 3. Sprawdza, czy użytkownik ma dostęp do fiszki
 * 4. Aktualizuje status fiszki i oblicza datę następnej powtórki
 * 5. Zwraca zaktualizowane dane fiszki
 *
 * @returns {Promise<Response>} Odpowiedź JSON z danymi zaktualizowanej fiszki lub szczegółami błędu
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] POST /api/flashcards/review - Start`);

  const startTime = performance.now();

  try {
    // Pobierz klienta Supabase z locals (dostarczony przez middleware Astro)
    const supabase = locals.supabase;

    // UŁATWIENIE DLA ŚRODOWISKA DEWELOPERSKIEGO: Automatyczne logowanie jako użytkownik testowy
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

    // Pobierz bieżącego użytkownika
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

    // Sprawdź limit żądań, aby zapobiec nadużyciom
    const rateLimitResult = checkRateLimit(user.id);

    // Dodaj nagłówki limitu żądań do wszystkich odpowiedzi
    const responseHeaders = {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
      "X-RateLimit-Limit": rateLimitResult.limit.toString(),
      "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
    };

    if (rateLimitResult.isLimited) {
      console.warn(`[${requestId}] Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({
          error: "Too Many Requests",
          details: "Przekroczono limit żądań dla operacji na fiszkach",
          requestId,
        }),
        {
          status: 429,
          headers: responseHeaders,
        }
      );
    }

    // Parsuj dane wejściowe
    let body: FlashcardReviewDto & { flashcard_id: string };
    try {
      body = await request.json();
    } catch (error) {
      console.error(`[${requestId}] Error parsing request body:`, error);
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: "Treść żądania musi być poprawnym JSON",
          requestId,
        }),
        { status: 400, headers: responseHeaders }
      );
    }

    // Waliduj dane wejściowe
    const result = reviewFlashcardSchema.safeParse(body);
    if (!result.success) {
      console.error(`[${requestId}] Validation error:`, result.error.format());
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: result.error.format(),
          requestId,
        }),
        { status: 400, headers: responseHeaders }
      );
    }

    const { flashcard_id, status } = result.data;

    console.log(
      `[${requestId}] Validated input: flashcard_id=${flashcard_id}, status=${status}`
    );

    // Sprawdź, czy fiszka istnieje i czy użytkownik ma do niej dostęp
    const { data: flashcard, error: flashcardError } = await supabase
      .from("flashcards")
      .select("id, user_id, review_count")
      .eq("id", flashcard_id)
      .single();

    if (flashcardError) {
      console.error(`[${requestId}] Error fetching flashcard:`, flashcardError);
      return new Response(
        JSON.stringify({
          error: "Resource not found",
          details: `Fiszka o ID ${flashcard_id} nie została znaleziona`,
          requestId,
        }),
        { status: 404, headers: responseHeaders }
      );
    }

    // Sprawdź, czy użytkownik jest właścicielem fiszki
    if (flashcard.user_id !== user.id) {
      console.error(
        `[${requestId}] Access error: User ${user.id} tried to access flashcard ${flashcard_id} owned by ${flashcard.user_id}`
      );
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          details: "Nie masz dostępu do tej fiszki",
          requestId,
        }),
        { status: 403, headers: responseHeaders }
      );
    }

    // Oblicz datę następnej powtórki
    const currentReviewCount = flashcard.review_count || 0;
    const next_review_at = calculateNextReviewDate(status, currentReviewCount);

    // Aktualizuj fiszkę w bazie danych
    const { data: updatedFlashcard, error: updateError } = await supabase
      .from("flashcards")
      .update({
        status: status,
        review_count: currentReviewCount + 1,
        next_review_at: next_review_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", flashcard_id)
      .select()
      .single();

    if (updateError) {
      console.error(`[${requestId}] Error updating flashcard:`, updateError);
      return new Response(
        JSON.stringify({
          error: "Database Error",
          details: "Nie udało się zaktualizować fiszki",
          requestId,
        }),
        { status: 500, headers: responseHeaders }
      );
    }

    console.log(`[${requestId}] Successfully updated flashcard ${flashcard_id} with status=${status}`);

    // Przygotuj odpowiedź
    const response: FlashcardReviewResponseDto = {
      id: updatedFlashcard.id,
      status: updatedFlashcard.status,
      next_review_at: updatedFlashcard.next_review_at,
    };

    const endTime = performance.now();
    const processingTime = Math.round(endTime - startTime);

    console.info(
      `[${requestId}] Successfully reviewed flashcard for user ${user.id} in ${processingTime}ms`
    );

    // Zwróć odpowiedź
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...responseHeaders,
        "X-Processing-Time": processingTime.toString(),
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

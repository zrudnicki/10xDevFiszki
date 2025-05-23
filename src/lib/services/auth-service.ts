/**
 * @fileoverview Usługi autoryzacji i weryfikacji dostępu dla aplikacji Fiszki
 * 
 * Ten moduł zawiera funkcje do weryfikacji, czy użytkownik ma dostęp do zasobu (kolekcji, kategorii)
 * oraz inne funkcje związane z autoryzacją, zapobiegając nieautoryzowanemu dostępowi do danych innych użytkowników.
 * 
 * @example
 * // Przykładowe użycie w API endpoincie
 * const hasAccess = await validateUserAccess(supabase, user.id, 'collections', collectionId);
 * if (!hasAccess) {
 *   return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
 * }
 */

import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Weryfikuje czy użytkownik ma dostęp do określonego zasobu w bazie danych
 * Funkcja sprawdza czy zasób istnieje i należy do danego użytkownika
 *
 * @param {SupabaseClient} supabase - Instancja klienta Supabase z kontekstu Astro
 * @param {string} userId - Identyfikator użytkownika wykonującego żądanie
 * @param {string} tableName - Nazwa tabeli do sprawdzenia (np. 'collections', 'categories')
 * @param {string} resourceId - Identyfikator UUID zasobu do sprawdzenia dostępu
 * @returns {Promise<boolean>} - Zwraca true jeśli użytkownik ma dostęp do zasobu, false w przeciwnym razie
 *
 * @example
 * // Weryfikacja dostępu do kolekcji w endpoincie API
 * if (collection_id) {
 *   const hasAccess = await validateUserAccess(supabase, user.id, 'collections', collection_id);
 *   if (!hasAccess) {
 *     return new Response(
 *       JSON.stringify({
 *         error: "Resource not found",
 *         details: `Collection with ID ${collection_id} not found`
 *       }),
 *       { status: 404 }
 *     );
 *   }
 * }
 * 
 * @example
 * // Weryfikacja dostępu przed edycją lub usunięciem zasobu
 * const canEdit = await validateUserAccess(supabase, user.id, 'flashcards', flashcardId);
 * if (!canEdit) {
 *   throw new Error('Unauthorized access to flashcard');
 * }
 */
export async function validateUserAccess(
  supabase: SupabaseClient,
  userId: string,
  tableName: string,
  resourceId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select("id")
      .eq("id", resourceId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error validating user access to ${tableName}:`, error);
    return false;
  }
}

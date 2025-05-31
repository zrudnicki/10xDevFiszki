import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Validates if a user has access to a specific resource
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param tableName - Name of the table to check (collections, categories)
 * @param resourceId - ID of the resource to check access for
 * @returns Promise<boolean> - True if user has access to the resource
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

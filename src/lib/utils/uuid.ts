/**
 * Generates a UUID v4
 * Used for temporary IDs for generated flashcards before they are saved to the database
 *
 * @returns string - A UUID v4 string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

import { z } from "zod";

/**
 * Validation schema for AI Generation API request
 * Enforces text length (1000-10000 chars) and max_cards limit (1-15)
 */
export const AIGenerationSchema = z.object({
  text: z
    .string()
    .min(1000, "Text must be at least 1000 characters long")
    .max(10000, "Text cannot exceed 10000 characters"),
  collection_id: z.string().uuid("Collection ID must be a valid UUID").optional(),
  max_cards: z
    .number()
    .int("Max cards must be an integer")
    .min(1, "Must generate at least 1 card")
    .max(15, "Cannot generate more than 15 cards")
    .default(10),
});

/**
 * Type inference from Zod schema
 */
export type ValidatedAIGenerationRequest = z.infer<typeof AIGenerationSchema>;

/**
 * Validation error formatting helper
 */
export function formatValidationError(error: z.ZodError) {
  const details: Record<string, string> = {};

  error.errors.forEach((err) => {
    const field = err.path.join(".");
    details[field] = err.message;
  });

  return {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details,
  };
}

// AI Generation Request Validation
export const AIGenerationRequestSchema = z.object({
  text: z
    .string()
    .min(1000, "Text must be at least 1000 characters")
    .max(10000, "Text must not exceed 10000 characters"),
  collection_id: z.string().uuid().optional(),
  max_cards: z.number().int().min(1).max(15).default(10),
});

export type AIGenerationRequestInput = z.infer<typeof AIGenerationRequestSchema>;

// AI Review Request Validation
export const FlashcardReviewRequestSchema = z.object({
  collection_id: z.string().uuid("Collection ID must be a valid UUID"),
  category_id: z.string().uuid("Category ID must be a valid UUID").optional(),
  flashcards: z
    .array(
      z.object({
        front: z.string().min(1, "Front side cannot be empty").max(200, "Front side must not exceed 200 characters"),
        back: z.string().min(1, "Back side cannot be empty").max(500, "Back side must not exceed 500 characters"),
        action: z.enum(["accept_direct", "accept_edited", "reject"], {
          errorMap: () => ({ message: "Action must be accept_direct, accept_edited, or reject" }),
        }),
      })
    )
    .min(1, "At least one flashcard is required")
    .max(15, "Maximum 15 flashcards per batch"), // MVP limit
});

export type FlashcardReviewRequestInput = z.infer<typeof FlashcardReviewRequestSchema>;

// Categories API Validation Schemas
export const CategoryListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(['created_at', 'updated_at', 'name']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(250, "Category name must not exceed 250 characters").trim(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(250, "Category name must not exceed 250 characters").trim(),
});

export const CategoryIdParamSchema = z.object({
  id: z.string().uuid("Category ID must be a valid UUID"),
});

/**
 * Data Transfer Objects (DTOs) and Command Models for the Fiszki application
 * These types represent the structures used in API requests and responses
 */

import type { Database } from "./db/database.types";

/**
 * Base entity types extracted from the database schema
 */
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Collection = Database["public"]["Tables"]["collections"]["Row"];
export type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
export type FlashcardGenerationStats = Database["public"]["Tables"]["flashcard_generation_stats"]["Row"];

/**
 * Generic response wrapper for paginated results
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Simple success response for operations like deletion
 */
export interface SuccessResponse {
  success: boolean;
}

/**
 * Collection DTOs
 */
export interface CollectionDto extends Omit<Collection, "user_id"> {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateCollectionDto {
  name: string;
  description?: string | null;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string | null;
}

/**
 * Category DTOs
 */
export interface CategoryDto extends Omit<Category, "user_id"> {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateCategoryDto {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string | null;
}

/**
 * Flashcard DTOs
 */
export interface FlashcardDto extends Omit<Flashcard, "user_id"> {
  id: string;
  front: string;
  back: string;
  collection_id: string | null;
  category_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateFlashcardDto {
  front: string;
  back: string;
  collection_id?: string | null;
  category_id?: string | null;
}

export interface UpdateFlashcardDto {
  front?: string;
  back?: string;
  collection_id?: string | null;
  category_id?: string | null;
}

export interface BulkCreateFlashcardsDto {
  flashcards: CreateFlashcardDto[];
}

/**
 * Flashcard review DTOs
 */
export type FlashcardReviewStatus = "learned" | "review";

export interface FlashcardReviewDto {
  status: FlashcardReviewStatus;
}

export interface FlashcardReviewResponseDto {
  id: string;
  status: FlashcardReviewStatus;
  next_review_at: string | null;
}

export interface FlashcardDueDto extends FlashcardDto {
  next_review_at: string;
}

/**
 * AI Flashcard Generation DTOs
 */
export interface GenerateFlashcardsDto {
  text: string;
  collection_id?: string | null;
  category_id?: string | null;
}

export interface GeneratedFlashcardDto {
  id?: string;
  front: string;
  back: string;
  collection_id: string | null;
  category_id: string | null;
}

export interface GenerateFlashcardsResponseDto {
  flashcards: GeneratedFlashcardDto[];
}

export interface AcceptFlashcardDto extends GeneratedFlashcardDto {
  was_edited: boolean;
}

export interface AcceptFlashcardsDto {
  flashcards: AcceptFlashcardDto[];
}

export interface AcceptFlashcardsResponseDto {
  data: FlashcardDto[];
  stats: {
    total_accepted: number;
    direct_accepted: number;
    edited_accepted: number;
  };
}

/**
 * Flashcard Generation Stats DTOs
 */
export interface FlashcardGenerationStatsDto extends Omit<FlashcardGenerationStats, "user_id" | "id"> {
  total_generated: number;
  total_accepted_direct: number;
  total_accepted_edited: number;
  acceptance_rate: number;
  last_generation_at: string | null;
}

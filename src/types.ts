// AI Generation API Types
export interface AIGenerationRequest {
  text: string; // required, 1000-10000 chars
  collection_id?: string; // optional, UUID, for context
  max_cards?: number; // optional, default: 10, max: 15
}

export interface FlashcardCandidate {
  front: string;
  back: string;
  confidence: number; // 0-1, AI confidence score
}

export interface AIGenerationResponse {
  data: {
    candidates: FlashcardCandidate[];
    generated_count: number;
    processing_time_ms: number;
  };
}

export interface RateLimitResponse {
  error: {
    code: "RATE_LIMIT_EXCEEDED";
    message: "Too many generation requests. Please wait before trying again.";
    details: {
      limit: 10;
      window: "1 minute";
      retry_after: number; // seconds until next allowed request
    };
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// AI Review API Types
export interface FlashcardReviewRequest {
  collection_id: string; // required, UUID
  category_id?: string; // optional, UUID
  flashcards: FlashcardReviewItem[];
}

export interface FlashcardReviewItem {
  front: string; // required, max 200 chars
  back: string; // required, max 500 chars
  action: 'accept_direct' | 'accept_edited' | 'reject';
}

export interface FlashcardReviewResponse {
  data: {
    created_count: number;
    accepted_direct: number;
    accepted_edited: number;
    rejected: number;
    flashcards: CreatedFlashcard[];
  };
}

export interface CreatedFlashcard {
  id: string;
  front: string;
  back: string;
  collection_id: string;
  category_id: string | null;
  created_by: 'ai_generated';
  
  // SM-2 Algorithm Parameters (defaults)
  easiness_factor: number; // 2.5
  interval_days: number; // 1
  reviews_count: number; // 0
  next_review_at: string; // tomorrow
}

// Categories API Types
export interface Category {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CategoryWithCount extends Category {
  flashcard_count: number;
}

export interface CategoryListQuery {
  limit?: number; // default: 20, max: 100
  offset?: number; // default: 0
  sort?: 'created_at' | 'updated_at' | 'name'; // default: 'created_at'
  order?: 'asc' | 'desc'; // default: 'desc'
}

export interface CreateCategoryRequest {
  name: string; // required, max 250 chars
}

export interface UpdateCategoryRequest {
  name: string; // required, max 250 chars
}

export interface CategoryResponse {
  id: string;
  name: string;
  flashcard_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface CategoryListResponse {
  data: CategoryResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface SingleCategoryResponse {
  data: CategoryResponse;
}

// Collections API Types
export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CollectionWithCount extends Collection {
  flashcard_count: number;
}

export interface CollectionListQuery {
  limit?: number; // default: 20, max: 100
  offset?: number; // default: 0
  sort?: 'created_at' | 'updated_at' | 'name'; // default: 'created_at'
  order?: 'asc' | 'desc'; // default: 'desc'
}

export interface CreateCollectionRequest {
  name: string; // required, max 250 chars
  description?: string; // optional
}

export interface UpdateCollectionRequest {
  name?: string; // optional, max 250 chars  
  description?: string; // optional
}

export interface CollectionResponse {
  id: string;
  name: string;
  description: string | null;
  flashcard_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface CollectionListResponse {
  data: CollectionResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface SingleCollectionResponse {
  data: CollectionResponse;
}

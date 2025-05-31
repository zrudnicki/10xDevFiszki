# Plan Wdrożenia AI Review API

## 1. Przegląd punktu końcowego

### Cel
Implementacja systemu przeglądania i zatwierdzania AI-generowanych fiszek z batch processing, transaction management i tracking statystyk dla MVP metrics.

### Endpoint
- `POST /api/flashcards/review` - Przeglądanie i zatwierdzanie AI-generated candidates

### Kluczowe funkcjonalności
- **Batch flashcard creation** z transaction safety
- **AI-generated workflow integration** (workflow step po generate-flashcards)
- **Action-based processing** (accept_direct, accept_edited, reject)
- **MVP statistics tracking** (75% acceptance rate requirement)
- **SM-2 parameter initialization** dla approved flashcards
- **Collection/category validation** z ownership verification

### Workflow Integration
- **Previous Step**: `POST /api/generate-flashcards` (generates candidates)
- **Current Step**: `POST /api/flashcards/review` (approve/edit candidates)
- **Next Step**: Study sessions z approved flashcards

## 2. Szczegóły żądania

### POST /api/flashcards/review
```typescript
interface FlashcardReviewRequest {
  collection_id: string; // required, UUID
  category_id?: string; // optional, UUID
  flashcards: FlashcardReviewItem[];
}

interface FlashcardReviewItem {
  front: string; // required, max 200 chars
  back: string; // required, max 500 chars
  action: 'accept_direct' | 'accept_edited' | 'reject';
}
```

### Walidacja Zod Schema
```typescript
const FlashcardReviewSchema = z.object({
  collection_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  flashcards: z.array(z.object({
    front: z.string().min(1).max(200),
    back: z.string().min(1).max(500),
    action: z.enum(['accept_direct', 'accept_edited', 'reject'])
  })).min(1).max(15) // MVP: max 15 cards per batch
});
```

### Business Rules
- **Tylko approved actions** tworzą flashcards ('accept_direct', 'accept_edited')
- **Rejected cards** nie są tworzone ale są liczone w statistics
- **All approved flashcards** mają `created_by = 'ai_generated'`
- **SM-2 default parameters** dla nowych flashcards
- **Batch transaction** - all or nothing dla data consistency

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
interface FlashcardReviewResponse {
  data: {
    created_count: number;
    accepted_direct: number;
    accepted_edited: number;
    rejected: number;
    flashcards: CreatedFlashcard[];
  };
}

interface CreatedFlashcard {
  id: string;
  front: string;
  back: string;
  collection_id: string;
  category_id: string | null;
  created_by: 'ai_generated';
  
  // SM-2 Algorithm Parameters (defaults)
  easiness_factor: number; // 2.5
  interval: number; // 1
  repetitions: number; // 0
  next_review_date: string; // tomorrow
}
```

### MVP Statistics Integration
```typescript
interface StatisticsUpdate {
  total_accepted_direct: number; // increment by accepted_direct count
  total_accepted_edited: number; // increment by accepted_edited count
  // total_generated already updated by generate-flashcards endpoint
  acceptance_rate: number; // calculated: (accepted_direct + accepted_edited) / total_generated * 100
}
```

### Kody stanu HTTP
- **201 Created**: Successful flashcards creation
- **400 Bad Request**: Invalid request format, empty batch
- **401 Unauthorized**: No authentication
- **404 Not Found**: Collection/category not found
- **422 Unprocessable Entity**: Validation errors, invalid actions
- **500 Internal Server Error**: Transaction failures, statistics update errors

## 4. Przepływ danych

### POST /api/flashcards/review Flow
1. **Authentication Check**: Verify user via `auth.uid()`
2. **Input Validation**: Validate request body schema
3. **Collection Validation**: Verify collection exists and belongs to user
4. **Category Validation**: If provided, verify category exists and belongs to user
5. **Batch Processing Preparation**: Separate approved vs rejected items
6. **Database Transaction Start**: Begin atomic transaction
7. **Flashcard Creation Loop**:
   ```sql
   -- For each 'accept_direct' or 'accept_edited' action:
   INSERT INTO flashcards (
     user_id, collection_id, category_id, front, back,
     easiness_factor, interval, repetitions, next_review_date, created_by
   ) VALUES (
     auth.uid(), $1, $2, $3, $4,
     2.5, 1, 0, (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ, 'ai_generated'
   ) RETURNING *;
   ```
8. **Statistics Update**:
   ```sql
   UPDATE flashcard_generation_stats 
   SET total_accepted_direct = total_accepted_direct + $1,
       total_accepted_edited = total_accepted_edited + $2,
       updated_at = NOW()
   WHERE user_id = auth.uid();
   ```
9. **Transaction Commit**: Commit all changes atomically
10. **Response Formation**: Return summary with created flashcards

### Action Processing Logic
```typescript
interface ActionCounts {
  accepted_direct: number;
  accepted_edited: number;
  rejected: number;
  to_create: FlashcardReviewItem[]; // only approved items
}

function processReviewActions(items: FlashcardReviewItem[]): ActionCounts {
  const counts: ActionCounts = {
    accepted_direct: 0,
    accepted_edited: 0,
    rejected: 0,
    to_create: []
  };

  for (const item of items) {
    switch (item.action) {
      case 'accept_direct':
        counts.accepted_direct++;
        counts.to_create.push(item);
        break;
      case 'accept_edited':
        counts.accepted_edited++;
        counts.to_create.push(item);
        break;
      case 'reject':
        counts.rejected++;
        break;
    }
  }

  return counts;
}
```

### Transaction Management Strategy
```typescript
async function processFlashcardReview(
  userId: string, 
  request: FlashcardReviewRequest
): Promise<FlashcardReviewResponse> {
  
  const { data, error } = await supabase.rpc('process_flashcard_review', {
    p_user_id: userId,
    p_collection_id: request.collection_id,
    p_category_id: request.category_id,
    p_flashcards: request.flashcards
  });

  if (error) {
    throw new FlashcardReviewTransactionError(error.message);
  }

  return data;
}
```

## 5. Względy bezpieczeństwa

### Input Validation & Sanitization
- **Content validation**: front ≤ 200 chars, back ≤ 500 chars
- **Action validation**: Tylko allowed enum values
- **Batch size limits**: Max 15 items per request (prevent abuse)
- **UUID validation** dla collection_id, category_id
- **Content sanitization**: Remove dangerous characters

### Collection/Category Access Control
- **Collection ownership**: Verify user owns target collection
- **Category ownership**: If provided, verify user owns category  
- **Cross-user prevention**: Block access to other users' resources
- **Existence validation**: Ensure resources exist before processing

### Transaction Security
- **Atomic operations**: All flashcards created or none
- **Rollback safety**: Automatic rollback on any failure
- **Statistics consistency**: Update stats only on successful creation
- **Isolation levels**: Prevent concurrent modification conflicts

### Rate Limiting & Abuse Prevention
- **Batch size limits**: Max 15 flashcards per request
- **Request frequency**: Consider rate limiting dla review operations
- **Resource consumption**: Monitor transaction duration
- **Memory usage**: Limit batch processing memory footprint

## 6. Obsługa błędów

### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Specific Error Scenarios
```typescript
// 422 Validation Error - Invalid action
{
  error: {
    code: "INVALID_REVIEW_ACTION",
    message: "Invalid action type. Must be 'accept_direct', 'accept_edited', or 'reject'",
    details: { 
      field: "flashcards[2].action", 
      value: "invalid_action" 
    }
  }
}

// 422 Validation Error - Content too long
{
  error: {
    code: "CONTENT_VALIDATION_ERROR",
    message: "Flashcard content validation failed",
    details: {
      "flashcards[0].front": "Front text must be between 1 and 200 characters",
      "flashcards[1].back": "Back text must be between 1 and 500 characters"
    }
  }
}

// 404 Not Found - Collection doesn't exist
{
  error: {
    code: "COLLECTION_NOT_FOUND",
    message: "Collection not found or access denied",
    details: { field: "collection_id" }
  }
}

// 400 Bad Request - Empty batch
{
  error: {
    code: "EMPTY_REVIEW_BATCH",
    message: "At least one flashcard must be provided for review"
  }
}

// 500 Internal Server Error - Transaction failure
{
  error: {
    code: "REVIEW_TRANSACTION_FAILED",
    message: "Failed to process flashcard review. Please try again.",
    details: { 
      transaction_id: "uuid-for-tracking",
      partial_success: false 
    }
  }
}

// 500 Internal Server Error - Statistics update failure
{
  error: {
    code: "STATISTICS_UPDATE_FAILED",
    message: "Flashcards created but statistics update failed. Contact support if needed.",
    details: { 
      created_count: 3,
      stats_error: "Connection timeout" 
    }
  }
}
```

### Error Handling Strategy
- **Early validation**: Validate all inputs before transaction
- **Atomic transactions**: Ensure data consistency
- **Detailed error messages**: Specific field-level validation errors
- **Graceful degradation**: Handle partial failures appropriately
- **Comprehensive logging**: Log all errors dla debugging
- **User-friendly responses**: Clear, actionable error messages

### Partial Failure Scenarios
```typescript
// Handle partial failures in batch processing
interface BatchProcessingResult {
  successful_items: number;
  failed_items: number;
  errors: Array<{
    index: number;
    error: string;
    item: FlashcardReviewItem;
  }>;
}
```

## 7. Wydajność

### Database Optimizations
```sql
-- Essential indexes for batch operations
CREATE INDEX idx_flashcards_user_collection ON flashcards(user_id, collection_id);
CREATE INDEX idx_flashcards_created_by ON flashcards(created_by) WHERE created_by = 'ai_generated';

-- Statistics table optimization
CREATE INDEX idx_generation_stats_user_id ON flashcard_generation_stats(user_id);

-- Transaction log indexes for performance monitoring
CREATE INDEX idx_flashcard_creation_timestamp ON flashcards(created_at) WHERE created_by = 'ai_generated';
```

### Batch Processing Optimizations
- **Bulk insert operations**: Use batch INSERT dla multiple flashcards
- **Transaction batching**: Single transaction dla all operations
- **Prepared statements**: Reuse query plans dla batch inserts
- **Memory management**: Stream processing dla large batches

### Performance Monitoring
```typescript
interface ReviewPerformanceMetrics {
  batch_size: number;
  processing_time_ms: number;
  transaction_duration_ms: number;
  created_flashcards_count: number;
  statistics_update_time_ms: number;
  database_roundtrips: number;
}
```

### Caching Strategy
- **Collection validation cache**: Cache collection ownership checks
- **Category validation cache**: Cache category existence/ownership
- **Statistics cache**: Consider caching current stats dla display
- **SM-2 defaults cache**: Cache default parameters dla performance

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/flashcards/
├── review.ts (POST)
src/lib/services/
├── AIReviewService.ts
├── FlashcardBatchService.ts
├── StatisticsUpdateService.ts
src/lib/schemas/
├── ai-review.ts
src/types/
├── ai-review.ts
src/lib/errors/
├── AIReviewErrors.ts
├── FlashcardReviewTransactionError.ts
├── InvalidReviewActionError.ts
├── EmptyReviewBatchError.ts
├── ContentValidationError.ts
├── CollectionNotFoundError.ts
├── CategoryNotFoundError.ts
├── StatisticsUpdateError.ts
src/lib/utils/
├── batch-processing.ts
├── review-action-processor.ts
├── flashcard-validation.ts
```

### Krok 2: Database Function dla Batch Processing
```sql
-- PostgreSQL function dla atomic batch processing
CREATE OR REPLACE FUNCTION process_flashcard_review(
  p_user_id UUID,
  p_collection_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_flashcards JSONB
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  flashcard_item JSONB;
  created_flashcard RECORD;
  created_flashcards JSONB[] := '{}';
  accepted_direct_count INTEGER := 0;
  accepted_edited_count INTEGER := 0;
  rejected_count INTEGER := 0;
  result JSONB;
BEGIN
  -- Validate collection ownership
  IF NOT EXISTS (
    SELECT 1 FROM collections 
    WHERE id = p_collection_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Collection not found or access denied';
  END IF;

  -- Validate category ownership if provided
  IF p_category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE id = p_category_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Category not found or access denied';
  END IF;

  -- Process each flashcard
  FOR flashcard_item IN SELECT * FROM jsonb_array_elements(p_flashcards)
  LOOP
    CASE flashcard_item->>'action'
      WHEN 'accept_direct' THEN
        accepted_direct_count := accepted_direct_count + 1;
        
        INSERT INTO flashcards (
          user_id, collection_id, category_id, front, back,
          easiness_factor, interval, repetitions, next_review_date, created_by
        ) VALUES (
          p_user_id, p_collection_id, p_category_id,
          flashcard_item->>'front', flashcard_item->>'back',
          2.5, 1, 0, (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ, 'ai_generated'
        ) RETURNING * INTO created_flashcard;
        
        created_flashcards := created_flashcards || to_jsonb(created_flashcard);

      WHEN 'accept_edited' THEN
        accepted_edited_count := accepted_edited_count + 1;
        
        INSERT INTO flashcards (
          user_id, collection_id, category_id, front, back,
          easiness_factor, interval, repetitions, next_review_date, created_by
        ) VALUES (
          p_user_id, p_collection_id, p_category_id,
          flashcard_item->>'front', flashcard_item->>'back',
          2.5, 1, 0, (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ, 'ai_generated'
        ) RETURNING * INTO created_flashcard;
        
        created_flashcards := created_flashcards || to_jsonb(created_flashcard);

      WHEN 'reject' THEN
        rejected_count := rejected_count + 1;
        -- No flashcard created for rejected items
        
      ELSE
        RAISE EXCEPTION 'Invalid action: %', flashcard_item->>'action';
    END CASE;
  END LOOP;

  -- Update generation statistics
  INSERT INTO flashcard_generation_stats (
    user_id, total_accepted_direct, total_accepted_edited
  ) VALUES (
    p_user_id, accepted_direct_count, accepted_edited_count
  ) ON CONFLICT (user_id) DO UPDATE SET
    total_accepted_direct = flashcard_generation_stats.total_accepted_direct + accepted_direct_count,
    total_accepted_edited = flashcard_generation_stats.total_accepted_edited + accepted_edited_count,
    updated_at = NOW();

  -- Build result
  result := jsonb_build_object(
    'created_count', accepted_direct_count + accepted_edited_count,
    'accepted_direct', accepted_direct_count,
    'accepted_edited', accepted_edited_count,
    'rejected', rejected_count,
    'flashcards', array_to_json(created_flashcards)
  );

  RETURN result;
END;
$$;
```

### Krok 3: Service Layer Implementation
```typescript
// src/lib/services/AIReviewService.ts
export class AIReviewService {
  constructor(
    private supabase: SupabaseClient,
    private batchService: FlashcardBatchService,
    private statisticsService: StatisticsUpdateService
  ) {}

  async processFlashcardReview(
    userId: string, 
    request: FlashcardReviewRequest
  ): Promise<FlashcardReviewResponse> {
    
    try {
      // Validate collection and category access
      await this.validateResourceAccess(userId, request);

      // Process batch using database function
      const { data, error } = await this.supabase.rpc('process_flashcard_review', {
        p_user_id: userId,
        p_collection_id: request.collection_id,
        p_category_id: request.category_id,
        p_flashcards: JSON.stringify(request.flashcards)
      });

      if (error) {
        throw new FlashcardReviewTransactionError(error.message);
      }

      return { data };

    } catch (error) {
      console.error('Flashcard review processing failed:', error);
      throw error;
    }
  }

  private async validateResourceAccess(
    userId: string, 
    request: FlashcardReviewRequest
  ): Promise<void> {
    
    // Validate collection ownership
    const { data: collection, error: collectionError } = await this.supabase
      .from('collections')
      .select('id')
      .eq('id', request.collection_id)
      .eq('user_id', userId)
      .single();

    if (collectionError || !collection) {
      throw new CollectionNotFoundError();
    }

    // Validate category ownership if provided
    if (request.category_id) {
      const { data: category, error: categoryError } = await this.supabase
        .from('categories')
        .select('id')
        .eq('id', request.category_id)
        .eq('user_id', userId)
        .single();

      if (categoryError || !category) {
        throw new CategoryNotFoundError();
      }
    }
  }

  private validateBatchContent(flashcards: FlashcardReviewItem[]): void {
    if (flashcards.length === 0) {
      throw new EmptyReviewBatchError();
    }

    if (flashcards.length > 15) {
      throw new InvalidBatchSizeError('Maximum 15 flashcards per batch');
    }

    flashcards.forEach((item, index) => {
      if (!['accept_direct', 'accept_edited', 'reject'].includes(item.action)) {
        throw new InvalidReviewActionError(index, item.action);
      }

      if (item.front.length === 0 || item.front.length > 200) {
        throw new ContentValidationError(index, 'front', 'must be between 1 and 200 characters');
      }

      if (item.back.length === 0 || item.back.length > 500) {
        throw new ContentValidationError(index, 'back', 'must be between 1 and 500 characters');
      }
    });
  }
}
```

### Krok 4: API Route Implementation
```typescript
// src/pages/api/flashcards/review.ts
import type { APIRoute } from 'astro';
import { AIReviewService } from '../../../lib/services/AIReviewService';
import { FlashcardBatchService } from '../../../lib/services/FlashcardBatchService';
import { StatisticsUpdateService } from '../../../lib/services/StatisticsUpdateService';
import { FlashcardReviewSchema } from '../../../lib/schemas/ai-review';

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const body = await request.json();
    const validatedData = FlashcardReviewSchema.parse(body);

    const aiReviewService = new AIReviewService(
      locals.supabase,
      new FlashcardBatchService(locals.supabase),
      new StatisticsUpdateService(locals.supabase)
    );

    const result = await aiReviewService.processFlashcardReview(user.id, validatedData);

    return new Response(JSON.stringify(result), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Handle specific error types
    if (error instanceof CollectionNotFoundError) {
      return new Response(JSON.stringify({
        error: {
          code: "COLLECTION_NOT_FOUND",
          message: "Collection not found or access denied",
          details: { field: "collection_id" }
        }
      }), { status: 404 });
    }

    if (error instanceof CategoryNotFoundError) {
      return new Response(JSON.stringify({
        error: {
          code: "CATEGORY_NOT_FOUND",
          message: "Category not found or access denied",
          details: { field: "category_id" }
        }
      }), { status: 404 });
    }

    if (error instanceof EmptyReviewBatchError) {
      return new Response(JSON.stringify({
        error: {
          code: "EMPTY_REVIEW_BATCH",
          message: "At least one flashcard must be provided for review"
        }
      }), { status: 400 });
    }

    if (error instanceof InvalidReviewActionError) {
      return new Response(JSON.stringify({
        error: {
          code: "INVALID_REVIEW_ACTION",
          message: "Invalid action type. Must be 'accept_direct', 'accept_edited', or 'reject'",
          details: { 
            field: `flashcards[${error.index}].action`,
            value: error.action 
          }
        }
      }), { status: 422 });
    }

    if (error instanceof ContentValidationError) {
      return new Response(JSON.stringify({
        error: {
          code: "CONTENT_VALIDATION_ERROR",
          message: "Flashcard content validation failed",
          details: error.details
        }
      }), { status: 422 });
    }

    if (error instanceof FlashcardReviewTransactionError) {
      return new Response(JSON.stringify({
        error: {
          code: "REVIEW_TRANSACTION_FAILED",
          message: "Failed to process flashcard review. Please try again.",
          details: { 
            transaction_id: crypto.randomUUID(),
            partial_success: false 
          }
        }
      }), { status: 500 });
    }

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return new Response(JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors
        }
      }), { status: 422 });
    }

    // Generic error handling
    console.error('AI Review processing error:', error);
    return new Response(JSON.stringify({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while processing the review"
      }
    }), { status: 500 });
  }
};
```

### Krok 5: Error Classes
```typescript
// src/lib/errors/AIReviewErrors.ts
export class FlashcardReviewTransactionError extends Error {
  constructor(details: string) {
    super(`Flashcard review transaction failed: ${details}`);
    this.name = 'FlashcardReviewTransactionError';
  }
}

export class InvalidReviewActionError extends Error {
  constructor(public index: number, public action: string) {
    super(`Invalid review action at index ${index}: ${action}`);
    this.name = 'InvalidReviewActionError';
  }
}

export class EmptyReviewBatchError extends Error {
  constructor() {
    super('At least one flashcard must be provided for review');
    this.name = 'EmptyReviewBatchError';
  }
}

export class ContentValidationError extends Error {
  constructor(
    public index: number, 
    public field: string, 
    public details: string
  ) {
    super(`Content validation failed at flashcards[${index}].${field}: ${details}`);
    this.name = 'ContentValidationError';
  }
}

export class InvalidBatchSizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBatchSizeError';
  }
}

export class StatisticsUpdateError extends Error {
  constructor(details: string) {
    super(`Statistics update failed: ${details}`);
    this.name = 'StatisticsUpdateError';
  }
}
```

### Krok 6: MVP Metrics Integration
```typescript
// src/lib/utils/mvp-metrics-calculator.ts
export class MVPMetricsCalculator {
  static calculateAcceptanceRate(stats: GenerationStats): number {
    const totalAccepted = stats.total_accepted_direct + stats.total_accepted_edited;
    return stats.total_generated > 0 
      ? Math.round((totalAccepted / stats.total_generated) * 100 * 100) / 100
      : 0;
  }

  static isMVPCompliant(acceptanceRate: number): boolean {
    return acceptanceRate >= 75; // MVP requirement: 75% acceptance rate
  }

  static async updateDashboardMetrics(
    supabase: SupabaseClient, 
    userId: string
  ): Promise<MVPDashboardData> {
    
    const { data: stats } = await supabase
      .from('flashcard_generation_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!stats) {
      return {
        acceptance_rate: 0,
        mvp_compliant: false,
        total_generated: 0,
        total_accepted: 0
      };
    }

    const acceptanceRate = this.calculateAcceptanceRate(stats);
    
    return {
      acceptance_rate: acceptanceRate,
      mvp_compliant: this.isMVPCompliant(acceptanceRate),
      total_generated: stats.total_generated,
      total_accepted: stats.total_accepted_direct + stats.total_accepted_edited
    };
  }
}
```

### Krok 7: Testing Strategy
- **Unit tests**: AIReviewService, batch processing logic, action validation
- **Integration tests**: End-to-end review workflow
- **Transaction tests**: Rollback scenarios, atomic operations
- **Batch processing tests**: Various batch sizes, mixed actions
- **MVP metrics tests**: Statistics calculation accuracy
- **Error scenario tests**: Invalid actions, missing resources, validation failures
- **Performance tests**: Large batch processing, concurrent requests
- **Database function tests**: PostgreSQL function correctness

### Krok 8: Performance Monitoring & Analytics
```typescript
interface AIReviewAnalytics {
  daily_reviews_processed: number;
  average_batch_size: number;
  acceptance_rate_trend: number[];
  processing_time_percentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
  error_rate_by_type: Record<string, number>;
  mvp_compliance_rate: number;
}

// Performance monitoring dla batch operations
class ReviewPerformanceMonitor {
  static async trackReviewBatch(
    userId: string, 
    batchSize: number, 
    processingTime: number,
    success: boolean
  ): Promise<void> {
    // Track review batch performance metrics
  }

  static async calculateMVPMetrics(userId: string): Promise<MVPComplianceReport> {
    // Calculate and return MVP compliance status
  }
}
```

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ **Complete AI Review workflow** z batch processing
- ✅ **Transaction-safe operations** dla data consistency
- ✅ **MVP metrics integration** (75% acceptance rate tracking)
- ✅ **Action-based processing** (accept_direct, accept_edited, reject)
- ✅ **SM-2 parameter initialization** dla approved flashcards
- ✅ **Comprehensive validation** (content, ownership, actions)
- ✅ **Error handling** dla wszystkich scenariuszy (batch failures, validation errors)
- ✅ **Security measures** (ownership verification, input sanitization)
- ✅ **Performance optimization** (batch operations, database functions)
- ✅ **Production-ready implementation** z monitoring i analytics

Plan jest gotowy do implementacji z robust batch processing, comprehensive error handling i tight integration z AI generation workflow dla completed AI-powered flashcard creation system w 10xDevFiszki aplikacji. 
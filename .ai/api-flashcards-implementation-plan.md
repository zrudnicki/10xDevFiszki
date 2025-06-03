# Plan Wdrożenia Flashcards API

## 1. Przegląd punktu końcowego

### Cel
Implementacja kompletnego API dla zarządzania fiszkami z obsługą CRUD, generowania przez AI, review AI-generated content oraz algorytmu SM-2 do spaced repetition.

### Endpointy
- `GET /api/flashcards` - Lista fiszek z filtrami i paginacją
- `POST /api/flashcards` - Tworzenie nowej fiszki
- `POST /api/flashcards/generate` - Generowanie fiszek przez AI
- `POST /api/flashcards/review` - Review i akceptacja AI-generated fiszek
- `PUT /api/flashcards/{id}` - Aktualizacja fiszki
- `DELETE /api/flashcards/{id}` - Usunięcie fiszki

### Kluczowe funkcjonalności
- User isolation przez RLS policies
- Filtrowanie po collection, category, dueForReview, createdBy
- SM-2 algorithm dla spaced repetition
- AI generation workflow z OPENROUTER.ai
- Review process dla AI-generated content
- Rate limiting dla AI operations

## 2. Szczegóły żądania

### GET /api/flashcards
```typescript
interface FlashcardListQuery {
  limit?: number; // default: 20, max: 100
  offset?: number; // default: 0
  sort?: 'created_at' | 'updated_at' | 'next_review_date'; // default: 'created_at'
  order?: 'asc' | 'desc'; // default: 'desc'
  collectionId?: string; // filter by collection
  categoryId?: string; // filter by category
  dueForReview?: boolean; // only cards due for review
  createdBy?: 'manual' | 'ai_generated'; // filter by creation method
}
```

### POST /api/flashcards
```typescript
interface CreateFlashcardRequest {
  front: string; // required, 1-200 chars
  back: string; // required, 1-500 chars
  collectionId: string; // required, UUID
  categoryId?: string; // optional, UUID
}
```

### POST /api/flashcards/generate
```typescript
interface GenerateFlashcardsRequest {
  text: string; // required, 1000-10000 chars
  targetCount?: number; // optional, 5-15, default: 10
}
```

### POST /api/flashcards/review
```typescript
interface ReviewFlashcardsRequest {
  generationId: string; // required, UUID
  collectionId: string; // required, UUID
  categoryId?: string; // optional, UUID
  decisions: FlashcardDecision[];
}

interface FlashcardDecision {
  candidateIndex: number;
  action: 'accept' | 'accept_edited' | 'reject';
  front?: string; // required if action is 'accept_edited'
  back?: string; // required if action is 'accept_edited'
}
```

### PUT /api/flashcards/{id}
```typescript
interface UpdateFlashcardRequest {
  front?: string; // optional, 1-200 chars
  back?: string; // optional, 1-500 chars
  categoryId?: string; // optional, UUID
}
```

### Walidacja Zod Schemas
```typescript
const FlashcardListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(['created_at', 'updated_at', 'next_review_date']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  collectionId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  dueForReview: z.coerce.boolean().optional(),
  createdBy: z.enum(['manual', 'ai_generated']).optional()
});

const CreateFlashcardSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  collectionId: z.string().uuid(),
  categoryId: z.string().uuid().optional()
});

const GenerateFlashcardsSchema = z.object({
  text: z.string().min(1000).max(10000),
  targetCount: z.number().min(5).max(15).default(10)
});

const UpdateFlashcardSchema = z.object({
  front: z.string().min(1).max(200).optional(),
  back: z.string().min(1).max(500).optional(),
  categoryId: z.string().uuid().optional()
});
```

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
interface FlashcardResponse {
  id: string;
  front: string;
  back: string;
  collectionId: string;
  categoryId: string | null;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  createdBy: 'manual' | 'ai_generated';
  createdAt: string;
  updatedAt: string;
}

interface FlashcardListResponse {
  data: FlashcardResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface GenerationResponse {
  candidates: FlashcardCandidate[];
  generationId: string;
  totalGenerated: number;
}

interface FlashcardCandidate {
  front: string;
  back: string;
  confidence: number;
}

interface ReviewResponse {
  acceptedFlashcards: FlashcardResponse[];
  stats: {
    totalCandidates: number;
    acceptedDirect: number;
    acceptedEdited: number;
    rejected: number;
  };
}
```

### Kody stanu HTTP
- **200 OK**: Successful retrieval/update/generation
- **201 Created**: Successful creation/review
- **204 No Content**: Successful deletion
- **400 Bad Request**: Invalid request format, validation errors
- **401 Unauthorized**: No authentication
- **404 Not Found**: Flashcard/references not found
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limiting (AI)
- **503 Service Unavailable**: AI service error
- **500 Internal Server Error**: Server errors

## 4. Przepływ danych

### GET /api/flashcards Flow
1. **Authentication Check**: Verify user via `auth.uid()`
2. **Query Validation**: Validate filters and pagination
3. **Database Query**: 
   ```sql
   SELECT f.*, c.name as collection_name, cat.name as category_name
   FROM flashcards f
   LEFT JOIN collections c ON f.collection_id = c.id
   LEFT JOIN categories cat ON f.category_id = cat.id
   WHERE f.user_id = auth.uid()
   AND ($1::uuid IS NULL OR f.collection_id = $1)
   AND ($2::uuid IS NULL OR f.category_id = $2)
   AND ($3::boolean IS NULL OR (f.next_review_date <= NOW()) = $3)
   AND ($4::text IS NULL OR f.created_by = $4::flashcard_created_by)
   ORDER BY f.{sort} {order}
   LIMIT {limit} OFFSET {offset}
   ```
4. **Count Query**: Get total count for pagination
5. **Response Formation**: Build paginated response

### POST /api/flashcards Flow
1. **Authentication Check**: Verify user authentication
2. **Input Validation**: Validate front, back, references
3. **Reference Check**: Verify collection/category ownership
4. **Database Insert**:
   ```sql
   INSERT INTO flashcards (user_id, front, back, collection_id, category_id, created_by)
   VALUES (auth.uid(), $1, $2, $3, $4, 'manual')
   RETURNING *
   ```
5. **Response Formation**: Return created flashcard

### POST /api/flashcards/generate Flow
1. **Authentication Check**: Verify user authentication
2. **Rate Limiting Check**: Verify AI generation limits
3. **Input Validation**: Validate text length and content
4. **AI Service Call**: 
   - Call OPENROUTER.ai with text input
   - Process AI response and extract candidates
   - Generate unique generationId
5. **Temporary Storage**: Store candidates with generationId
6. **Response Formation**: Return candidates and generationId

### POST /api/flashcards/review Flow
1. **Authentication Check**: Verify user authentication
2. **Input Validation**: Validate review decisions
3. **Generation Check**: Verify generationId exists and belongs to user
4. **Reference Check**: Verify collection/category ownership
5. **Process Decisions**:
   ```sql
   -- For each accepted flashcard
   INSERT INTO flashcards (user_id, front, back, collection_id, category_id, created_by)
   VALUES (auth.uid(), $1, $2, $3, $4, 'ai_generated')
   ```
6. **Statistics Update**: Update generation stats
7. **Cleanup**: Remove temporary generation data
8. **Response Formation**: Return accepted flashcards and stats

### PUT /api/flashcards/{id} Flow
1. **Authentication & Authorization**: Verify ownership
2. **Existence Check**: Verify flashcard exists
3. **Input Validation**: Validate updates
4. **Reference Check**: If categoryId changed, verify ownership
5. **Database Update**:
   ```sql
   UPDATE flashcards 
   SET front = COALESCE($1, front),
       back = COALESCE($2, back),
       category_id = COALESCE($3, category_id),
       updated_at = NOW()
   WHERE id = $4 AND user_id = auth.uid()
   RETURNING *
   ```
6. **Response Formation**: Return updated flashcard

### DELETE /api/flashcards/{id} Flow
1. **Authentication & Authorization**: Verify ownership
2. **Existence Check**: Verify flashcard exists
3. **Database Delete**:
   ```sql
   DELETE FROM flashcards 
   WHERE id = $1 AND user_id = auth.uid()
   ```
4. **Success Response**: 204 No Content

## 5. Względy bezpieczeństwa

### Row Level Security (RLS)
```sql
CREATE POLICY flashcards_user_isolation ON flashcards
    FOR ALL USING (auth.uid() = user_id);
```

### Input Validation
- Wszystkie dane wejściowe walidowane przez Zod schemas
- Text length enforcement (front 1-200, back 1-500, AI text 1000-10000)
- UUID validation dla references
- SQL injection prevention through parameterized queries

### Authentication & Authorization
- Wymaganie autentykacji dla wszystkich operacji
- Weryfikacja ownership przez `auth.uid() = user_id`
- Reference validation dla collections/categories
- Brak możliwości dostępu do cudzych fiszek

### Rate Limiting
- **AI Generation**: 10 requests per hour per user
- **Standard Operations**: 1000 requests per hour per user
- **Bulk Operations**: 50 requests per hour per user
- Protection against abuse i DoS attacks

### AI Security
- Input sanitization dla AI text
- Response filtering dla AI output
- Timeout protection dla AI calls
- Error handling dla AI service failures

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
// 400 Bad Request - Validation
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Front text exceeds 200 character limit",
    details: { field: "front", maxLength: 200, actualLength: 245 }
  }
}

// 404 Not Found - Flashcard
{
  error: {
    code: "FLASHCARD_NOT_FOUND",
    message: "Flashcard not found or access denied"
  }
}

// 404 Not Found - Reference
{
  error: {
    code: "COLLECTION_NOT_FOUND",
    message: "Referenced collection not found or access denied",
    details: { collectionId: "uuid" }
  }
}

// 429 Rate Limiting - AI
{
  error: {
    code: "AI_RATE_LIMIT_EXCEEDED",
    message: "AI generation rate limit exceeded. Try again later.",
    details: { resetTime: "2025-01-15T18:00:00Z" }
  }
}

// 503 AI Service Error
{
  error: {
    code: "AI_SERVICE_UNAVAILABLE",
    message: "AI service temporarily unavailable",
    details: { retryAfter: 300 }
  }
}
```

### Error Handling Strategy
- Early returns for error conditions
- Comprehensive logging for debugging
- User-friendly error messages
- Proper HTTP status codes
- Graceful degradation dla AI failures

## 7. Wydajność

### Database Optimizations
```sql
-- Essential indexes
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_collection_id ON flashcards(collection_id);
CREATE INDEX idx_flashcards_category_id ON flashcards(category_id);
CREATE INDEX idx_flashcards_next_review_date ON flashcards(next_review_date);
CREATE INDEX idx_flashcards_user_next_review ON flashcards(user_id, next_review_date);
CREATE INDEX idx_flashcards_created_by ON flashcards(created_by);

-- Composite indexes for filtering
CREATE INDEX idx_flashcards_user_collection ON flashcards(user_id, collection_id);
CREATE INDEX idx_flashcards_user_category ON flashcards(user_id, category_id);
```

### Query Optimizations
- Efficient filtering with indexed columns
- LIMIT/OFFSET for pagination
- LEFT JOINs for related data
- Selective field queries

### Caching Strategy
- Cache user flashcard counts
- Cache AI generation results temporarily
- Cache collection/category names
- Invalidate cache on CRUD operations

### AI Performance
- Async processing dla AI generation
- Timeout handling dla AI calls
- Retry logic z exponential backoff
- Connection pooling dla external services

### Performance Monitoring
- Track query execution times
- Monitor AI service response times
- Log slow queries for optimization
- Track rate limiting metrics

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/flashcards/
├── index.ts (GET, POST)
├── generate.ts (POST - AI generation)
├── review.ts (POST - AI review)
├── [id].ts (PUT, DELETE)
src/lib/services/
├── FlashcardsService.ts
├── AIGenerationService.ts
├── SM2AlgorithmService.ts
src/lib/schemas/
├── flashcards.ts
src/types/
├── flashcards.ts
src/lib/errors/
├── FlashcardErrors.ts
├── FlashcardNotFoundError.ts
├── FlashcardValidationError.ts
├── ReferenceNotFoundError.ts
├── AIServiceError.ts
├── RateLimitError.ts
src/lib/utils/
├── flashcard-validation.ts
├── ai-processing.ts
├── rate-limiting.ts
```

### Krok 2: Typy i schemas
```typescript
// src/types/flashcards.ts
export interface Flashcard {
  id: string;
  user_id: string;
  collection_id: string;
  category_id: string | null;
  front: string;
  back: string;
  easiness_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: string;
  created_by: 'manual' | 'ai_generated';
  created_at: string;
  updated_at: string;
}

export interface FlashcardCandidate {
  front: string;
  back: string;
  confidence: number;
}

// src/lib/schemas/flashcards.ts
export const CreateFlashcardSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  collectionId: z.string().uuid(),
  categoryId: z.string().uuid().optional()
});
```

### Krok 3: Service Layer
```typescript
// src/lib/services/FlashcardsService.ts
export class FlashcardsService {
  constructor(private supabase: SupabaseClient) {}

  async getFlashcards(userId: string, query: FlashcardListQuery) {
    // Implementation with complex filtering
  }

  async createFlashcard(userId: string, data: CreateFlashcardRequest) {
    // Implementation with reference validation
  }

  async updateFlashcard(userId: string, id: string, data: UpdateFlashcardRequest) {
    // Implementation with ownership checks
  }

  async deleteFlashcard(userId: string, id: string) {
    // Implementation with ownership validation
  }

  private async validateReferences(userId: string, collectionId: string, categoryId?: string) {
    // Validate collection and category ownership
  }

  private async flashcardExists(userId: string, id: string) {
    // Verify flashcard exists and belongs to user
  }
}

// src/lib/services/AIGenerationService.ts
export class AIGenerationService {
  constructor(private supabase: SupabaseClient) {}

  async generateFlashcards(userId: string, data: GenerateFlashcardsRequest) {
    // AI generation implementation
  }

  async reviewFlashcards(userId: string, data: ReviewFlashcardsRequest) {
    // Review workflow implementation
  }

  private async callAIService(text: string, targetCount: number) {
    // OPENROUTER.ai integration
  }

  private async storeGenerationCandidates(generationId: string, candidates: FlashcardCandidate[]) {
    // Temporary storage for candidates
  }
}
```

### Krok 4: API Routes

#### src/pages/api/flashcards/index.ts
```typescript
import type { APIRoute } from 'astro';
import { FlashcardsService } from '../../lib/services/FlashcardsService';
import { FlashcardListQuerySchema, CreateFlashcardSchema } from '../../lib/schemas/flashcards';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const queryParams = Object.fromEntries(url.searchParams);
    const validatedQuery = FlashcardListQuerySchema.parse(queryParams);
    
    const flashcardsService = new FlashcardsService(locals.supabase);
    const result = await flashcardsService.getFlashcards(user.id, validatedQuery);
    
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    // Error handling
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateFlashcardSchema.parse(body);
    
    const flashcardsService = new FlashcardsService(locals.supabase);
    const result = await flashcardsService.createFlashcard(user.id, validatedData);
    
    return new Response(JSON.stringify({ data: result }), { status: 201 });
  } catch (error) {
    // Error handling
  }
};
```

#### src/pages/api/flashcards/generate.ts
```typescript
import type { APIRoute } from 'astro';
import { AIGenerationService } from '../../../lib/services/AIGenerationService';
import { GenerateFlashcardsSchema } from '../../../lib/schemas/flashcards';

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(user.id, 'ai_generation');
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: { 
          code: "AI_RATE_LIMIT_EXCEEDED", 
          message: "AI generation rate limit exceeded",
          details: { resetTime: rateLimitResult.resetTime }
        }
      }), { status: 429 });
    }

    const body = await request.json();
    const validatedData = GenerateFlashcardsSchema.parse(body);
    
    const aiService = new AIGenerationService(locals.supabase);
    const result = await aiService.generateFlashcards(user.id, validatedData);
    
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    // Error handling including AI service errors
  }
};
```

#### src/pages/api/flashcards/[id].ts
```typescript
import type { APIRoute } from 'astro';
import { FlashcardsService } from '../../../lib/services/FlashcardsService';
import { UpdateFlashcardSchema } from '../../../lib/schemas/flashcards';

export const PUT: APIRoute = async ({ locals, params, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const flashcardId = params.id;
    if (!flashcardId) {
      return new Response(JSON.stringify({ 
        error: { code: "INVALID_REQUEST", message: "Flashcard ID is required" }
      }), { status: 400 });
    }

    const body = await request.json();
    const validatedData = UpdateFlashcardSchema.parse(body);
    
    const flashcardsService = new FlashcardsService(locals.supabase);
    const result = await flashcardsService.updateFlashcard(user.id, flashcardId, validatedData);
    
    return new Response(JSON.stringify({ data: result }), { status: 200 });
  } catch (error) {
    // Error handling
  }
};

export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const flashcardId = params.id;
    if (!flashcardId) {
      return new Response(JSON.stringify({ 
        error: { code: "INVALID_REQUEST", message: "Flashcard ID is required" }
      }), { status: 400 });
    }
    
    const flashcardsService = new FlashcardsService(locals.supabase);
    await flashcardsService.deleteFlashcard(user.id, flashcardId);
    
    return new Response(null, { status: 204 });
  } catch (error) {
    // Error handling
  }
};
```

### Krok 5: Error Handling
```typescript
// src/lib/errors/FlashcardErrors.ts
export class FlashcardNotFoundError extends Error {
  constructor() {
    super('Flashcard not found or access denied');
    this.name = 'FlashcardNotFoundError';
  }
}

export class ReferenceNotFoundError extends Error {
  constructor(type: 'collection' | 'category', id: string) {
    super(`${type} not found or access denied: ${id}`);
    this.name = 'ReferenceNotFoundError';
  }
}

export class AIServiceError extends Error {
  constructor(message: string) {
    super(`AI service error: ${message}`);
    this.name = 'AIServiceError';
  }
}

export class RateLimitError extends Error {
  constructor(resetTime: string) {
    super(`Rate limit exceeded. Reset time: ${resetTime}`);
    this.name = 'RateLimitError';
  }
}

// Error handler utility
export function handleFlashcardError(error: any) {
  if (error instanceof FlashcardNotFoundError) {
    return { status: 404, code: "FLASHCARD_NOT_FOUND" };
  }
  if (error instanceof ReferenceNotFoundError) {
    return { status: 404, code: "REFERENCE_NOT_FOUND" };
  }
  if (error instanceof AIServiceError) {
    return { status: 503, code: "AI_SERVICE_UNAVAILABLE" };
  }
  if (error instanceof RateLimitError) {
    return { status: 429, code: "RATE_LIMIT_EXCEEDED" };
  }
  // ... other error types
}
```

### Krok 6: Testing
- Unit tests dla FlashcardsService
- Unit tests dla AIGenerationService
- Integration tests dla wszystkich API endpoints
- AI service mocking dla testów
- Rate limiting testing
- SM-2 algorithm testing
- Edge case testing (invalid references, AI failures)
- Authentication & authorization testing
- Performance testing z large datasets

### Krok 7: Documentation
- API documentation z przykładami dla wszystkich endpoints
- AI generation workflow documentation
- Review process documentation
- Error codes documentation
- Rate limiting documentation
- SM-2 algorithm documentation
- Usage examples dla frontend

### Krok 8: Deployment
- Database migrations (tables already exist)
- Environment variables setup (OPENROUTER_API_KEY)
- AI service configuration
- Rate limiting configuration
- Performance monitoring setup
- Error tracking integration
- AI service monitoring

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ Kompletny CRUD API dla fiszek
- ✅ Zaawansowane filtrowanie i paginację
- ✅ AI generation workflow z OPENROUTER.ai
- ✅ Review process dla AI content
- ✅ SM-2 algorithm support
- ✅ Comprehensive error handling
- ✅ Rate limiting dla AI operations
- ✅ Security best practices
- ✅ Performance optimizations
- ✅ Scalable architecture
- ✅ MVP-ready functionality

Plan jest gotowy do implementacji przez zespół programistów z jasno określonymi krokami, kompleksową obsługą AI i wszystkimi niezbędnymi szczegółami technicznymi. 
# Plan Wdrożenia Flashcards API

## 1. Przegląd punktu końcowego

### Cel
Implementacja kompletnego CRUD API dla zarządzania fiszkami użytkownika z integracją algorytmu SM-2, zaawansowanymi filtrami i obsługą spaced repetition.

### Endpointy
- `GET /api/flashcards` - Lista fiszek z zaawansowanymi filtrami i paginacją
- `POST /api/flashcards` - Tworzenie nowej fiszki (manual)
- `PATCH /api/flashcards/{id}` - Aktualizacja fiszki
- `DELETE /api/flashcards/{id}` - Usunięcie fiszki

### Kluczowe funkcjonalności
- **SM-2 Algorithm integration** z parametrami spaced repetition
- **Zaawansowane filtering** (collection, category, created_by, due cards)
- **User isolation** przez RLS policies
- **Content validation** (front ≤ 200 chars, back ≤ 500 chars)
- **Manual vs AI-generated** tracking
- **Due cards calculation** dla study sessions

## 2. Szczegóły żądania

### GET /api/flashcards
```typescript
interface FlashcardListQuery {
  // Pagination
  limit?: number; // default: 20, max: 100
  offset?: number; // default: 0
  sort?: 'created_at' | 'updated_at' | 'front' | 'next_review_date'; // default: 'created_at'
  order?: 'asc' | 'desc'; // default: 'desc'
  
  // Filters
  collection_id?: string; // UUID
  category_id?: string; // UUID
  created_by?: 'manual' | 'ai_generated';
  due?: boolean; // only cards due for review (next_review_date <= NOW())
}
```

### POST /api/flashcards
```typescript
interface CreateFlashcardRequest {
  collection_id: string; // required, UUID
  category_id?: string; // optional, UUID
  front: string; // required, max 200 chars
  back: string; // required, max 500 chars
}
```

### PATCH /api/flashcards/{id}
```typescript
interface UpdateFlashcardRequest {
  collection_id?: string; // optional, UUID
  category_id?: string; // optional, UUID
  front?: string; // optional, max 200 chars
  back?: string; // optional, max 500 chars
}
```

### Walidacja Zod Schemas
```typescript
const FlashcardListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(['created_at', 'updated_at', 'front', 'next_review_date']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  collection_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  created_by: z.enum(['manual', 'ai_generated']).optional(),
  due: z.coerce.boolean().optional()
});

const CreateFlashcardSchema = z.object({
  collection_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500)
});

const UpdateFlashcardSchema = z.object({
  collection_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  front: z.string().min(1).max(200).optional(),
  back: z.string().min(1).max(500).optional()
});
```

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
interface FlashcardResponse {
  id: string;
  collection_id: string;
  category_id: string | null;
  front: string;
  back: string;
  
  // SM-2 Algorithm Parameters
  easiness_factor: number; // 1.3-2.5
  interval: number; // positive integer
  repetitions: number; // non-negative integer
  next_review_date: string; // TIMESTAMPTZ
  
  created_by: 'manual' | 'ai_generated';
  created_at: string;
  updated_at: string;
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

interface SingleFlashcardResponse {
  data: FlashcardResponse;
}
```

### Kody stanu HTTP
- **200 OK**: Successful retrieval/update
- **201 Created**: Successful creation
- **204 No Content**: Successful deletion
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: No authentication
- **404 Not Found**: Flashcard/collection/category not found
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server errors

## 4. Przepływ danych

### GET /api/flashcards Flow
1. **Authentication Check**: Verify user via `auth.uid()`
2. **Query Validation**: Validate filters and pagination parameters
3. **Filter Building**: Build WHERE clause based on filters
4. **Database Query**: 
   ```sql
   SELECT * FROM flashcards 
   WHERE user_id = auth.uid()
     AND ($1::uuid IS NULL OR collection_id = $1)
     AND ($2::uuid IS NULL OR category_id = $2)
     AND ($3::text IS NULL OR created_by = $3::flashcard_created_by)
     AND ($4::boolean IS FALSE OR next_review_date <= NOW())
   ORDER BY {sort} {order}
   LIMIT {limit} OFFSET {offset}
   ```
5. **Count Query**: Get total count for pagination
6. **Response Formation**: Build paginated response

### POST /api/flashcards Flow
1. **Authentication Check**: Verify user authentication
2. **Input Validation**: Validate request body
3. **Collection Existence**: Verify collection exists and belongs to user
4. **Category Existence**: If provided, verify category exists and belongs to user
5. **SM-2 Initialization**: Set default SM-2 parameters
6. **Database Insert**:
   ```sql
   INSERT INTO flashcards (
     user_id, collection_id, category_id, front, back,
     easiness_factor, interval, repetitions, next_review_date, created_by
   ) VALUES (
     auth.uid(), $1, $2, $3, $4,
     2.5, 1, 0, (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ, 'manual'
   ) RETURNING *
   ```
7. **Response Formation**: Return created flashcard

### PATCH /api/flashcards/{id} Flow
1. **Authentication & Authorization**: Verify ownership
2. **Existence Check**: Verify flashcard exists
3. **Input Validation**: Validate updates
4. **Collection/Category Validation**: If changed, verify existence and ownership
5. **Database Update**:
   ```sql
   UPDATE flashcards 
   SET collection_id = COALESCE($1, collection_id),
       category_id = COALESCE($2, category_id),
       front = COALESCE($3, front),
       back = COALESCE($4, back),
       updated_at = NOW()
   WHERE id = $5 AND user_id = auth.uid()
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
- **Content validation**: front ≤ 200 chars, back ≤ 500 chars
- **SM-2 constraints**: easiness_factor 1.3-2.5, interval > 0, repetitions ≥ 0
- **UUID validation** for collection_id, category_id
- **SQL injection prevention** through parameterized queries

### Authentication & Authorization
- **User authentication** required for all operations
- **Ownership verification** through `auth.uid() = user_id`
- **Collection/category ownership** verification on create/update
- **No cross-user data access**

### Data Integrity
- **Foreign key constraints** for collection_id (required), category_id (optional)
- **SM-2 parameter ranges** enforced at database level
- **Content length constraints** enforced at database level

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
// 404 Not Found - Collection doesn't exist
{
  error: {
    code: "COLLECTION_NOT_FOUND",
    message: "Collection not found or access denied",
    details: { field: "collection_id" }
  }
}

// 404 Not Found - Category doesn't exist
{
  error: {
    code: "CATEGORY_NOT_FOUND",
    message: "Category not found or access denied",
    details: { field: "category_id" }
  }
}

// 422 Validation Error - Content too long
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: {
      front: "Front text must be between 1 and 200 characters",
      back: "Back text must be between 1 and 500 characters"
    }
  }
}

// 404 Not Found - Flashcard doesn't exist
{
  error: {
    code: "FLASHCARD_NOT_FOUND",
    message: "Flashcard not found or access denied"
  }
}
```

### Error Handling Strategy
- **Early validation**: Validate all inputs before database operations
- **Comprehensive logging**: Log all errors for debugging
- **User-friendly messages**: Provide clear error descriptions
- **Proper HTTP codes**: Use appropriate status codes
- **Graceful degradation**: Handle partial failures

## 7. Wydajność

### Database Optimizations
```sql
-- Essential indexes for performance
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_collection_id ON flashcards(collection_id);
CREATE INDEX idx_flashcards_category_id ON flashcards(category_id);
CREATE INDEX idx_flashcards_next_review_date ON flashcards(next_review_date);
CREATE INDEX idx_flashcards_user_next_review ON flashcards(user_id, next_review_date);
CREATE INDEX idx_flashcards_created_by ON flashcards(created_by);

-- Composite indexes for common filter combinations
CREATE INDEX idx_flashcards_user_collection ON flashcards(user_id, collection_id);
CREATE INDEX idx_flashcards_user_category ON flashcards(user_id, category_id);
CREATE INDEX idx_flashcards_user_created_by ON flashcards(user_id, created_by);
```

### Query Optimizations
- **Efficient filtering** with proper index usage
- **LIMIT/OFFSET pagination** with optimized queries
- **Conditional WHERE clauses** to avoid unnecessary filters
- **Single query** for both data and count when possible

### Caching Strategy
- **Query result caching** for frequently accessed flashcards
- **Due cards caching** for study session optimization
- **Cache invalidation** on CRUD operations
- **Collection-based cache keys** for targeted invalidation

### Performance Monitoring
- **Query execution time tracking**
- **Database connection pool monitoring**
- **Slow query identification**
- **Index usage analysis**

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/flashcards/
├── index.ts (GET, POST)
├── [id].ts (PATCH, DELETE)
src/lib/services/
├── FlashcardsService.ts
├── SM2Service.ts
src/lib/schemas/
├── flashcards.ts
src/types/
├── flashcards.ts
src/lib/errors/
├── FlashcardErrors.ts
├── FlashcardNotFoundError.ts
├── CollectionNotFoundError.ts
├── CategoryNotFoundError.ts
├── InvalidSM2ParametersError.ts
├── ContentValidationError.ts
├── InvalidFilterError.ts
src/lib/utils/
├── flashcard-filters.ts
├── sm2-calculations.ts
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

export interface SM2Parameters {
  easiness_factor: number; // 1.3-2.5
  interval: number; // positive integer
  repetitions: number; // non-negative integer
  next_review_date: string;
}

// src/lib/schemas/flashcards.ts
export const CreateFlashcardSchema = z.object({
  collection_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500)
});
```

### Krok 3: Service Layer
```typescript
// src/lib/services/FlashcardsService.ts
export class FlashcardsService {
  constructor(
    private supabase: SupabaseClient,
    private sm2Service: SM2Service
  ) {}

  async getFlashcards(userId: string, query: FlashcardListQuery) {
    // Implementation with advanced filtering
  }

  async createFlashcard(userId: string, data: CreateFlashcardRequest) {
    // Implementation with SM-2 initialization
  }

  async updateFlashcard(userId: string, id: string, data: UpdateFlashcardRequest) {
    // Implementation with ownership verification
  }

  async deleteFlashcard(userId: string, id: string) {
    // Implementation with ownership verification
  }

  private async validateCollectionAccess(userId: string, collectionId: string) {
    // Verify collection exists and belongs to user
  }

  private async validateCategoryAccess(userId: string, categoryId: string) {
    // Verify category exists and belongs to user
  }

  private buildWhereClause(query: FlashcardListQuery) {
    // Build dynamic WHERE clause based on filters
  }
}

// src/lib/services/SM2Service.ts
export class SM2Service {
  static getDefaultParameters(): SM2Parameters {
    return {
      easiness_factor: 2.5,
      interval: 1,
      repetitions: 0,
      next_review_date: this.calculateNextReviewDate(1)
    };
  }

  static calculateNextReviewDate(interval: number): string {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    return nextDate.toISOString();
  }

  static validateParameters(params: Partial<SM2Parameters>): boolean {
    // Validate SM-2 parameter ranges
  }
}
```

### Krok 4: API Routes

#### src/pages/api/flashcards/index.ts
```typescript
import type { APIRoute } from 'astro';
import { FlashcardsService } from '../../lib/services/FlashcardsService';
import { SM2Service } from '../../lib/services/SM2Service';
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
    
    const flashcardsService = new FlashcardsService(locals.supabase, new SM2Service());
    const result = await flashcardsService.getFlashcards(user.id, validatedQuery);
    
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    // Comprehensive error handling
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
    
    const flashcardsService = new FlashcardsService(locals.supabase, new SM2Service());
    const result = await flashcardsService.createFlashcard(user.id, validatedData);
    
    return new Response(JSON.stringify({ data: result }), { status: 201 });
  } catch (error) {
    // Comprehensive error handling
  }
};
```

#### src/pages/api/flashcards/[id].ts
```typescript
import type { APIRoute } from 'astro';
import { FlashcardsService } from '../../../lib/services/FlashcardsService';
import { SM2Service } from '../../../lib/services/SM2Service';
import { UpdateFlashcardSchema } from '../../../lib/schemas/flashcards';

export const PATCH: APIRoute = async ({ locals, params, request }) => {
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
    
    const flashcardsService = new FlashcardsService(locals.supabase, new SM2Service());
    const result = await flashcardsService.updateFlashcard(user.id, flashcardId, validatedData);
    
    return new Response(JSON.stringify({ data: result }), { status: 200 });
  } catch (error) {
    // Comprehensive error handling
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
    
    const flashcardsService = new FlashcardsService(locals.supabase, new SM2Service());
    await flashcardsService.deleteFlashcard(user.id, flashcardId);
    
    return new Response(null, { status: 204 });
  } catch (error) {
    // Comprehensive error handling
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

export class CollectionNotFoundError extends Error {
  constructor() {
    super('Collection not found or access denied');
    this.name = 'CollectionNotFoundError';
  }
}

export class CategoryNotFoundError extends Error {
  constructor() {
    super('Category not found or access denied');
    this.name = 'CategoryNotFoundError';
  }
}

export class InvalidSM2ParametersError extends Error {
  constructor(details: string) {
    super(`Invalid SM-2 parameters: ${details}`);
    this.name = 'InvalidSM2ParametersError';
  }
}

// Error handler utility
export function handleFlashcardError(error: any) {
  if (error instanceof FlashcardNotFoundError) {
    return { status: 404, code: "FLASHCARD_NOT_FOUND" };
  }
  if (error instanceof CollectionNotFoundError) {
    return { status: 404, code: "COLLECTION_NOT_FOUND" };
  }
  if (error instanceof CategoryNotFoundError) {
    return { status: 404, code: "CATEGORY_NOT_FOUND" };
  }
  if (error instanceof InvalidSM2ParametersError) {
    return { status: 422, code: "INVALID_SM2_PARAMETERS" };
  }
  // ... other error types
}
```

### Krok 6: Testing
- **Unit tests** dla FlashcardsService i SM2Service
- **Integration tests** dla wszystkich API endpoints
- **SM-2 algorithm testing** (parameter validation, calculations)
- **Advanced filtering testing** (wszystkie kombinacje filtrów)
- **Performance testing** (duże dataset, complex queries)
- **Edge case testing** (boundary values, invalid references)

### Krok 7: Documentation
- **API documentation** z przykładami wszystkich filtrów
- **SM-2 algorithm documentation** (parameters, ranges, calculations)
- **Error codes documentation** z wszystkimi scenariuszami
- **Usage examples** dla frontend (filtering, due cards)
- **Database schema documentation** (constraints, indexes)

### Krok 8: Deployment
- **Database migrations** (tables already exist)
- **Index creation** dla performance optimization
- **Environment variables** setup
- **Performance monitoring** setup (query times, slow queries)
- **Error tracking integration**

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ **Kompletny CRUD API** dla fiszek z zaawansowanymi filtrami
- ✅ **SM-2 Algorithm integration** z proper parameter handling
- ✅ **Advanced filtering** (collection, category, created_by, due cards)
- ✅ **Bezpieczną user isolation** i ownership verification
- ✅ **Content validation** z proper length constraints
- ✅ **Performance optimization** z targeted indexes
- ✅ **Comprehensive error handling** dla wszystkich edge cases
- ✅ **MVP-ready functionality** dla spaced repetition
- ✅ **Scalable architecture** z service layer pattern
- ✅ **Security best practices** z RLS i input validation

Plan jest gotowy do implementacji przez zespół programistów z jasno określonymi krokami, szczegółową specyfikacją SM-2 algorithm integration i comprehensive testing strategy. 
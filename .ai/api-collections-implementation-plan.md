# Plan Wdrożenia Collections API

## 1. Przegląd punktu końcowego

### Cel
Implementacja pełnego CRUD API dla zarządzania kolekcjami fiszek użytkownika z paginacją, sortowaniem i liczeniem fiszek.

### Endpointy
- `GET /api/collections` - Lista kolekcji z paginacją
- `POST /api/collections` - Tworzenie nowej kolekcji
- `GET /api/collections/{id}` - Pobranie konkretnej kolekcji
- `PATCH /api/collections/{id}` - Aktualizacja kolekcji
- `DELETE /api/collections/{id}` - Usunięcie kolekcji (CASCADE)

### Kluczowe funkcjonalności
- User isolation przez RLS policies
- Paginacja z sortowaniem
- Walidacja unikalności nazwy per user
- Liczenie fiszek w kolekcji
- CASCADE delete flashcards i study sessions

## 2. Szczegóły żądania

### GET /api/collections
```typescript
interface CollectionListQuery {
  limit?: number; // default: 20, max: 100
  offset?: number; // default: 0
  sort?: 'created_at' | 'updated_at' | 'name'; // default: 'created_at'
  order?: 'asc' | 'desc'; // default: 'desc'
}
```

### POST /api/collections
```typescript
interface CreateCollectionRequest {
  name: string; // required, max 250 chars
  description?: string; // optional
}
```

### PATCH /api/collections/{id}
```typescript
interface UpdateCollectionRequest {
  name?: string; // optional, max 250 chars
  description?: string; // optional
}
```

### Walidacja Zod Schemas
```typescript
const CollectionListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(['created_at', 'updated_at', 'name']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
});

const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(250),
  description: z.string().optional()
});

const UpdateCollectionSchema = z.object({
  name: z.string().min(1).max(250).optional(),
  description: z.string().optional()
});
```

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
interface CollectionResponse {
  id: string;
  name: string;
  description: string | null;
  flashcard_count: number;
  created_at: string;
  updated_at: string;
}

interface CollectionListResponse {
  data: CollectionResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface SingleCollectionResponse {
  data: CollectionResponse;
}
```

### Kody stanu HTTP
- **200 OK**: Successful retrieval
- **201 Created**: Successful creation
- **204 No Content**: Successful deletion
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: No authentication
- **404 Not Found**: Collection not found
- **409 Conflict**: Name already exists
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server errors

## 4. Przepływ danych

### GET /api/collections Flow
1. **Authentication Check**: Verify user via `auth.uid()`
2. **Query Validation**: Validate pagination parameters
3. **Database Query**: 
   ```sql
   SELECT c.*, COUNT(f.id) as flashcard_count
   FROM collections c
   LEFT JOIN flashcards f ON c.id = f.collection_id
   WHERE c.user_id = auth.uid()
   GROUP BY c.id
   ORDER BY c.{sort} {order}
   LIMIT {limit} OFFSET {offset}
   ```
4. **Count Query**: Get total count for pagination
5. **Response Formation**: Build paginated response

### POST /api/collections Flow
1. **Authentication Check**: Verify user authentication
2. **Input Validation**: Validate name and description
3. **Uniqueness Check**: Verify name uniqueness for user
4. **Database Insert**:
   ```sql
   INSERT INTO collections (user_id, name, description)
   VALUES (auth.uid(), $1, $2)
   RETURNING *
   ```
5. **Response Formation**: Return created collection with flashcard_count = 0

### PATCH /api/collections/{id} Flow
1. **Authentication & Authorization**: Verify ownership
2. **Existence Check**: Verify collection exists
3. **Input Validation**: Validate updates
4. **Uniqueness Check**: If name changed, check uniqueness
5. **Database Update**:
   ```sql
   UPDATE collections 
   SET name = COALESCE($1, name), 
       description = COALESCE($2, description),
       updated_at = NOW()
   WHERE id = $3 AND user_id = auth.uid()
   RETURNING *
   ```
6. **Flashcard Count**: Query flashcard count
7. **Response Formation**: Return updated collection

### DELETE /api/collections/{id} Flow
1. **Authentication & Authorization**: Verify ownership
2. **Existence Check**: Verify collection exists
3. **CASCADE Delete**:
   ```sql
   DELETE FROM collections 
   WHERE id = $1 AND user_id = auth.uid()
   ```
4. **Success Response**: 204 No Content

## 5. Względy bezpieczeństwa

### Row Level Security (RLS)
```sql
CREATE POLICY collections_user_isolation ON collections
    FOR ALL USING (auth.uid() = user_id);
```

### Input Validation
- Wszystkie dane wejściowe walidowane przez Zod schemas
- Sanitization of input strings
- Length limits enforcement (name max 250 chars)
- SQL injection prevention through parameterized queries

### Authentication & Authorization
- Wymaganie autentykacji dla wszystkich operacji
- Weryfikacja ownership przez `auth.uid() = user_id`
- Brak możliwości dostępu do cudzych kolekcji

### Rate Limiting
- Implementacja rate limiting (100 req/min per user)
- Protection against abuse and DoS attacks

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
// 409 Conflict - Name exists
{
  error: {
    code: "COLLECTION_NAME_EXISTS",
    message: "A collection with this name already exists",
    details: { field: "name" }
  }
}

// 404 Not Found
{
  error: {
    code: "COLLECTION_NOT_FOUND", 
    message: "Collection not found or access denied"
  }
}

// 422 Validation Error
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: {
      name: "Name is required and must be between 1 and 250 characters"
    }
  }
}
```

### Error Handling Strategy
- Early returns for error conditions
- Comprehensive logging for debugging
- User-friendly error messages
- Proper HTTP status codes
- Graceful degradation

## 7. Wydajność

### Database Optimizations
```sql
-- Essential indexes
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_user_created_at ON collections(user_id, created_at DESC);
CREATE INDEX idx_collections_user_name ON collections(user_id, name);

-- For flashcard counting
CREATE INDEX idx_flashcards_collection_id ON flashcards(collection_id);
```

### Query Optimizations
- Use of LEFT JOIN for flashcard counting
- LIMIT/OFFSET for pagination
- Single query for list with counts
- Efficient sorting with indexed columns

### Caching Strategy
- Consider caching total counts for large datasets
- Cache user collection lists for frequent access
- Invalidate cache on CRUD operations

### Performance Monitoring
- Track query execution times
- Monitor database connection usage
- Log slow queries for optimization

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/collections/
├── index.ts (GET, POST)
├── [id].ts (GET, PATCH, DELETE)
src/lib/services/
├── CollectionsService.ts
src/lib/schemas/
├── collections.ts
src/types/
├── collections.ts
src/lib/errors/
├── CollectionErrors.ts
├── CollectionNotFoundError.ts
├── CollectionNameExistsError.ts
├── CollectionValidationError.ts
├── UnauthorizedCollectionAccessError.ts
src/lib/utils/
├── collection-validation.ts
├── flashcard-counting.ts
```

### Krok 2: Typy i schemas
```typescript
// src/types/collections.ts
export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithCount extends Collection {
  flashcard_count: number;
}

// src/lib/schemas/collections.ts
export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(250),
  description: z.string().optional()
});
```

### Krok 3: Service Layer
```typescript
// src/lib/services/CollectionsService.ts
export class CollectionsService {
  constructor(private supabase: SupabaseClient) {}

  async getCollections(userId: string, query: CollectionListQuery) {
    // Implementation
  }

  async createCollection(userId: string, data: CreateCollectionRequest) {
    // Implementation
  }

  async getCollectionById(userId: string, id: string) {
    // Implementation
  }

  async updateCollection(userId: string, id: string, data: UpdateCollectionRequest) {
    // Implementation
  }

  async deleteCollection(userId: string, id: string) {
    // Implementation
  }

  private async checkNameUniqueness(userId: string, name: string, excludeId?: string) {
    // Implementation
  }

  private async getFlashcardCount(collectionId: string) {
    // Implementation
  }
}
```

### Krok 4: API Routes

#### src/pages/api/collections/index.ts
```typescript
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, url }) => {
  // GET implementation
};

export const POST: APIRoute = async ({ locals, request }) => {
  // POST implementation
};
```

#### src/pages/api/collections/[id].ts
```typescript
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, params }) => {
  // GET by ID implementation
};

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  // PATCH implementation
};

export const DELETE: APIRoute = async ({ locals, params }) => {
  // DELETE implementation
};
```

### Krok 5: Error Handling
```typescript
// src/lib/errors/CollectionErrors.ts
export class CollectionNotFoundError extends Error {
  constructor() {
    super('Collection not found or access denied');
    this.name = 'CollectionNotFoundError';
  }
}

export class CollectionNameExistsError extends Error {
  constructor() {
    super('A collection with this name already exists');
    this.name = 'CollectionNameExistsError';
  }
}
```

### Krok 6: Testing
- Unit tests dla CollectionsService
- Integration tests dla API endpoints
- Edge case testing (empty data, large datasets)
- Authentication & authorization testing
- Performance testing z paginacją

### Krok 7: Documentation
- API documentation z przykładami
- Error codes documentation
- Usage examples dla frontend
- Database schema documentation

### Krok 8: Deployment
- Database migrations (tables already exist)
- Environment variables setup
- Performance monitoring setup
- Error tracking integration

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ Kompletny CRUD API dla kolekcji
- ✅ Bezpieczną user isolation
- ✅ Wydajną paginację i sortowanie
- ✅ Proper error handling
- ✅ MVP-ready functionality
- ✅ Scalable architecture
- ✅ Security best practices
- ✅ Performance optimizations 
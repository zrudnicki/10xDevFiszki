# Plan Wdrożenia Categories API

## 1. Przegląd punktu końcowego

### Cel
Implementacja pełnego CRUD API dla zarządzania kategoriami fiszek użytkownika z paginacją, sortowaniem i liczeniem fiszek.

### Endpointy
- `GET /api/categories` - Lista kategorii z paginacją
- `POST /api/categories` - Tworzenie nowej kategorii
- `PATCH /api/categories/{id}` - Aktualizacja kategorii
- `DELETE /api/categories/{id}` - Usunięcie kategorii (SET NULL na flashcards)

### Kluczowe funkcjonalności
- User isolation przez RLS policies
- Paginacja z sortowaniem
- Walidacja unikalności nazwy per user
- Liczenie fiszek w kategorii
- SET NULL na flashcards.category_id przy usunięciu kategorii

## 2. Szczegóły żądania

### GET /api/categories
```typescript
interface CategoryListQuery {
  limit?: number; // default: 20, max: 100
  offset?: number; // default: 0
  sort?: 'created_at' | 'updated_at' | 'name'; // default: 'created_at'
  order?: 'asc' | 'desc'; // default: 'desc'
}
```

### POST /api/categories
```typescript
interface CreateCategoryRequest {
  name: string; // required, max 250 chars
}
```

### PATCH /api/categories/{id}
```typescript
interface UpdateCategoryRequest {
  name: string; // required, max 250 chars
}
```

### Walidacja Zod Schemas
```typescript
const CategoryListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(['created_at', 'updated_at', 'name']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
});

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(250)
});

const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(250)
});
```

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
interface CategoryResponse {
  id: string;
  name: string;
  flashcard_count: number;
  created_at: string;
  updated_at: string;
}

interface CategoryListResponse {
  data: CategoryResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface SingleCategoryResponse {
  data: CategoryResponse;
}
```

### Kody stanu HTTP
- **200 OK**: Successful retrieval/update
- **201 Created**: Successful creation
- **204 No Content**: Successful deletion
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: No authentication
- **404 Not Found**: Category not found
- **409 Conflict**: Name already exists
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server errors

## 4. Przepływ danych

### GET /api/categories Flow
1. **Authentication Check**: Verify user via `auth.uid()`
2. **Query Validation**: Validate pagination parameters
3. **Database Query**: 
   ```sql
   SELECT c.*, COUNT(f.id) as flashcard_count
   FROM categories c
   LEFT JOIN flashcards f ON c.id = f.category_id
   WHERE c.user_id = auth.uid()
   GROUP BY c.id
   ORDER BY c.{sort} {order}
   LIMIT {limit} OFFSET {offset}
   ```
4. **Count Query**: Get total count for pagination
5. **Response Formation**: Build paginated response

### POST /api/categories Flow
1. **Authentication Check**: Verify user authentication
2. **Input Validation**: Validate name
3. **Uniqueness Check**: Verify name uniqueness for user
4. **Database Insert**:
   ```sql
   INSERT INTO categories (user_id, name)
   VALUES (auth.uid(), $1)
   RETURNING *
   ```
5. **Response Formation**: Return created category with flashcard_count = 0

### PATCH /api/categories/{id} Flow
1. **Authentication & Authorization**: Verify ownership
2. **Existence Check**: Verify category exists
3. **Input Validation**: Validate name update
4. **Uniqueness Check**: Check name uniqueness for user
5. **Database Update**:
   ```sql
   UPDATE categories 
   SET name = $1, 
       updated_at = NOW()
   WHERE id = $2 AND user_id = auth.uid()
   RETURNING *
   ```
6. **Flashcard Count**: Query flashcard count
7. **Response Formation**: Return updated category

### DELETE /api/categories/{id} Flow
1. **Authentication & Authorization**: Verify ownership
2. **Existence Check**: Verify category exists
3. **SET NULL Delete**:
   ```sql
   DELETE FROM categories 
   WHERE id = $1 AND user_id = auth.uid()
   ```
   (Foreign key constraint automatically sets flashcards.category_id to NULL)
4. **Success Response**: 204 No Content

## 5. Względy bezpieczeństwa

### Row Level Security (RLS)
```sql
CREATE POLICY categories_user_isolation ON categories
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
- Brak możliwości dostępu do cudzych kategorii

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
    code: "CATEGORY_NAME_EXISTS",
    message: "A category with this name already exists",
    details: { field: "name" }
  }
}

// 404 Not Found
{
  error: {
    code: "CATEGORY_NOT_FOUND", 
    message: "Category not found or access denied"
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
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_user_name ON categories(user_id, name);

-- For flashcard counting
CREATE INDEX idx_flashcards_category_id ON flashcards(category_id);
```

### Query Optimizations
- Use of LEFT JOIN for flashcard counting
- LIMIT/OFFSET for pagination
- Single query for list with counts
- Efficient sorting with indexed columns

### Caching Strategy
- Consider caching total counts for large datasets
- Cache user category lists for frequent access
- Invalidate cache on CRUD operations

### Performance Monitoring
- Track query execution times
- Monitor database connection usage
- Log slow queries for optimization

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/categories/
├── index.ts (GET, POST)
├── [id].ts (PATCH, DELETE)
src/lib/services/
├── CategoriesService.ts
src/lib/schemas/
├── categories.ts
src/types/
├── categories.ts
src/lib/errors/
├── CategoryErrors.ts
├── CategoryNotFoundError.ts
├── CategoryNameExistsError.ts
├── CategoryValidationError.ts
├── UnauthorizedCategoryAccessError.ts
src/lib/utils/
├── category-validation.ts
├── category-flashcard-counting.ts
```

### Krok 2: Typy i schemas
```typescript
// src/types/categories.ts
export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithCount extends Category {
  flashcard_count: number;
}

// src/lib/schemas/categories.ts
export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(250)
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(250)
});
```

### Krok 3: Service Layer
```typescript
// src/lib/services/CategoriesService.ts
export class CategoriesService {
  constructor(private supabase: SupabaseClient) {}

  async getCategories(userId: string, query: CategoryListQuery) {
    // Implementation with LEFT JOIN for flashcard counting
  }

  async createCategory(userId: string, data: CreateCategoryRequest) {
    // Implementation with uniqueness check
  }

  async updateCategory(userId: string, id: string, data: UpdateCategoryRequest) {
    // Implementation with ownership and uniqueness checks
  }

  async deleteCategory(userId: string, id: string) {
    // Implementation with ownership check (SET NULL handled by FK)
  }

  private async checkNameUniqueness(userId: string, name: string, excludeId?: string) {
    // Check if name exists for user, optionally excluding specific ID
  }

  private async getFlashcardCount(categoryId: string) {
    // Count flashcards in category
  }

  private async categoryExists(userId: string, id: string) {
    // Verify category exists and belongs to user
  }
}
```

### Krok 4: API Routes

#### src/pages/api/categories/index.ts
```typescript
import type { APIRoute } from 'astro';
import { CategoriesService } from '../../lib/services/CategoriesService';
import { CategoryListQuerySchema, CreateCategorySchema } from '../../lib/schemas/categories';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const queryParams = Object.fromEntries(url.searchParams);
    const validatedQuery = CategoryListQuerySchema.parse(queryParams);
    
    const categoriesService = new CategoriesService(locals.supabase);
    const result = await categoriesService.getCategories(user.id, validatedQuery);
    
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
    const validatedData = CreateCategorySchema.parse(body);
    
    const categoriesService = new CategoriesService(locals.supabase);
    const result = await categoriesService.createCategory(user.id, validatedData);
    
    return new Response(JSON.stringify({ data: result }), { status: 201 });
  } catch (error) {
    // Error handling
  }
};
```

#### src/pages/api/categories/[id].ts
```typescript
import type { APIRoute } from 'astro';
import { CategoriesService } from '../../../lib/services/CategoriesService';
import { UpdateCategorySchema } from '../../../lib/schemas/categories';

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const categoryId = params.id;
    if (!categoryId) {
      return new Response(JSON.stringify({ 
        error: { code: "INVALID_REQUEST", message: "Category ID is required" }
      }), { status: 400 });
    }

    const body = await request.json();
    const validatedData = UpdateCategorySchema.parse(body);
    
    const categoriesService = new CategoriesService(locals.supabase);
    const result = await categoriesService.updateCategory(user.id, categoryId, validatedData);
    
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

    const categoryId = params.id;
    if (!categoryId) {
      return new Response(JSON.stringify({ 
        error: { code: "INVALID_REQUEST", message: "Category ID is required" }
      }), { status: 400 });
    }
    
    const categoriesService = new CategoriesService(locals.supabase);
    await categoriesService.deleteCategory(user.id, categoryId);
    
    return new Response(null, { status: 204 });
  } catch (error) {
    // Error handling
  }
};
```

### Krok 5: Error Handling
```typescript
// src/lib/errors/CategoryErrors.ts
export class CategoryNotFoundError extends Error {
  constructor() {
    super('Category not found or access denied');
    this.name = 'CategoryNotFoundError';
  }
}

export class CategoryNameExistsError extends Error {
  constructor() {
    super('A category with this name already exists');
    this.name = 'CategoryNameExistsError';
  }
}

// Error handler utility
export function handleCategoryError(error: any) {
  if (error instanceof CategoryNotFoundError) {
    return { status: 404, code: "CATEGORY_NOT_FOUND" };
  }
  if (error instanceof CategoryNameExistsError) {
    return { status: 409, code: "CATEGORY_NAME_EXISTS" };
  }
  // ... other error types
}
```

### Krok 6: Testing
- Unit tests dla CategoriesService
- Integration tests dla API endpoints
- Edge case testing (empty data, large datasets)
- Authentication & authorization testing
- Performance testing z paginacją
- Testing SET NULL behavior on category deletion

### Krok 7: Documentation
- API documentation z przykładami
- Error codes documentation
- Usage examples dla frontend
- Database schema documentation
- SET NULL behavior documentation

### Krok 8: Deployment
- Database migrations (tables already exist)
- Environment variables setup
- Performance monitoring setup
- Error tracking integration

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ Kompletny CRUD API dla kategorii
- ✅ Bezpieczną user isolation
- ✅ Wydajną paginację i sortowanie
- ✅ Proper error handling
- ✅ MVP-ready functionality
- ✅ Scalable architecture
- ✅ Security best practices
- ✅ Performance optimizations
- ✅ SET NULL behavior handling

Plan jest gotowy do implementacji przez zespół programistów z jasno określonymi krokami i strukturą. 
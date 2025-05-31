Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### Flashcards Endpoints

#### GET /api/flashcards
- **Description**: Retrieve user's flashcards
- **Query Parameters**:
  - `limit` (integer, default: 20, max: 100)
  - `offset` (integer, default: 0)
  - `sort` (string: 'created_at', 'updated_at', 'name', default: 'created_at')
  - `order` (string: 'asc', 'desc', default: 'desc')
  - `collection_id` (uuid, optional)
  - `category_id` (uuid, optional)
  - `created_by` (string: 'manual', 'ai_generated', optional)
  - `due` (boolean, optional) - only flashcards due for review
- **Response**: 200 OK
```json
{
  "data": [
    {
      "id": "uuid",
      "collection_id": "uuid",
      "category_id": "uuid",
      "front": "string",
      "back": "string",
      "easiness_factor": 2.5,
      "interval": 1,
      "repetitions": 0,
      "next_review_date": "2025-06-01T14:00:00Z",
      "created_by": "manual",
      "created_at": "2025-05-31T14:00:00Z",
      "updated_at": "2025-05-31T14:00:00Z"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```
- **Error Codes**: 401 Unauthorized, 500 Internal Server Error

#### POST /api/flashcards
- **Description**: Create new flashcard manually
- **Request Body**:
```json
{
  "collection_id": "uuid", // required
  "category_id": "uuid", // optional
  "front": "string", // required, max 200 chars
  "back": "string" // required, max 500 chars
}
```
- **Response**: 201 Created
```json
{
  "data": {
    "id": "uuid",
    "collection_id": "uuid",
    "category_id": "uuid",
    "front": "string",
    "back": "string",
    "easiness_factor": 2.5,
    "interval": 1,
    "repetitions": 0,
    "next_review_date": "2025-06-01T14:00:00Z",
    "created_by": "manual",
    "created_at": "2025-05-31T14:00:00Z",
    "updated_at": "2025-05-31T14:00:00Z"
  }
}
```
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found (collection/category), 422 Unprocessable Entity

#### PATCH /api/flashcards/{id}
- **Description**: Update flashcard
- **Request Body**: Same as POST (all fields optional)
- **Response**: 200 OK (same structure as POST response)
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 422 Unprocessable Entity

#### DELETE /api/flashcards/{id}
- **Description**: Delete flashcard
- **Response**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found
</route_api_specification>

2. Related database resources:
<related_db_resources>
### Flashcards Table
```sql
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    front VARCHAR(200) NOT NULL,
    back VARCHAR(500) NOT NULL,
    
    -- SM-2 Algorithm Parameters
    easiness_factor DECIMAL(3,2) NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 1,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_date TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ,
    
    created_by flashcard_created_by NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT flashcards_front_length CHECK (length(front) <= 200 AND length(front) > 0),
    CONSTRAINT flashcards_back_length CHECK (length(back) <= 500 AND length(back) > 0),
    CONSTRAINT flashcards_easiness_factor_range CHECK (easiness_factor >= 1.3 AND easiness_factor <= 2.5),
    CONSTRAINT flashcards_interval_positive CHECK (interval > 0),
    CONSTRAINT flashcards_repetitions_non_negative CHECK (repetitions >= 0)
);
```

### Related Tables
- **Collections**: References collection_id (required)
- **Categories**: References category_id (optional)
- **Study_Sessions**: Flashcards are reviewed in sessions

### Indexes
```sql
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_collection_id ON flashcards(collection_id);
CREATE INDEX idx_flashcards_category_id ON flashcards(category_id);
CREATE INDEX idx_flashcards_next_review_date ON flashcards(next_review_date);
CREATE INDEX idx_flashcards_user_next_review ON flashcards(user_id, next_review_date);
CREATE INDEX idx_flashcards_created_by ON flashcards(created_by);
```

### RLS Policy
```sql
CREATE POLICY flashcards_user_isolation ON flashcards
    FOR ALL USING (auth.uid() = user_id);
```
</related_db_resources>

3. Definicje typów:
<type_definitions>
Referencje do typów z `src/db/database.types.ts`:

```typescript
// Flashcards types from database.types.ts
Tables<'flashcards'> // Row type
TablesInsert<'flashcards'> // Insert type  
TablesUpdate<'flashcards'> // Update type
```

Struktura tabeli flashcards:
- id: string (UUID)
- user_id: string (UUID)
- collection_id: string (UUID, required)
- category_id: string | null (UUID, optional)
- front: string (max 200 chars)
- back: string (max 500 chars)
- easiness_factor: number (1.3-2.5, SM-2 parameter)
- interval: number (positive integer, SM-2 parameter)
- repetitions: number (non-negative integer, SM-2 parameter)
- next_review_date: string (TIMESTAMPTZ)
- created_by: 'manual' | 'ai_generated'
- created_at: string | null (TIMESTAMPTZ)
- updated_at: string | null (TIMESTAMPTZ)
</type_definitions>

4. Tech stack:
<tech_stack>
Referencje do `tech-stack.md`:

**Frontend**: Astro 5 z React 19 dla komponentów interaktywnych, TypeScript 5, Tailwind 4, Shadcn/ui

**Backend**: Supabase jako kompleksowe rozwiązanie backendowe (PostgreSQL + Auth + SDK)

**AI**: Komunikacja z modelami przez OPENROUTER.ai

**CI/CD i Hosting**: Github Actions + DigitalOcean z obrazami Docker
</tech_stack>

5. Implementation rules:
<implementation_rules>
Referencje do zasad implementacji z `api-supabase-astro-init.mdc` oraz backend guidelines:

### Supabase Integration
- Use supabase from context.locals in Astro routes instead of importing supabaseClient directly
- Use SupabaseClient type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`
- Follow Supabase guidelines for security and performance
- Use Zod schemas to validate data exchanged with the backend

### Astro API Routes
- Create endpoints in `src/pages/api/` directory
- Use proper HTTP methods (GET, POST, PATCH, DELETE)
- Return JSON responses with consistent format
- Handle authentication via Supabase Auth middleware

### Error Handling
- Use early returns for error conditions
- Implement proper error logging and user-friendly error messages
- Handle errors and edge cases at the beginning of functions
- Avoid deeply nested if statements

### Security
- Implement Row Level Security through Supabase
- Validate all input data using Zod schemas
- Use auth.uid() for user identification
- Never expose sensitive data in responses

### SM-2 Algorithm
- Initialize new flashcards with default SM-2 parameters (easiness_factor=2.5, interval=1, repetitions=0)
- Validate SM-2 parameters are within acceptable ranges
- Set next_review_date to tomorrow for new flashcards
</implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointów Flashcards API. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API dla Flashcards.
2. Wymień wymagane i opcjonalne parametry ze specyfikacji API.
3. Wymień niezbędne typy DTO i Command Modele.
4. Zastanów się, jak wyodrębnić logikę do service (FlashcardsService).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API Flashcards.
6. Określenie sposobu obsługi błędów specyficznych dla Flashcards.
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa dla Flashcards API.
8. Nakreśl potencjalne scenariusze błędów i odpowiadające im kody stanu.

Po przeprowadzeniu analizy utwórz szczegółowy plan wdrożenia w formacie markdown. Plan powinien zawierać następujące sekcje:

1. Przegląd punktu końcowego
2. Szczegóły żądania
3. Szczegóły odpowiedzi
4. Przepływ danych
5. Względy bezpieczeństwa
6. Obsługa błędów
7. Wydajność
8. Kroki implementacji

W całym planie upewnij się, że:
- Używać prawidłowych kodów stanu API:
  - 200 dla pomyślnego odczytu
  - 201 dla pomyślnego utworzenia
  - 400 dla nieprawidłowych danych wejściowych
  - 401 dla nieautoryzowanego dostępu
  - 404 dla nie znalezionych zasobów
  - 422 dla błędów walidacji
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji
- Uwzględnij specyficzne wymagania SM-2 Algorithm

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown.

Pamiętaj, aby zapisać swój plan wdrożenia jako `.ai/flashcards-implementation-plan.md`. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów. 
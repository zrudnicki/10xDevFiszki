Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### Categories Endpoints

#### GET /api/categories
- **Description**: Retrieve user's categories
- **Query Parameters**: 
  - `limit` (integer, default: 20, max: 100)
  - `offset` (integer, default: 0)
  - `sort` (string: 'created_at', 'updated_at', 'name', default: 'created_at')
  - `order` (string: 'asc', 'desc', default: 'desc')
- **Response**: 200 OK
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "flashcard_count": 0,
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

#### POST /api/categories
- **Description**: Create new category
- **Request Body**:
```json
{
  "name": "string" // required, max 250 chars
}
```
- **Response**: 201 Created
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "flashcard_count": 0,
    "created_at": "2025-05-31T14:00:00Z",
    "updated_at": "2025-05-31T14:00:00Z"
  }
}
```
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 409 Conflict (name exists), 422 Unprocessable Entity

#### PATCH /api/categories/{id}
- **Description**: Update category
- **Request Body**:
```json
{
  "name": "string" // required, max 250 chars
}
```
- **Response**: 200 OK (same structure as POST response)
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict

#### DELETE /api/categories/{id}
- **Description**: Delete category (sets flashcards category_id to null)
- **Response**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found
</route_api_specification>

2. Related database resources:
<related_db_resources>
### Categories Table
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(250) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT categories_name_length CHECK (length(name) <= 250),
    CONSTRAINT categories_user_name_unique UNIQUE (user_id, name)
);
```

### Related Tables
- **Flashcards**: References category_id with SET NULL on delete

### Indexes
```sql
CREATE INDEX idx_categories_user_id ON categories(user_id);
```

### RLS Policy
```sql
CREATE POLICY categories_user_isolation ON categories
    FOR ALL USING (auth.uid() = user_id);
```
</related_db_resources>

3. Definicje typów:
<type_definitions>
Referencje do typów z `src/db/database.types.ts`:

```typescript
// Categories types from database.types.ts
Tables<'categories'> // Row type
TablesInsert<'categories'> // Insert type  
TablesUpdate<'categories'> // Update type
```

Struktura tabeli categories:
- id: string (UUID)
- user_id: string (UUID)
- name: string (max 250 chars)
- description: string | null
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
</implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointów Categories API. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API dla Categories.
2. Wymień wymagane i opcjonalne parametry ze specyfikacji API.
3. Wymień niezbędne typy DTO i Command Modele.
4. Zastanów się, jak wyodrębnić logikę do service (CategoriesService).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API Categories.
6. Określenie sposobu obsługi błędów specyficznych dla Categories.
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa dla Categories API.
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
  - 409 dla konfliktów (nazwa już istnieje)
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown.

Pamiętaj, aby zapisać swój plan wdrożenia jako `.ai/categories-implementation-plan.md`. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów. 
Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### Collections Endpoints

#### GET /api/collections
- **Description**: Retrieve user's collections
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
      "description": "string",
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

#### POST /api/collections
- **Description**: Create new collection
- **Request Body**:
```json
{
  "name": "string", // required, max 250 chars
  "description": "string" // optional
}
```
- **Response**: 201 Created
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "flashcard_count": 0,
    "created_at": "2025-05-31T14:00:00Z",
    "updated_at": "2025-05-31T14:00:00Z"
  }
}
```
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 409 Conflict (name exists), 422 Unprocessable Entity

#### GET /api/collections/{id}
- **Description**: Retrieve specific collection
- **Response**: 200 OK (same structure as POST response)
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### PATCH /api/collections/{id}
- **Description**: Update collection
- **Request Body**:
```json
{
  "name": "string", // optional, max 250 chars
  "description": "string" // optional
}
```
- **Response**: 200 OK (same structure as POST response)
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict

#### DELETE /api/collections/{id}
- **Description**: Delete collection and all flashcards
- **Response**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found
</route_api_specification>

2. Related database resources:
<related_db_resources>
### Collections Table
```sql
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(250) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT collections_name_length CHECK (length(name) <= 250),
    CONSTRAINT collections_user_name_unique UNIQUE (user_id, name)
);
```

### Related Tables
- **Flashcards**: References collection_id with CASCADE DELETE
- **Study_Sessions**: References collection_id with CASCADE DELETE

### Indexes
```sql
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_user_created_at ON collections(user_id, created_at DESC);
```

### RLS Policy
```sql
CREATE POLICY collections_user_isolation ON collections
    FOR ALL USING (auth.uid() = user_id);
```
</related_db_resources>

3. Definicje typów:
<type_definitions>
Referencje do typów z `src/db/database.types.ts`:

```typescript
// Collections types from database.types.ts
Tables<'collections'> // Row type
TablesInsert<'collections'> // Insert type  
TablesUpdate<'collections'> // Update type
```

Struktura tabeli collections:
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

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointów Collections API. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API dla Collections.
2. Wymień wymagane i opcjonalne parametry ze specyfikacji API.
3. Wymień niezbędne typy DTO i Command Modele.
4. Zastanów się, jak wyodrębnić logikę do service (CollectionsService).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API Collections.
6. Określenie sposobu obsługi błędów specyficznych dla Collections.
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa dla Collections API.
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

Pamiętaj, aby zapisać swój plan wdrożenia jako `.ai/collections-implementation-plan.md`. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów. 
Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktów końcowych REST API dla Collections. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tych punktów końcowych.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### 2.2 Collections

#### List Collections
- **Method**: GET
- **Path**: `/api/collections`
- **Description**: Get user's flashcard collections
- **Query Parameters**:
  - `page` (optional, default=1) - Page number
  - `limit` (optional, default=20, max=100) - Items per page
  - `sort` (optional, default=created_at) - Sort field (name, created_at)
  - `order` (optional, default=desc) - Sort order (asc, desc)
- **Response**: 200 OK
```json
{
  "collections": [
    {
      "id": "uuid",
      "name": "JavaScript Fundamentals",
      "description": "Core JS concepts and syntax",
      "flashcardCount": 25,
      "createdAt": "2025-01-10T12:00:00Z",
      "updatedAt": "2025-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Create Collection
- **Method**: POST
- **Path**: `/api/collections`
- **Request Body**:
```json
{
  "name": "React Hooks",
  "description": "useState, useEffect, custom hooks"
}
```
- **Response**: 201 Created
```json
{
  "id": "uuid",
  "name": "React Hooks", 
  "description": "useState, useEffect, custom hooks",
  "flashcardCount": 0,
  "createdAt": "2025-01-15T16:45:00Z",
  "updatedAt": "2025-01-15T16:45:00Z"
}
```
- **Error Codes**:
  - 400 Bad Request - Name too long (>250 chars) or duplicate name
  - 422 Unprocessable Entity - Validation errors

#### Update Collection
- **Method**: PUT
- **Path**: `/api/collections/{id}`
- **Request Body**:
```json
{
  "name": "React Hooks Advanced",
  "description": "Advanced patterns with hooks"
}
```
- **Response**: 200 OK (same structure as create)
- **Error Codes**: 
  - 404 Not Found - Collection doesn't exist or not owned by user
  - 400 Bad Request - Validation errors

#### Delete Collection
- **Method**: DELETE
- **Path**: `/api/collections/{id}`
- **Response**: 204 No Content
- **Error Codes**: 404 Not Found
</route_api_specification>

2. Related database resources:
<related_db_resources>
### 2.2 Collections
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

### Relacje:
- **Users ↔ Collections**: 1:N (jeden użytkownik może mieć wiele kolekcji)
- **Collections ↔ Flashcards**: 1:N (jedna kolekcja może zawierać wiele fiszek)
- **Collections ↔ Study_Sessions**: 1:N (jedna kolekcja może mieć wiele sesji nauki)

### Indeksy:
```sql
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_user_created_at ON collections(user_id, created_at DESC);
```

### RLS Policies:
```sql
CREATE POLICY collections_user_isolation ON collections
    FOR ALL USING (auth.uid() = user_id);
```
</related_db_resources>

3. Definicje typów:
<type_definitions>
@database.types.ts - Collections related types:

```typescript
collections: {
  Row: {
    created_at: string
    description: string | null
    id: string
    name: string
    updated_at: string
    user_id: string
  }
  Insert: {
    created_at?: string
    description?: string | null
    id?: string
    name: string
    updated_at?: string
    user_id: string
  }
  Update: {
    created_at?: string
    description?: string | null
    id?: string
    name?: string
    updated_at?: string
    user_id?: string
  }
  Relationships: []
}
```
</type_definitions>

4. Tech stack:
<tech_stack>
@tech-stack.md - 
Frontend - Astro z React dla komponentów interaktywnych:
- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:
- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę OPENROUTER.ai:
- Dostęp do szerokiej gamy modeli (OpenRouter API, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

CI/CD i Hosting:
- Github Actions do tworzenia pipeline'ów CI/CD
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker
</tech_stack>

5. Implementation rules:
<implementation_rules>
@api-supabase-astro-init - Supabase Astro Initialization rules:
- Use Supabase for backend services, including authentication and database interactions
- Follow Supabase guidelines for security and performance
- Use Zod schemas to validate data exchanged with the backend
- Use supabase from context.locals in Astro routes instead of importing supabaseClient directly
- Use SupabaseClient type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`

@backend - Backend rules:
- Use Supabase for backend services, including authentication and database interactions
- Follow Supabase guidelines for security and performance
- Use Zod schemas to validate data exchanged with the backend
- Use supabase from context.locals in Astro routes instead of importing supabaseClient directly
- Use SupabaseClient type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`
</implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointów Collections API REST. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API dla Collections.
2. Wymień wymagane i opcjonalne parametry ze specyfikacji API.
3. Wymień niezbędne typy DTO i Command Modele.
4. Zastanów się, jak wyodrębnić logikę do service (istniejącego lub nowego, jeśli nie istnieje).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API endpointa, zasobami bazy danych i regułami implementacji.
6. Określenie sposobu rejestrowania błędów w tabeli błędów (jeśli dotyczy).
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa w oparciu o specyfikację API i stack technologiczny.
8. Nakreśl potencjalne scenariusze błędów i odpowiadające im kody stanu.

Po przeprowadzeniu analizy utwórz szczegółowy plan wdrożenia w formacie markdown. Plan powinien zawierać następujące sekcje:

1. Przegląd punktów końcowych
2. Szczegóły żądań
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
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown zapisany jako `.ai/api-collections-implementation-plan.md`. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów. 
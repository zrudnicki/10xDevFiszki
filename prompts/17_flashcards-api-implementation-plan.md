Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktów końcowych REST API dla Flashcards. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tych punktów końcowych.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### 2.4 Flashcards

#### List Flashcards
- **Method**: GET
- **Path**: `/api/flashcards`
- **Query Parameters**:
  - `collectionId` (optional) - Filter by collection
  - `categoryId` (optional) - Filter by category  
  - `dueForReview` (optional, boolean) - Only cards due for review
  - `createdBy` (optional) - Filter by creation method (manual, ai_generated)
  - Standard pagination parameters
- **Response**: 200 OK
```json
{
  "flashcards": [
    {
      "id": "uuid",
      "front": "What is closure in JavaScript?",
      "back": "A closure is a function that has access to variables in its outer scope even after the outer function returns",
      "collectionId": "uuid",
      "categoryId": "uuid", 
      "easinessFactor": 2.5,
      "interval": 1,
      "repetitions": 0,
      "nextReviewDate": "2025-01-16T00:00:00Z",
      "createdBy": "ai_generated",
      "createdAt": "2025-01-15T12:00:00Z",
      "updatedAt": "2025-01-15T12:00:00Z"
    }
  ],
  "pagination": { /* standard pagination */ }
}
```

#### Create Flashcard
- **Method**: POST
- **Path**: `/api/flashcards`
- **Request Body**:
```json
{
  "front": "What is React useState?",
  "back": "A Hook that lets you add state to functional components",
  "collectionId": "uuid",
  "categoryId": "uuid"
}
```
- **Response**: 201 Created (same structure as list item)
- **Error Codes**:
  - 400 Bad Request - Front >200 chars, back >500 chars, invalid references
  - 422 Unprocessable Entity - Validation errors

#### Generate Flashcards with AI
- **Method**: POST
- **Path**: `/api/flashcards/generate`
- **Request Body**:
```json
{
  "text": "JavaScript closures are a fundamental concept...", 
  "targetCount": 10
}
```
- **Response**: 200 OK
```json
{
  "candidates": [
    {
      "front": "What is a closure?",
      "back": "A function that retains access to its outer scope variables",
      "confidence": 0.92
    }
  ],
  "generationId": "uuid",
  "totalGenerated": 8
}
```
- **Error Codes**:
  - 400 Bad Request - Text length not in 1000-10000 range
  - 429 Too Many Requests - Rate limiting
  - 503 Service Unavailable - AI service error

#### Review Generated Flashcards
- **Method**: POST
- **Path**: `/api/flashcards/review`
- **Request Body**:
```json
{
  "generationId": "uuid",
  "collectionId": "uuid",
  "categoryId": "uuid",
  "decisions": [
    {
      "candidateIndex": 0,
      "action": "accept",
      "front": "What is a closure?",
      "back": "A function that retains access to its outer scope variables"
    },
    {
      "candidateIndex": 1, 
      "action": "accept_edited",
      "front": "Edited question about scope",
      "back": "Edited answer about scope"
    },
    {
      "candidateIndex": 2,
      "action": "reject"
    }
  ]
}
```
- **Response**: 201 Created
```json
{
  "acceptedFlashcards": [
    {
      "id": "uuid",
      "front": "What is a closure?",
      "back": "A function that retains access to its outer scope variables",
      "collectionId": "uuid",
      "categoryId": "uuid",
      "createdBy": "ai_generated"
    }
  ],
  "stats": {
    "totalCandidates": 8,
    "acceptedDirect": 5,
    "acceptedEdited": 2,
    "rejected": 1
  }
}
```

#### Update Flashcard
- **Method**: PUT
- **Path**: `/api/flashcards/{id}`
- **Request Body**:
```json
{
  "front": "Updated question",
  "back": "Updated answer",
  "categoryId": "uuid"
}
```
- **Response**: 200 OK

#### Delete Flashcard
- **Method**: DELETE
- **Path**: `/api/flashcards/{id}`
- **Response**: 204 No Content
</route_api_specification>

2. Related database resources:
<related_db_resources>
### 2.4 Flashcards
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

### Relacje:
- **Users ↔ Flashcards**: 1:N (jeden użytkownik może mieć wiele fiszek)
- **Collections ↔ Flashcards**: 1:N (jedna kolekcja może zawierać wiele fiszek)
- **Categories ↔ Flashcards**: 1:N (jedna kategoria może być przypisana do wielu fiszek)

### Indeksy:
```sql
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_collection_id ON flashcards(collection_id);
CREATE INDEX idx_flashcards_category_id ON flashcards(category_id);
CREATE INDEX idx_flashcards_next_review_date ON flashcards(next_review_date);
CREATE INDEX idx_flashcards_user_next_review ON flashcards(user_id, next_review_date);
CREATE INDEX idx_flashcards_created_by ON flashcards(created_by);
```

### RLS Policies:
```sql
CREATE POLICY flashcards_user_isolation ON flashcards
    FOR ALL USING (auth.uid() = user_id);
```

### Enums:
```sql
CREATE TYPE flashcard_created_by AS ENUM ('manual', 'ai_generated');
```
</related_db_resources>

3. Definicje typów:
<type_definitions>
@database.types.ts - Flashcards related types:

```typescript
flashcards: {
  Row: {
    back: string
    category_id: string | null
    collection_id: string
    created_at: string
    created_by: Database["public"]["Enums"]["flashcard_created_by"]
    easiness_factor: number
    front: string
    id: string
    interval: number
    next_review_date: string
    repetitions: number
    updated_at: string
    user_id: string
  }
  Insert: {
    back: string
    category_id?: string | null
    collection_id: string
    created_at?: string
    created_by?: Database["public"]["Enums"]["flashcard_created_by"]
    easiness_factor?: number
    front: string
    id?: string
    interval?: number
    next_review_date?: string
    repetitions?: number
    updated_at?: string
    user_id: string
  }
  Update: {
    back?: string
    category_id?: string | null
    collection_id?: string
    created_at?: string
    created_by?: Database["public"]["Enums"]["flashcard_created_by"]
    easiness_factor?: number
    front?: string
    id?: string
    interval?: number
    next_review_date?: string
    repetitions?: number
    updated_at?: string
    user_id?: string
  }
  Relationships: [
    {
      foreignKeyName: "flashcards_category_id_fkey"
      columns: ["category_id"]
      isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "flashcards_collection_id_fkey"
      columns: ["collection_id"]
      isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    }
  ]
}

Enums: {
  flashcard_created_by: "manual" | "ai_generated"
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

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointów Flashcards API REST. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API dla Flashcards.
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

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown zapisany jako `.ai/api-flashcards-implementation-plan.md`. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów. 
Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktów końcowych REST API dla Study Sessions. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tych punktów końcowych.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### 2.5 Study Sessions

#### Start Study Session
- **Method**: POST
- **Path**: `/api/study-sessions`
- **Request Body**:
```json
{
  "collectionId": "uuid",
  "studyType": "review" // or "new"
}
```
- **Response**: 201 Created
```json
{
  "sessionId": "uuid",
  "collectionId": "uuid", 
  "flashcardsToReview": [
    {
      "id": "uuid",
      "front": "What is closure?",
      "back": "A function with access to outer scope"
    }
  ],
  "totalFlashcards": 15,
  "startedAt": "2025-01-15T17:00:00Z"
}
```

#### Submit Study Response
- **Method**: PUT
- **Path**: `/api/study-sessions/{sessionId}/response`
- **Request Body**:
```json
{
  "flashcardId": "uuid",
  "quality": 4, // SM-2 quality rating 0-5
  "responseTime": 8500 // milliseconds
}
```
- **Response**: 200 OK
```json
{
  "nextFlashcard": {
    "id": "uuid",
    "front": "Next question",
    "back": "Next answer"
  },
  "updatedParameters": {
    "easinessFactor": 2.6,
    "interval": 6, 
    "repetitions": 2,
    "nextReviewDate": "2025-01-21T00:00:00Z"
  },
  "sessionProgress": {
    "completed": 8,
    "remaining": 7
  }
}
```

#### Complete Study Session
- **Method**: PUT
- **Path**: `/api/study-sessions/{sessionId}/complete`
- **Response**: 200 OK
```json
{
  "sessionId": "uuid",
  "duration": 127, // seconds
  "flashcardsReviewed": 15,
  "averageResponseTime": 6800,
  "completedAt": "2025-01-15T17:15:23Z"
}
```

#### Get Active Study Session
- **Method**: GET
- **Path**: `/api/study-sessions/active`
- **Response**: 200 OK or 404 if no active session
</route_api_specification>

2. Related database resources:
<related_db_resources>
### 2.5 Study_Sessions
```sql
CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    flashcards_reviewed_count INTEGER NOT NULL DEFAULT 0,
    status session_status NOT NULL DEFAULT 'active',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT study_sessions_flashcards_count_non_negative CHECK (flashcards_reviewed_count >= 0),
    CONSTRAINT study_sessions_ended_after_started CHECK (ended_at IS NULL OR ended_at >= started_at)
);
```

### Relacje:
- **Users ↔ Study_Sessions**: 1:N (jeden użytkownik może mieć wiele sesji)
- **Collections ↔ Study_Sessions**: 1:N (jedna kolekcja może mieć wiele sesji nauki)

### Indeksy:
```sql
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_collection_id ON study_sessions(collection_id);
CREATE INDEX idx_study_sessions_user_started_at ON study_sessions(user_id, started_at DESC);
CREATE INDEX idx_study_sessions_status ON study_sessions(status) WHERE status = 'active';
```

### RLS Policies:
```sql
CREATE POLICY study_sessions_user_isolation ON study_sessions
    FOR ALL USING (auth.uid() = user_id);
```

### Enums:
```sql
CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned');
```

### Business Logic:
- **Automatic Timeout**: Sessions auto-expire after 30 minutes of inactivity
- **Progress Persistence**: Partial progress saved for session continuation
- **SM-2 Algorithm Integration**: Update flashcard parameters based on quality responses
- **Completion Tracking**: Detailed metrics for study effectiveness
</related_db_resources>

3. Definicje typów:
<type_definitions>
@database.types.ts - Study Sessions related types:

```typescript
study_sessions: {
  Row: {
    collection_id: string
    created_at: string
    ended_at: string | null
    flashcards_reviewed_count: number
    id: string
    started_at: string
    status: Database["public"]["Enums"]["session_status"]
    updated_at: string
    user_id: string
  }
  Insert: {
    collection_id: string
    created_at?: string
    ended_at?: string | null
    flashcards_reviewed_count?: number
    id?: string
    started_at?: string
    status?: Database["public"]["Enums"]["session_status"]
    updated_at?: string
    user_id: string
  }
  Update: {
    collection_id?: string
    created_at?: string
    ended_at?: string | null
    flashcards_reviewed_count?: number
    id?: string
    started_at?: string
    status?: Database["public"]["Enums"]["session_status"]
    updated_at?: string
    user_id?: string
  }
  Relationships: [
    {
      foreignKeyName: "study_sessions_collection_id_fkey"
      columns: ["collection_id"]
      isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    }
  ]
}

Enums: {
  session_status: "active" | "completed" | "abandoned"
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

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointów Study Sessions API REST. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API dla Study Sessions.
2. Wymień wymagane i opcjonalne parametry ze specyfikacją API.
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

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown zapisany jako `.ai/api-study-sessions-implementation-plan.md`. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów. 
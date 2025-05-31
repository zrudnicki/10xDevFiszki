Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### Study Sessions Endpoints

#### POST /api/study-sessions
- **Description**: Start new study session
- **Request Body**:
```json
{
  "collection_id": "uuid", // required
  "max_cards": 20 // optional, default: 10
}
```
- **Response**: 201 Created
```json
{
  "data": {
    "id": "uuid",
    "collection_id": "uuid",
    "status": "active",
    "cards_to_review": 5,
    "current_card": {
      "id": "uuid",
      "front": "string",
      "back": "string"
    },
    "progress": {
      "reviewed": 0,
      "remaining": 5
    },
    "started_at": "2025-05-31T14:00:00Z"
  }
}
```
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### GET /api/study-sessions/{id}
- **Description**: Get current study session state
- **Response**: 200 OK (same structure as POST response)
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### PATCH /api/study-sessions/{id}/answer
- **Description**: Submit answer for current flashcard
- **Request Body**:
```json
{
  "flashcard_id": "uuid", // required
  "quality": 5, // required, 0-5 (SM-2 quality rating)
  "response_time_ms": 3000 // optional
}
```
- **Response**: 200 OK
```json
{
  "data": {
    "session_id": "uuid",
    "status": "active", // or "completed"
    "next_card": {
      "id": "uuid",
      "front": "string",
      "back": "string"
    },
    "progress": {
      "reviewed": 1,
      "remaining": 4
    },
    "updated_sm2_params": {
      "easiness_factor": 2.36,
      "interval": 2,
      "repetitions": 1,
      "next_review_date": "2025-06-02T14:00:00Z"
    }
  }
}
```
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 422 Unprocessable Entity

#### PATCH /api/study-sessions/{id}/complete
- **Description**: End study session
- **Response**: 200 OK
```json
{
  "data": {
    "id": "uuid",
    "status": "completed",
    "stats": {
      "flashcards_reviewed": 5,
      "session_duration_ms": 120000,
      "average_response_time_ms": 3000
    },
    "ended_at": "2025-05-31T14:02:00Z"
  }
}
```
- **Error Codes**: 401 Unauthorized, 404 Not Found
</route_api_specification>

2. Related database resources:
<related_db_resources>
### Study_Sessions Table
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

-- Session status enum
CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned');
```

### Flashcards Table (SM-2 Updates)
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Related Tables
- **Collections**: Referenced by collection_id (required)
- **Flashcards**: Cards to be reviewed in the session

### Indexes
```sql
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_collection_id ON study_sessions(collection_id);
CREATE INDEX idx_study_sessions_user_started_at ON study_sessions(user_id, started_at DESC);
CREATE INDEX idx_study_sessions_status ON study_sessions(status) WHERE status = 'active';
CREATE INDEX idx_flashcards_user_next_review ON flashcards(user_id, next_review_date);
```

### SM-2 Algorithm Integration
- **Quality Scale**: 0-5 (0=wrong, 5=perfect)
- **Formula**: Updates easiness_factor, interval, repetitions
- **Next Review**: Calculated based on SM-2 parameters
- **Performance Tracking**: Average review time for MVP metrics
</related_db_resources>

3. Definicje typów:
<type_definitions>
Referencje do typów z `src/db/database.types.ts`:

```typescript
// Study Sessions types from database.types.ts
Tables<'study_sessions'> // Row type
TablesInsert<'study_sessions'> // Insert type  
TablesUpdate<'study_sessions'> // Update type

// Flashcards types for SM-2 updates
Tables<'flashcards'> // Row type
TablesUpdate<'flashcards'> // Update type for SM-2 parameters

// Collections for validation
Tables<'collections'> // Row type for collection validation
```

### Study Session Types
```typescript
interface StartStudySessionRequest {
  collection_id: string; // UUID, required
  max_cards?: number; // optional, default: 10, max: 20
}

interface StudySessionResponse {
  id: string;
  collection_id: string;
  status: 'active' | 'completed' | 'abandoned';
  cards_to_review: number;
  current_card?: FlashcardForReview;
  progress: {
    reviewed: number;
    remaining: number;
  };
  started_at: string;
  ended_at?: string;
}

interface SubmitAnswerRequest {
  flashcard_id: string; // UUID, required
  quality: number; // 0-5, SM-2 quality rating
  response_time_ms?: number; // optional, for performance tracking
}

interface FlashcardForReview {
  id: string;
  front: string;
  back: string;
}

interface SM2UpdateResult {
  easiness_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: string;
}
```
</type_definitions>

4. Tech stack:
<tech_stack>
Referencje do `tech-stack.md`:

**Frontend**: Astro 5 z React 19 dla komponentów interaktywnych, TypeScript 5, Tailwind 4, Shadcn/ui

**Backend**: Supabase jako kompleksowe rozwiązanie backendowe (PostgreSQL + Auth + SDK)

**AI**: Komunikacja z modelami przez OPENROUTER.ai (not directly used in study sessions)

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
- Use proper HTTP methods (POST, GET, PATCH)
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
- Verify session/collection ownership before operations
- Never expose sensitive data in responses

### SM-2 Algorithm Implementation
- Implement proper SM-2 calculation for spaced repetition
- Update flashcard parameters based on quality rating
- Calculate next review date accurately
- Handle edge cases (quality 0-2 resets interval to 1)
- Track performance metrics for MVP requirements

### Session Management
- Support continuation of interrupted sessions
- Auto-abandon sessions after timeout (30 minutes)
- Handle concurrent session limits (max 5 active per user)
- Efficient querying of due flashcards
- Session state management and progress tracking
</implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointów Study Sessions API. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API dla Study Sessions.
2. Wymień wymagane i opcjonalne parametry ze specyfikacji API.
3. Wymień niezbędne typy DTO i Command Modele dla study session workflow.
4. Zastanów się, jak wyodrębnić logikę do service (StudySessionsService, SM2Service).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API Study Sessions.
6. Określenie sposobu obsługi błędów specyficznych dla Study Sessions i SM-2 algorithm.
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa dla Study Sessions API.
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
  - 200 dla pomyślnego odczytu/aktualizacji
  - 201 dla pomyślnego utworzenia sesji
  - 400 dla nieprawidłowych danych wejściowych
  - 401 dla nieautoryzowanego dostępu
  - 404 dla nie znalezionych sesji/kolekcji
  - 422 dla błędów walidacji
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji
- Uwzględnij SM-2 algorithm implementation
- Implementuj session management i state tracking
- Track performance metrics for MVP (average review time <2min)

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown.

Pamiętaj, aby zapisać swój plan wdrożenia jako `.ai/study-sessions-implementation-plan.md`. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów. 
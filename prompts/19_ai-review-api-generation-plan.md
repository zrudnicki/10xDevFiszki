 Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### AI Review Endpoint

#### POST /api/flashcards/review
- **Description**: Review and approve AI-generated flashcards
- **Request Body**:
```json
{
  "collection_id": "uuid", // required
  "category_id": "uuid", // optional
  "flashcards": [
    {
      "front": "string", // required, max 200 chars
      "back": "string", // required, max 500 chars
      "action": "accept_direct" // 'accept_direct', 'accept_edited', 'reject'
    }
  ]
}
```
- **Response**: 201 Created
```json
{
  "data": {
    "created_count": 5,
    "accepted_direct": 3,
    "accepted_edited": 2,
    "rejected": 1,
    "flashcards": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "created_by": "ai_generated"
      }
    ]
  }
}
```
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 422 Unprocessable Entity

### Workflow Integration
- **Previous Step**: POST /api/generate-flashcards (generates candidates)
- **Current Step**: POST /api/flashcards/review (approve/edit candidates)
- **Statistics Update**: Updates flashcard_generation_stats with acceptance metrics
- **MVP Metric**: Tracks 75% AI acceptance rate requirement
</route_api_specification>

2. Related database resources:
<related_db_resources>
### Flashcards Table (Target)
```sql
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    front VARCHAR(200) NOT NULL,
    back VARCHAR(500) NOT NULL,
    
    -- SM-2 Algorithm Parameters (defaults)
    easiness_factor DECIMAL(3,2) NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 1,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_date TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ,
    
    created_by flashcard_created_by NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Flashcard_Generation_Stats Table (Updates)
```sql
CREATE TABLE flashcard_generation_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    total_generated INTEGER NOT NULL DEFAULT 0,
    total_accepted_direct INTEGER NOT NULL DEFAULT 0,
    total_accepted_edited INTEGER NOT NULL DEFAULT 0,
    last_generation_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Related Tables
- **Collections**: Must exist for collection_id (required)
- **Categories**: Optional reference for category_id
- **Collections ownership**: Must belong to authenticated user

### Business Logic
- Only accepts 'accept_direct', 'accept_edited', 'reject' actions
- Creates flashcards only for 'accept_direct' and 'accept_edited' actions
- Updates generation stats based on approval actions
- Sets created_by = 'ai_generated' for all approved flashcards
</related_db_resources>

3. Definicje typów:
<type_definitions>
Referencje do typów z `src/db/database.types.ts`:

```typescript
// Flashcards types from database.types.ts
Tables<'flashcards'> // Row type
TablesInsert<'flashcards'> // Insert type for AI-generated flashcards

// Generation Stats types
Tables<'flashcard_generation_stats'> // Row type
TablesUpdate<'flashcard_generation_stats'> // Update type for stats

// Collections and Categories for validation
Tables<'collections'> // Row type for collection validation
Tables<'categories'> // Row type for category validation
```

### AI Review Types
```typescript
interface FlashcardReviewRequest {
  collection_id: string; // UUID, required
  category_id?: string; // UUID, optional
  flashcards: FlashcardReviewItem[];
}

interface FlashcardReviewItem {
  front: string; // max 200 chars
  back: string; // max 500 chars
  action: 'accept_direct' | 'accept_edited' | 'reject';
}

interface FlashcardReviewResponse {
  created_count: number;
  accepted_direct: number;
  accepted_edited: number;
  rejected: number;
  flashcards: CreatedFlashcard[];
}

interface CreatedFlashcard {
  id: string;
  front: string;
  back: string;
  created_by: 'ai_generated';
}
```
</type_definitions>

4. Tech stack:
<tech_stack>
Referencje do `tech-stack.md`:

**Frontend**: Astro 5 z React 19 dla komponentów interaktywnych, TypeScript 5, Tailwind 4, Shadcn/ui

**Backend**: Supabase jako kompleksowe rozwiązanie backendowe (PostgreSQL + Auth + SDK)

**AI**: Komunikacja z modelami przez OPENROUTER.ai (poprzedni krok w workflow)

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
- Use proper HTTP methods (POST for review approval)
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
- Verify collection/category ownership before creating flashcards
- Never expose sensitive data in responses

### Transaction Management
- Use database transactions for batch flashcard creation
- Ensure atomic updates to generation stats
- Handle partial failures gracefully
- Rollback on any validation or creation errors

### MVP Metrics Integration
- Track acceptance rates for 75% AI acceptance requirement
- Update statistics immediately after successful review
- Calculate metrics for real-time dashboard updates
</implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointu AI Review API. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API dla AI Review.
2. Wymień wymagane i opcjonalne parametry ze specyfikacji API.
3. Wymień niezbędne typy DTO i Command Modele dla AI review workflow.
4. Zastanów się, jak wyodrębnić logikę do service (AIReviewService).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API AI Review.
6. Określenie sposobu obsługi błędów specyficznych dla AI Review i batch operations.
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa dla AI Review API.
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
  - 201 dla pomyślnego utworzenia flashcards
  - 400 dla nieprawidłowych danych wejściowych
  - 401 dla nieautoryzowanego dostępu
  - 404 dla nie znalezionych collection/category
  - 422 dla błędów walidacji
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji
- Uwzględnij transakcyjność batch operations
- Implementuj tracking dla MVP metrics (75% acceptance rate)

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown.

Pamiętaj, aby zapisać swój plan wdrożenia jako `.ai/api-ai-review-implementation-plan.md`. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów.
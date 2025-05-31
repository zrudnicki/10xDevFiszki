Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### User Statistics Endpoint

#### GET /api/users/stats
- **Description**: Get user statistics and metrics
- **Query Parameters**: None
- **Response**: 200 OK
```json
{
  "data": {
    "generation_stats": {
      "total_generated": 150,
      "total_accepted_direct": 120,
      "total_accepted_edited": 20,
      "acceptance_rate": 93.3,
      "last_generation_at": "2025-05-31T14:00:00Z"
    },
    "learning_stats": {
      "total_flashcards": 200,
      "ai_generated_percentage": 75.0,
      "cards_due_today": 15,
      "average_session_time_ms": 90000,
      "sessions_this_week": 5
    },
    "collection_stats": {
      "total_collections": 8,
      "total_categories": 12
    }
  }
}
```
- **Error Codes**: 401 Unauthorized, 500 Internal Server Error

### MVP Metrics Integration
- **75% AI Acceptance Rate**: Calculated from generation_stats
- **75% AI-Generated Flashcards**: From learning_stats.ai_generated_percentage
- **Average Review Time <2min**: From learning_stats.average_session_time_ms
- **Real-time Calculations**: Stats computed dynamically from database
</route_api_specification>

2. Related database resources:
<related_db_resources>
### Flashcard_Generation_Stats Table
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

### Collections Table (Counting)
```sql
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(250) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Categories Table (Counting)
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(250) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Flashcards Table (AI Percentage & Due Cards)
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

### Study_Sessions Table (Session Stats)
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Statistical Calculations
```sql
-- AI Acceptance Rate
SELECT 
    CASE 
        WHEN total_generated > 0 
        THEN ROUND(((total_accepted_direct + total_accepted_edited)::DECIMAL / total_generated) * 100, 2)
        ELSE 0 
    END as acceptance_rate_percentage
FROM flashcard_generation_stats 
WHERE user_id = auth.uid();

-- AI Generated Percentage
SELECT 
    CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE created_by = 'ai_generated')::DECIMAL / COUNT(*)) * 100, 2)
        ELSE 0 
    END as ai_percentage
FROM flashcards 
WHERE user_id = auth.uid();

-- Cards Due Today
SELECT COUNT(*) 
FROM flashcards 
WHERE user_id = auth.uid() 
  AND next_review_date <= NOW();

-- Sessions This Week
SELECT COUNT(*) 
FROM study_sessions 
WHERE user_id = auth.uid() 
  AND started_at >= date_trunc('week', NOW());
```
</related_db_resources>

3. Definicje typów:
<type_definitions>
Referencje do typów z `src/db/database.types.ts`:

```typescript
// All tables for statistics calculation
Tables<'flashcard_generation_stats'> // Generation stats
Tables<'collections'> // Collection count
Tables<'categories'> // Category count
Tables<'flashcards'> // AI percentage, due cards, total count
Tables<'study_sessions'> // Session statistics
```

### User Statistics Types
```typescript
interface UserStatsResponse {
  generation_stats: GenerationStats;
  learning_stats: LearningStats;
  collection_stats: CollectionStats;
}

interface GenerationStats {
  total_generated: number;
  total_accepted_direct: number;
  total_accepted_edited: number;
  acceptance_rate: number; // percentage
  last_generation_at: string | null;
}

interface LearningStats {
  total_flashcards: number;
  ai_generated_percentage: number; // percentage
  cards_due_today: number;
  average_session_time_ms: number;
  sessions_this_week: number;
}

interface CollectionStats {
  total_collections: number;
  total_categories: number;
}

// MVP Metrics for tracking
interface MVPMetrics {
  ai_acceptance_rate: number; // should be >= 75%
  ai_generated_percentage: number; // should be >= 75%
  average_session_time_minutes: number; // should be < 2 minutes
}
```
</type_definitions>

4. Tech stack:
<tech_stack>
Referencje do `tech-stack.md`:

**Frontend**: Astro 5 z React 19 dla komponentów interaktywnych, TypeScript 5, Tailwind 4, Shadcn/ui

**Backend**: Supabase jako kompleksowe rozwiązanie backendowe (PostgreSQL + Auth + SDK)

**AI**: Komunikacja z modelami przez OPENROUTER.ai (statistics tracking)

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
- Use proper HTTP methods (GET for statistics)
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
- Only return user's own statistics
- Never expose sensitive data in responses

### Performance Optimization
- Use efficient SQL queries with proper indexing
- Cache statistics for heavy calculations if needed
- Use database aggregation functions for counting
- Minimize database round trips with combined queries
- Handle edge cases (division by zero, null values)

### MVP Metrics Tracking
- Calculate real-time metrics for dashboard
- Provide clear percentage values for business KPIs
- Track time-based metrics (sessions this week)
- Handle edge cases gracefully (new users with no data)
- Return consistent data structure for frontend consumption
</implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointu User Statistics API. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API dla User Statistics.
2. Wymień wymagane kalkulacje i agregacje statystyczne.
3. Wymień niezbędne typy DTO dla statistics response.
4. Zastanów się, jak wyodrębnić logikę do service (UserStatsService).
5. Zaplanuj optymalizację wydajności dla complex queries.
6. Określenie sposobu obsługi błędów specyficznych dla statistics calculation.
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa dla User Statistics API.
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
  - 200 dla pomyślnego pobrania statystyk
  - 401 dla nieautoryzowanego dostępu
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji
- Uwzględnij efficient database queries
- Implementuj MVP metrics calculation (75% acceptance, 75% AI, <2min sessions)
- Handle edge cases for new users or empty data

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown.

Pamiętaj, aby zapisać swój plan wdrożenia jako `.ai/user-stats-implementation-plan.md`. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów. 
Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### AI Generation Endpoint

#### POST /api/generate-flashcards
- **Description**: Generate flashcards using AI
- **Request Body**:
```json
{
  "text": "string", // required, 1000-10000 chars
  "collection_id": "uuid", // optional, for context
  "max_cards": 15 // optional, default: 10, max: 15
}
```
- **Response**: 200 OK
```json
{
  "data": {
    "candidates": [
      {
        "front": "string",
        "back": "string",
        "confidence": 0.95
      }
    ],
    "generated_count": 8,
    "processing_time_ms": 1500
  }
}
```
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 422 Unprocessable Entity, 429 Too Many Requests

### Rate Limiting
- **AI Generation**: 10 requests per minute per user
- **Error Response for Rate Limit**: 429 Too Many Requests
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many generation requests. Please wait before trying again.",
    "details": {
      "limit": 10,
      "window": "1 minute",
      "retry_after": 30
    }
  }
}
```
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT generation_stats_totals_non_negative CHECK (
        total_generated >= 0 AND 
        total_accepted_direct >= 0 AND 
        total_accepted_edited >= 0
    ),
    CONSTRAINT generation_stats_accepted_not_exceed_generated CHECK (
        (total_accepted_direct + total_accepted_edited) <= total_generated
    )
);
```

### Related Tables
- **Collections**: Optional reference for context
- **Flashcards**: Generated candidates will eventually be saved here after review

### OPENROUTER.ai Integration
- **Service**: External AI service for flashcard generation
- **Rate Limiting**: 10 requests per minute per user
- **Input**: Text content (1000-10000 characters)
- **Output**: Array of flashcard candidates with confidence scores
</related_db_resources>

3. Definicje typów:
<type_definitions>
Referencje do typów z `src/db/database.types.ts`:

```typescript
// Generation Stats types from database.types.ts
Tables<'flashcard_generation_stats'> // Row type
TablesInsert<'flashcard_generation_stats'> // Insert type  
TablesUpdate<'flashcard_generation_stats'> // Update type

// Collections for optional context
Tables<'collections'> // Row type for collection reference
```

### AI Generation Types
```typescript
interface AIGenerationRequest {
  text: string; // 1000-10000 chars
  collection_id?: string; // UUID, optional
  max_cards?: number; // 1-15, default 10
}

interface AIGenerationResponse {
  candidates: FlashcardCandidate[];
  generated_count: number;
  processing_time_ms: number;
}

interface FlashcardCandidate {
  front: string;
  back: string;
  confidence: number; // 0-1
}
```
</type_definitions>

4. Tech stack:
<tech_stack>
Referencje do `tech-stack.md`:

**Frontend**: Astro 5 z React 19 dla komponentów interaktywnych, TypeScript 5, Tailwind 4, Shadcn/ui

**Backend**: Supabase jako kompleksowe rozwiązanie backendowe (PostgreSQL + Auth + SDK)

**AI**: Komunikacja z modelami przez OPENROUTER.ai
- Dostęp do szerokiej gamy modeli (OpenRouter API, Anthropic, Google i wiele innych)
- Pozwala na ustawianie limitów finansowych na klucze API
- Rate limiting i cost management

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
- Use proper HTTP methods (POST for AI generation)
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
- Never expose sensitive data (API keys) in responses
- Implement rate limiting to prevent abuse

### AI Integration
- Update generation stats only after successful generation
- Handle OPENROUTER.ai API errors gracefully
- Implement proper timeout handling for AI requests
- Cache or session-based storage for candidates (not in database)
- Track processing time for performance monitoring
</implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointu AI Generation API. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API dla AI Generation.
2. Wymień wymagane i opcjonalne parametry ze specyfikacją API.
3. Wymień niezbędne typy DTO i Command Modele dla AI integration.
4. Zastanów się, jak wyodrębnić logikę do service (AIGenerationService).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API AI Generation.
6. Określenie sposobu obsługi błędów specyficznych dla AI Generation i rate limiting.
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa dla AI Generation API.
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
  - 200 dla pomyślnego wygenerowania
  - 400 dla nieprawidłowych danych wejściowych
  - 401 dla nieautoryzowanego dostępu
  - 422 dla błędów walidacji
  - 429 dla przekroczenia limitów
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji
- Uwzględnij specyficzne wymagania OPENROUTER.ai integration
- Implementuj rate limiting (10 req/min per user)

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown.

Pamiętaj, aby zapisać swój plan wdrożenia jako `.ai/ai-generation-implementation-plan.md`. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów. 
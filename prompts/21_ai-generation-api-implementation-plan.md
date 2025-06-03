Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### AI Flashcard Generation

#### Generate Flashcards with AI
- **Method**: POST
- **Path**: `/api/flashcards/generate`
- **Description**: Generate flashcards from text input using AI
- **Request Body**:
```json
{
  "text": "JavaScript closures are a fundamental concept in the language. A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function has returned. This is possible because functions in JavaScript form closures over the environment in which they were defined...", 
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
- **Description**: Accept and save generated flashcards
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
- **Success Codes**:
  - 201: Flashcards saved successfully
- **Error Codes**:
  - 400: Invalid request body
  - 401: Unauthorized
  - 500: Server error
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

### Generation Stats Table
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

### Enums
```sql
CREATE TYPE flashcard_created_by AS ENUM ('manual', 'ai_generated');
```
</related_db_resources>

3. Definicje typów:
<type_definitions>
// Database types from src/db/database.types.ts
import { Database, Tables, TablesInsert } from '../db/database.types';

type FlashcardRow = Tables<'flashcards'>;
type FlashcardInsert = TablesInsert<'flashcards'>;
type FlashcardGenerationStatsRow = Tables<'flashcard_generation_stats'>;
type FlashcardGenerationStatsInsert = TablesInsert<'flashcard_generation_stats'>;
type FlashcardCreatedBy = Database['public']['Enums']['flashcard_created_by'];
type CollectionRow = Tables<'collections'>;
type CategoryRow = Tables<'categories'>;
</type_definitions>

4. Tech stack:
<tech_stack>
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
### Backend and Database Rules

- Use Supabase for backend services, including authentication and database interactions.
- Follow Supabase guidelines for security and performance.
- Use Zod schemas to validate data exchanged with the backend.
- Use supabase from context.locals in Astro routes instead of importing supabaseClient directly
- Use SupabaseClient type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`

### Supabase Astro Initialization

- Supabase client initialization is available at `/src/db/supabase.client.ts`
- Middleware setup adds Supabase client to context.locals at `/src/middleware/index.ts`
- TypeScript environment definitions are in `src/env.d.ts`
- Authentication uses Supabase Auth with JWT tokens
- Row Level Security (RLS) ensures users can only access their own data

### Security Guidelines

- Never commit sensitive credentials, secrets, or API keys to the repository.
- Use environment variables for configuration secrets. Reference them in code, e.g., `process.env.SECRET_KEY` in config.js.
- Review all AI-generated code for potential security vulnerabilities before merging.
- Regularly update dependencies to patch known vulnerabilities.

### Coding practices

#### Guidelines for clean code

- Use feedback from linters to improve the code when making changes.
- Prioritize error handling and edge cases.
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling.
</implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointu interfejsu API REST. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API.
2. Wymień wymagane i opcjonalne parametry ze specyfikacji API.
3. Wymień niezbędne typy DTO i Command Modele.
4. Zastanów się, jak wyodrębnić logikę do service (istniejącego lub nowego, jeśli nie istnieje).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API endpointa, zasobami bazy danych i regułami implementacji.
6. Określenie sposobu rejestrowania błędów w tabeli błędów (jeśli dotyczy).
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa w oparciu o specyfikację API i stack technologiczny.
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

W całym planie upewnij się, że
- Używać prawidłowych kodów stanu API:
  - 200 dla pomyślnego odczytu
  - 201 dla pomyślnego utworzenia
  - 400 dla nieprawidłowych danych wejściowych
  - 401 dla nieautoryzowanego dostępu
  - 404 dla nie znalezionych zasobów
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown. Oto przykład tego, jak powinny wyglądać dane wyjściowe:

```markdown
# API Endpoint Implementation Plan: [Nazwa punktu końcowego]

## 1. Przegląd punktu końcowego
[Krótki opis celu i funkcjonalności punktu końcowego]

## 2. Szczegóły żądania
- Metoda HTTP: [GET/POST/PUT/DELETE]
- Struktura URL: [wzorzec URL]
- Parametry:
  - Wymagane: [Lista wymaganych parametrów]
  - Opcjonalne: [Lista opcjonalnych parametrów]
- Request Body: [Struktura treści żądania, jeśli dotyczy]

## 3. Wykorzystywane typy
[DTOs i Command Modele niezbędne do implementacji]

## 3. Szczegóły odpowiedzi
[Oczekiwana struktura odpowiedzi i kody statusu]

## 4. Przepływ danych
[Opis przepływu danych, w tym interakcji z zewnętrznymi usługami lub bazami danych]

## 5. Względy bezpieczeństwa
[Szczegóły uwierzytelniania, autoryzacji i walidacji danych]

## 6. Obsługa błędów
[Lista potencjalnych błędów i sposób ich obsługi]

## 7. Rozważania dotyczące wydajności
[Potencjalne wąskie gardła i strategie optymalizacji]

## 8. Etapy wdrożenia
1. [Krok 1]
2. [Krok 2]
3. [Krok 3]
...
```

Końcowe wyniki powinny składać się wyłącznie z planu wdrożenia w formacie markdown i nie powinny powielać ani powtarzać żadnej pracy wykonanej w sekcji analizy.

Pamiętaj, aby zapisać swój plan wdrożenia jako .ai/api-ai-generation-implementation-plan.md. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów. 
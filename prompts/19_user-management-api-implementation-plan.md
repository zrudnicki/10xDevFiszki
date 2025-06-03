Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktów końcowych REST API dla User Management. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tych punktów końcowych.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### 2.1 Authentication & User Management

#### Delete User Account
- **Method**: DELETE
- **Path**: `/api/users/me`
- **Description**: Delete user account with all associated data (GDPR compliance)
- **Authentication**: Required (Bearer token)
- **Request Body**: 
```json
{
  "confirmation": "DELETE_MY_ACCOUNT"
}
```
- **Response**: 204 No Content
- **Error Codes**: 
  - 401 Unauthorized - Invalid or missing token
  - 400 Bad Request - Missing or invalid confirmation

#### Get User Statistics
- **Method**: GET
- **Path**: `/api/users/me/stats`
- **Description**: Get comprehensive user statistics and metrics
- **Authentication**: Required
- **Response**: 200 OK
```json
{
  "totalFlashcards": 145,
  "totalCollections": 8,
  "totalCategories": 12,
  "studySessionsCompleted": 23,
  "averageSessionDuration": 118,
  "generationStats": {
    "totalGenerated": 89,
    "totalAcceptedDirect": 67,
    "totalAcceptedEdited": 12,
    "acceptanceRate": 88.8,
    "lastGenerationAt": "2025-01-15T10:30:00Z"
  },
  "studyMetrics": {
    "flashcardsReviewedToday": 15,
    "flashcardsDueForReview": 23,
    "averageEasinessFactor": 2.3
  }
}
```
</route_api_specification>

2. Related database resources:
<related_db_resources>
### Users (Supabase Auth)
```sql
-- Zarządzane przez Supabase Auth
-- Tabela auth.users jest automatycznie tworzona przez Supabase
-- Używamy auth.uid() jako referencji w innych tabelach
```

### Related Tables dla statystyk:
```sql
-- Collections - count dla totalCollections
-- Categories - count dla totalCategories  
-- Flashcards - count dla totalFlashcards
-- Study_Sessions - count/metrics dla studySessionsCompleted, averageSessionDuration
-- Flashcard_Generation_Stats - dla generationStats

-- Przykładowe zapytanie statystyk:
SELECT 
    COUNT(*) FILTER (WHERE created_by = 'ai_generated') as ai_generated_count,
    COUNT(*) as total_count,
    CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE created_by = 'ai_generated')::DECIMAL / COUNT(*)) * 100, 2)
        ELSE 0 
    END as ai_percentage
FROM flashcards 
WHERE user_id = auth.uid();
```

### GDPR Compliance:
- Hard delete wszystkich danych użytkownika
- Kaskadowe usuwanie przez ON DELETE CASCADE
- Brak soft delete w MVP
</related_db_resources>

3. Definicje typów:
<type_definitions>
@database.types.ts - User Management related types:

```typescript
// Supabase Auth User (dostępne przez auth.users)
interface User {
  id: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// Flashcard Generation Stats
flashcard_generation_stats: {
  Row: {
    created_at: string
    last_generation_at: string | null
    total_accepted_direct: number
    total_accepted_edited: number
    total_generated: number
    updated_at: string
    user_id: string
  }
  Insert: {
    created_at?: string
    last_generation_at?: string | null
    total_accepted_direct?: number
    total_accepted_edited?: number
    total_generated?: number
    updated_at?: string
    user_id: string
  }
  Update: {
    created_at?: string
    last_generation_at?: string | null
    total_accepted_direct?: number
    total_accepted_edited?: number
    total_generated?: number
    updated_at?: string
    user_id?: string
  }
  Relationships: []
}

// Study Sessions for duration calculations
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

GDPR Requirements:
- Hard delete user data on account deletion
- No retention of personal data after deletion
- Complete data removal including cascaded relations
</implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointów User Management API REST. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API dla User Management.
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

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown zapisany jako `.ai/api-user-management-implementation-plan.md`. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów. 
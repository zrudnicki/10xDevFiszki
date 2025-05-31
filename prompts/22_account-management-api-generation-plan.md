Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
### Account Management Endpoint

#### DELETE /api/users/account
- **Description**: Delete user account and all associated data (GDPR compliance)
- **Request Body**:
```json
{
  "confirmation": "DELETE_MY_ACCOUNT" // required
}
```
- **Response**: 204 No Content
- **Error Codes**: 400 Bad Request, 401 Unauthorized

### GDPR Compliance Requirements
- **Complete Data Deletion**: Remove all user data from all tables
- **Cascade Deletion**: Properly handle foreign key relationships
- **Audit Trail**: Log deletion for compliance (external system)
- **Irreversible Action**: No recovery after confirmation
- **Confirmation Required**: Exact string match for safety

### Data Deletion Scope
- **Auth Data**: Supabase Auth user record
- **Collections**: All user collections and flashcards
- **Categories**: All user categories
- **Flashcards**: All user flashcards (manual and AI-generated)
- **Study Sessions**: All user study sessions
- **Generation Stats**: All AI generation statistics
- **No Backup**: Hard delete, no soft delete or archiving
</route_api_specification>

2. Related database resources:
<related_db_resources>
### All User Tables (Deletion Targets)

#### Collections Table
```sql
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Will be deleted via CASCADE when user is deleted
);
```

#### Categories Table
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Will be deleted via CASCADE when user is deleted
);
```

#### Flashcards Table
```sql
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    -- Will be deleted via CASCADE when user is deleted
);
```

#### Study_Sessions Table
```sql
CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Will be deleted via CASCADE when user is deleted
);
```

#### Flashcard_Generation_Stats Table
```sql
CREATE TABLE flashcard_generation_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Will be deleted via CASCADE when user is deleted
);
```

### Supabase Auth Integration
```sql
-- The final deletion point - triggers all cascades
DELETE FROM auth.users WHERE id = auth.uid();
```

### Deletion Order (Handled by CASCADE)
1. **auth.users DELETE** (triggers all cascades)
2. **Collections** → automatically deletes flashcards
3. **Categories** → sets flashcards.category_id to NULL then deletes
4. **Flashcards** → deleted by collection cascade or user cascade
5. **Study_Sessions** → deleted by user cascade
6. **Generation_Stats** → deleted by user cascade

### RLS Policies (Security)
- All tables have RLS policies ensuring users can only delete their own data
- Supabase Auth handles user authentication and authorization
</related_db_resources>

3. Definicje typów:
<type_definitions>
Referencje do typów z `src/db/database.types.ts`:

```typescript
// Not directly used for deletion (CASCADE handles structure)
// But useful for verification queries before deletion

Tables<'collections'> // For counting user data before deletion
Tables<'categories'> // For counting user data before deletion  
Tables<'flashcards'> // For counting user data before deletion
Tables<'study_sessions'> // For counting user data before deletion
Tables<'flashcard_generation_stats'> // For counting user data before deletion
```

### Account Deletion Types
```typescript
interface DeleteAccountRequest {
  confirmation: string; // Must exactly match "DELETE_MY_ACCOUNT"
}

interface DeleteAccountResponse {
  // 204 No Content - no response body
}

// For logging/auditing (optional)
interface AccountDeletionAudit {
  user_id: string;
  deletion_timestamp: string;
  data_counts: {
    collections: number;
    categories: number;
    flashcards: number;
    study_sessions: number;
    has_generation_stats: boolean;
  };
  confirmation_provided: boolean;
}

// For verification before deletion
interface UserDataSummary {
  total_collections: number;
  total_categories: number;
  total_flashcards: number;
  total_study_sessions: number;
  generation_stats_exists: boolean;
}
```
</type_definitions>

4. Tech stack:
<tech_stack>
Referencje do `tech-stack.md`:

**Frontend**: Astro 5 z React 19 dla komponentów interaktywnych, TypeScript 5, Tailwind 4, Shadcn/ui

**Backend**: Supabase jako kompleksowe rozwiązanie backendowe (PostgreSQL + Auth + SDK)
- Supabase Auth manages user accounts and authentication
- CASCADE DELETE relationships handle data cleanup automatically
- RLS policies ensure security during deletion process

**AI**: Komunikacja z modelami przez OPENROUTER.ai (data to be deleted)

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
- Use proper HTTP methods (DELETE for account deletion)
- Return proper status codes (204 No Content)
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
- Verify exact confirmation string match
- Never allow deletion without proper authentication
- Implement rate limiting to prevent abuse

### GDPR Compliance
- Ensure complete data deletion (hard delete, not soft delete)
- Log deletion activity for compliance auditing
- Handle deletion atomically (transaction-based)
- Verify all related data is properly removed
- Document data retention and deletion policies

### Safety Measures
- Require exact confirmation string match
- Implement deletion confirmation flow
- Optional: Send confirmation email before deletion
- Optional: Implement cooling-off period
- Log all deletion attempts for security monitoring
- Handle partial failures gracefully
</implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointu Account Management API. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API dla Account Deletion.
2. Wymień wymagane kroki walidacji i bezpieczeństwa.
3. Wymień niezbędne typy DTO dla account deletion workflow.
4. Zastanów się, jak wyodrębnić logikę do service (AccountManagementService).
5. Zaplanuj GDPR compliance i data deletion procedures.
6. Określenie sposobu obsługi błędów specyficznych dla account deletion.
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa dla Account Deletion API.
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
  - 204 dla pomyślnego usunięcia konta
  - 400 dla nieprawidłowych danych wejściowych (wrong confirmation)
  - 401 dla nieautoryzowanego dostępu
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji
- Uwzględnij GDPR compliance requirements
- Implementuj proper security measures (confirmation, authentication)
- Handle CASCADE deletion and data integrity
- Include audit logging for compliance

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown.

Pamiętaj, aby zapisać swój plan wdrożenia jako `.ai/account-management-implementation-plan.md`. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów. 
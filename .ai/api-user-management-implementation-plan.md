# Plan Wdrożenia User Management API

## 1. Przegląd punktu końcowego

### Cel
Implementacja kompletnego API dla zarządzania kontami użytkowników z GDPR compliance, hard delete i kompleksowymi statystykami użytkownika.

### Endpointy
- `DELETE /api/users/me` - Usunięcie konta użytkownika z wszystkimi danymi (GDPR)
- `GET /api/users/me/stats` - Pobranie kompleksowych statystyk użytkownika

### Kluczowe funkcjonalności
- GDPR compliance z hard delete
- Supabase Auth integration
- Cascade deletion wszystkich powiązanych danych
- Comprehensive user statistics calculation
- Complete data removal dla privacy compliance
- Multi-table analytics i metrics

## 2. Szczegóły żądania

### DELETE /api/users/me
```typescript
interface DeleteAccountRequest {
  confirmation: string; // required, must be "DELETE_MY_ACCOUNT"
}
```

### GET /api/users/me/stats
```typescript
// No request body - simple authenticated GET request
// Authentication required via Bearer token
```

### Walidacja Zod Schemas
```typescript
const DeleteAccountSchema = z.object({
  confirmation: z.literal("DELETE_MY_ACCOUNT")
});

// No schema needed for stats endpoint - authentication only
```

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
interface DeleteAccountResponse {
  // 204 No Content - no response body
}

interface UserStatsResponse {
  totalFlashcards: number;
  totalCollections: number;
  totalCategories: number;
  studySessionsCompleted: number;
  averageSessionDuration: number; // seconds
  generationStats: {
    totalGenerated: number;
    totalAcceptedDirect: number;
    totalAcceptedEdited: number;
    acceptanceRate: number; // percentage
    lastGenerationAt: string | null;
  };
  studyMetrics: {
    flashcardsReviewedToday: number;
    flashcardsDueForReview: number;
    averageEasinessFactor: number;
  };
}
```

### Kody stanu HTTP
- **200 OK**: Successful statistics retrieval
- **204 No Content**: Successful account deletion
- **400 Bad Request**: Invalid confirmation string
- **401 Unauthorized**: No authentication or invalid token
- **500 Internal Server Error**: Database errors, cascade deletion failures

## 4. Przepływ danych

### DELETE /api/users/me Flow
1. **Authentication Check**: Verify user via `auth.uid()`
2. **Input Validation**: Validate confirmation string
3. **Data Backup**: Optional data export dla user (GDPR requirement)
4. **Cascade Deletion**: Delete all user data in proper order
   ```sql
   -- Order matters due to foreign key constraints
   DELETE FROM study_sessions WHERE user_id = auth.uid();
   DELETE FROM flashcard_generation_stats WHERE user_id = auth.uid();
   DELETE FROM flashcards WHERE user_id = auth.uid();
   DELETE FROM categories WHERE user_id = auth.uid();
   DELETE FROM collections WHERE user_id = auth.uid();
   
   -- Finally delete user from Supabase Auth
   -- This is handled by Supabase Admin API
   ```
5. **Auth User Deletion**: Remove from Supabase Auth
6. **Response Formation**: Return 204 No Content

### GET /api/users/me/stats Flow
1. **Authentication Check**: Verify user authentication
2. **Statistics Calculation**: Query all related tables
   ```sql
   -- Collections count
   SELECT COUNT(*) FROM collections WHERE user_id = auth.uid();
   
   -- Categories count  
   SELECT COUNT(*) FROM categories WHERE user_id = auth.uid();
   
   -- Flashcards count and metrics
   SELECT 
     COUNT(*) as total_flashcards,
     AVG(easiness_factor) as avg_easiness_factor,
     COUNT(*) FILTER (WHERE next_review_date <= NOW()) as due_for_review
   FROM flashcards WHERE user_id = auth.uid();
   
   -- Study sessions metrics
   SELECT 
     COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
     AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as avg_duration
   FROM study_sessions WHERE user_id = auth.uid();
   
   -- Generation statistics
   SELECT * FROM flashcard_generation_stats WHERE user_id = auth.uid();
   
   -- Today's reviewed flashcards
   SELECT COUNT(*) FROM study_sessions s
   JOIN flashcards f ON s.collection_id = f.collection_id
   WHERE s.user_id = auth.uid() 
   AND s.started_at >= CURRENT_DATE;
   ```
3. **Data Aggregation**: Combine results into response format
4. **Calculations**: Calculate rates, averages, percentages
5. **Response Formation**: Return formatted statistics

## 5. Względy bezpieczeństwa

### Authentication & Authorization
- Wymaganie autentykacji dla wszystkich operacji
- Weryfikacja user identity przez `auth.uid()`
- Bearer token validation via Supabase Auth
- Brak możliwości operacji na cudzych kontach

### GDPR Compliance
- **Hard Delete**: Complete data removal bez możliwości odzyskania
- **Cascade Deletion**: Proper order dla foreign key constraints
- **Data Export**: Optional backup przed deletion
- **Audit Trail**: Logging deletion events dla compliance
- **Right to be Forgotten**: Complete implementation

### Data Security
- **No Data Retention**: Żadne dane nie pozostają po deletion
- **Secure Statistics**: Only authenticated user's data w statistics
- **Privacy Protection**: Brak exposure cudzych danych
- **Safe Deletion**: Transaction-based deletion dla data integrity

### Input Validation
- Strict validation confirmation string
- Prevent accidental deletions
- Authentication token verification
- SQL injection prevention przez parameterized queries

## 6. Obsługa błędów

### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Specific Error Scenarios
```typescript
// 400 Bad Request - Invalid confirmation
{
  error: {
    code: "INVALID_CONFIRMATION",
    message: "Invalid confirmation string. Must be 'DELETE_MY_ACCOUNT'",
    details: { required: "DELETE_MY_ACCOUNT" }
  }
}

// 401 Unauthorized - No authentication
{
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required. Please provide valid bearer token"
  }
}

// 500 Internal Server Error - Deletion failure
{
  error: {
    code: "DELETION_FAILED",
    message: "Failed to delete user account. Please try again",
    details: { stage: "cascade_deletion" }
  }
}

// 500 Internal Server Error - Statistics calculation error
{
  error: {
    code: "STATISTICS_CALCULATION_ERROR",
    message: "Failed to calculate user statistics",
    details: { failedQuery: "study_sessions_metrics" }
  }
}
```

### Error Handling Strategy
- **Transaction Safety**: Use database transactions dla deletion
- **Rollback Capability**: Proper rollback on deletion failures
- **Comprehensive Logging**: Detailed error logging dla debugging
- **User-Friendly Messages**: Clear error communication
- **Graceful Degradation**: Partial statistics on calculation errors
- **Audit Trail**: Error tracking dla compliance

## 7. Wydajność

### Database Optimizations
```sql
-- Essential indexes for statistics queries
CREATE INDEX idx_flashcards_user_review_date ON flashcards(user_id, next_review_date);
CREATE INDEX idx_study_sessions_user_status ON study_sessions(user_id, status);
CREATE INDEX idx_study_sessions_user_date ON study_sessions(user_id, started_at);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- For today's flashcard reviews
CREATE INDEX idx_study_sessions_today ON study_sessions(user_id, started_at) 
  WHERE started_at >= CURRENT_DATE;
```

### Query Optimizations
- **Parallel Queries**: Execute statistics queries w parallel
- **Efficient Aggregations**: Use proper GROUP BY i aggregate functions
- **Selective Queries**: Only fetch necessary data dla calculations
- **Query Optimization**: Proper indexes dla fast statistics

### Caching Strategy
- **Statistics Caching**: Cache user statistics dla 15 minutes
- **Invalidation**: Clear cache on user data changes
- **Selective Caching**: Cache expensive calculations only
- **Memory Efficiency**: Avoid caching large datasets

### Performance Monitoring
- **Query Performance**: Monitor statistics calculation times
- **Deletion Performance**: Track cascade deletion duration
- **Database Load**: Monitor concurrent statistics requests
- **Error Rates**: Track failed statistics calculations

### Deletion Performance
- **Transaction Optimization**: Batch deletions w single transaction
- **Foreign Key Management**: Proper deletion order
- **Connection Pooling**: Efficient database connections
- **Cleanup Jobs**: Background cleanup dla orphaned data

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/users/
├── me.ts (DELETE - delete account)
├── me/
│   └── stats.ts (GET - user statistics)
src/lib/services/
├── UserManagementService.ts
├── UserStatisticsService.ts
├── GDPRComplianceService.ts
src/lib/schemas/
├── user-management.ts
src/types/
├── user-management.ts
src/lib/errors/
├── UserManagementErrors.ts
├── AccountDeletionError.ts
├── StatisticsCalculationError.ts
├── InvalidConfirmationError.ts
src/lib/utils/
├── statistics-calculator.ts
├── gdpr-compliance.ts
├── user-data-export.ts
```

### Krok 2: Typy i schemas
```typescript
// src/types/user-management.ts
export interface UserStatistics {
  totalFlashcards: number;
  totalCollections: number;
  totalCategories: number;
  studySessionsCompleted: number;
  averageSessionDuration: number;
  generationStats: GenerationStatistics;
  studyMetrics: StudyMetrics;
}

export interface GenerationStatistics {
  totalGenerated: number;
  totalAcceptedDirect: number;
  totalAcceptedEdited: number;
  acceptanceRate: number;
  lastGenerationAt: string | null;
}

export interface StudyMetrics {
  flashcardsReviewedToday: number;
  flashcardsDueForReview: number;
  averageEasinessFactor: number;
}

// src/lib/schemas/user-management.ts
export const DeleteAccountSchema = z.object({
  confirmation: z.literal("DELETE_MY_ACCOUNT")
});
```

### Krok 3: Service Layer
```typescript
// src/lib/services/UserManagementService.ts
export class UserManagementService {
  constructor(private supabase: SupabaseClient) {}

  async deleteUserAccount(userId: string, confirmation: string) {
    // Implementation with GDPR compliance and cascade deletion
  }

  async getUserStatistics(userId: string): Promise<UserStatistics> {
    // Implementation with comprehensive statistics calculation
  }

  private async cascadeDeleteUserData(userId: string) {
    // Proper order deletion with transaction safety
  }

  private async deleteFromSupabaseAuth(userId: string) {
    // Supabase Admin API call for user deletion
  }
}

// src/lib/services/UserStatisticsService.ts
export class UserStatisticsService {
  constructor(private supabase: SupabaseClient) {}

  async calculateFlashcardStats(userId: string) {
    // Flashcard count, due for review, average easiness factor
  }

  async calculateStudySessionStats(userId: string) {
    // Completed sessions, average duration, today's reviews
  }

  async calculateGenerationStats(userId: string) {
    // AI generation statistics and acceptance rates
  }

  async calculateCollectionAndCategoryStats(userId: string) {
    // Collections and categories counts
  }
}

// src/lib/services/GDPRComplianceService.ts
export class GDPRComplianceService {
  constructor(private supabase: SupabaseClient) {}

  async exportUserData(userId: string) {
    // Optional data export before deletion
  }

  async verifyCompleteDeletion(userId: string) {
    // Verify no data remains after deletion
  }

  async logDeletionEvent(userId: string, success: boolean) {
    // Audit trail for compliance
  }
}
```

### Krok 4: API Routes

#### src/pages/api/users/me.ts
```typescript
import type { APIRoute } from 'astro';
import { UserManagementService } from '../../lib/services/UserManagementService';
import { DeleteAccountSchema } from '../../lib/schemas/user-management';

export const DELETE: APIRoute = async ({ locals, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const body = await request.json();
    const { confirmation } = DeleteAccountSchema.parse(body);
    
    const userService = new UserManagementService(locals.supabase);
    await userService.deleteUserAccount(user.id, confirmation);
    
    return new Response(null, { status: 204 });
  } catch (error) {
    // Comprehensive error handling including GDPR compliance errors
  }
};
```

#### src/pages/api/users/me/stats.ts
```typescript
import type { APIRoute } from 'astro';
import { UserStatisticsService } from '../../../lib/services/UserStatisticsService';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }
    
    const statsService = new UserStatisticsService(locals.supabase);
    const statistics = await statsService.getUserStatistics(user.id);
    
    return new Response(JSON.stringify(statistics), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Error handling for statistics calculation failures
  }
};
```

### Krok 5: Error Handling
```typescript
// src/lib/errors/UserManagementErrors.ts
export class AccountDeletionError extends Error {
  constructor(stage: string, originalError?: Error) {
    super(`Account deletion failed at stage: ${stage}`);
    this.name = 'AccountDeletionError';
    this.cause = originalError;
  }
}

export class StatisticsCalculationError extends Error {
  constructor(query: string, originalError?: Error) {
    super(`Statistics calculation failed for: ${query}`);
    this.name = 'StatisticsCalculationError';
    this.cause = originalError;
  }
}

export class InvalidConfirmationError extends Error {
  constructor() {
    super('Invalid confirmation string. Must be "DELETE_MY_ACCOUNT"');
    this.name = 'InvalidConfirmationError';
  }
}

// Error handler utility
export function handleUserManagementError(error: any) {
  if (error instanceof InvalidConfirmationError) {
    return { status: 400, code: "INVALID_CONFIRMATION" };
  }
  if (error instanceof AccountDeletionError) {
    return { status: 500, code: "DELETION_FAILED" };
  }
  if (error instanceof StatisticsCalculationError) {
    return { status: 500, code: "STATISTICS_CALCULATION_ERROR" };
  }
  // ... other error types
}
```

### Krok 6: Testing
- Unit tests dla UserManagementService
- Unit tests dla UserStatisticsService
- Integration tests dla deletion endpoint
- Integration tests dla statistics endpoint
- GDPR compliance testing
- Cascade deletion testing
- Statistics accuracy testing
- Authentication & authorization testing
- Performance testing dla complex statistics queries
- Error recovery testing

### Krok 7: Documentation
- API documentation z examples dla both endpoints
- GDPR compliance documentation
- Statistics calculation methodology
- Deletion process documentation
- Error codes documentation
- Privacy policy implications
- Usage examples dla frontend integration

### Krok 8: Deployment
- Database indexes dla statistics queries
- Supabase Admin API setup dla user deletion
- Environment variables dla admin credentials
- Monitoring setup dla deletion events
- GDPR compliance audit setup
- Performance monitoring dla statistics queries
- Backup procedures documentation

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ Kompletny User Management API
- ✅ GDPR compliance z hard delete
- ✅ Comprehensive user statistics
- ✅ Supabase Auth integration
- ✅ Cascade deletion safety
- ✅ Transaction-based operations
- ✅ Security best practices
- ✅ Performance optimizations
- ✅ Comprehensive error handling
- ✅ MVP-ready functionality

Plan jest gotowy do implementacji przez zespół programistów z jasno określonymi krokami, pełną GDPR compliance i wszystkimi niezbędnymi szczegółami technicznymi dla zarządzania kontami użytkowników. 
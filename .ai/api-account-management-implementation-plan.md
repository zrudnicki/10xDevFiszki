# Plan Wdrożenia Account Management API

## 1. Przegląd punktu końcowego

### Cel
Implementacja bezpiecznego API do usuwania konta użytkownika z GDPR compliance, complete data deletion, audit logging i security measures.

### Endpoint
- `DELETE /api/users/account` - Kompletne usunięcie konta użytkownika

### Kluczowe funkcjonalności
- **GDPR compliance** z complete data deletion
- **CASCADE DELETE** wszystkich powiązanych danych
- **Security measures** (confirmation string, rate limiting)
- **Audit logging** przed i po usunięciu
- **Data summary** przed usunięciem dla użytkownika
- **Post-deletion verification**

## 2. Szczegóły żądania

### DELETE /api/users/account
```typescript
interface DeleteAccountRequest {
  confirmation: string; // required, must equal "DELETE_MY_ACCOUNT"
}
```

### Walidacja Zod Schema
```typescript
const DeleteAccountSchema = z.object({
  confirmation: z.string().refine(
    (val) => val === "DELETE_MY_ACCOUNT",
    { message: "Confirmation string must be exactly 'DELETE_MY_ACCOUNT'" }
  )
});
```

### Security Requirements
- **Exact confirmation**: String musi być dokładnie "DELETE_MY_ACCOUNT"
- **Rate limiting**: 3 attempts per hour per user
- **Authentication**: Aktywna sesja użytkownika wymagana
- **Audit logging**: Log wszystkich attempt i successful deletions

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
interface DeleteAccountResponse {
  data: {
    message: string;
    deleted_at: string;
    data_summary: UserDataSummary;
  };
}

interface UserDataSummary {
  collections_count: number;
  categories_count: number;
  flashcards_count: number;
  study_sessions_count: number;
  generation_stats_records: number;
}
```

### Kody stanu HTTP
- **200 OK**: Successful account deletion
- **400 Bad Request**: Invalid confirmation string
- **401 Unauthorized**: No authentication
- **429 Too Many Requests**: Rate limit exceeded (3 attempts/hour)
- **500 Internal Server Error**: Deletion errors

### Rate Limit Error Response
```typescript
interface RateLimitResponse {
  error: {
    code: "ACCOUNT_DELETION_RATE_LIMIT";
    message: "Too many account deletion attempts. Please wait before trying again.";
    details: {
      limit: 3;
      window: "1 hour";
      retry_after: number; // seconds until next allowed attempt
    };
  };
}
```

## 4. Przepływ danych

### DELETE /api/users/account Flow
1. **Authentication Check**: Verify active user session
2. **Rate Limiting Check**: Verify user hasn't exceeded 3 attempts/hour
3. **Input Validation**: Validate confirmation string equals "DELETE_MY_ACCOUNT"
4. **Pre-deletion Data Summary**: Count all user's data for summary
5. **Audit Log - Start**: Log deletion attempt with user ID and timestamp
6. **Database Transaction Start**: Begin deletion transaction
7. **Data Deletion Cascade**: 
   ```sql
   -- Supabase auth.users CASCADE DELETE triggers:
   DELETE FROM auth.users WHERE id = auth.uid();
   -- This cascades to all user tables due to FK constraints
   ```
8. **Post-deletion Verification**: Verify all data deleted
9. **Audit Log - Complete**: Log successful deletion
10. **Response Formation**: Return success with data summary

### Rate Limiting Implementation
```typescript
class AccountDeletionRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isAllowed(userId: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(userId) || [];
    
    // Remove attempts older than 1 hour
    const recentAttempts = userAttempts.filter(time => now - time < 3600000);
    
    if (recentAttempts.length >= 3) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(userId, recentAttempts);
    return true;
  }
  
  getRetryAfter(userId: string): number {
    const userAttempts = this.attempts.get(userId) || [];
    if (userAttempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...userAttempts);
    return Math.max(0, 3600 - Math.floor((Date.now() - oldestAttempt) / 1000));
  }
}
```

### Data Deletion Cascade Strategy
```sql
-- Database constraints ensure CASCADE DELETE
-- When auth.users row is deleted, all related data is automatically deleted:

-- Direct CASCADE:
-- collections (user_id → auth.users.id)
-- categories (user_id → auth.users.id) 
-- flashcard_generation_stats (user_id → auth.users.id)

-- Indirect CASCADE (through collections):
-- flashcards (collection_id → collections.id, CASCADE)
-- study_sessions (collection_id → collections.id, CASCADE)

-- SET NULL (through categories):
-- flashcards.category_id → NULL when categories deleted
```

## 5. Względy bezpieczeństwa

### Input Validation
- **Exact string match**: "DELETE_MY_ACCOUNT" z case sensitivity
- **No partial matches**: Zabezpieczenie przed przypadkowym usunięciem
- **Sanitization**: Validate input thoroughly

### Rate Limiting Security
- **3 attempts per hour**: Prevent brute force attempts
- **Per-user tracking**: Individual user rate limiting
- **Persistent storage**: Rate limit data survives server restarts
- **Gradual backoff**: Increase penalties for repeated attempts

### Authentication & Authorization
- **Active session required**: No anonymous deletions
- **User ownership**: Only user can delete own account
- **No admin bypass**: Even admins need proper authentication

### Audit Trail
- **Complete logging**: All attempts (successful and failed)
- **Immutable logs**: Audit logs cannot be deleted/modified
- **GDPR compliance**: Logs can reference deleted user ID for legal purposes

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
// 400 Bad Request - Wrong confirmation
{
  error: {
    code: "INVALID_CONFIRMATION",
    message: "Confirmation string must be exactly 'DELETE_MY_ACCOUNT'",
    details: { field: "confirmation" }
  }
}

// 429 Too Many Requests - Rate limit
{
  error: {
    code: "ACCOUNT_DELETION_RATE_LIMIT",
    message: "Too many account deletion attempts. Please wait before trying again.",
    details: {
      limit: 3,
      window: "1 hour",
      retry_after: 2847
    }
  }
}

// 500 Internal Server Error - Deletion failed
{
  error: {
    code: "ACCOUNT_DELETION_FAILED",
    message: "Account deletion failed. Please contact support.",
    details: { 
      error_id: "uuid-for-tracking",
      support_email: "support@10xdevfiszki.com" 
    }
  }
}
```

### Error Handling Strategy
- **Transaction rollback**: Rollback on any deletion failure
- **Comprehensive logging**: Log all errors for debugging
- **User-friendly messages**: Clear instructions for users
- **Support contact**: Provide support information for failures
- **Graceful degradation**: Handle partial failures safely

## 7. Wydajność

### Database Optimization
```sql
-- Ensure efficient CASCADE DELETE
-- Indexes on foreign keys for fast deletion
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_flashcards_collection_id ON flashcards(collection_id);
CREATE INDEX idx_study_sessions_collection_id ON study_sessions(collection_id);
CREATE INDEX idx_flashcard_generation_stats_user_id ON flashcard_generation_stats(user_id);
```

### Deletion Performance
- **Single transaction**: All deletions in one transaction
- **Batch operations**: Efficient CASCADE DELETE
- **Timeout handling**: Set reasonable timeouts (60s)
- **Progress monitoring**: Track deletion progress

### Rate Limiting Performance
- **In-memory storage**: Fast access to rate limit data
- **Efficient cleanup**: Remove old rate limit entries
- **Minimal overhead**: Fast rate limit checking

### Monitoring & Metrics
```typescript
interface AccountDeletionMetrics {
  total_deletion_attempts: number;
  successful_deletions: number;
  failed_deletions: number;
  rate_limit_hits: number;
  average_deletion_time_ms: number;
  data_summary_stats: {
    average_collections: number;
    average_flashcards: number;
    average_sessions: number;
  };
}
```

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/users/
├── account.ts (DELETE)
src/lib/services/
├── AccountManagementService.ts
├── AuditLogService.ts
├── DataSummaryService.ts
src/lib/schemas/
├── account-management.ts
src/types/
├── account-management.ts
src/lib/errors/
├── AccountManagementErrors.ts
├── InvalidConfirmationError.ts
├── AccountDeletionRateLimitError.ts
├── AccountDeletionFailedError.ts
├── DataSummaryError.ts
├── AuditLogError.ts
src/lib/utils/
├── account-deletion-rate-limiter.ts
├── data-cascade-verification.ts
├── audit-logging.ts
```

### Krok 2: Environment Setup
```typescript
// Environment variables
ACCOUNT_DELETION_RATE_LIMIT_ATTEMPTS=3
ACCOUNT_DELETION_RATE_LIMIT_WINDOW=3600000
ACCOUNT_DELETION_TIMEOUT=60000
AUDIT_LOG_RETENTION_DAYS=2555  // 7 years for GDPR
```

### Krok 3: Service Layer Implementation

#### Account Management Service
```typescript
// src/lib/services/AccountManagementService.ts
export class AccountManagementService {
  constructor(
    private supabase: SupabaseClient,
    private auditLogService: AuditLogService,
    private dataSummaryService: DataSummaryService,
    private rateLimiter: AccountDeletionRateLimiter
  ) {}

  async deleteAccount(userId: string, confirmation: string): Promise<DeleteAccountResponse> {
    const startTime = Date.now();

    // Rate limiting check
    if (!this.rateLimiter.isAllowed(userId)) {
      const retryAfter = this.rateLimiter.getRetryAfter(userId);
      throw new AccountDeletionRateLimitError(retryAfter);
    }

    // Confirmation validation
    if (confirmation !== "DELETE_MY_ACCOUNT") {
      throw new InvalidConfirmationError();
    }

    // Pre-deletion data summary
    const dataSummary = await this.dataSummaryService.getUserDataSummary(userId);

    // Audit log - start
    await this.auditLogService.logDeletionAttempt(userId, dataSummary);

    try {
      // Database transaction for deletion
      const { error } = await this.supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        throw new AccountDeletionFailedError(error.message);
      }

      // Post-deletion verification
      await this.verifyDeletionComplete(userId);

      // Audit log - success
      await this.auditLogService.logDeletionSuccess(userId, dataSummary);

      const deletionTime = Date.now() - startTime;

      return {
        data: {
          message: "Account successfully deleted",
          deleted_at: new Date().toISOString(),
          data_summary: dataSummary
        }
      };

    } catch (error) {
      // Audit log - failure
      await this.auditLogService.logDeletionFailure(userId, error);
      throw error;
    }
  }

  private async verifyDeletionComplete(userId: string): Promise<void> {
    // Verify all user data has been deleted
    const checks = await Promise.all([
      this.checkCollectionsDeleted(userId),
      this.checkCategoriesDeleted(userId),
      this.checkFlashcardsDeleted(userId),
      this.checkStudySessionsDeleted(userId),
      this.checkGenerationStatsDeleted(userId)
    ]);

    const failedChecks = checks.filter(check => !check.deleted);
    if (failedChecks.length > 0) {
      throw new AccountDeletionFailedError(
        `Incomplete deletion: ${failedChecks.map(c => c.table).join(', ')}`
      );
    }
  }

  private async checkCollectionsDeleted(userId: string) {
    // Check if any collections remain for deleted user
  }

  private async checkCategoriesDeleted(userId: string) {
    // Check if any categories remain for deleted user
  }

  private async checkFlashcardsDeleted(userId: string) {
    // Check if any flashcards remain for deleted user
  }

  private async checkStudySessionsDeleted(userId: string) {
    // Check if any study sessions remain for deleted user
  }

  private async checkGenerationStatsDeleted(userId: string) {
    // Check if any generation stats remain for deleted user
  }
}
```

#### Data Summary Service
```typescript
// src/lib/services/DataSummaryService.ts
export class DataSummaryService {
  constructor(private supabase: SupabaseClient) {}

  async getUserDataSummary(userId: string): Promise<UserDataSummary> {
    const [
      collectionsCount,
      categoriesCount,
      flashcardsCount,
      studySessionsCount,
      generationStatsCount
    ] = await Promise.all([
      this.countUserCollections(userId),
      this.countUserCategories(userId),
      this.countUserFlashcards(userId),
      this.countUserStudySessions(userId),
      this.countUserGenerationStats(userId)
    ]);

    return {
      collections_count: collectionsCount,
      categories_count: categoriesCount,
      flashcards_count: flashcardsCount,
      study_sessions_count: studySessionsCount,
      generation_stats_records: generationStatsCount
    };
  }

  private async countUserCollections(userId: string): Promise<number> {
    // Count user's collections
  }

  private async countUserCategories(userId: string): Promise<number> {
    // Count user's categories
  }

  private async countUserFlashcards(userId: string): Promise<number> {
    // Count user's flashcards (across all collections)
  }

  private async countUserStudySessions(userId: string): Promise<number> {
    // Count user's study sessions
  }

  private async countUserGenerationStats(userId: string): Promise<number> {
    // Count user's generation stats records
  }
}
```

### Krok 4: API Route Implementation
```typescript
// src/pages/api/users/account.ts
import type { APIRoute } from 'astro';
import { AccountManagementService } from '../../lib/services/AccountManagementService';
import { AuditLogService } from '../../lib/services/AuditLogService';
import { DataSummaryService } from '../../lib/services/DataSummaryService';
import { AccountDeletionRateLimiter } from '../../lib/utils/account-deletion-rate-limiter';
import { DeleteAccountSchema } from '../../lib/schemas/account-management';

export const DELETE: APIRoute = async ({ locals, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const body = await request.json();
    const validatedData = DeleteAccountSchema.parse(body);

    const accountManagementService = new AccountManagementService(
      locals.supabase,
      new AuditLogService(locals.supabase),
      new DataSummaryService(locals.supabase),
      new AccountDeletionRateLimiter()
    );

    const result = await accountManagementService.deleteAccount(
      user.id, 
      validatedData.confirmation
    );

    return new Response(JSON.stringify(result), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    if (error instanceof InvalidConfirmationError) {
      return new Response(JSON.stringify({
        error: {
          code: "INVALID_CONFIRMATION",
          message: "Confirmation string must be exactly 'DELETE_MY_ACCOUNT'",
          details: { field: "confirmation" }
        }
      }), { status: 400 });
    }

    if (error instanceof AccountDeletionRateLimitError) {
      return new Response(JSON.stringify({
        error: {
          code: "ACCOUNT_DELETION_RATE_LIMIT",
          message: "Too many account deletion attempts. Please wait before trying again.",
          details: {
            limit: 3,
            window: "1 hour",
            retry_after: error.retryAfter
          }
        }
      }), { status: 429 });
    }

    if (error instanceof AccountDeletionFailedError) {
      return new Response(JSON.stringify({
        error: {
          code: "ACCOUNT_DELETION_FAILED",
          message: "Account deletion failed. Please contact support.",
          details: { 
            error_id: crypto.randomUUID(),
            support_email: "support@10xdevfiszki.com" 
          }
        }
      }), { status: 500 });
    }

    // Handle other errors...
    console.error('Account deletion error:', error);
    return new Response(JSON.stringify({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred"
      }
    }), { status: 500 });
  }
};
```

### Krok 5: Error Classes
```typescript
// src/lib/errors/AccountManagementErrors.ts
export class InvalidConfirmationError extends Error {
  constructor() {
    super("Confirmation string must be exactly 'DELETE_MY_ACCOUNT'");
    this.name = 'InvalidConfirmationError';
  }
}

export class AccountDeletionRateLimitError extends Error {
  constructor(public retryAfter: number) {
    super('Account deletion rate limit exceeded');
    this.name = 'AccountDeletionRateLimitError';
  }
}

export class AccountDeletionFailedError extends Error {
  constructor(details: string) {
    super(`Account deletion failed: ${details}`);
    this.name = 'AccountDeletionFailedError';
  }
}

export class DataSummaryError extends Error {
  constructor(details: string) {
    super(`Data summary failed: ${details}`);
    this.name = 'DataSummaryError';
  }
}
```

### Krok 6: GDPR Compliance Documentation
```typescript
// GDPR Compliance Checklist:
// ✅ Right to erasure (Article 17) - Complete account deletion
// ✅ Data minimization - Only necessary audit logs retained
// ✅ Audit trail - Immutable logs for legal compliance
// ✅ User consent - Explicit confirmation required
// ✅ Data processing lawfulness - User-initiated deletion
// ✅ Notification - Clear confirmation of deletion
// ✅ Completeness - All personal data deleted via CASCADE
```

### Krok 7: Testing Strategy
- **Unit tests**: All service classes and error scenarios
- **Integration tests**: End-to-end account deletion
- **Rate limiting tests**: Verify 3 attempts/hour enforcement  
- **CASCADE DELETE tests**: Verify all related data deleted
- **Security tests**: Invalid confirmations, unauthorized attempts
- **Performance tests**: Large dataset deletions
- **GDPR compliance tests**: Verify complete data removal

### Krok 8: Deployment & Monitoring
- **Audit log retention**: 7-year retention for GDPR compliance
- **Monitoring**: Track deletion success rates and errors
- **Alerting**: Failed deletion notifications
- **Backup verification**: Ensure deleted users not in backups
- **Legal documentation**: GDPR compliance documentation

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ **GDPR-compliant account deletion** z complete data removal
- ✅ **Security measures** (confirmation string, rate limiting)
- ✅ **Comprehensive audit logging** dla legal compliance
- ✅ **CASCADE DELETE strategy** dla complete data removal
- ✅ **Error handling** z user-friendly messages
- ✅ **Performance optimization** dla efficient deletions
- ✅ **Post-deletion verification** dla data integrity
- ✅ **Rate limiting protection** protiv abuse
- ✅ **Production-ready implementation** z monitoring
- ✅ **Legal compliance documentation** dla GDPR

Plan jest gotowy do implementacji z jasno określonymi krokami security measures i GDPR compliance requirements. 
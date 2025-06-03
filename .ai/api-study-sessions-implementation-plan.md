# Plan Wdrożenia Study Sessions API

## 1. Przegląd punktu końcowego

### Cel
Implementacja kompletnego API dla zarządzania sesjami nauki z integracją algorytmu SM-2, tracking'iem postępu i automatycznym timeout'em sesji.

### Endpointy
- `POST /api/study-sessions` - Uruchomienie nowej sesji nauki
- `PUT /api/study-sessions/{sessionId}/response` - Przesłanie odpowiedzi na fiszkę
- `PUT /api/study-sessions/{sessionId}/complete` - Zakończenie sesji nauki
- `GET /api/study-sessions/active` - Pobranie aktywnej sesji użytkownika

### Kluczowe funkcjonalności
- User isolation przez RLS policies
- SM-2 algorithm integration dla spaced repetition
- Session management z 30-minutowym timeout'em
- Progress tracking i persistence
- Automatic session expiration
- Detailed study metrics i analytics

## 2. Szczegóły żądania

### POST /api/study-sessions
```typescript
interface StartSessionRequest {
  collectionId: string; // required, UUID
  studyType: 'review' | 'new'; // required
}
```

### PUT /api/study-sessions/{sessionId}/response
```typescript
interface SubmitResponseRequest {
  flashcardId: string; // required, UUID
  quality: number; // required, 0-5 (SM-2 quality rating)
  responseTime: number; // required, milliseconds
}
```

### PUT /api/study-sessions/{sessionId}/complete
```typescript
// No request body required
```

### GET /api/study-sessions/active
```typescript
// No request body - simple GET request
```

### Walidacja Zod Schemas
```typescript
const StartSessionSchema = z.object({
  collectionId: z.string().uuid(),
  studyType: z.enum(['review', 'new'])
});

const SubmitResponseSchema = z.object({
  flashcardId: z.string().uuid(),
  quality: z.number().min(0).max(5).int(),
  responseTime: z.number().min(0).int()
});

const SessionIdSchema = z.object({
  sessionId: z.string().uuid()
});
```

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
interface SessionResponse {
  sessionId: string;
  collectionId: string;
  flashcardsToReview: FlashcardSummary[];
  totalFlashcards: number;
  startedAt: string;
  status: 'active' | 'completed' | 'abandoned';
}

interface FlashcardSummary {
  id: string;
  front: string;
  back: string;
}

interface StudyResponseResponse {
  nextFlashcard: FlashcardSummary | null;
  updatedParameters: {
    easinessFactor: number;
    interval: number;
    repetitions: number;
    nextReviewDate: string;
  };
  sessionProgress: {
    completed: number;
    remaining: number;
  };
}

interface SessionCompletionResponse {
  sessionId: string;
  duration: number; // seconds
  flashcardsReviewed: number;
  averageResponseTime: number; // milliseconds
  completedAt: string;
}

interface ActiveSessionResponse {
  sessionId: string;
  collectionId: string;
  startedAt: string;
  flashcardsRemaining: number;
  currentFlashcard: FlashcardSummary | null;
}
```

### Kody stanu HTTP
- **200 OK**: Successful retrieval/update
- **201 Created**: Successful session creation
- **204 No Content**: Successful completion
- **400 Bad Request**: Invalid request format, validation errors
- **401 Unauthorized**: No authentication
- **404 Not Found**: Session/collection not found
- **409 Conflict**: Active session already exists
- **410 Gone**: Session expired/abandoned
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server errors

## 4. Przepływ danych

### POST /api/study-sessions Flow
1. **Authentication Check**: Verify user via `auth.uid()`
2. **Input Validation**: Validate collectionId and studyType
3. **Collection Check**: Verify collection ownership and existence
4. **Active Session Check**: Ensure no active session exists
5. **Flashcards Query**: Get flashcards for study based on studyType
   ```sql
   -- For review type
   SELECT * FROM flashcards 
   WHERE collection_id = $1 AND user_id = auth.uid() 
   AND next_review_date <= NOW()
   ORDER BY next_review_date ASC
   
   -- For new type  
   SELECT * FROM flashcards 
   WHERE collection_id = $1 AND user_id = auth.uid() 
   AND repetitions = 0
   ORDER BY created_at ASC
   ```
6. **Session Creation**:
   ```sql
   INSERT INTO study_sessions (user_id, collection_id, status)
   VALUES (auth.uid(), $1, 'active')
   RETURNING *
   ```
7. **Response Formation**: Return session with flashcards to review

### PUT /api/study-sessions/{sessionId}/response Flow
1. **Authentication Check**: Verify user authentication
2. **Session Validation**: Verify session exists and is active
3. **Timeout Check**: Verify session hasn't expired (30 min)
4. **Input Validation**: Validate flashcardId, quality, responseTime
5. **Flashcard Ownership**: Verify flashcard belongs to session collection
6. **SM-2 Algorithm**: Calculate new parameters based on quality
   ```sql
   -- Update flashcard parameters
   UPDATE flashcards 
   SET easiness_factor = $1,
       interval = $2,
       repetitions = $3,
       next_review_date = $4,
       updated_at = NOW()
   WHERE id = $5 AND user_id = auth.uid()
   ```
7. **Session Update**: Increment flashcards_reviewed_count
8. **Next Flashcard**: Get next flashcard or detect completion
9. **Response Formation**: Return next flashcard and updated parameters

### PUT /api/study-sessions/{sessionId}/complete Flow
1. **Authentication Check**: Verify user authentication
2. **Session Validation**: Verify session exists and belongs to user
3. **Active Check**: Verify session is active
4. **Completion Update**:
   ```sql
   UPDATE study_sessions 
   SET status = 'completed',
       ended_at = NOW(),
       updated_at = NOW()
   WHERE id = $1 AND user_id = auth.uid()
   RETURNING *
   ```
5. **Statistics Calculation**: Calculate session metrics
6. **Response Formation**: Return completion statistics

### GET /api/study-sessions/active Flow
1. **Authentication Check**: Verify user authentication
2. **Active Session Query**:
   ```sql
   SELECT s.*, COUNT(f.id) as flashcards_remaining
   FROM study_sessions s
   LEFT JOIN flashcards f ON s.collection_id = f.collection_id 
   WHERE s.user_id = auth.uid() 
   AND s.status = 'active'
   AND s.started_at > NOW() - INTERVAL '30 minutes'
   GROUP BY s.id
   ```
3. **Timeout Check**: Mark expired sessions as abandoned
4. **Current Flashcard**: Get current flashcard in session
5. **Response Formation**: Return active session or 404

## 5. Względy bezpieczeństwa

### Row Level Security (RLS)
```sql
CREATE POLICY study_sessions_user_isolation ON study_sessions
    FOR ALL USING (auth.uid() = user_id);
```

### Input Validation
- Wszystkie dane wejściowe walidowane przez Zod schemas
- Quality rating validation (0-5 integer)
- UUID validation dla wszystkich ID parameters
- Response time validation (positive integers)
- SQL injection prevention through parameterized queries

### Authentication & Authorization
- Wymaganie autentykacji dla wszystkich operacji
- Weryfikacja ownership przez `auth.uid() = user_id`
- Collection ownership validation
- Session ownership verification
- Brak możliwości dostępu do cudzych sesji

### Session Security
- Automatic timeout after 30 minutes inactivity
- Session state validation before each operation
- Prevention of concurrent active sessions
- Secure session ID generation

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
// 409 Conflict - Active session exists
{
  error: {
    code: "ACTIVE_SESSION_EXISTS",
    message: "An active study session already exists",
    details: { existingSessionId: "uuid" }
  }
}

// 410 Gone - Session expired
{
  error: {
    code: "SESSION_EXPIRED",
    message: "Study session has expired due to inactivity",
    details: { expiredAt: "2025-01-15T18:30:00Z" }
  }
}

// 404 Not Found - Session
{
  error: {
    code: "SESSION_NOT_FOUND",
    message: "Study session not found or access denied"
  }
}

// 400 Bad Request - Invalid quality
{
  error: {
    code: "INVALID_QUALITY_RATING",
    message: "Quality rating must be between 0 and 5",
    details: { provided: 7, min: 0, max: 5 }
  }
}

// 422 Validation Error
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: {
      flashcardId: "Must be a valid UUID"
    }
  }
}
```

### Error Handling Strategy
- Early returns for error conditions
- Comprehensive logging for debugging
- User-friendly error messages
- Proper HTTP status codes
- Session cleanup on errors
- Graceful degradation

## 7. Wydajność

### Database Optimizations
```sql
-- Essential indexes
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_collection_id ON study_sessions(collection_id);
CREATE INDEX idx_study_sessions_user_started_at ON study_sessions(user_id, started_at DESC);
CREATE INDEX idx_study_sessions_status ON study_sessions(status) WHERE status = 'active';

-- For flashcard queries
CREATE INDEX idx_flashcards_collection_review ON flashcards(collection_id, next_review_date) 
  WHERE next_review_date <= NOW();
CREATE INDEX idx_flashcards_collection_new ON flashcards(collection_id, repetitions, created_at)
  WHERE repetitions = 0;
```

### Query Optimizations
- Efficient flashcard filtering dla study types
- Single query dla session validation
- Optimized SM-2 parameter updates
- Batch operations gdzie możliwe

### Caching Strategy
- Cache active session state
- Cache collection flashcard counts
- Cache SM-2 calculation results temporarily
- Invalidate cache on session state changes

### Performance Monitoring
- Track session duration i completion rates
- Monitor SM-2 calculation performance
- Log slow database queries
- Track timeout frequencies

### Session Management
- Automatic cleanup of expired sessions
- Background job dla session timeout handling
- Efficient session state checks
- Minimal database calls per response

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/study-sessions/
├── index.ts (POST - start session)
├── active.ts (GET - active session)
├── [sessionId]/
│   ├── response.ts (PUT - submit response)
│   └── complete.ts (PUT - complete session)
src/lib/services/
├── StudySessionsService.ts
├── SM2AlgorithmService.ts
├── SessionTimeoutService.ts
src/lib/schemas/
├── study-sessions.ts
src/types/
├── study-sessions.ts
src/lib/errors/
├── StudySessionErrors.ts
├── SessionNotFoundError.ts
├── SessionExpiredError.ts
├── ActiveSessionExistsError.ts
├── SessionValidationError.ts
src/lib/utils/
├── session-management.ts
├── sm2-calculations.ts
├── session-timeout.ts
```

### Krok 2: Typy i schemas
```typescript
// src/types/study-sessions.ts
export interface StudySession {
  id: string;
  user_id: string;
  collection_id: string;
  started_at: string;
  ended_at: string | null;
  flashcards_reviewed_count: number;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface SessionFlashcard {
  id: string;
  front: string;
  back: string;
  easiness_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: string;
}

// src/lib/schemas/study-sessions.ts
export const StartSessionSchema = z.object({
  collectionId: z.string().uuid(),
  studyType: z.enum(['review', 'new'])
});

export const SubmitResponseSchema = z.object({
  flashcardId: z.string().uuid(),
  quality: z.number().min(0).max(5).int(),
  responseTime: z.number().min(0).int()
});
```

### Krok 3: Service Layer
```typescript
// src/lib/services/StudySessionsService.ts
export class StudySessionsService {
  constructor(private supabase: SupabaseClient) {}

  async startSession(userId: string, data: StartSessionRequest) {
    // Implementation with active session check
  }

  async submitResponse(userId: string, sessionId: string, data: SubmitResponseRequest) {
    // Implementation with SM-2 algorithm integration
  }

  async completeSession(userId: string, sessionId: string) {
    // Implementation with statistics calculation
  }

  async getActiveSession(userId: string) {
    // Implementation with timeout handling
  }

  private async validateSession(userId: string, sessionId: string) {
    // Verify session exists, is active, and belongs to user
  }

  private async checkActiveSession(userId: string) {
    // Check if user has active session
  }

  private async getSessionFlashcards(collectionId: string, studyType: string) {
    // Get flashcards based on study type
  }

  private async handleSessionTimeout(sessionId: string) {
    // Mark expired sessions as abandoned
  }
}

// src/lib/services/SM2AlgorithmService.ts
export class SM2AlgorithmService {
  static calculateNewParameters(
    easinessFactor: number,
    interval: number,
    repetitions: number,
    quality: number
  ) {
    // SM-2 algorithm implementation
  }

  static calculateNextReviewDate(interval: number): Date {
    // Calculate next review date based on interval
  }
}
```

### Krok 4: API Routes

#### src/pages/api/study-sessions/index.ts
```typescript
import type { APIRoute } from 'astro';
import { StudySessionsService } from '../../lib/services/StudySessionsService';
import { StartSessionSchema } from '../../lib/schemas/study-sessions';

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const body = await request.json();
    const validatedData = StartSessionSchema.parse(body);
    
    const studyService = new StudySessionsService(locals.supabase);
    const result = await studyService.startSession(user.id, validatedData);
    
    return new Response(JSON.stringify(result), { status: 201 });
  } catch (error) {
    // Error handling including active session conflicts
  }
};
```

#### src/pages/api/study-sessions/active.ts
```typescript
import type { APIRoute } from 'astro';
import { StudySessionsService } from '../../../lib/services/StudySessionsService';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }
    
    const studyService = new StudySessionsService(locals.supabase);
    const result = await studyService.getActiveSession(user.id);
    
    if (!result) {
      return new Response(JSON.stringify({ 
        error: { code: "NO_ACTIVE_SESSION", message: "No active session found" }
      }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ data: result }), { status: 200 });
  } catch (error) {
    // Error handling
  }
};
```

#### src/pages/api/study-sessions/[sessionId]/response.ts
```typescript
import type { APIRoute } from 'astro';
import { StudySessionsService } from '../../../../lib/services/StudySessionsService';
import { SubmitResponseSchema } from '../../../../lib/schemas/study-sessions';

export const PUT: APIRoute = async ({ locals, params, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const sessionId = params.sessionId;
    if (!sessionId) {
      return new Response(JSON.stringify({ 
        error: { code: "INVALID_REQUEST", message: "Session ID is required" }
      }), { status: 400 });
    }

    const body = await request.json();
    const validatedData = SubmitResponseSchema.parse(body);
    
    const studyService = new StudySessionsService(locals.supabase);
    const result = await studyService.submitResponse(user.id, sessionId, validatedData);
    
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    // Error handling including session timeout
  }
};
```

#### src/pages/api/study-sessions/[sessionId]/complete.ts
```typescript
import type { APIRoute } from 'astro';
import { StudySessionsService } from '../../../../lib/services/StudySessionsService';

export const PUT: APIRoute = async ({ locals, params }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const sessionId = params.sessionId;
    if (!sessionId) {
      return new Response(JSON.stringify({ 
        error: { code: "INVALID_REQUEST", message: "Session ID is required" }
      }), { status: 400 });
    }
    
    const studyService = new StudySessionsService(locals.supabase);
    const result = await studyService.completeSession(user.id, sessionId);
    
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    // Error handling
  }
};
```

### Krok 5: Error Handling
```typescript
// src/lib/errors/StudySessionErrors.ts
export class SessionNotFoundError extends Error {
  constructor() {
    super('Study session not found or access denied');
    this.name = 'SessionNotFoundError';
  }
}

export class SessionExpiredError extends Error {
  constructor(expiredAt: string) {
    super(`Study session expired at ${expiredAt}`);
    this.name = 'SessionExpiredError';
  }
}

export class ActiveSessionExistsError extends Error {
  constructor(sessionId: string) {
    super(`Active session already exists: ${sessionId}`);
    this.name = 'ActiveSessionExistsError';
  }
}

// Error handler utility
export function handleStudySessionError(error: any) {
  if (error instanceof SessionNotFoundError) {
    return { status: 404, code: "SESSION_NOT_FOUND" };
  }
  if (error instanceof SessionExpiredError) {
    return { status: 410, code: "SESSION_EXPIRED" };
  }
  if (error instanceof ActiveSessionExistsError) {
    return { status: 409, code: "ACTIVE_SESSION_EXISTS" };
  }
  // ... other error types
}
```

### Krok 6: Testing
- Unit tests dla StudySessionsService
- Unit tests dla SM2AlgorithmService
- Integration tests dla wszystkich API endpoints
- Session timeout testing
- Concurrent session testing
- SM-2 algorithm accuracy testing
- Edge case testing (expired sessions, invalid data)
- Authentication & authorization testing
- Performance testing z large flashcard sets

### Krok 7: Documentation
- API documentation z przykładami dla wszystkich endpoints
- SM-2 algorithm integration documentation
- Session management flow documentation
- Timeout behavior documentation
- Error codes documentation
- Study metrics explanation
- Usage examples dla frontend

### Krok 8: Deployment
- Database migrations (tables already exist)
- Background job setup dla session timeout handling
- Environment variables setup
- Performance monitoring setup
- Error tracking integration
- Session cleanup job scheduling

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ Kompletny Study Sessions API
- ✅ SM-2 algorithm integration
- ✅ Automatic session timeout handling
- ✅ Comprehensive error handling
- ✅ Session state management
- ✅ Progress tracking i analytics
- ✅ Security best practices
- ✅ Performance optimizations
- ✅ Scalable architecture
- ✅ MVP-ready functionality

Plan jest gotowy do implementacji przez zespół programistów z jasno określonymi krokami, kompleksową obsługą sesji nauki i wszystkimi niezbędnymi szczegółami technicznymi. 
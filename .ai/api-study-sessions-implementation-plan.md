# Plan Wdrożenia Study Sessions API

## 1. Przegląd punktu końcowego

### Cel
Implementacja systemu sesji nauki z integracją algorytmu SM-2, state management, performance tracking i automatycznym zarządzaniem sesjami dla spaced repetition.

### Endpointy
- `POST /api/study-sessions` - Rozpoczęcie nowej sesji nauki
- `GET /api/study-sessions/{id}` - Pobranie stanu aktualnej sesji
- `PATCH /api/study-sessions/{id}/answer` - Przesłanie odpowiedzi na fiszek (SM-2 update)
- `PATCH /api/study-sessions/{id}/complete` - Zakończenie sesji nauki

### Kluczowe funkcjonalności
- **SM-2 Algorithm integration** z real-time parameter updates
- **Session state management** z progress tracking
- **Due cards querying** (cards ready for review)
- **Performance metrics tracking** dla MVP (average time <2min)
- **Auto-abandon sessions** (timeout po 30 min)
- **Concurrent session limits** (max 5 active per user)

## 2. Szczegóły żądania

### POST /api/study-sessions
```typescript
interface StartStudySessionRequest {
  collection_id: string; // required, UUID
  max_cards?: number; // optional, default: 10, max: 20
}
```

### PATCH /api/study-sessions/{id}/answer
```typescript
interface SubmitAnswerRequest {
  flashcard_id: string; // required, UUID
  quality: number; // required, 0-5 (SM-2 quality rating)
  response_time_ms?: number; // optional, for performance tracking
}
```

### Walidacja Zod Schemas
```typescript
const StartStudySessionSchema = z.object({
  collection_id: z.string().uuid(),
  max_cards: z.number().min(1).max(20).default(10)
});

const SubmitAnswerSchema = z.object({
  flashcard_id: z.string().uuid(),
  quality: z.number().min(0).max(5),
  response_time_ms: z.number().positive().optional()
});
```

### Session Management Rules
- **Max active sessions**: 5 per user
- **Auto-abandon timeout**: 30 minutes of inactivity
- **Progress persistence**: Session state saved in database
- **Due cards selection**: next_review_date <= NOW()

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
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

interface FlashcardForReview {
  id: string;
  front: string;
  back: string;
}

interface AnswerResponse {
  session_id: string;
  status: 'active' | 'completed';
  next_card?: FlashcardForReview;
  progress: {
    reviewed: number;
    remaining: number;
  };
  updated_sm2_params: SM2UpdateResult;
}

interface SM2UpdateResult {
  easiness_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: string;
}

interface SessionStatsResponse {
  id: string;
  status: 'completed';
  stats: {
    flashcards_reviewed: number;
    session_duration_ms: number;
    average_response_time_ms: number;
  };
  ended_at: string;
}
```

### Kody stanu HTTP
- **200 OK**: Successful retrieval/update
- **201 Created**: Successful session creation
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: No authentication
- **404 Not Found**: Session/collection/flashcard not found
- **422 Unprocessable Entity**: Validation errors (invalid quality, wrong flashcard)
- **500 Internal Server Error**: SM-2 calculation errors, server errors

## 4. Przepływ danych

### POST /api/study-sessions Flow
1. **Authentication Check**: Verify user via `auth.uid()`
2. **Collection Validation**: Verify collection exists and belongs to user
3. **Active Sessions Check**: Ensure user has <5 active sessions
4. **Due Cards Query**: Find flashcards where next_review_date <= NOW()
5. **Session Creation**:
   ```sql
   INSERT INTO study_sessions (user_id, collection_id, status)
   VALUES (auth.uid(), $1, 'active')
   RETURNING *
   ```
6. **Cards Selection**: Select up to max_cards due flashcards
7. **Current Card Assignment**: Set first card as current_card
8. **Response Formation**: Return session with progress and current card

### PATCH /api/study-sessions/{id}/answer Flow
1. **Authentication & Authorization**: Verify session ownership
2. **Session State Check**: Verify session is active
3. **Flashcard Validation**: Verify flashcard belongs to session collection
4. **Quality Validation**: Ensure quality is 0-5
5. **SM-2 Calculation**:
   ```typescript
   const sm2Result = SM2Service.calculateNext(currentParams, quality);
   ```
6. **Flashcard Update**:
   ```sql
   UPDATE flashcards 
   SET easiness_factor = $1, interval = $2, repetitions = $3, 
       next_review_date = $4, updated_at = NOW()
   WHERE id = $5 AND user_id = auth.uid()
   ```
7. **Session Progress Update**: Increment flashcards_reviewed_count
8. **Next Card Selection**: Get next due card or complete session
9. **Response Formation**: Return updated progress and next card

### SM-2 Algorithm Implementation
```typescript
class SM2Service {
  static calculateNext(current: SM2Parameters, quality: number): SM2UpdateResult {
    let { easiness_factor, interval, repetitions } = current;
    
    if (quality >= 3) {
      // Correct answer
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easiness_factor);
      }
      repetitions += 1;
    } else {
      // Incorrect answer - reset
      repetitions = 0;
      interval = 1;
    }
    
    // Update easiness factor
    easiness_factor = easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easiness_factor = Math.max(1.3, easiness_factor);
    
    const next_review_date = new Date();
    next_review_date.setDate(next_review_date.getDate() + interval);
    
    return {
      easiness_factor: Math.round(easiness_factor * 100) / 100,
      interval,
      repetitions,
      next_review_date: next_review_date.toISOString()
    };
  }
}
```

### PATCH /api/study-sessions/{id}/complete Flow
1. **Authentication & Authorization**: Verify session ownership
2. **Session State Check**: Verify session is active
3. **Statistics Calculation**:
   - Session duration (ended_at - started_at)
   - Average response time (if tracked)
   - Total flashcards reviewed
4. **Session Update**:
   ```sql
   UPDATE study_sessions 
   SET status = 'completed', ended_at = NOW()
   WHERE id = $1 AND user_id = auth.uid()
   ```
5. **Response Formation**: Return completion stats

## 5. Względy bezpieczeństwa

### Row Level Security (RLS)
```sql
CREATE POLICY study_sessions_user_isolation ON study_sessions
    FOR ALL USING (auth.uid() = user_id);
```

### Session Ownership Verification
- **Session access**: Verify user owns session before any operation
- **Collection access**: Verify user owns collection when creating session
- **Flashcard validation**: Ensure flashcard belongs to session collection

### Input Validation
- **Quality range**: Ensure quality is 0-5 (SM-2 requirement)
- **Response time**: Validate positive numbers if provided
- **UUID validation**: All IDs must be valid UUIDs
- **Session state**: Only allow operations on active sessions

### Concurrent Session Limits
- **Max 5 active sessions** per user to prevent resource abuse
- **Auto-abandon**: Sessions inactive for 30+ minutes
- **Resource management**: Clean up abandoned sessions

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
// 404 Not Found - Collection doesn't exist
{
  error: {
    code: "COLLECTION_NOT_FOUND",
    message: "Collection not found or access denied",
    details: { field: "collection_id" }
  }
}

// 422 Validation Error - Invalid quality
{
  error: {
    code: "INVALID_QUALITY_RATING",
    message: "Quality must be between 0 and 5",
    details: { field: "quality", value: quality }
  }
}

// 400 Bad Request - Too many active sessions
{
  error: {
    code: "TOO_MANY_ACTIVE_SESSIONS",
    message: "Maximum of 5 active sessions allowed. Complete or abandon existing sessions."
  }
}

// 422 Validation Error - Wrong flashcard
{
  error: {
    code: "FLASHCARD_NOT_IN_SESSION",
    message: "Flashcard does not belong to this session's collection",
    details: { flashcard_id, session_collection_id }
  }
}

// 404 Not Found - Session not found
{
  error: {
    code: "SESSION_NOT_FOUND",
    message: "Study session not found or access denied"
  }
}

// 400 Bad Request - Session not active
{
  error: {
    code: "SESSION_NOT_ACTIVE",
    message: "Session is not active. Current status: completed"
  }
}
```

### Error Handling Strategy
- **Early validation**: Check all conditions before SM-2 calculations
- **Atomic operations**: Use transactions for SM-2 updates
- **Comprehensive logging**: Log all session activities
- **Graceful degradation**: Handle SM-2 calculation errors
- **User-friendly messages**: Clear error descriptions

## 7. Wydajność

### Database Optimizations
```sql
-- Session management indexes
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_status ON study_sessions(status) WHERE status = 'active';
CREATE INDEX idx_study_sessions_user_started_at ON study_sessions(user_id, started_at DESC);

-- Due cards optimization
CREATE INDEX idx_flashcards_user_next_review ON flashcards(user_id, next_review_date);
CREATE INDEX idx_flashcards_collection_due ON flashcards(collection_id, next_review_date) 
  WHERE next_review_date <= NOW();
```

### Query Optimizations
- **Efficient due cards query**: Use proper indexing for next_review_date
- **Session state caching**: Cache active session data
- **Batch SM-2 updates**: Minimize database roundtrips
- **Connection pooling**: Reuse database connections

### Performance Monitoring
```typescript
interface SessionPerformanceMetrics {
  average_session_duration_ms: number;
  average_response_time_ms: number;
  cards_per_session_avg: number;
  sm2_calculation_time_ms: number;
  database_query_time_ms: number;
}
```

### Auto-Cleanup Strategy
```sql
-- Auto-abandon sessions after 30 minutes
UPDATE study_sessions 
SET status = 'abandoned', ended_at = NOW()
WHERE status = 'active' 
  AND started_at < NOW() - INTERVAL '30 minutes';
```

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/study-sessions/
├── index.ts (POST)
├── [id].ts (GET)
├── [id]/
│   ├── answer.ts (PATCH)
│   └── complete.ts (PATCH)
src/lib/services/
├── StudySessionsService.ts
├── SM2Service.ts (reused from flashcards)
src/lib/schemas/
├── study-sessions.ts
src/types/
├── study-sessions.ts
src/lib/errors/
├── StudySessionErrors.ts
├── SessionNotFoundError.ts
├── SessionNotActiveError.ts
├── TooManyActiveSessionsError.ts
├── InvalidQualityRatingError.ts
├── FlashcardNotInSessionError.ts
├── SM2CalculationError.ts
src/lib/utils/
├── session-cleanup.ts
```

### Krok 2: SM-2 Service Implementation
```typescript
// src/lib/services/SM2Service.ts (extended from flashcards)
export class SM2Service {
  static calculateNext(current: SM2Parameters, quality: number): SM2UpdateResult {
    // Full SM-2 algorithm implementation
  }
  
  static validateQuality(quality: number): boolean {
    return Number.isInteger(quality) && quality >= 0 && quality <= 5;
  }
  
  static getDefaultParameters(): SM2Parameters {
    return {
      easiness_factor: 2.5,
      interval: 1,
      repetitions: 0,
      next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }
}
```

### Krok 3: Study Sessions Service
```typescript
// src/lib/services/StudySessionsService.ts
export class StudySessionsService {
  constructor(private supabase: SupabaseClient) {}

  async startSession(userId: string, request: StartStudySessionRequest): Promise<StudySessionResponse> {
    // 1. Validate collection access
    // 2. Check active sessions limit
    // 3. Query due cards
    // 4. Create session
    // 5. Return session with first card
  }

  async getSession(userId: string, sessionId: string): Promise<StudySessionResponse> {
    // 1. Verify ownership
    // 2. Get session with current progress
    // 3. Get current card if session active
  }

  async submitAnswer(userId: string, sessionId: string, answer: SubmitAnswerRequest): Promise<AnswerResponse> {
    // 1. Validate session and flashcard
    // 2. Calculate SM-2 update
    // 3. Update flashcard parameters
    // 4. Update session progress
    // 5. Get next card or complete session
  }

  async completeSession(userId: string, sessionId: string): Promise<SessionStatsResponse> {
    // 1. Verify ownership and status
    // 2. Calculate session statistics
    // 3. Update session to completed
  }

  private async getDueCards(userId: string, collectionId: string, maxCards: number): Promise<FlashcardForReview[]> {
    // Query flashcards where next_review_date <= NOW()
  }

  private async checkActiveSessionsLimit(userId: string): Promise<boolean> {
    // Ensure user has < 5 active sessions
  }

  private async cleanupAbandonedSessions(): Promise<void> {
    // Auto-abandon sessions after 30 minutes
  }
}
```

### Krok 4: API Routes Implementation

#### POST /api/study-sessions
```typescript
import type { APIRoute } from 'astro';
import { StudySessionsService } from '../../lib/services/StudySessionsService';
import { StartStudySessionSchema } from '../../lib/schemas/study-sessions';

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const body = await request.json();
    const validatedData = StartStudySessionSchema.parse(body);

    const sessionsService = new StudySessionsService(locals.supabase);
    const result = await sessionsService.startSession(user.id, validatedData);

    return new Response(JSON.stringify({ data: result }), { status: 201 });
  } catch (error) {
    // Comprehensive error handling
  }
};
```

#### PATCH /api/study-sessions/[id]/answer
```typescript
import type { APIRoute } from 'astro';
import { StudySessionsService } from '../../../../lib/services/StudySessionsService';
import { SubmitAnswerSchema } from '../../../../lib/schemas/study-sessions';

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const sessionId = params.id;
    if (!sessionId) {
      return new Response(JSON.stringify({ 
        error: { code: "INVALID_REQUEST", message: "Session ID is required" }
      }), { status: 400 });
    }

    const body = await request.json();
    const validatedData = SubmitAnswerSchema.parse(body);

    const sessionsService = new StudySessionsService(locals.supabase);
    const result = await sessionsService.submitAnswer(user.id, sessionId, validatedData);

    return new Response(JSON.stringify({ data: result }), { status: 200 });
  } catch (error) {
    // Handle specific errors (invalid quality, wrong flashcard, etc.)
  }
};
```

### Krok 5: Background Tasks
```typescript
// src/lib/utils/session-cleanup.ts
export class SessionCleanupService {
  static async cleanupAbandonedSessions(supabase: SupabaseClient): Promise<number> {
    const { data, error } = await supabase
      .from('study_sessions')
      .update({ 
        status: 'abandoned', 
        ended_at: new Date().toISOString() 
      })
      .eq('status', 'active')
      .lt('started_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .select('id');

    if (error) {
      console.error('Session cleanup failed:', error);
      return 0;
    }

    return data?.length || 0;
  }
}

// Cron job or scheduled task
setInterval(async () => {
  const cleaned = await SessionCleanupService.cleanupAbandonedSessions(supabase);
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} abandoned sessions`);
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

### Krok 6: Error Classes
```typescript
// src/lib/errors/StudySessionErrors.ts
export class SessionNotFoundError extends Error {
  constructor() {
    super('Study session not found or access denied');
    this.name = 'SessionNotFoundError';
  }
}

export class SessionNotActiveError extends Error {
  constructor(status: string) {
    super(`Session is not active. Current status: ${status}`);
    this.name = 'SessionNotActiveError';
  }
}

export class TooManyActiveSessionsError extends Error {
  constructor() {
    super('Maximum of 5 active sessions allowed');
    this.name = 'TooManyActiveSessionsError';
  }
}

export class InvalidQualityRatingError extends Error {
  constructor(quality: number) {
    super(`Quality must be between 0 and 5, got: ${quality}`);
    this.name = 'InvalidQualityRatingError';
  }
}
```

### Krok 7: Testing Strategy
- **Unit tests**: StudySessionsService, SM2Service calculations
- **Integration tests**: Complete session workflow
- **SM-2 algorithm tests**: All quality scenarios (0-5)
- **Session management tests**: Limits, timeouts, state transitions
- **Performance tests**: Response times for MVP <2min requirement
- **Concurrent sessions tests**: Multiple active sessions handling

### Krok 8: Monitoring & Analytics
```typescript
interface StudySessionAnalytics {
  sessions_started_today: number;
  sessions_completed_today: number;
  sessions_abandoned_today: number;
  average_session_duration_minutes: number;
  average_cards_per_session: number;
  average_response_time_ms: number; // MVP metric
  quality_distribution: Record<0|1|2|3|4|5, number>;
}
```

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ **Complete study session workflow** z state management
- ✅ **SM-2 Algorithm integration** z real-time parameter updates
- ✅ **Performance tracking** dla MVP metrics (average time <2min)
- ✅ **Session management** (limits, timeouts, auto-cleanup)
- ✅ **Due cards optimization** z efficient querying
- ✅ **Comprehensive error handling** dla wszystkich edge cases
- ✅ **Security best practices** z ownership verification
- ✅ **Database optimization** z proper indexing
- ✅ **MVP-ready functionality** dla spaced repetition system
- ✅ **Scalable architecture** z background cleanup tasks

Plan jest gotowy do implementacji z robust session management i comprehensive SM-2 algorithm integration dla core learning experience aplikacji 10xDevFiszki. 
# Plan Wdrożenia AI Generation API

## 1. Przegląd punktu końcowego

### Cel
Implementacja kompletnego API dla generowania fiszek z wykorzystaniem AI (OPENROUTER.ai) oraz systemu review i akceptacji wygenerowanych kandydatów na fiszki.

### Endpointy
- `POST /api/flashcards/generate` - Generowanie fiszek z tekstu przez AI
- `POST /api/flashcards/review` - Przyjmowanie i zapisywanie wybranych fiszek

### Kluczowe funkcjonalności
- OPENROUTER.ai integration dla AI generation
- Rate limiting (10 requests/hour per user)
- Generation statistics tracking
- Multi-action review system (accept, accept_edited, reject)
- Content filtering i quality validation
- User isolation przez RLS policies

## 2. Szczegóły żądania

### POST /api/flashcards/generate
```typescript
interface GenerateFlashcardsRequest {
  text: string; // required, 1000-10000 characters
  targetCount?: number; // optional, 5-15, default: 10
}
```

### POST /api/flashcards/review
```typescript
interface ReviewFlashcardsRequest {
  generationId: string; // required, UUID
  collectionId: string; // required, UUID
  categoryId?: string; // optional, UUID
  decisions: ReviewDecision[]; // required, array
}

interface ReviewDecision {
  candidateIndex: number; // required, 0-based index
  action: 'accept' | 'accept_edited' | 'reject'; // required
  front?: string; // required for accept/accept_edited
  back?: string; // required for accept/accept_edited
}
```

### Walidacja Zod Schemas
```typescript
const GenerateFlashcardsSchema = z.object({
  text: z.string().min(1000).max(10000),
  targetCount: z.number().min(5).max(15).default(10)
});

const ReviewDecisionSchema = z.object({
  candidateIndex: z.number().min(0),
  action: z.enum(['accept', 'accept_edited', 'reject']),
  front: z.string().min(1).max(200).optional(),
  back: z.string().min(1).max(500).optional()
});

const ReviewFlashcardsSchema = z.object({
  generationId: z.string().uuid(),
  collectionId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  decisions: z.array(ReviewDecisionSchema).min(1)
});
```

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
interface FlashcardCandidate {
  front: string;
  back: string;
  confidence: number; // 0.0-1.0
}

interface GenerateFlashcardsResponse {
  candidates: FlashcardCandidate[];
  generationId: string;
  totalGenerated: number;
}

interface CreatedFlashcard {
  id: string;
  front: string;
  back: string;
  collectionId: string;
  categoryId: string | null;
  createdBy: 'ai_generated';
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewStats {
  totalCandidates: number;
  acceptedDirect: number;
  acceptedEdited: number;
  rejected: number;
}

interface ReviewFlashcardsResponse {
  acceptedFlashcards: CreatedFlashcard[];
  stats: ReviewStats;
}
```

### Kody stanu HTTP
- **200 OK**: Successful generation
- **201 Created**: Successful flashcard creation from review
- **400 Bad Request**: Invalid request format, text length validation
- **401 Unauthorized**: No authentication
- **404 Not Found**: Generation ID not found, collection/category not found
- **429 Too Many Requests**: Rate limit exceeded (10/hour)
- **503 Service Unavailable**: AI service error
- **500 Internal Server Error**: Server errors

## 4. Przepływ danych

### POST /api/flashcards/generate Flow
1. **Authentication Check**: Verify user via `auth.uid()`
2. **Rate Limiting Check**: Verify user hasn't exceeded 10 requests/hour
3. **Input Validation**: Validate text length (1000-10000) and targetCount
4. **AI Generation Call**: Send request to OPENROUTER.ai
   ```typescript
   const aiResponse = await openRouterClient.generateFlashcards({
     text: validatedData.text,
     targetCount: validatedData.targetCount,
     model: "anthropic/claude-3-haiku"
   });
   ```
5. **Response Processing**: Parse AI response and validate candidates
6. **Content Filtering**: Filter inappropriate content and duplicates
7. **Generation ID Creation**: Create unique generation session ID
8. **Temporary Storage**: Store candidates for review (cache/temp table)
9. **Statistics Update**: Update generation attempt count
10. **Response Formation**: Return candidates with generation ID

### POST /api/flashcards/review Flow
1. **Authentication Check**: Verify user authentication
2. **Input Validation**: Validate generationId, collectionId, decisions
3. **Generation Session Verification**: Verify generation session exists and belongs to user
4. **Collection/Category Ownership**: Verify user owns collection and category
5. **Decision Processing**: Process each decision:
   ```sql
   -- For accept/accept_edited actions
   INSERT INTO flashcards (
     user_id, collection_id, category_id, front, back, 
     created_by, easiness_factor, interval, repetitions, next_review_date
   ) VALUES (
     auth.uid(), $1, $2, $3, $4, 
     'ai_generated', 2.5, 1, 0, CURRENT_DATE + INTERVAL '1 day'
   ) RETURNING *;
   ```
6. **Statistics Update**: Update flashcard_generation_stats
   ```sql
   INSERT INTO flashcard_generation_stats (
     user_id, total_generated, total_accepted_direct, total_accepted_edited, last_generation_at
   ) VALUES (auth.uid(), $1, $2, $3, NOW())
   ON CONFLICT (user_id) DO UPDATE SET
     total_generated = flashcard_generation_stats.total_generated + EXCLUDED.total_generated,
     total_accepted_direct = flashcard_generation_stats.total_accepted_direct + EXCLUDED.total_accepted_direct,
     total_accepted_edited = flashcard_generation_stats.total_accepted_edited + EXCLUDED.total_accepted_edited,
     last_generation_at = EXCLUDED.last_generation_at,
     updated_at = NOW();
   ```
7. **Cleanup**: Remove temporary generation session data
8. **Response Formation**: Return created flashcards and statistics

## 5. Względy bezpieczeństwa

### Authentication & Authorization
- Wymaganie autentykacji dla wszystkich operacji
- Weryfikacja ownership przez `auth.uid()` dla collections/categories
- Generation session ownership validation
- User isolation dla wszystkich AI generations

### API Security
- **OPENROUTER.ai API Key**: Secure storage w environment variables
- **Rate Limiting**: 10 AI generations per hour per user
- **Content Filtering**: Filter inappropriate AI responses
- **Input Sanitization**: Validate all text inputs
- **SQL Injection Prevention**: Parameterized queries only

### Data Security
- **Temporary Data**: Secure storage of generation candidates
- **Session Management**: Time-limited generation sessions (1 hour expiry)
- **PII Protection**: No personal data sent to AI service
- **Error Logging**: Sanitized error logs without sensitive data

### Row Level Security (RLS)
```sql
-- Already exists for flashcards table
CREATE POLICY flashcards_user_isolation ON flashcards
    FOR ALL USING (auth.uid() = user_id);

-- For generation stats
CREATE POLICY generation_stats_user_isolation ON flashcard_generation_stats
    FOR ALL USING (auth.uid() = user_id);
```

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
// 400 Bad Request - Text length validation
{
  error: {
    code: "INVALID_TEXT_LENGTH",
    message: "Text must be between 1000 and 10000 characters",
    details: { provided: 500, min: 1000, max: 10000 }
  }
}

// 429 Too Many Requests - Rate limiting
{
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "AI generation rate limit exceeded. Try again in 1 hour",
    details: { 
      limit: 10, 
      resetTime: "2025-01-15T18:00:00Z",
      currentUsage: 10
    }
  }
}

// 503 Service Unavailable - AI service error
{
  error: {
    code: "AI_SERVICE_UNAVAILABLE",
    message: "AI generation service is temporarily unavailable",
    details: { 
      service: "OPENROUTER.ai",
      retryAfter: 300
    }
  }
}

// 404 Not Found - Generation session
{
  error: {
    code: "GENERATION_SESSION_NOT_FOUND",
    message: "Generation session not found or expired",
    details: { generationId: "uuid" }
  }
}

// 400 Bad Request - Invalid decision
{
  error: {
    code: "INVALID_REVIEW_DECISION",
    message: "Invalid review decision. Front and back required for accept actions",
    details: { 
      candidateIndex: 0,
      action: "accept",
      missingFields: ["front", "back"]
    }
  }
}
```

### Error Handling Strategy
- **Early Returns**: Handle errors at function start
- **Comprehensive Logging**: Log all AI service interactions
- **User-Friendly Messages**: Clear error communication
- **Retry Logic**: Automatic retry dla transient AI service errors
- **Graceful Degradation**: Partial success handling w review
- **Rate Limit Headers**: Include rate limit info w responses

## 7. Wydajność

### Database Optimizations
```sql
-- Essential indexes for AI generation
CREATE INDEX idx_flashcard_generation_stats_user_id ON flashcard_generation_stats(user_id);
CREATE INDEX idx_flashcard_generation_stats_last_generation ON flashcard_generation_stats(user_id, last_generation_at);

-- For flashcard creation
CREATE INDEX idx_flashcards_user_created_by ON flashcards(user_id, created_by);
CREATE INDEX idx_flashcards_user_collection ON flashcards(user_id, collection_id);

-- For rate limiting queries
CREATE INDEX idx_flashcards_user_created_at ON flashcards(user_id, created_at) 
  WHERE created_by = 'ai_generated';
```

### AI Service Optimizations
- **Request Batching**: Batch multiple generation requests
- **Response Caching**: Cache similar text patterns (disabled dla privacy)
- **Timeout Handling**: 30-second timeout dla AI requests
- **Connection Pooling**: Reuse HTTP connections dla OPENROUTER.ai

### Rate Limiting Implementation
- **Time Window**: Rolling 1-hour window
- **Redis Storage**: Store rate limit counters w Redis
- **Efficient Queries**: Fast rate limit checks
- **Background Cleanup**: Clean expired rate limit data

### Performance Monitoring
- **AI Response Times**: Track OPENROUTER.ai latency
- **Generation Success Rates**: Monitor AI service reliability
- **Database Query Performance**: Monitor complex statistics updates
- **Memory Usage**: Track temporary generation data storage

### Caching Strategy
- **Generation Session Cache**: Store temporary candidates w Redis (1 hour TTL)
- **Rate Limit Cache**: Cache user rate limit counters
- **No Content Caching**: Don't cache AI responses dla privacy
- **Statistics Cache**: Cache user generation statistics (15 minutes)

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/flashcards/
├── generate.ts (POST - AI generation)
├── review.ts (POST - review and save)
src/lib/services/
├── AIGenerationService.ts
├── FlashcardReviewService.ts
├── GenerationStatsService.ts
├── RateLimitService.ts
src/lib/clients/
├── OpenRouterClient.ts
src/lib/schemas/
├── ai-generation.ts
src/types/
├── ai-generation.ts
src/lib/errors/
├── AIGenerationErrors.ts
├── RateLimitExceededError.ts
├── AIServiceUnavailableError.ts
├── GenerationSessionNotFoundError.ts
├── InvalidReviewDecisionError.ts
src/lib/utils/
├── content-filter.ts
├── generation-session-manager.ts
├── ai-response-parser.ts
```

### Krok 2: Typy i schemas
```typescript
// src/types/ai-generation.ts
export interface GenerateFlashcardsRequest {
  text: string;
  targetCount?: number;
}

export interface FlashcardCandidate {
  front: string;
  back: string;
  confidence: number;
}

export interface GenerationSession {
  id: string;
  userId: string;
  candidates: FlashcardCandidate[];
  createdAt: Date;
  expiresAt: Date;
}

export interface ReviewDecision {
  candidateIndex: number;
  action: 'accept' | 'accept_edited' | 'reject';
  front?: string;
  back?: string;
}

// src/lib/schemas/ai-generation.ts
export const GenerateFlashcardsSchema = z.object({
  text: z.string().min(1000).max(10000),
  targetCount: z.number().min(5).max(15).default(10)
});

export const ReviewFlashcardsSchema = z.object({
  generationId: z.string().uuid(),
  collectionId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  decisions: z.array(ReviewDecisionSchema).min(1)
});
```

### Krok 3: Service Layer
```typescript
// src/lib/services/AIGenerationService.ts
export class AIGenerationService {
  constructor(
    private openRouterClient: OpenRouterClient,
    private rateLimitService: RateLimitService
  ) {}

  async generateFlashcards(userId: string, request: GenerateFlashcardsRequest): Promise<GenerateFlashcardsResponse> {
    // Rate limiting check
    await this.rateLimitService.checkRateLimit(userId);
    
    // AI generation
    const aiResponse = await this.openRouterClient.generateFlashcards(request);
    
    // Content filtering and validation
    const filteredCandidates = await this.filterAndValidateCandidates(aiResponse.candidates);
    
    // Create generation session
    const sessionId = await this.createGenerationSession(userId, filteredCandidates);
    
    return {
      candidates: filteredCandidates,
      generationId: sessionId,
      totalGenerated: filteredCandidates.length
    };
  }

  private async filterAndValidateCandidates(candidates: any[]): Promise<FlashcardCandidate[]> {
    // Implementation with content filtering
  }

  private async createGenerationSession(userId: string, candidates: FlashcardCandidate[]): Promise<string> {
    // Implementation with Redis storage
  }
}

// src/lib/services/FlashcardReviewService.ts
export class FlashcardReviewService {
  constructor(
    private supabase: SupabaseClient,
    private statsService: GenerationStatsService
  ) {}

  async reviewFlashcards(userId: string, request: ReviewFlashcardsRequest): Promise<ReviewFlashcardsResponse> {
    // Verify generation session
    const session = await this.getGenerationSession(request.generationId, userId);
    
    // Verify collection/category ownership
    await this.verifyOwnership(userId, request.collectionId, request.categoryId);
    
    // Process decisions
    const acceptedFlashcards = await this.processDecisions(userId, request, session);
    
    // Update statistics
    const stats = await this.updateStatistics(userId, request.decisions);
    
    // Cleanup session
    await this.cleanupGenerationSession(request.generationId);
    
    return {
      acceptedFlashcards,
      stats
    };
  }

  private async processDecisions(userId: string, request: ReviewFlashcardsRequest, session: GenerationSession): Promise<CreatedFlashcard[]> {
    // Implementation with transaction safety
  }
}

// src/lib/clients/OpenRouterClient.ts
export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY!;
  }

  async generateFlashcards(request: GenerateFlashcardsRequest): Promise<any> {
    // Implementation with proper error handling and retry logic
  }
}
```

### Krok 4: API Routes

#### src/pages/api/flashcards/generate.ts
```typescript
import type { APIRoute } from 'astro';
import { AIGenerationService } from '../../lib/services/AIGenerationService';
import { GenerateFlashcardsSchema } from '../../lib/schemas/ai-generation';

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const body = await request.json();
    const validatedData = GenerateFlashcardsSchema.parse(body);
    
    const aiService = new AIGenerationService(
      new OpenRouterClient(),
      new RateLimitService()
    );
    
    const result = await aiService.generateFlashcards(user.id, validatedData);
    
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    // Comprehensive error handling including rate limiting and AI service errors
  }
};
```

#### src/pages/api/flashcards/review.ts
```typescript
import type { APIRoute } from 'astro';
import { FlashcardReviewService } from '../../lib/services/FlashcardReviewService';
import { ReviewFlashcardsSchema } from '../../lib/schemas/ai-generation';

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const body = await request.json();
    const validatedData = ReviewFlashcardsSchema.parse(body);
    
    const reviewService = new FlashcardReviewService(
      locals.supabase,
      new GenerationStatsService(locals.supabase)
    );
    
    const result = await reviewService.reviewFlashcards(user.id, validatedData);
    
    return new Response(JSON.stringify(result), { status: 201 });
  } catch (error) {
    // Error handling including generation session validation
  }
};
```

### Krok 5: Error Handling
```typescript
// src/lib/errors/AIGenerationErrors.ts
export class RateLimitExceededError extends Error {
  constructor(public resetTime: Date, public currentUsage: number) {
    super('AI generation rate limit exceeded');
    this.name = 'RateLimitExceededError';
  }
}

export class AIServiceUnavailableError extends Error {
  constructor(public retryAfter?: number) {
    super('AI generation service is temporarily unavailable');
    this.name = 'AIServiceUnavailableError';
  }
}

export class GenerationSessionNotFoundError extends Error {
  constructor(public generationId: string) {
    super('Generation session not found or expired');
    this.name = 'GenerationSessionNotFoundError';
  }
}

// Error handler utility
export function handleAIGenerationError(error: any) {
  if (error instanceof RateLimitExceededError) {
    return { 
      status: 429, 
      code: "RATE_LIMIT_EXCEEDED",
      details: { resetTime: error.resetTime, currentUsage: error.currentUsage }
    };
  }
  if (error instanceof AIServiceUnavailableError) {
    return { 
      status: 503, 
      code: "AI_SERVICE_UNAVAILABLE",
      details: { retryAfter: error.retryAfter }
    };
  }
  // ... other error types
}
```

### Krok 6: Testing
- Unit tests dla AIGenerationService
- Unit tests dla FlashcardReviewService
- Integration tests dla generation endpoint
- Integration tests dla review endpoint
- Rate limiting testing
- AI service mock testing
- Content filtering testing
- Generation session management testing
- Statistics accuracy testing
- Authentication & authorization testing
- Performance testing z concurrent requests

### Krok 7: Documentation
- API documentation z examples dla both endpoints
- OPENROUTER.ai integration guide
- Rate limiting documentation
- Generation session lifecycle
- Review decision workflow
- Error codes documentation
- Content filtering policies
- Usage examples dla frontend integration

### Krok 8: Deployment
- OPENROUTER.ai API key setup
- Redis setup dla session storage i rate limiting
- Database migrations dla generation stats
- Environment variables configuration
- Rate limiting monitoring setup
- AI service health checks
- Performance monitoring dla AI requests
- Error tracking integration

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ Kompletny AI Generation API
- ✅ OPENROUTER.ai integration z retry logic
- ✅ Rate limiting (10 req/hour per user)
- ✅ Multi-action review system
- ✅ Generation statistics tracking
- ✅ Content filtering i quality validation
- ✅ Secure session management
- ✅ Comprehensive error handling
- ✅ Performance optimizations
- ✅ MVP-ready functionality

Plan jest gotowy do implementacji przez zespół programistów z jasno określonymi krokami, bezpieczną integracją AI i wszystkimi niezbędnymi szczegółami technicznymi. 
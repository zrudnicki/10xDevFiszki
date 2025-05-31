# Plan Wdrożenia AI Generation API

## 1. Przegląd punktu końcowego

### Cel
Implementacja AI-powered generowania fiszek z integracją OPENROUTER.ai, rate limiting, session-based storage i tracking statystyk dla MVP metrics.

### Endpoint
- `POST /api/generate-flashcards` - Generowanie fiszek przy użyciu AI

### Kluczowe funkcjonalności
- **OPENROUTER.ai integration** z multiple model support
- **Rate limiting** (10 requests per minute per user)
- **Generation statistics tracking** dla MVP metrics
- **Session-based candidate storage** (nie bezpośrednio w database)
- **Collection context** dla lepszego AI generation
- **Performance monitoring** (processing time tracking)

## 2. Szczegóły żądania

### POST /api/generate-flashcards
```typescript
interface AIGenerationRequest {
  text: string; // required, 1000-10000 chars
  collection_id?: string; // optional, UUID, for context
  max_cards?: number; // optional, default: 10, max: 15
}
```

### Walidacja Zod Schema
```typescript
const AIGenerationSchema = z.object({
  text: z.string().min(1000).max(10000),
  collection_id: z.string().uuid().optional(),
  max_cards: z.number().min(1).max(15).default(10)
});
```

### Rate Limiting Requirements
- **Limit**: 10 requests per minute per user
- **Window**: 1 minute sliding window
- **Storage**: In-memory store lub Redis dla production
- **Response**: 429 Too Many Requests z retry_after

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
interface AIGenerationResponse {
  data: {
    candidates: FlashcardCandidate[];
    generated_count: number;
    processing_time_ms: number;
  };
}

interface FlashcardCandidate {
  front: string;
  back: string;
  confidence: number; // 0-1, AI confidence score
}
```

### Kody stanu HTTP
- **200 OK**: Successful generation
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: No authentication
- **422 Unprocessable Entity**: Validation errors (text length, invalid collection)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: AI service errors, server errors

### Rate Limit Error Response
```typescript
interface RateLimitResponse {
  error: {
    code: "RATE_LIMIT_EXCEEDED";
    message: "Too many generation requests. Please wait before trying again.";
    details: {
      limit: 10;
      window: "1 minute";
      retry_after: number; // seconds until next allowed request
    };
  };
}
```

## 4. Przepływ danych

### POST /api/generate-flashcards Flow
1. **Authentication Check**: Verify user via `auth.uid()`
2. **Rate Limiting Check**: Verify user hasn't exceeded 10 req/min
3. **Input Validation**: Validate text length (1000-10000 chars), max_cards (1-15)
4. **Collection Context**: If collection_id provided, fetch collection for context
5. **AI Request Preparation**: Format request for OPENROUTER.ai
6. **AI Generation**: 
   ```typescript
   const aiResponse = await openRouterClient.generateFlashcards({
     text: validatedData.text,
     maxCards: validatedData.max_cards,
     context: collectionContext
   });
   ```
7. **Response Processing**: Parse AI response, validate candidates
8. **Statistics Update**: Update flashcard_generation_stats.total_generated
9. **Session Storage**: Store candidates in session/cache (not database yet)
10. **Response Formation**: Return candidates with metadata

### Rate Limiting Implementation
```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= 10) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }
  
  getRetryAfter(userId: string): number {
    const userRequests = this.requests.get(userId) || [];
    if (userRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...userRequests);
    return Math.max(0, 60 - Math.floor((Date.now() - oldestRequest) / 1000));
  }
}
```

## 5. Względy bezpieczeństwa

### API Key Protection
- **Environment variables**: Store OPENROUTER.ai API key securely
- **Never expose**: API keys in client-side code or responses
- **Key rotation**: Plan for API key rotation procedures

### Input Validation
- **Text content**: Validate length (1000-10000 chars), sanitize input
- **Collection access**: Verify user owns collection if collection_id provided
- **Max cards limit**: Enforce max 15 cards per request

### Rate Limiting Security
- **Per-user limits**: Prevent individual user abuse
- **IP-based backup**: Additional IP-based limiting for extreme cases
- **Gradual backoff**: Increase penalties for repeated violations

### Authentication & Authorization
- **User authentication**: Required for all requests
- **Collection ownership**: Verify user owns referenced collection
- **No anonymous access**: Prevent unauthorized AI usage

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
// 422 Validation Error - Text too short/long
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: {
      text: "Text must be between 1000 and 10000 characters"
    }
  }
}

// 429 Rate Limit Exceeded
{
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many generation requests. Please wait before trying again.",
    details: {
      limit: 10,
      window: "1 minute",
      retry_after: 45
    }
  }
}

// 422 Collection Not Found
{
  error: {
    code: "COLLECTION_NOT_FOUND",
    message: "Collection not found or access denied",
    details: { field: "collection_id" }
  }
}

// 500 AI Service Error
{
  error: {
    code: "AI_SERVICE_ERROR",
    message: "AI service temporarily unavailable. Please try again later."
  }
}
```

### Error Handling Strategy
- **Graceful degradation**: Handle AI service outages
- **Retry logic**: Implement exponential backoff for AI requests
- **User-friendly messages**: Clear error descriptions
- **Comprehensive logging**: Log all errors for debugging
- **Timeout handling**: Handle slow AI responses

## 7. Wydajność

### AI Request Optimization
- **Request batching**: Optimize AI requests for efficiency
- **Timeout handling**: Set reasonable timeouts (30s)
- **Connection pooling**: Reuse HTTP connections to OPENROUTER.ai
- **Response caching**: Cache similar requests (with caution)

### Rate Limiting Performance
- **In-memory storage**: Fast access to rate limit data
- **Efficient cleanup**: Remove old rate limit entries
- **Sliding window**: Accurate rate limiting with minimal overhead

### Session Storage
- **Temporary storage**: Store candidates in session/cache
- **TTL (Time To Live)**: Auto-expire old candidates (1 hour)
- **Memory management**: Prevent memory leaks from abandoned sessions

### Performance Monitoring
```typescript
interface PerformanceMetrics {
  ai_request_duration_ms: number;
  total_processing_time_ms: number;
  candidates_generated: number;
  rate_limit_hits: number;
}
```

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/
├── generate-flashcards.ts
src/lib/services/
├── AIGenerationService.ts
├── OpenRouterService.ts
├── RateLimitService.ts
src/lib/schemas/
├── ai-generation.ts
src/types/
├── ai-generation.ts
src/lib/errors/
├── AIGenerationErrors.ts
├── RateLimitExceededError.ts
├── AIServiceError.ts
├── InvalidTextLengthError.ts
├── CollectionNotFoundError.ts
├── AITimeoutError.ts
├── InvalidGenerationParametersError.ts
src/lib/utils/
├── session-storage.ts
├── ai-prompt-builder.ts
├── rate-limiting.ts
```

### Krok 2: Environment Setup
```typescript
// Environment variables required
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_REQUEST_TIMEOUT=30000
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=10
```

### Krok 3: Service Layer Implementation

#### OpenRouter Service
```typescript
// src/lib/services/OpenRouterService.ts
export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY!;
    this.baseUrl = process.env.OPENROUTER_BASE_URL!;
    this.timeout = parseInt(process.env.AI_REQUEST_TIMEOUT!) || 30000;
  }

  async generateFlashcards(request: AIGenerationRequest, context?: string): Promise<FlashcardCandidate[]> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildPrompt(request.text, context, request.max_cards);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://10xdevfiszki.com',
          'X-Title': '10xDevFiszki'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new AIServiceError(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const candidates = this.parseAIResponse(data);
      
      return candidates;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('AI Generation failed:', { error, processingTime });
      throw error;
    }
  }

  private buildPrompt(text: string, context?: string, maxCards?: number): string {
    // Build optimized prompt for flashcard generation
  }

  private parseAIResponse(response: any): FlashcardCandidate[] {
    // Parse AI response and extract flashcard candidates
  }
}
```

#### AI Generation Service
```typescript
// src/lib/services/AIGenerationService.ts
export class AIGenerationService {
  constructor(
    private supabase: SupabaseClient,
    private openRouterService: OpenRouterService,
    private rateLimitService: RateLimitService
  ) {}

  async generateFlashcards(userId: string, request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const startTime = Date.now();

    // Rate limiting check
    if (!this.rateLimitService.isAllowed(userId)) {
      const retryAfter = this.rateLimitService.getRetryAfter(userId);
      throw new RateLimitExceededError(retryAfter);
    }

    // Collection context
    let collectionContext: string | undefined;
    if (request.collection_id) {
      collectionContext = await this.getCollectionContext(userId, request.collection_id);
    }

    // AI generation
    const candidates = await this.openRouterService.generateFlashcards(request, collectionContext);

    // Update statistics
    await this.updateGenerationStats(userId, candidates.length);

    const processingTime = Date.now() - startTime;

    return {
      data: {
        candidates,
        generated_count: candidates.length,
        processing_time_ms: processingTime
      }
    };
  }

  private async getCollectionContext(userId: string, collectionId: string): Promise<string> {
    // Fetch collection info for AI context
  }

  private async updateGenerationStats(userId: string, generatedCount: number): Promise<void> {
    // Update or insert generation statistics
  }
}
```

### Krok 4: API Route Implementation
```typescript
// src/pages/api/generate-flashcards.ts
import type { APIRoute } from 'astro';
import { AIGenerationService } from '../lib/services/AIGenerationService';
import { OpenRouterService } from '../lib/services/OpenRouterService';
import { RateLimitService } from '../lib/services/RateLimitService';
import { AIGenerationSchema } from '../lib/schemas/ai-generation';

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    const body = await request.json();
    const validatedData = AIGenerationSchema.parse(body);

    const aiGenerationService = new AIGenerationService(
      locals.supabase,
      new OpenRouterService(),
      new RateLimitService()
    );

    const result = await aiGenerationService.generateFlashcards(user.id, validatedData);

    return new Response(JSON.stringify(result), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return new Response(JSON.stringify({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many generation requests. Please wait before trying again.",
          details: {
            limit: 10,
            window: "1 minute",
            retry_after: error.retryAfter
          }
        }
      }), { status: 429 });
    }

    if (error instanceof AIServiceError) {
      return new Response(JSON.stringify({
        error: {
          code: "AI_SERVICE_ERROR",
          message: "AI service temporarily unavailable. Please try again later."
        }
      }), { status: 500 });
    }

    // Handle other errors...
    console.error('AI Generation error:', error);
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
// src/lib/errors/AIGenerationErrors.ts
export class RateLimitExceededError extends Error {
  constructor(public retryAfter: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitExceededError';
  }
}

export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class InvalidTextLengthError extends Error {
  constructor() {
    super('Text must be between 1000 and 10000 characters');
    this.name = 'InvalidTextLengthError';
  }
}
```

### Krok 6: Testing Strategy
- **Unit tests**: AIGenerationService, OpenRouterService, RateLimitService
- **Integration tests**: End-to-end API testing
- **Rate limiting tests**: Verify 10 req/min enforcement
- **AI service mocking**: Test without actual AI calls
- **Performance tests**: Response time under load
- **Error scenario tests**: AI service failures, timeouts

### Krok 7: Monitoring & Analytics
```typescript
interface AIGenerationMetrics {
  total_requests: number;
  successful_generations: number;
  rate_limit_hits: number;
  average_processing_time: number;
  ai_service_errors: number;
  average_candidates_per_request: number;
}
```

### Krok 8: Deployment Considerations
- **Environment variables**: Secure API key storage
- **Rate limiting storage**: Redis dla production scalability
- **Monitoring**: Performance metrics tracking
- **Alerting**: AI service failure notifications
- **Cost monitoring**: OPENROUTER.ai usage tracking

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ **OPENROUTER.ai integration** z multiple model support
- ✅ **Robust rate limiting** (10 req/min per user)
- ✅ **Generation statistics tracking** dla MVP metrics
- ✅ **Session-based candidate storage**
- ✅ **Comprehensive error handling** (timeouts, service failures)
- ✅ **Security best practices** (API key protection, input validation)
- ✅ **Performance optimization** (connection pooling, monitoring)
- ✅ **MVP-ready functionality** dla AI-powered flashcard generation
- ✅ **Scalable architecture** z service layer pattern
- ✅ **Production-ready features** (rate limiting, monitoring, alerting)

Plan jest gotowy do implementacji z jasno określonymi krokami i comprehensive testing strategy dla AI integration. 
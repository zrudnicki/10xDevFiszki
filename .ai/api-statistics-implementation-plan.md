# Plan Wdrożenia Statistics & Analytics API

## 1. Przegląd punktu końcowego

### Cel
Implementacja kompletnego API dla statystyk i analityki użytkownika z focus na generation statistics, monthly trends i advanced metrics dla AI flashcard generation.

### Endpointy
- `GET /api/stats/generation` - Szczegółowe statystyki generacji AI z monthly trends
- `GET /api/users/me/stats` - Comprehensive user statistics (już pokryte w User Management API)

### Kluczowe funkcjonalności
- User isolation przez RLS policies
- Generation statistics z acceptance rates
- Monthly trend calculations
- Real-time statistics aggregation
- MVP metrics tracking (75% AI acceptance rate)
- Multi-table analytics dla complex insights

## 2. Szczegóły żądania

### GET /api/stats/generation
```typescript
// No request body - simple authenticated GET request
// Authentication required via Bearer token
// Optional query parameters for filtering
interface GenerationStatsQuery {
  months?: number; // optional, default: 12, max: 24 - how many months back
}
```

### Walidacja Zod Schemas
```typescript
const GenerationStatsQuerySchema = z.object({
  months: z.coerce.number().min(1).max(24).default(12)
});

// No complex validation needed - mainly authentication
```

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
interface GenerationStatsResponse {
  totalGenerated: number;
  totalAcceptedDirect: number;
  totalAcceptedEdited: number;
  totalRejected: number;
  acceptanceRate: number; // percentage
  editRate: number; // percentage  
  lastGenerationAt: string | null;
  monthlyTrend: MonthlyTrendItem[];
}

interface MonthlyTrendItem {
  month: string; // "2025-01" format
  generated: number;
  accepted: number; // acceptedDirect + acceptedEdited
  acceptanceRate: number; // percentage for that month
}

// User stats response already covered in User Management API
interface UserStatsResponse {
  totalFlashcards: number;
  totalCollections: number;
  totalCategories: number;
  studySessionsCompleted: number;
  averageSessionDuration: number;
  generationStats: {
    totalGenerated: number;
    totalAcceptedDirect: number;
    totalAcceptedEdited: number;
    acceptanceRate: number;
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
- **401 Unauthorized**: No authentication or invalid token
- **404 Not Found**: No statistics available (edge case for new users)
- **500 Internal Server Error**: Statistics calculation errors

## 4. Przepływ danych

### GET /api/stats/generation Flow
1. **Authentication Check**: Verify user via `auth.uid()`
2. **Query Validation**: Validate optional months parameter
3. **Generation Stats Query**: Get basic statistics from flashcard_generation_stats
   ```sql
   SELECT 
     total_generated,
     total_accepted_direct,
     total_accepted_edited,
     last_generation_at,
     CASE 
       WHEN total_generated > 0 
       THEN ROUND(((total_accepted_direct + total_accepted_edited)::DECIMAL / total_generated) * 100, 2)
       ELSE 0 
     END as acceptance_rate,
     CASE 
       WHEN total_generated > 0 
       THEN ROUND((total_accepted_edited::DECIMAL / total_generated) * 100, 2)
       ELSE 0 
     END as edit_rate
   FROM flashcard_generation_stats 
   WHERE user_id = auth.uid();
   ```
4. **Rejected Count Calculation**: Calculate rejected flashcards
   ```sql
   -- totalRejected = totalGenerated - (totalAcceptedDirect + totalAcceptedEdited)
   ```
5. **Monthly Trend Query**: Get monthly generation trends
   ```sql
   SELECT 
     TO_CHAR(created_at, 'YYYY-MM') as month,
     COUNT(*) FILTER (WHERE created_by = 'ai_generated') as generated,
     COUNT(*) FILTER (WHERE created_by = 'ai_generated') as accepted
   FROM flashcards 
   WHERE user_id = auth.uid() 
     AND created_at >= NOW() - INTERVAL '{months} months'
   GROUP BY TO_CHAR(created_at, 'YYYY-MM')
   ORDER BY month DESC;
   ```
6. **Data Aggregation**: Combine statistics and trends
7. **Response Formation**: Return formatted generation statistics

## 5. Względy bezpieczeństwa

### Row Level Security (RLS)
```sql
CREATE POLICY generation_stats_user_isolation ON flashcard_generation_stats
    FOR ALL USING (auth.uid() = user_id);
```

### Authentication & Authorization
- Wymaganie autentykacji dla wszystkich operacji
- Weryfikacja user identity przez `auth.uid()`
- Bearer token validation via Supabase Auth
- Brak możliwości dostępu do cudzych statystyk

### Data Privacy
- **User Isolation**: Only authenticated user's statistics
- **No Cross-User Data**: Strict user_id filtering
- **Secure Aggregations**: All queries filtered by auth.uid()
- **Privacy Protection**: No exposure of other users' metrics

### Input Validation
- Parameter validation dla months filter
- Authentication token verification
- SQL injection prevention przez parameterized queries
- Rate limiting dla expensive statistics queries

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
// 401 Unauthorized - No authentication
{
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required. Please provide valid bearer token"
  }
}

// 404 Not Found - No statistics (new user)
{
  error: {
    code: "NO_STATISTICS_FOUND",
    message: "No generation statistics found for user",
    details: { suggestion: "Generate some flashcards first" }
  }
}

// 500 Internal Server Error - Calculation error
{
  error: {
    code: "STATISTICS_CALCULATION_ERROR",
    message: "Failed to calculate generation statistics",
    details: { failedQuery: "monthly_trend_calculation" }
  }
}

// 400 Bad Request - Invalid months parameter
{
  error: {
    code: "INVALID_MONTHS_PARAMETER",
    message: "Months parameter must be between 1 and 24",
    details: { provided: 36, min: 1, max: 24 }
  }
}
```

### Error Handling Strategy
- **Graceful Degradation**: Return partial statistics on calculation errors
- **Comprehensive Logging**: Detailed error logging dla debugging
- **User-Friendly Messages**: Clear error communication
- **Fallback Values**: Default values dla missing statistics
- **Performance Monitoring**: Track failed statistics queries

## 7. Wydajność

### Database Optimizations
```sql
-- Essential indexes for statistics queries
CREATE INDEX idx_flashcard_generation_stats_user_id ON flashcard_generation_stats(user_id);
CREATE INDEX idx_flashcards_user_created_by ON flashcards(user_id, created_by, created_at);
CREATE INDEX idx_flashcards_user_monthly ON flashcards(user_id, DATE_TRUNC('month', created_at));

-- For monthly trend calculations
CREATE INDEX idx_flashcards_created_month ON flashcards(DATE_TRUNC('month', created_at)) 
  WHERE created_by = 'ai_generated';

-- For generation stats lookup
CREATE INDEX idx_generation_stats_lookup ON flashcard_generation_stats(user_id, total_generated, last_generation_at);
```

### Query Optimizations
- **Efficient Aggregations**: Use proper GROUP BY i date functions
- **Selective Filtering**: Filter by user_id early w queries
- **Materialized Calculations**: Pre-calculate acceptance rates
- **Optimized Date Grouping**: Efficient monthly grouping

### Caching Strategy
- **Statistics Caching**: Cache generation statistics dla 30 minutes
- **Trend Caching**: Cache monthly trends dla 1 hour
- **Invalidation**: Clear cache on new generations
- **User-Specific Caching**: Separate cache per user

### Performance Monitoring
- **Query Performance**: Monitor statistics calculation times
- **Cache Hit Rates**: Track cache effectiveness
- **Database Load**: Monitor concurrent statistics requests
- **Trend Calculation Time**: Track monthly aggregation performance

### Statistics Calculation
- **Lazy Loading**: Calculate trends on demand
- **Batch Processing**: Efficient monthly aggregations
- **Memory Efficiency**: Stream large result sets
- **Connection Pooling**: Efficient database connections

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/stats/
├── generation.ts (GET - generation statistics)
src/lib/services/
├── StatisticsService.ts
├── GenerationAnalyticsService.ts
├── StatisticsCacheService.ts
src/lib/schemas/
├── statistics.ts
src/types/
├── statistics.ts
src/lib/errors/
├── StatisticsErrors.ts
├── StatisticsCalculationError.ts
├── NoStatisticsFoundError.ts
src/lib/utils/
├── statistics-calculator.ts
├── monthly-trend-calculator.ts
├── generation-metrics.ts
```

### Krok 2: Typy i schemas
```typescript
// src/types/statistics.ts
export interface GenerationStatistics {
  totalGenerated: number;
  totalAcceptedDirect: number;
  totalAcceptedEdited: number;
  totalRejected: number;
  acceptanceRate: number;
  editRate: number;
  lastGenerationAt: string | null;
  monthlyTrend: MonthlyTrendItem[];
}

export interface MonthlyTrendItem {
  month: string;
  generated: number;
  accepted: number;
  acceptanceRate: number;
}

export interface GenerationMetrics {
  mvpAcceptanceRate: boolean; // >= 75%
  averageGenerationTime: number;
  monthlyGrowthRate: number;
}

// src/lib/schemas/statistics.ts
export const GenerationStatsQuerySchema = z.object({
  months: z.coerce.number().min(1).max(24).default(12)
});
```

### Krok 3: Service Layer
```typescript
// src/lib/services/StatisticsService.ts
export class StatisticsService {
  constructor(private supabase: SupabaseClient) {}

  async getGenerationStatistics(userId: string, months: number = 12): Promise<GenerationStatistics> {
    // Implementation with comprehensive generation statistics
  }

  async getBasicGenerationStats(userId: string) {
    // Query flashcard_generation_stats table
  }

  async getMonthlyTrends(userId: string, months: number) {
    // Calculate monthly generation trends
  }

  private async calculateAcceptanceRates(stats: any) {
    // Calculate acceptance and edit rates
  }

  private async calculateRejectedCount(stats: any) {
    // Calculate rejected flashcards count
  }
}

// src/lib/services/GenerationAnalyticsService.ts
export class GenerationAnalyticsService {
  constructor(private supabase: SupabaseClient) {}

  async calculateMonthlyTrends(userId: string, months: number): Promise<MonthlyTrendItem[]> {
    // Complex monthly trend calculation
  }

  async getMVPMetrics(userId: string): Promise<GenerationMetrics> {
    // Calculate MVP-specific metrics
  }

  async getGenerationEfficiency(userId: string) {
    // Calculate generation efficiency metrics
  }
}

// src/lib/services/StatisticsCacheService.ts
export class StatisticsCacheService {
  private cache = new Map<string, { data: any; expiry: number }>();

  async getOrCalculate<T>(
    key: string,
    calculator: () => Promise<T>,
    ttlMinutes: number = 30
  ): Promise<T> {
    // Cache implementation with TTL
  }

  invalidateUserCache(userId: string) {
    // Invalidate all user-related cache entries
  }
}
```

### Krok 4: API Routes

#### src/pages/api/stats/generation.ts
```typescript
import type { APIRoute } from 'astro';
import { StatisticsService } from '../../lib/services/StatisticsService';
import { GenerationStatsQuerySchema } from '../../lib/schemas/statistics';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      }), { status: 401 });
    }

    // Parse query parameters
    const searchParams = new URL(url).searchParams;
    const queryData = {
      months: searchParams.get('months') || '12'
    };
    
    const { months } = GenerationStatsQuerySchema.parse(queryData);
    
    const statsService = new StatisticsService(locals.supabase);
    const statistics = await statsService.getGenerationStatistics(user.id, months);
    
    return new Response(JSON.stringify(statistics), { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=1800' // 30 minutes
      }
    });
  } catch (error) {
    // Comprehensive error handling including calculation failures
  }
};
```

### Krok 5: Error Handling
```typescript
// src/lib/errors/StatisticsErrors.ts
export class StatisticsCalculationError extends Error {
  constructor(query: string, originalError?: Error) {
    super(`Statistics calculation failed for: ${query}`);
    this.name = 'StatisticsCalculationError';
    this.cause = originalError;
  }
}

export class NoStatisticsFoundError extends Error {
  constructor() {
    super('No generation statistics found for user');
    this.name = 'NoStatisticsFoundError';
  }
}

export class InvalidMonthsParameterError extends Error {
  constructor(provided: number) {
    super(`Invalid months parameter: ${provided}. Must be between 1 and 24`);
    this.name = 'InvalidMonthsParameterError';
  }
}

// Error handler utility
export function handleStatisticsError(error: any) {
  if (error instanceof NoStatisticsFoundError) {
    return { status: 404, code: "NO_STATISTICS_FOUND" };
  }
  if (error instanceof StatisticsCalculationError) {
    return { status: 500, code: "STATISTICS_CALCULATION_ERROR" };
  }
  if (error instanceof InvalidMonthsParameterError) {
    return { status: 400, code: "INVALID_MONTHS_PARAMETER" };
  }
  // ... other error types
}
```

### Krok 6: Testing
- Unit tests dla StatisticsService
- Unit tests dla GenerationAnalyticsService
- Integration tests dla generation endpoint
- Performance testing dla complex aggregations
- Cache functionality testing
- Monthly trend calculation accuracy
- MVP metrics validation testing
- Authentication & authorization testing
- Edge case testing (new users, no data)
- Load testing dla concurrent statistics requests

### Krok 7: Documentation
- API documentation z examples dla generation endpoint
- Statistics calculation methodology
- Monthly trend explanation
- MVP metrics documentation
- Caching strategy documentation
- Performance optimization guide
- Usage examples dla frontend integration
- Analytics dashboard requirements

### Krok 8: Deployment
- Database indexes dla statistics queries
- Cache service setup and configuration
- Performance monitoring dla statistics endpoints
- Error tracking integration
- Background job setup dla statistics precalculation
- Database query optimization
- CDN setup dla cacheable responses

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ Kompletny Statistics & Analytics API
- ✅ Generation statistics z monthly trends
- ✅ MVP metrics tracking (75% acceptance rate)
- ✅ Real-time calculations z caching
- ✅ Multi-table analytics aggregation
- ✅ Performance optimizations
- ✅ Comprehensive error handling
- ✅ Security best practices
- ✅ Scalable architecture
- ✅ MVP-ready functionality

Plan jest gotowy do implementacji przez zespół programistów z jasno określonymi krokami, wydajnymi obliczeniami statystyk i wszystkimi niezbędnymi szczegółami technicznymi dla advanced analytics. 
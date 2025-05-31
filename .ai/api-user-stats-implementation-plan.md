# Plan Wdrożenia User Statistics API

## 1. Przegląd punktu końcowego

### Cel
Implementacja comprehensive user statistics API z real-time calculation dla MVP metrics, complex database aggregations i efficient performance tracking.

### Endpoint
- `GET /api/users/stats` - Pobranie kompletnych statystyk użytkownika

### Kluczowe funkcjonalności
- **MVP Metrics calculation** (75% AI acceptance, 75% AI-generated, <2min sessions)
- **Real-time aggregations** across all user tables
- **Generation statistics** tracking dla AI workflow
- **Learning progress metrics** dla spaced repetition
- **Collection & category counts** dla dashboard
- **Performance optimization** z efficient SQL queries

## 2. Szczegóły żądania

### GET /api/users/stats
```typescript
// No query parameters - returns all user statistics
interface UserStatsRequest {
  // No request body or parameters
}
```

### Authentication Required
- **User authentication**: Required via Supabase Auth
- **Personal data only**: Returns only authenticated user's statistics
- **Real-time calculation**: No caching - fresh data every request

## 3. Szczegóły odpowiedzi

### Struktura odpowiedzi
```typescript
interface UserStatsResponse {
  data: {
    generation_stats: GenerationStats;
    learning_stats: LearningStats;
    collection_stats: CollectionStats;
  };
}

interface GenerationStats {
  total_generated: number;
  total_accepted_direct: number;
  total_accepted_edited: number;
  acceptance_rate: number; // percentage, MVP metric
  last_generation_at: string | null;
}

interface LearningStats {
  total_flashcards: number;
  ai_generated_percentage: number; // percentage, MVP metric
  cards_due_today: number;
  average_session_time_ms: number; // MVP metric (<2min = <120000ms)
  sessions_this_week: number;
}

interface CollectionStats {
  total_collections: number;
  total_categories: number;
}
```

### MVP Metrics Integration
```typescript
interface MVPMetrics {
  ai_acceptance_rate: number; // should be >= 75%
  ai_generated_percentage: number; // should be >= 75%
  average_session_time_minutes: number; // should be < 2 minutes
}
```

### Kody stanu HTTP
- **200 OK**: Successful statistics retrieval
- **401 Unauthorized**: No authentication
- **500 Internal Server Error**: Database aggregation errors

## 4. Przepływ danych

### GET /api/users/stats Flow
1. **Authentication Check**: Verify user via `auth.uid()`
2. **Parallel Statistics Queries**: Execute multiple aggregation queries simultaneously
3. **Generation Stats Calculation**:
   ```sql
   SELECT 
     total_generated,
     total_accepted_direct,
     total_accepted_edited,
     CASE 
       WHEN total_generated > 0 
       THEN ROUND(((total_accepted_direct + total_accepted_edited)::DECIMAL / total_generated) * 100, 2)
       ELSE 0 
     END as acceptance_rate,
     last_generation_at
   FROM flashcard_generation_stats 
   WHERE user_id = auth.uid()
   ```
4. **Learning Stats Calculation**:
   ```sql
   -- Total flashcards and AI percentage
   SELECT 
     COUNT(*) as total_flashcards,
     CASE 
       WHEN COUNT(*) > 0 
       THEN ROUND((COUNT(*) FILTER (WHERE created_by = 'ai_generated')::DECIMAL / COUNT(*)) * 100, 2)
       ELSE 0 
     END as ai_percentage
   FROM flashcards 
   WHERE user_id = auth.uid();
   
   -- Cards due today
   SELECT COUNT(*) as cards_due_today
   FROM flashcards 
   WHERE user_id = auth.uid() 
     AND next_review_date <= NOW();
   
   -- Average session time and sessions this week
   SELECT 
     COALESCE(AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000), 0) as avg_session_time_ms,
     COUNT(*) FILTER (WHERE started_at >= date_trunc('week', NOW())) as sessions_this_week
   FROM study_sessions 
   WHERE user_id = auth.uid() 
     AND status = 'completed'
     AND ended_at IS NOT NULL;
   ```
5. **Collection Stats Calculation**:
   ```sql
   SELECT 
     (SELECT COUNT(*) FROM collections WHERE user_id = auth.uid()) as total_collections,
     (SELECT COUNT(*) FROM categories WHERE user_id = auth.uid()) as total_categories;
   ```
6. **Response Formation**: Combine all statistics into structured response

### Database Aggregation Strategies
```typescript
class UserStatsService {
  async getComprehensiveStats(userId: string): Promise<UserStatsResponse> {
    // Execute all queries in parallel for better performance
    const [
      generationStats,
      learningStats,
      collectionStats
    ] = await Promise.all([
      this.getGenerationStats(userId),
      this.getLearningStats(userId),
      this.getCollectionStats(userId)
    ]);

    return {
      data: {
        generation_stats: generationStats,
        learning_stats: learningStats,
        collection_stats: collectionStats
      }
    };
  }
}
```

## 5. Względy bezpieczeństwa

### User Data Isolation
- **RLS policies**: All tables have proper user isolation
- **Auth verification**: Use `auth.uid()` for all queries
- **No cross-user data**: Never expose other users' statistics
- **Personal metrics only**: Statistics only for authenticated user

### Input Validation
- **No parameters**: GET request with no query parameters
- **Authentication required**: Block all unauthenticated requests
- **SQL injection prevention**: Use parameterized queries

### Data Privacy
- **Personal statistics only**: Never aggregate across users
- **No sensitive data exposure**: Statistics only, no raw content
- **GDPR compliance**: User can see their own data

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
    message: "Authentication required to access user statistics"
  }
}

// 500 Internal Server Error - Database aggregation failure
{
  error: {
    code: "STATISTICS_CALCULATION_ERROR",
    message: "Failed to calculate user statistics. Please try again."
  }
}

// 500 Internal Server Error - Specific aggregation failure
{
  error: {
    code: "DATABASE_AGGREGATION_ERROR",
    message: "Database aggregation failed during statistics calculation",
    details: { failed_query: "learning_stats" }
  }
}
```

### Error Handling Strategy
- **Graceful degradation**: Return partial statistics if some queries fail
- **Comprehensive logging**: Log all aggregation errors
- **Default values**: Provide sensible defaults for missing data
- **Retry logic**: Retry failed queries once
- **User-friendly messages**: Clear error descriptions

## 7. Wydajność

### Database Optimizations
```sql
-- Generation stats - simple primary key lookup
CREATE INDEX idx_generation_stats_user_id ON flashcard_generation_stats(user_id);

-- Flashcards aggregations
CREATE INDEX idx_flashcards_user_created_by ON flashcards(user_id, created_by);
CREATE INDEX idx_flashcards_user_next_review ON flashcards(user_id, next_review_date);

-- Study sessions aggregations  
CREATE INDEX idx_study_sessions_user_status_dates ON study_sessions(user_id, status, started_at, ended_at);
CREATE INDEX idx_study_sessions_user_week ON study_sessions(user_id, started_at) 
  WHERE started_at >= date_trunc('week', NOW());

-- Collections and categories - simple user_id indexes
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
```

### Query Optimizations
```sql
-- Optimized combined query for learning stats
WITH flashcard_stats AS (
  SELECT 
    COUNT(*) as total_flashcards,
    COUNT(*) FILTER (WHERE created_by = 'ai_generated') as ai_generated_count,
    COUNT(*) FILTER (WHERE next_review_date <= NOW()) as due_count
  FROM flashcards 
  WHERE user_id = $1
),
session_stats AS (
  SELECT 
    AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000) as avg_session_time_ms,
    COUNT(*) FILTER (WHERE started_at >= date_trunc('week', NOW())) as sessions_this_week
  FROM study_sessions 
  WHERE user_id = $1 
    AND status = 'completed'
    AND ended_at IS NOT NULL
)
SELECT 
  f.total_flashcards,
  CASE 
    WHEN f.total_flashcards > 0 
    THEN ROUND((f.ai_generated_count::DECIMAL / f.total_flashcards) * 100, 2)
    ELSE 0 
  END as ai_generated_percentage,
  f.due_count as cards_due_today,
  COALESCE(s.avg_session_time_ms, 0) as average_session_time_ms,
  COALESCE(s.sessions_this_week, 0) as sessions_this_week
FROM flashcard_stats f
CROSS JOIN session_stats s;
```

### Performance Monitoring
```typescript
interface StatsPerformanceMetrics {
  query_execution_time_ms: number;
  total_records_processed: number;
  cache_hit_rate?: number; // if caching implemented
  aggregation_complexity: 'simple' | 'complex';
}
```

### Caching Strategy (Optional)
```typescript
// Optional Redis caching for expensive aggregations
class StatsCacheService {
  async getCachedStats(userId: string): Promise<UserStatsResponse | null> {
    // Check Redis for cached stats (TTL: 5 minutes)
  }
  
  async setCachedStats(userId: string, stats: UserStatsResponse): Promise<void> {
    // Cache stats with 5-minute expiration
  }
}
```

## 8. Kroki implementacji

### Krok 1: Struktura plików
```
src/pages/api/users/
├── stats.ts
src/lib/services/
├── UserStatsService.ts
├── StatsCacheService.ts (optional)
src/lib/schemas/
├── user-stats.ts
src/types/
├── user-stats.ts
src/lib/errors/
├── UserStatsErrors.ts
├── StatisticsCalculationError.ts
├── DatabaseAggregationError.ts
├── InvalidUserError.ts
src/lib/utils/
├── stats-calculations.ts
```

### Krok 2: Core Service Implementation
```typescript
// src/lib/services/UserStatsService.ts
export class UserStatsService {
  constructor(private supabase: SupabaseClient) {}

  async getComprehensiveStats(userId: string): Promise<UserStatsResponse> {
    try {
      const [generationStats, learningStats, collectionStats] = await Promise.all([
        this.getGenerationStats(userId),
        this.getLearningStats(userId),
        this.getCollectionStats(userId)
      ]);

      return {
        data: {
          generation_stats: generationStats,
          learning_stats: learningStats,
          collection_stats: collectionStats
        }
      };
    } catch (error) {
      console.error('Failed to calculate user statistics:', error);
      throw new StatisticsCalculationError('Failed to calculate comprehensive statistics');
    }
  }

  private async getGenerationStats(userId: string): Promise<GenerationStats> {
    const { data, error } = await this.supabase
      .from('flashcard_generation_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw new DatabaseAggregationError('Failed to fetch generation stats');
    }

    if (!data) {
      return {
        total_generated: 0,
        total_accepted_direct: 0,
        total_accepted_edited: 0,
        acceptance_rate: 0,
        last_generation_at: null
      };
    }

    const totalAccepted = data.total_accepted_direct + data.total_accepted_edited;
    const acceptanceRate = data.total_generated > 0 
      ? Math.round((totalAccepted / data.total_generated) * 100 * 100) / 100 
      : 0;

    return {
      total_generated: data.total_generated,
      total_accepted_direct: data.total_accepted_direct,
      total_accepted_edited: data.total_accepted_edited,
      acceptance_rate: acceptanceRate,
      last_generation_at: data.last_generation_at
    };
  }

  private async getLearningStats(userId: string): Promise<LearningStats> {
    // Complex aggregation query combining multiple metrics
    const { data, error } = await this.supabase.rpc('get_user_learning_stats', {
      p_user_id: userId
    });

    if (error) {
      throw new DatabaseAggregationError('Failed to fetch learning stats');
    }

    return data[0] || {
      total_flashcards: 0,
      ai_generated_percentage: 0,
      cards_due_today: 0,
      average_session_time_ms: 0,
      sessions_this_week: 0
    };
  }

  private async getCollectionStats(userId: string): Promise<CollectionStats> {
    const [collectionsResult, categoriesResult] = await Promise.all([
      this.supabase.from('collections').select('id', { count: 'exact' }).eq('user_id', userId),
      this.supabase.from('categories').select('id', { count: 'exact' }).eq('user_id', userId)
    ]);

    if (collectionsResult.error || categoriesResult.error) {
      throw new DatabaseAggregationError('Failed to fetch collection stats');
    }

    return {
      total_collections: collectionsResult.count || 0,
      total_categories: categoriesResult.count || 0
    };
  }
}
```

### Krok 3: Database Function for Complex Aggregations
```sql
-- Create PostgreSQL function for efficient learning stats calculation
CREATE OR REPLACE FUNCTION get_user_learning_stats(p_user_id UUID)
RETURNS TABLE (
  total_flashcards BIGINT,
  ai_generated_percentage NUMERIC,
  cards_due_today BIGINT,
  average_session_time_ms NUMERIC,
  sessions_this_week BIGINT
) 
LANGUAGE SQL
AS $$
  WITH flashcard_stats AS (
    SELECT 
      COUNT(*) as total_flashcards,
      COUNT(*) FILTER (WHERE created_by = 'ai_generated') as ai_generated_count,
      COUNT(*) FILTER (WHERE next_review_date <= NOW()) as due_count
    FROM flashcards 
    WHERE user_id = p_user_id
  ),
  session_stats AS (
    SELECT 
      AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000) as avg_session_time_ms,
      COUNT(*) FILTER (WHERE started_at >= date_trunc('week', NOW())) as sessions_this_week
    FROM study_sessions 
    WHERE user_id = p_user_id 
      AND status = 'completed'
      AND ended_at IS NOT NULL
  )
  SELECT 
    f.total_flashcards,
    CASE 
      WHEN f.total_flashcards > 0 
      THEN ROUND((f.ai_generated_count::DECIMAL / f.total_flashcards) * 100, 2)
      ELSE 0 
    END as ai_generated_percentage,
    f.due_count as cards_due_today,
    COALESCE(s.avg_session_time_ms, 0) as average_session_time_ms,
    COALESCE(s.sessions_this_week, 0) as sessions_this_week
  FROM flashcard_stats f
  CROSS JOIN session_stats s;
$$;
```

### Krok 4: API Route Implementation
```typescript
// src/pages/api/users/stats.ts
import type { APIRoute } from 'astro';
import { UserStatsService } from '../../../lib/services/UserStatsService';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ 
        error: { 
          code: "UNAUTHORIZED", 
          message: "Authentication required to access user statistics" 
        }
      }), { status: 401 });
    }

    const userStatsService = new UserStatsService(locals.supabase);
    const stats = await userStatsService.getComprehensiveStats(user.id);

    return new Response(JSON.stringify(stats), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('User stats calculation failed:', error);
    
    if (error instanceof StatisticsCalculationError) {
      return new Response(JSON.stringify({
        error: {
          code: "STATISTICS_CALCULATION_ERROR",
          message: "Failed to calculate user statistics. Please try again."
        }
      }), { status: 500 });
    }

    if (error instanceof DatabaseAggregationError) {
      return new Response(JSON.stringify({
        error: {
          code: "DATABASE_AGGREGATION_ERROR",
          message: "Database aggregation failed during statistics calculation"
        }
      }), { status: 500 });
    }

    return new Response(JSON.stringify({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while calculating statistics"
      }
    }), { status: 500 });
  }
};
```

### Krok 5: MVP Metrics Utilities
```typescript
// src/lib/utils/stats-calculations.ts
export class MVPMetricsCalculator {
  static calculateMVPCompliance(stats: UserStatsResponse): MVPComplianceReport {
    const { generation_stats, learning_stats } = stats.data;
    
    return {
      ai_acceptance_rate: {
        value: generation_stats.acceptance_rate,
        target: 75,
        compliant: generation_stats.acceptance_rate >= 75,
        status: generation_stats.acceptance_rate >= 75 ? 'success' : 'warning'
      },
      ai_generated_percentage: {
        value: learning_stats.ai_generated_percentage,
        target: 75,
        compliant: learning_stats.ai_generated_percentage >= 75,
        status: learning_stats.ai_generated_percentage >= 75 ? 'success' : 'warning'
      },
      average_session_time: {
        value: learning_stats.average_session_time_ms / 1000 / 60, // convert to minutes
        target: 2,
        compliant: learning_stats.average_session_time_ms <= 120000, // 2 minutes
        status: learning_stats.average_session_time_ms <= 120000 ? 'success' : 'warning'
      }
    };
  }
}

interface MVPComplianceReport {
  ai_acceptance_rate: MVPMetric;
  ai_generated_percentage: MVPMetric;
  average_session_time: MVPMetric;
}

interface MVPMetric {
  value: number;
  target: number;
  compliant: boolean;
  status: 'success' | 'warning';
}
```

### Krok 6: Error Classes
```typescript
// src/lib/errors/UserStatsErrors.ts
export class StatisticsCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StatisticsCalculationError';
  }
}

export class DatabaseAggregationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseAggregationError';
  }
}

export class InvalidUserError extends Error {
  constructor() {
    super('Invalid user for statistics calculation');
    this.name = 'InvalidUserError';
  }
}
```

### Krok 7: Testing Strategy
- **Unit tests**: UserStatsService, individual aggregation methods
- **Integration tests**: Complete API endpoint testing
- **Performance tests**: Large dataset aggregation performance
- **MVP metrics tests**: Verify calculation accuracy
- **Edge case tests**: New users with no data, division by zero
- **Database function tests**: PostgreSQL function correctness

### Krok 8: Monitoring & Analytics
```typescript
interface UserStatsAnalytics {
  daily_stats_requests: number;
  average_calculation_time_ms: number;
  mvp_compliance_rate: number;
  users_above_ai_threshold: number;
  users_below_session_time_target: number;
}

// Performance monitoring
class StatsPerformanceMonitor {
  static async trackStatsRequest(userId: string, executionTime: number, success: boolean): Promise<void> {
    // Track stats request performance for monitoring
  }
}
```

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ **Comprehensive user statistics** z real-time calculation
- ✅ **MVP metrics integration** (75% acceptance, 75% AI, <2min sessions)
- ✅ **Efficient database aggregations** z parallel queries
- ✅ **Performance optimization** z proper indexing i database functions
- ✅ **Security best practices** z user data isolation
- ✅ **Error handling** dla wszystkich aggregation scenarios
- ✅ **MVP compliance tracking** z detailed metrics
- ✅ **Scalable architecture** z optional caching layer
- ✅ **Production-ready functionality** dla dashboard statistics
- ✅ **GDPR compliance** z user-specific data only

Plan jest gotowy do implementacji z efficient database queries i comprehensive MVP metrics tracking dla business intelligence dashboard aplikacji 10xDevFiszki. 
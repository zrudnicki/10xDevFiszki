/**
 * Rate limiting service to prevent abuse of AI-based endpoints
 * Uses in-memory storage with periodic cleanup
 */

import type { SupabaseClient } from '@supabase/supabase-js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  isLimited: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

// Configure rate limits
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_REQUESTS_PER_WINDOW = 50; // Maximum requests per 24 hours
const CLEANUP_INTERVAL = 3600000; // Clean old entries every hour

// Storage for rate limiting
const userRateLimits = new Map<string, RateLimitEntry>();

// Set up automatic cleanup
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize the rate limiting service with periodic cleanup
 */
export function initRateLimitService(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
  }

  cleanupIntervalId = setInterval(() => {
    cleanupRateLimits();
  }, CLEANUP_INTERVAL);

  console.log("Rate limiting service initialized");
}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimits(): void {
  const now = Date.now();
  let entriesDeleted = 0;

  for (const [userId, entry] of userRateLimits.entries()) {
    if (now >= entry.resetAt) {
      userRateLimits.delete(userId);
      entriesDeleted++;
    }
  }

  if (entriesDeleted > 0) {
    console.log(`Rate limit cleanup: ${entriesDeleted} entries removed. Current size: ${userRateLimits.size}`);
  }
}

/**
 * Check if a user has exceeded their rate limit
 *
 * @param supabase - Supabase client
 * @param userId - The ID of the user to check
 * @returns Object with isLimited flag and information about the limit
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

  try {
    // Get request count for the current window
    const { data: requests, error } = await supabase
      .from("flashcard_generation_requests")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", windowStart.toISOString());

    if (error) {
      // If table doesn't exist or other database error, allow the request
      // This prevents blocking users when the database is not fully set up
      console.warn("Rate limit check failed, allowing request:", error);
      return {
        isLimited: false,
        limit: MAX_REQUESTS_PER_WINDOW,
        remaining: MAX_REQUESTS_PER_WINDOW,
        resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW),
      };
    }

    const requestCount = requests?.length || 0;
    const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - requestCount);
    const isLimited = requestCount >= MAX_REQUESTS_PER_WINDOW;

    // Only try to record the request if we're not limited
    if (!isLimited) {
      try {
        await supabase.from("flashcard_generation_requests").insert({
          user_id: userId,
          created_at: now.toISOString(),
        });
      } catch (insertError) {
        // If insert fails, log but don't block the request
        console.warn("Failed to record rate limit request:", insertError);
      }
    }

    return {
      isLimited,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining,
      resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW),
    };
  } catch (error) {
    // If anything fails, allow the request
    console.warn("Rate limit check failed, allowing request:", error);
    return {
      isLimited: false,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: MAX_REQUESTS_PER_WINDOW,
      resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW),
    };
  }
}

/**
 * Reset rate limit for a user (for testing purposes)
 *
 * @param userId - The ID of the user to reset
 */
export function resetRateLimit(userId: string): void {
  userRateLimits.delete(userId);
}

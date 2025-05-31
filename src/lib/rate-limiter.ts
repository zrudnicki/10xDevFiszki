/**
 * Rate Limiter for AI Generation API
 * Enforces 10 requests per minute per user with sliding window
 */
export class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly limit: number = 10;
  private readonly windowMs: number = 60000; // 1 minute in milliseconds

  /**
   * Check if user is allowed to make a request
   * @param userId - User ID to check rate limit for
   * @returns true if request is allowed, false if rate limited
   */
  isAllowed(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Remove requests older than 1 minute (sliding window)
    const recentRequests = userRequests.filter((time) => now - time < this.windowMs);

    if (recentRequests.length >= this.limit) {
      return false;
    }

    // Add current request timestamp
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }

  /**
   * Get number of seconds until user can make next request
   * @param userId - User ID to check
   * @returns seconds to wait, 0 if no waiting required
   */
  getRetryAfter(userId: string): number {
    const userRequests = this.requests.get(userId) || [];
    if (userRequests.length === 0) return 0;

    const oldestRequest = Math.min(...userRequests);
    const waitTime = Math.max(0, this.windowMs - (Date.now() - oldestRequest));
    return Math.ceil(waitTime / 1000); // Convert to seconds
  }

  /**
   * Get current request count for user in current window
   * @param userId - User ID to check
   * @returns number of requests in current window
   */
  getCurrentCount(userId: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    return userRequests.filter((time) => now - time < this.windowMs).length;
  }

  /**
   * Clear old requests to prevent memory leaks
   * Should be called periodically in production
   */
  cleanup(): void {
    const now = Date.now();

    for (const [userId, requests] of this.requests.entries()) {
      const recentRequests = requests.filter((time) => now - time < this.windowMs);

      if (recentRequests.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, recentRequests);
      }
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

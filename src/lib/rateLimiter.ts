// Rate limiter for prevent Dos attacks 
export class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private windowMs: number;
    private maxRequests: number;

    constructor(windowMs: number = 30000, maxRequests: number = 10) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    };

    // ==== Methods ===========
    // Check if user exceeded rate limit.
    // True if request is allowed, false if thriggered rate limided.
  isAllowed(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add new request
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);

    return true;
  }

  /**
   * Get remaining requests for user in current window
   */
  getRemaining(userId: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  /**
   * Get time until rate limit resets (in seconds)
   */
  getResetTime(userId: string): number {
    const userRequests = this.requests.get(userId) || [];
    if (userRequests.length === 0) return 0;

    const oldestRequest = Math.min(...userRequests);
    const resetTime = oldestRequest + this.windowMs;
    const now = Date.now();

    return Math.max(0, Math.ceil((resetTime - now) / 1000));
  }


  // Clear all rate limit data (useful for testing)

  clear(): void {
    this.requests.clear();
  }
}

// Global rate limiters for different command types
export const commandLimiter = new RateLimiter(60000, 30); // 30 requests per minute

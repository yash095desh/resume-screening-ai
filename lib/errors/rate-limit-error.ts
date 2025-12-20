/**
 * Custom error for rate limiting scenarios
 * Allows pipeline to gracefully handle rate limits and schedule retries
 */
export class RateLimitError extends Error {
  public readonly type: 'apify_search' | 'apify_scrape' | 'openrouter';
  public readonly resetAt: Date;
  public readonly retryAfter: number; // seconds

  constructor(
    message: string,
    options: {
      type: 'apify_search' | 'apify_scrape' | 'openrouter';
      resetAt: Date;
    }
  ) {
    super(message);
    this.name = 'RateLimitError';
    this.type = options.type;
    this.resetAt = options.resetAt;
    this.retryAfter = Math.ceil((options.resetAt.getTime() - Date.now()) / 1000);

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RateLimitError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      resetAt: this.resetAt.toISOString(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Check if an error is a RateLimitError
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}
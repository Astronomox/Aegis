/**
 * Simple in-memory rate limiter for API routes
 * In production, use Redis or a dedicated rate-limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export function rateLimit(identifier: string, options: RateLimitOptions): {
  success: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitMap.delete(identifier);
  }

  const currentEntry = rateLimitMap.get(identifier) || {
    count: 0,
    resetTime: now + options.windowMs,
  };

  if (currentEntry.count >= options.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: currentEntry.resetTime,
    };
  }

  currentEntry.count++;
  rateLimitMap.set(identifier, currentEntry);

  return {
    success: true,
    remaining: options.maxRequests - currentEntry.count,
    resetTime: currentEntry.resetTime,
  };
}

// Get identifier from request (IP address or user ID)
export function getIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return ip;
}

// Clean up old entries periodically (call this in a cron job or interval)
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

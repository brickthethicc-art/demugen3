import type { FastifyRequest, FastifyReply } from 'fastify';

// Simple in-memory rate limiter
// For production, consider using Redis-backed rate limiting

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60000; // 1 minute window
const MAX_REQUESTS = 100; // Max requests per window per IP

export function rateLimit(options: {
  windowMs?: number;
  maxRequests?: number;
} = {}) {
  const windowMs = options.windowMs || WINDOW_MS;
  const maxRequests = options.maxRequests || MAX_REQUESTS;

  return async function (request: FastifyRequest, reply: FastifyReply) {
    const ip = request.ip || request.headers['x-forwarded-for'] as string || 'unknown';
    const now = Date.now();

    // Clean up expired entries
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key);
      }
    }

    // Get or create entry
    let entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      rateLimitMap.set(ip, entry);
    }

    // Increment count
    entry.count++;

    // Check if over limit
    if (entry.count > maxRequests) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      reply.code(429);
      return {
        error: 'Too many requests',
        retryAfter: resetIn,
      };
    }

    // Add rate limit headers
    reply.header('X-RateLimit-Limit', maxRequests);
    reply.header('X-RateLimit-Remaining', maxRequests - entry.count);
    reply.header('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
  };
}

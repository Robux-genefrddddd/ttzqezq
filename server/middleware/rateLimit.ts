/**
 * Rate limiting middleware using in-memory store
 * For production, consider using Redis
 *
 * Limits:
 * - Login: 5 attempts per 15 minutes per IP
 * - Signup: 10 accounts per hour per IP
 * - General API: 100 requests per minute per IP
 * - Uploads: 20 uploads per hour per user
 */

import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limits
// For production, use Redis instead
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Generic rate limiter factory
 */
function createLimiter(
  windowMs: number, // Time window in milliseconds
  maxRequests: number, // Max requests per window
  keyGenerator: (req: Request) => string = (req) =>
    req.ip || req.socket.remoteAddress || "unknown",
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // Create or reset entry if expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetDate = new Date(entry.resetTime);

    res.set("X-RateLimit-Limit", maxRequests.toString());
    res.set("X-RateLimit-Remaining", remaining.toString());
    res.set("X-RateLimit-Reset", resetDate.toISOString());

    if (entry.count > maxRequests) {
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        message: `Rate limit exceeded. Please try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`,
      });
    }

    next();
  };
}

/**
 * Login rate limiter
 * 5 attempts per 15 minutes per IP
 */
export const loginLimiter = createLimiter(15 * 60 * 1000, 5);

/**
 * Signup rate limiter
 * 10 registrations per hour per IP
 */
export const signupLimiter = createLimiter(60 * 60 * 1000, 10);

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
export const apiLimiter = createLimiter(60 * 1000, 100);

/**
 * Password reset rate limiter
 * 3 attempts per hour per IP
 */
export const passwordResetLimiter = createLimiter(60 * 60 * 1000, 3);

/**
 * Email verification rate limiter
 * 5 resend attempts per hour per IP
 */
export const emailVerificationLimiter = createLimiter(60 * 60 * 1000, 5);

/**
 * Upload rate limiter (per user)
 * 20 uploads per hour per user
 */
export function uploadLimiter(req: Request, res: Response, next: NextFunction) {
  // Requires authenticated user
  if (!req.user && !req.headers.authorization) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = (req as any).user?.uid || "anonymous";
  const key = `upload:${userId}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxUploads = 20;

  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  const remaining = Math.max(0, maxUploads - entry.count);
  const resetDate = new Date(entry.resetTime);

  res.set("X-Upload-Limit", maxUploads.toString());
  res.set("X-Upload-Remaining", remaining.toString());
  res.set("X-Upload-Reset", resetDate.toISOString());

  if (entry.count > maxUploads) {
    return res.status(429).json({
      error: "Upload limit exceeded",
      message: `You can only upload ${maxUploads} assets per hour. Please try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    });
  }

  next();
}

/**
 * Message rate limiter (per user, per group)
 * 10 messages per minute per user per group
 */
export function messageLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = (req as any).user?.uid || "anonymous";
  const groupId = req.params.groupId || "unknown";
  const key = `msg:${userId}:${groupId}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxMessages = 10;

  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  if (entry.count > maxMessages) {
    return res.status(429).json({
      error: "Message rate limit exceeded",
      message: `You can send at most ${maxMessages} messages per minute. Please slow down.`,
    });
  }

  next();
}

/**
 * Cleanup old entries (run periodically to prevent memory leak)
 * Should be called every 5 minutes
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  let removed = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime + 60000) {
      // Remove entries 1 minute after expiry
      rateLimitStore.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`Rate limit cleanup: removed ${removed} expired entries`);
  }
}

// Start cleanup interval
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

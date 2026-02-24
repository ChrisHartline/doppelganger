import { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const store of stores.values()) {
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key)
      }
    }
  }
}, 5 * 60 * 1000).unref()

function getClientIp(req: Request): string {
  // Vercel / reverse proxy
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  if (Array.isArray(forwarded)) return forwarded[0]
  return req.ip || req.socket.remoteAddress || 'unknown'
}

/**
 * Creates a rate-limiting middleware.
 * @param maxRequests  Max requests in the window
 * @param windowMs    Window size in milliseconds
 * @param name        Identifier for this limiter's store
 */
export function rateLimit(maxRequests: number, windowMs: number, name = 'global') {
  if (!stores.has(name)) {
    stores.set(name, new Map())
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const store = stores.get(name)!
    const ip = getClientIp(req)
    const now = Date.now()

    let entry = store.get(ip)
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
      store.set(ip, entry)
    }

    entry.count++

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count)
    res.setHeader('X-RateLimit-Limit', maxRequests)
    res.setHeader('X-RateLimit-Remaining', remaining)
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000))

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      res.setHeader('Retry-After', retryAfter)
      res.status(429).json({ error: 'Too many requests. Please try again later.' })
      return
    }

    next()
  }
}

// Pre-configured limiters
export const chatLimiter = rateLimit(10, 60 * 1000, 'chat')                // 10/min
export const emailLimiter = rateLimit(3, 60 * 60 * 1000, 'email')          // 3/hour
export const contactLimiter = rateLimit(5, 60 * 1000, 'contact')           // 5/min
export const globalLimiter = rateLimit(60, 60 * 1000, 'global')            // 60/min

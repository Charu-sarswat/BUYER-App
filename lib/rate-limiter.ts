// In-memory rate limiter
interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return true
    }

    if (entry.count >= this.maxRequests) {
      return false
    }

    entry.count++
    return true
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.requests.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - entry.count)
  }

  getResetTime(identifier: string): number {
    const entry = this.requests.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.windowMs
    }
    return entry.resetTime
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.requests.forEach((entry, key) => {
      if (now > entry.resetTime) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => {
      this.requests.delete(key)
    })
  }
}

// Create rate limiter instances for different endpoints
export const createRateLimiter = new RateLimiter(15 * 60 * 1000, 20) // 20 requests per 15 minutes
export const updateRateLimiter = new RateLimiter(15 * 60 * 1000, 30) // 30 requests per 15 minutes
export const importRateLimiter = new RateLimiter(60 * 60 * 1000, 5) // 5 requests per hour

// Helper function to get client identifier
export function getClientIdentifier(request: Request): string {
  // In production, you might want to use a more sophisticated method
  // For now, we'll use a combination of IP and user agent
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `${ip}-${userAgent.slice(0, 50)}`
}

// Rate limiting middleware
export function withRateLimit(
  rateLimiter: RateLimiter,
  identifier: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const allowed = rateLimiter.isAllowed(identifier)
  const remaining = rateLimiter.getRemainingRequests(identifier)
  const resetTime = rateLimiter.getResetTime(identifier)

  return { allowed, remaining, resetTime }
}

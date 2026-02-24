import { Request, Response, NextFunction } from 'express'

/**
 * Bearer token auth middleware.
 * Checks Authorization header against ADMIN_API_KEY env var.
 * Apply to admin-only routes (logs, profile POST, email, avatar upload).
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_API_KEY

  if (!adminKey) {
    console.error('ADMIN_API_KEY is not set — blocking admin request')
    res.status(500).json({ error: 'Server misconfigured' })
    return
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization required' })
    return
  }

  const token = authHeader.slice(7)
  if (token !== adminKey) {
    res.status(403).json({ error: 'Invalid credentials' })
    return
  }

  next()
}

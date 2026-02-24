import { Request, Response, NextFunction } from 'express'

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')

  // Disable legacy XSS filter (rely on CSP instead)
  res.setHeader('X-XSS-Protection', '0')

  // HSTS — force HTTPS for 1 year, include subdomains
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
  )

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy — disable sensitive features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  next()
}

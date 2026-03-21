/**
 * Simple in-memory rate limiter by IP (and optional path key).
 * For production behind multiple instances, use Redis instead.
 */
export function createIpRateLimiter(options: { windowMs: number; max: number; keyPrefix?: string }) {
  const { windowMs, max, keyPrefix = "" } = options;
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return function rateLimitMiddleware(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction): void {
    const ip =
      ((req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        "unknown") + keyPrefix;
    const now = Date.now();
    let b = buckets.get(ip);
    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(ip, b);
    }
    b.count += 1;
    if (b.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((b.resetAt - now) / 1000)));
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }
    next();
  };
}

/**
 * Rate limit by logged-in user id when present, else by IP.
 * Use after auth middleware so `req.userId` is set.
 */
export function createUserOrIpRateLimiter(options: { windowMs: number; max: number; keyPrefix?: string }) {
  const { windowMs, max, keyPrefix = "" } = options;
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return function userOrIpRateLimitMiddleware(
    req: import("express").Request,
    res: import("express").Response,
    next: import("express").NextFunction
  ): void {
    const uid = (req as { userId?: number }).userId;
    const ipRaw =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
    const base = typeof uid === "number" && uid > 0 ? `u:${uid}` : `ip:${ipRaw}`;
    const key = base + keyPrefix;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((b.resetAt - now) / 1000)));
      res.status(429).json({ error: "Too many requests. Please try again later.", code: "RATE_LIMIT" });
      return;
    }
    next();
  };
}

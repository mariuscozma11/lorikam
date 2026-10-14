import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

// POST /store/contact hands straight off to a workflow that sends a real email
// through Resend, so unthrottled it is an open relay against our sending quota.
// There is no captcha in front of it, hence this.
//
// The backend runs a single replica, so an in-process Map is enough. With more
// than one replica each would keep its own counter and the real limit would
// become MAX_REQUESTS * replicas — at that point this has to move to Redis.
const WINDOW_MS = 10 * 60 * 1000
const MAX_REQUESTS = 3

// Hard cap so a flood of spoofed source addresses can't turn the throttle
// itself into the memory leak. Expired entries are pruned on every request, so
// the cap only ever bites during an actual flood, and then we evict the oldest.
const MAX_TRACKED_IPS = 5000

type Entry = { count: number; expires_at: number }

const windows = new Map<string, Entry>()

// Railway terminates TLS in front of the app, so req.ip is the proxy; the real
// client address only survives in x-forwarded-for.
//
// Caveat: the storefront submits the form through a Next.js server action
// (lib/data/contact.ts), so today every visitor arrives under the storefront
// server's address and the limit behaves as a site-wide one. That still caps
// the Resend exposure; to make it truly per-visitor the server action has to
// forward the caller's x-forwarded-for.
function clientIp(req: MedusaRequest): string {
  const forwarded = req.headers["x-forwarded-for"]
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return raw?.split(",")[0]?.trim() || req.ip || "unknown"
}

export const rateLimitContact = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const now = Date.now()

  for (const [ip, entry] of windows) {
    if (entry.expires_at <= now) {
      windows.delete(ip)
    }
  }

  const ip = clientIp(req)
  const current = windows.get(ip)

  if (current) {
    if (current.count >= MAX_REQUESTS) {
      res.status(429).json({
        message:
          "Ai trimis prea multe mesaje. Te rugăm să încerci din nou în câteva minute.",
      })
      return
    }

    current.count += 1
    return next()
  }

  // Map is still full after pruning: drop the oldest window rather than grow.
  // Map iterates in insertion order, so the first key is the stalest one.
  if (windows.size >= MAX_TRACKED_IPS) {
    const oldest = windows.keys().next().value
    if (oldest !== undefined) {
      windows.delete(oldest)
    }
  }

  windows.set(ip, { count: 1, expires_at: now + WINDOW_MS })
  next()
}

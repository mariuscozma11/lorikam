// Tells apart a send that might work on a second attempt from one that never
// will.
//
// Every subscriber used to wrap its body in a try/catch that only logged, so a
// failed send still returned successfully, the event-bus job was marked done,
// and the email was lost with nothing but a log line to show for it. Now that
// the Redis event bus is in place the job can be retried instead — but only
// when retrying can actually help. A rejected sender domain or a malformed
// recipient fails identically every time, so re-running that job only burns
// attempts and fills the log.
//
// Resend's error `name` is the one machine-readable signal we get about which
// kind we are looking at, so the provider tags the error it throws (see
// `service.ts`) and subscribers ask here.

export const RETRYABLE_SEND_ERROR = "resend_send_retryable"
export const PERMANENT_SEND_ERROR = "resend_send_permanent"

// Resend error names that mean "this message is wrong", not "we are busy".
// Nothing about the next attempt would differ: the key, the sender domain, the
// recipient or the payload has to change first, and that is a human's job.
const PERMANENT_RESEND_ERROR_NAMES = new Set([
  "validation_error",
  "missing_required_field",
  "invalid_parameter",
  "invalid_attachment",
  "invalid_from_address",
  "invalid_to_address",
  "invalid_access",
  "missing_api_key",
  "restricted_api_key",
  "security_error",
  "not_found",
  "method_not_allowed",
  "invalid_region",
  // Not transient on any useful timescale: the quota resets at midnight UTC,
  // far beyond any backoff the queue would wait, so retrying inside the next
  // few minutes is guaranteed to fail again.
  "daily_quota_exceeded",
])

// The notification module re-wraps the provider's error on its way up, which
// can strip the `code` we set, so the message text is the fallback signal.
// These are the phrasings Resend uses for the failures that look transient
// (an HTTP error) but are really configuration: the classic one here is a 403
// for a sender on a domain that is not verified — exactly the failure mode
// `validateSettings()` in the admin email settings tries to prevent.
const PERMANENT_MESSAGE_PATTERNS = [
  /not verified/i,
  /verify a domain/i,
  /invalid.{0,20}api key/i,
  /api key is invalid/i,
  /\b(400|401|403|404|422)\b/,
]

/**
 * `true` when the caller should let the error escape so the event bus retries.
 *
 * Unknown failures default to retryable on purpose: a dropped TCP connection
 * or a timeout arrives with no name and no status at all, and those are the
 * most common reason a send is worth repeating. That default is only safe
 * because the queue bounds the attempts — see `jobOptions.attempts` on the
 * event-bus module.
 */
export function isRetryableSendError(error: any): boolean {
  // Medusa wraps provider failures, so both the code and the useful message
  // can end up one level down — the same nesting the admin's send-test route
  // already digs through.
  const candidates = [error, error?.cause, error?.errors?.[0]].filter(Boolean)

  for (const candidate of candidates) {
    if (candidate.code === PERMANENT_SEND_ERROR) {
      return false
    }
    if (candidate.code === RETRYABLE_SEND_ERROR) {
      return true
    }
  }

  const message = candidates
    .map((candidate) => String(candidate.message ?? ""))
    .join(" ")

  return !PERMANENT_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))
}

/**
 * Classifies a raw Resend error payload. Called by the provider, where the
 * original `name` is still intact.
 */
export function sendErrorCode(resendErrorName: string | undefined | null) {
  return resendErrorName && PERMANENT_RESEND_ERROR_NAMES.has(resendErrorName)
    ? PERMANENT_SEND_ERROR
    : RETRYABLE_SEND_ERROR
}

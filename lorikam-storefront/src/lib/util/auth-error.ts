// The password-reset screens talk to Medusa's /auth routes, which answer in
// English and usually with nothing more than a status: a reset token that is
// malformed, already used or past its expiry all come back as a bare 401
// "Unauthorized". So the status matters more than the text here.
//
// translateCheckoutError cannot be reused for this flow even though the intent
// is the same: its `/expired/i` rule maps to "Cardul folosit a expirat", which
// is exactly the wrong sentence to show someone whose reset link expired. Same
// idea, different vocabulary — this module follows its style instead.

/** Minimum length we accept for a new password, in the form and on the server. */
export const MIN_PASSWORD_LENGTH = 8

/**
 * The two Server Action results of the password-reset flow. They live here
 * rather than next to the actions because `src/lib/data/customer.ts` is a
 * `"use server"` module, and the client components need the shapes without
 * importing anything from it but the actions themselves.
 */
export type PasswordResetRequestState = {
  success: boolean
  error: string | null
}

export type PasswordResetState = {
  success: boolean
  error: string | null
  /** True when the failure was the token itself, so the UI can offer a new link. */
  invalidToken: boolean
}

const GENERIC_ERROR =
  "Ceva nu a funcționat. Te rugăm să încerci din nou în câteva momente sau să ne contactezi."

/**
 * Shown whenever the backend refuses the reset token. We deliberately do not
 * try to tell "invalid" apart from "expired": Medusa does not say which, and
 * the customer's next step is the same either way.
 */
export const RESET_LINK_INVALID =
  "Linkul de resetare nu mai este valid — probabil a expirat sau a fost deja folosit. Cere un link nou mai jos."

const TOO_MANY_REQUESTS =
  "Prea multe încercări. Te rugăm să aștepți câteva minute și să încerci din nou."

// Matched in order, so the more specific patterns come first.
const TRANSLATIONS: [RegExp, string][] = [
  [
    /unauthorized|invalid token|jwt|token (is )?(invalid|expired)|expired/i,
    RESET_LINK_INVALID,
  ],
  [
    /password/i,
    "Parola nu a putut fi salvată. Alege o altă parolă și încearcă din nou.",
  ],
  [
    /no response received|fetch failed|network|timeout|ETIMEDOUT|ECONNREFUSED/i,
    "Nu am putut comunica cu serverul. Verifică conexiunea la internet și încearcă din nou.",
  ],
  [/rate limit|too many requests/i, TOO_MANY_REQUESTS],
]

/**
 * Which of the two steps the error came from. It changes what a 4xx means: on
 * the update route it is a rejected token, on the request route there is no
 * token yet, so the same status is about the address that was typed. Without
 * the distinction the request form would tell people their link had expired.
 */
export type AuthErrorContext = "reset-request" | "reset-update"

/**
 * Turns an SDK error from an /auth route into Romanian copy that is safe to put
 * in front of a customer. Takes the error object rather than its message,
 * because FetchError carries the HTTP `status` and that is the only reliable
 * signal for a rejected token.
 */
export default function translateAuthError(
  error: any,
  context: AuthErrorContext = "reset-update"
): string {
  const status: unknown = error?.status

  if (status === 429) {
    return TOO_MANY_REQUESTS
  }

  if (status === 401 || status === 403 || status === 400) {
    return context === "reset-update"
      ? RESET_LINK_INVALID
      : "Nu am putut trimite emailul de resetare. Verifică adresa de email și încearcă din nou."
  }

  const message = typeof error?.message === "string" ? error.message : ""

  if (!message) {
    return GENERIC_ERROR
  }

  for (const [pattern, translation] of TRANSLATIONS) {
    // The token patterns only make sense for the update step.
    if (translation === RESET_LINK_INVALID && context !== "reset-update") {
      continue
    }

    if (pattern.test(message)) {
      return translation
    }
  }

  // Ours already carry diacritics; anything still in English is not fit to show.
  return /[ăâîșț]/i.test(message) ? message : GENERIC_ERROR
}

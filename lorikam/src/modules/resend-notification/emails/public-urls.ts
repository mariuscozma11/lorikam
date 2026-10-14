// Public base URLs that go *into* emails.
//
// An email is the one place a link cannot be relative, and a wrong base URL is
// invisible until a customer clicks it. Both values are therefore read from
// configuration rather than hardcoded, with a localhost default so `yarn dev`
// produces something clickable.

type MinimalLogger = { warn: (message: string) => void }

// The storefront's dev port (see the storefront's package.json).
const DEV_STOREFRONT_URL = "http://localhost:8000"
// Matches the fallback medusa-config.ts uses for the file provider.
const DEV_BACKEND_URL = "http://localhost:9000"

function join(base: string, path: string) {
  const root = base.replace(/\/+$/, "")
  return path ? `${root}/${path.replace(/^\/+/, "")}` : root
}

/**
 * Absolute URL on the customer-facing storefront.
 *
 * `BACKEND_PUBLIC_URL` is deliberately not used here — that is this API
 * (api.lorikam.com), and sending a customer there gives them a JSON 404.
 * `STOREFRONT_URL` is a separate variable and must be set in Railway; unset in
 * production it is shouted about rather than guessed, because a reset link
 * pointing at localhost is unrecoverable for the person who received it.
 */
export function storefrontUrl(path = "", logger?: MinimalLogger) {
  const configured = process.env.STOREFRONT_URL?.trim()

  if (!configured && process.env.NODE_ENV === "production") {
    logger?.warn(
      "STOREFRONT_URL is not set — email links will point at localhost. " +
        "Set it on the backend service in Railway (e.g. https://lorikam.com)."
    )
  }

  return join(configured || DEV_STOREFRONT_URL, path)
}

/**
 * Absolute URL inside the Medusa admin dashboard, which is served by this
 * backend under /app.
 */
export function adminUrl(path = "") {
  const base = process.env.BACKEND_PUBLIC_URL?.trim() || DEV_BACKEND_URL
  return join(join(base, "app"), path)
}

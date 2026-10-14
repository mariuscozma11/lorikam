"use client"

import { Button } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Without this boundary a render error anywhere in the checkout bubbles up to
// the global one and takes the whole checkout chrome with it, right while the
// customer is trying to pay. Keep them inside the checkout, in Romanian, with a
// retry and a way back to the cart — the cart itself is never lost.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col gap-4 items-center justify-center text-center px-6 py-24">
      <h1 className="text-2xl-semi text-ui-fg-base">Ceva nu a funcționat</h1>
      <p className="text-small-regular text-ui-fg-subtle max-w-md">
        Nu am putut afișa pasul de finalizare a comenzii. Coșul tău este
        salvat, așa că poți încerca din nou fără să pierzi nimic.
      </p>
      <div className="flex flex-col small:flex-row gap-3 items-center">
        <Button variant="secondary" onClick={() => reset()}>
          Încearcă din nou
        </Button>
        <LocalizedClientLink
          href="/cart"
          className="text-small-regular text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
        >
          Înapoi la coș
        </LocalizedClientLink>
      </div>
      {/* The digest is the only handle we have for matching a user report to a
          server log line, so surface it instead of the raw error. */}
      {error.digest && (
        <p className="text-xsmall-regular text-ui-fg-muted">
          Cod eroare: {error.digest}
        </p>
      )}
    </div>
  )
}

"use client"

import { Button } from "@medusajs/ui"
import "styles/globals.css"

// global-error replaces the root layout when a render fails above it, so it has
// to ship its own <html>/<body> and can't rely on anything the layout provides.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ro" data-mode="light">
      <body>
        <div className="flex flex-col gap-4 items-center justify-center text-center px-6 min-h-screen">
          <h1 className="text-2xl-semi text-ui-fg-base">
            Ceva nu a funcționat
          </h1>
          <p className="text-small-regular text-ui-fg-subtle max-w-md">
            A apărut o eroare neașteptată. Încearcă din nou în câteva momente.
          </p>
          <Button variant="secondary" onClick={() => reset()}>
            Încearcă din nou
          </Button>
          {/* The digest is the only handle we have for matching a user report
              to a server log line, so surface it instead of the raw error. */}
          {error.digest && (
            <p className="text-xsmall-regular text-ui-fg-muted">
              Cod eroare: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}

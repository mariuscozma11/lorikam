"use client"

import { Button } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Catches throws from anything inside the (main) group — most of them backend
// calls — so a failing request shows Romanian copy and a retry instead of
// Next's raw English 500 page. Nav and footer from the layout stay in place.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col gap-4 items-center justify-center text-center px-6 min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Ceva nu a funcționat</h1>
      <p className="text-small-regular text-ui-fg-subtle max-w-md">
        Nu am putut încărca această pagină. Încearcă din nou în câteva momente.
      </p>
      <div className="flex flex-col small:flex-row gap-3 items-center">
        <Button variant="secondary" onClick={() => reset()}>
          Încearcă din nou
        </Button>
        <LocalizedClientLink
          href="/"
          className="text-small-regular text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
        >
          Mergi la pagina principală
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

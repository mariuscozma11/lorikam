"use client"

import { useEffect, useState } from "react"
import { Button } from "@medusajs/ui"

const STORAGE_KEY = "lorikam_cookie_consent"

type Props = {
  text: string
  policyHref: string
}

export default function CookieConsentClient({ text, policyHref }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      // localStorage unavailable — don't block the page
    }
  }, [])

  const decide = (choice: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, choice)
    } catch {
      // ignore
    }
    // Let analytics react immediately to the new consent state.
    try {
      window.dispatchEvent(new Event("lorikam-consent"))
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 small:p-6">
      <div className="content-container">
        <div className="mx-auto max-w-3xl rounded-xl border border-ui-border-base bg-ui-bg-base shadow-elevation-flyout p-4 small:p-5 flex flex-col small:flex-row small:items-center gap-4">
          <p className="txt-small text-ui-fg-subtle flex-1">
            {text}{" "}
            <a
              href={policyHref}
              className="underline hover:text-ui-fg-base"
            >
              Politica de cookie-uri
            </a>
            .
          </p>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="secondary"
              size="small"
              onClick={() => decide("rejected")}
            >
              Refuz
            </Button>
            <Button size="small" onClick={() => decide("accepted")}>
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

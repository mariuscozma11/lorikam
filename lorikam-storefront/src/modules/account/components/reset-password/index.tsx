"use client"

import { resetPassword } from "@lib/data/customer"
import {
  MIN_PASSWORD_LENGTH,
  type PasswordResetState,
} from "@lib/util/auth-error"
import ForgotPassword from "@modules/account/components/forgot-password"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState, useState } from "react"

type Props = {
  /**
   * The one-time token from the email link. It is never printed into the page:
   * it goes straight into a hidden field and from there to the Server Action.
   */
  token: string
  /** Only passed when the `email` query parameter actually looks like an address. */
  email?: string
}

const ResetPasswordForm = ({ token, email }: Props) => {
  const [state, formAction] = useActionState<
    PasswordResetState | null,
    FormData
  >(resetPassword, null)
  const [clientError, setClientError] = useState<string | null>(null)

  // Wraps the Server Action so the two cheap checks happen before a round trip.
  // The action repeats both — this is for feedback, not for safety.
  const handleAction = (formData: FormData) => {
    const password = (formData.get("password") as string) ?? ""
    const confirmPassword = (formData.get("confirm_password") as string) ?? ""

    if (password.length < MIN_PASSWORD_LENGTH) {
      setClientError(
        `Parola trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere.`
      )
      return
    }

    if (password !== confirmPassword) {
      setClientError("Cele două parole nu coincid.")
      return
    }

    setClientError(null)
    formAction(formData)
  }

  if (state?.success) {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center"
        data-testid="reset-password-success"
      >
        <h1 className="text-large-semi uppercase mb-6">Parolă schimbată</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          Ți-am actualizat parola. Te poți conecta acum cu noua parolă.
        </p>
        <LocalizedClientLink
          href="/account"
          className="underline text-base-regular text-ui-fg-base"
          data-testid="go-to-login-link"
        >
          Mergi la autentificare
        </LocalizedClientLink>
      </div>
    )
  }

  // The link is spent or past its expiry, so the password form is a dead end.
  // Offer the only useful next step instead: ask for a fresh link.
  if (state?.invalidToken) {
    return (
      <div className="max-w-sm w-full flex flex-col items-center">
        <h1 className="text-large-semi uppercase mb-6">Link expirat</h1>
        <p
          className="text-center text-base-regular text-rose-500 mb-8"
          data-testid="reset-password-invalid-token"
        >
          {state.error}
        </p>
        <ForgotPassword />
      </div>
    )
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="reset-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Setează o parolă nouă</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-2">
        {email
          ? `Alege o parolă nouă pentru contul ${email}.`
          : "Alege o parolă nouă pentru contul tău."}
      </p>
      <p className="text-center text-small-regular text-ui-fg-subtle mb-8">
        Parola trebuie să aibă cel puțin {MIN_PASSWORD_LENGTH} caractere.
      </p>
      <form className="w-full" action={handleAction}>
        {/* Kept in a hidden field so the token is never rendered as visible
            text, and the page sets a no-referrer policy so the query string
            cannot travel outwards either. */}
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Parolă nouă"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            data-testid="new-password-input"
          />
          <Input
            label="Confirmă parola"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            data-testid="confirm-password-input"
          />
        </div>
        <ErrorMessage
          error={clientError ?? state?.error}
          data-testid="reset-password-error-message"
        />
        <SubmitButton
          data-testid="reset-password-button"
          className="w-full mt-6"
        >
          Salvează parola
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        <LocalizedClientLink href="/account" className="underline">
          Înapoi la autentificare
        </LocalizedClientLink>
      </span>
    </div>
  )
}

export default ResetPasswordForm

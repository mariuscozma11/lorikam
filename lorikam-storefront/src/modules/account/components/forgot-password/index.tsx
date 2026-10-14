"use client"

import { requestPasswordReset } from "@lib/data/customer"
import type { PasswordResetRequestState } from "@lib/util/auth-error"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

type Props = {
  /**
   * Passed when this form is one of the views of the login page, so it can
   * hand control back. Left out when it is rendered on its own — on the
   * reset-password page, where the only way back is a real link.
   */
  setCurrentView?: (view: LOGIN_VIEW) => void
}

const ForgotPassword = ({ setCurrentView }: Props) => {
  const [state, formAction] = useActionState<
    PasswordResetRequestState | null,
    FormData
  >(requestPasswordReset, null)

  // Deliberately the same message for a known and an unknown address: saying
  // "nu există niciun cont" would turn this form into a way of checking which
  // of our customers' email addresses are registered.
  if (state?.success) {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center"
        data-testid="forgot-password-sent"
      >
        <h1 className="text-large-semi uppercase mb-6">Verifică-ți emailul</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-4">
          Dacă există un cont cu această adresă, ți-am trimis un link de
          resetare.
        </p>
        <p className="text-center text-small-regular text-ui-fg-subtle mb-8">
          Linkul poate fi folosit o singură dată și expiră după un timp scurt.
          Dacă nu îl găsești, verifică și folderul de spam.
        </p>
        {setCurrentView ? (
          <button
            onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
            className="underline text-small-regular text-ui-fg-base"
            data-testid="back-to-sign-in-button"
          >
            Înapoi la autentificare
          </button>
        ) : (
          <LocalizedClientLink
            href="/account"
            className="underline text-small-regular text-ui-fg-base"
          >
            Înapoi la autentificare
          </LocalizedClientLink>
        )}
      </div>
    )
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="forgot-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Ai uitat parola?</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Introdu adresa de email a contului tău și îți trimitem un link cu care
        poți seta o parolă nouă.
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Introdu o adresă de email validă."
            autoComplete="email"
            required
            data-testid="email-input"
          />
        </div>
        <ErrorMessage
          error={state?.error}
          data-testid="forgot-password-error-message"
        />
        <SubmitButton
          data-testid="send-reset-link-button"
          className="w-full mt-6"
        >
          Trimite linkul de resetare
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Ți-ai amintit parola?{" "}
        {setCurrentView ? (
          <button
            onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
            className="underline"
            data-testid="back-to-sign-in-button"
          >
            Conectează-te
          </button>
        ) : (
          <LocalizedClientLink href="/account" className="underline">
            Conectează-te
          </LocalizedClientLink>
        )}
        .
      </span>
    </div>
  )
}

export default ForgotPassword

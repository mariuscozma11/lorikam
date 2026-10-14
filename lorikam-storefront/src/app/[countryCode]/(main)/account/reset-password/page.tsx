import { Metadata } from "next"

import ForgotPassword from "@modules/account/components/forgot-password"
import ResetPasswordForm from "@modules/account/components/reset-password"

export const metadata: Metadata = {
  title: "Resetare parolă",
  description: "Setează o parolă nouă pentru contul tău.",
  // The reset token arrives in the query string, so nothing about this URL may
  // leak outwards: no referrer on any navigation away from the page, and no
  // indexing of the address itself.
  referrer: "no-referrer",
  robots: { index: false, follow: false },
}

// Only used to decide whether the address is safe to echo back as a label. A
// query parameter is attacker-controlled text, and "contactează 0800-..." in
// place of an email would read like a message from the shop.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const firstValue = (value?: string | string[]) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? ""

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{
    token?: string | string[]
    email?: string | string[]
  }>
}) {
  const searchParams = await props.searchParams

  const token = firstValue(searchParams.token)
  const email = firstValue(searchParams.email)

  // No token means somebody opened /account/reset-password directly, or a mail
  // client truncated the link. Either way the password form would be useless,
  // so go straight to the one thing that helps: requesting a fresh link.
  if (!token) {
    return (
      <div className="w-full flex justify-start px-8 py-8">
        <div className="max-w-sm w-full flex flex-col items-center">
          <p
            className="text-center text-base-regular text-ui-fg-subtle mb-8"
            data-testid="reset-password-missing-token"
          >
            Linkul de resetare este incomplet sau a expirat. Cere unul nou mai
            jos.
          </p>
          <ForgotPassword />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex justify-start px-8 py-8">
      <ResetPasswordForm
        token={token}
        email={EMAIL_PATTERN.test(email) ? email : undefined}
      />
    </div>
  )
}

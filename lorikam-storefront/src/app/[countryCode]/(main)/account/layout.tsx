import { retrieveCustomer } from "@lib/data/customer"
import { Toaster } from "@medusajs/ui"
import AccountLayout from "@modules/account/templates/account-layout"

/**
 * `/account` itself is a pair of parallel routes: the @dashboard slot for a
 * signed-in customer, the @login slot for everyone else.
 *
 * `children` is the ordinary (non-slot) segment, and it exists for the sake of
 * /account/reset-password — a page that belongs under /account but fits neither
 * slot, because the customer arrives from an email link while signed out and
 * must not be shown the login form instead. The two slots fall back to their
 * `default.tsx` (which render nothing) for that URL, and `children` falls back
 * to this folder's `default.tsx` everywhere else.
 */
export default async function AccountPageLayout({
  children,
  dashboard,
  login,
}: {
  children?: React.ReactNode
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {children}
      {customer ? dashboard : login}
      <Toaster />
    </AccountLayout>
  )
}

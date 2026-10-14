import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Finalizare comandă",
}

const CHECKOUT_STEPS = ["address", "delivery", "payment", "review"]

export default async function Checkout({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ step?: string }>
}) {
  // Every section of the form opens on its own `?step=` value, so a bare
  // /checkout — a bookmark, a typed URL — leaves all of them collapsed and the
  // address section stuck on a spinner. Default to the first step here rather
  // than teaching each component its own fallback.
  const { step } = await searchParams

  if (!step || !CHECKOUT_STEPS.includes(step)) {
    const { countryCode } = await params
    redirect(`/${countryCode}/checkout?step=address`)
  }

  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <PaymentWrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}

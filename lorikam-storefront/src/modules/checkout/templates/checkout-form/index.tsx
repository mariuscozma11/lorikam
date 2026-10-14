import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Both loaders swallow every backend failure into `null`, so this block is the
// only chance to explain a 500 or a timeout to the customer. Before it, the
// page rendered with nothing but the order summary and no way forward.
const CheckoutUnavailable = ({ message }: { message: string }) => (
  <div
    className="flex flex-col gap-y-3 p-6 border rounded-rounded"
    data-testid="checkout-load-error"
  >
    <h2 className="text-large-semi text-ui-fg-base">
      Nu am putut încărca finalizarea comenzii
    </h2>
    <p className="text-small-regular text-ui-fg-subtle">{message}</p>
    <div className="flex flex-col small:flex-row small:items-center gap-3">
      <LocalizedClientLink
        href="/checkout?step=address"
        className="text-small-regular text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
      >
        Încearcă din nou
      </LocalizedClientLink>
      <LocalizedClientLink
        href="/cart"
        className="text-small-regular text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
      >
        Înapoi la coș
      </LocalizedClientLink>
    </div>
  </div>
)

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  // The delivery step gates everything after it, so without shipping options
  // there is no usable form left to show.
  if (!shippingMethods) {
    return (
      <CheckoutUnavailable message="Nu am putut încărca opțiunile de livrare și de plată. Este o problemă temporară de comunicare cu serverul nostru, iar coșul tău rămâne salvat. Te rugăm să încerci din nou în câteva momente." />
    )
  }

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses cart={cart} customer={customer} />

      <Shipping cart={cart as any} availableShippingMethods={shippingMethods} />

      {/* Only the payment providers failed to load: the address and delivery
          steps still work, so keep them and explain the missing part instead of
          hiding the whole form. */}
      {paymentMethods ? (
        <>
          <Payment cart={cart} availablePaymentMethods={paymentMethods} />

          <Review cart={cart} />
        </>
      ) : (
        <CheckoutUnavailable message="Nu am putut încărca metodele de plată. Adresa și livrarea alese rămân salvate, așa că poți relua pasul de plată în câteva momente." />
      )}
    </div>
  )
}

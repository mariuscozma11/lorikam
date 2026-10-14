"use client"

import { isManual, isStripeLike } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import translateCheckoutError from "@lib/util/checkout-error"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"

// Romanian translations for Stripe error messages. Stripe itself is asked for
// Romanian (Elements is created with locale "ro"), so this map is only a
// fallback for anything that still arrives in English.
const translateStripeError = (message: string | undefined): string => {
  if (!message) return "A apărut o eroare. Vă rugăm să încercați din nou."

  const translations: Record<string, string> = {
    "Your card has been declined.": "Cardul dumneavoastră a fost refuzat.",
    "Your card's security code is incorrect.": "Codul de securitate al cardului este incorect.",
    "Your card has expired.": "Cardul dumneavoastră a expirat.",
    "Your card number is incorrect.": "Numărul cardului este incorect.",
    "Your card number is incomplete.": "Numărul cardului este incomplet.",
    "Your card's expiration date is incomplete.": "Data de expirare este incompletă.",
    "Your card's expiration year is in the past.": "Anul de expirare este în trecut.",
    "Your card's expiration month is in the past.": "Luna de expirare este în trecut.",
    "Your card was declined for making repeated attempts too frequently.": "Cardul a fost refuzat din cauza încercărilor repetate prea frecvente.",
    "Your card has insufficient funds.": "Fonduri insuficiente pe card.",
    "An error occurred while processing your card.": "A apărut o eroare la procesarea cardului.",
    "Your card does not support this type of purchase.": "Cardul nu suportă acest tip de achiziție.",
    "Your card is not supported.": "Cardul nu este suportat.",
  }

  // Never show the raw English string: anything unknown goes through the
  // shared mapper, which falls back to a generic Romanian sentence.
  return translations[message] || translateCheckoutError(message)
}

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    default:
      return <Button disabled>Selectează o metodă de plată</Button>
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    // placeOrder returns a Romanian message instead of throwing it — a thrown
    // Server Action error reaches production as a generic English sentence, and
    // this is the worst possible moment to lose the real reason. The catch is
    // left only for a failed call (offline, action transport).
    try {
      const result = await placeOrder()

      if (typeof result === "string") {
        setErrorMessage(result)
      }
    } catch (err: any) {
      setErrorMessage(translateCheckoutError(err?.message))
    } finally {
      setSubmitting(false)
    }
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
            return
          }

          setErrorMessage(translateStripeError(error.message))
          setSubmitting(false)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        // Handle unexpected payment status
        setSubmitting(false)
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Plasează comanda
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    // Same as above: the message is returned, not thrown.
    try {
      const result = await placeOrder()

      if (typeof result === "string") {
        setErrorMessage(result)
      }
    } catch (err: any) {
      setErrorMessage(translateCheckoutError(err?.message))
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid="submit-order-button"
      >
        Plasează comanda
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton

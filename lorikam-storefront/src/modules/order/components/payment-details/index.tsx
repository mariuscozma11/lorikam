import { Container, Heading, Text } from "@medusajs/ui"

import { isManual, isStripeLike, paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  // Both indexes need guarding: an order can arrive with an empty
  // payment_collections array, and reading `.payments` off that undefined entry
  // would crash the order confirmation page right after a successful purchase.
  const payment = order.payment_collections?.[0]?.payments?.[0]

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        Plată
      </Heading>
      <div>
        {payment && (
          <div className="flex items-start gap-x-1 w-full">
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Metodă de plată
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method"
              >
                {/* Fall back to the raw provider id, as elsewhere in checkout, so an
                    unmapped provider can't crash this page */}
                {paymentInfoMap[payment.provider_id]?.title ||
                  payment.provider_id}
              </Text>
            </div>
            <div className="flex flex-col w-2/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Detalii plată
              </Text>
              <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                  {paymentInfoMap[payment.provider_id]?.icon}
                </Container>
                <Text data-testid="payment-amount">
                  {isStripeLike(payment.provider_id) && payment.data?.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : `${convertToLocale({
                        amount: payment.amount,
                        currency_code: order.currency_code,
                      })} ${
                        // The manual/system provider only authorizes the amount —
                        // nothing is captured — so saying "achitat" would be false.
                        isManual(payment.provider_id)
                          ? "autorizat la"
                          : "achitat la"
                      } ${new Date(payment.created_at ?? "").toLocaleString(
                        // Without a locale this rendered as 10/14/2026, 8:56:00 AM
                        "ro-RO"
                      )}`}
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails

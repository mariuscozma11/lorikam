import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

// Medusa reports these in English; the storefront is Romanian.
const FULFILLMENT_STATUS: Record<string, string> = {
  not_fulfilled: "În procesare",
  partially_fulfilled: "Parțial pregătită",
  fulfilled: "Pregătită de expediere",
  partially_shipped: "Parțial expediată",
  shipped: "Expediată",
  partially_delivered: "Parțial livrată",
  delivered: "Livrată",
  partially_returned: "Parțial returnată",
  returned: "Returnată",
  canceled: "Anulată",
}

const PAYMENT_STATUS: Record<string, string> = {
  not_paid: "Neplătită",
  awaiting: "În așteptare",
  authorized: "Autorizată",
  partially_authorized: "Parțial autorizată",
  captured: "Plătită",
  partially_captured: "Parțial plătită",
  partially_refunded: "Parțial rambursată",
  refunded: "Rambursată",
  canceled: "Anulată",
  requires_action: "Necesită acțiune",
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string, map: Record<string, string>) => {
    if (!str) {
      return "—"
    }

    const translated = map[str]
    if (translated) {
      return translated
    }

    const formatted = str.split("_").join(" ")
    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div>
      <Text>
        Am trimis detaliile de confirmare a comenzii la{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>
      <Text className="mt-2">
        Data comenzii:{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toDateString()}
        </span>
      </Text>
      <Text className="mt-2 text-ui-fg-interactive">
        Număr comandă: <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text>
              Stare comandă:{" "}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {formatStatus(order.fulfillment_status, FULFILLMENT_STATUS)}
              </span>
            </Text>
            <Text>
              Stare plată:{" "}
              <span
                className="text-ui-fg-subtle "
                data-testid="order-payment-status"
              >
                {formatStatus(order.payment_status, PAYMENT_STATUS)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails

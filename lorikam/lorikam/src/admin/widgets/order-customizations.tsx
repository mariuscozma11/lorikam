import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Badge,
} from "@medusajs/ui"

type Customizations = Record<string, string>

type OrderItem = {
  id: string
  title: string
  product_title: string
  variant_title?: string
  quantity: number
  metadata?: {
    customizations?: Customizations
  }
}

const OrderCustomizationsWidget = ({
  data: order,
}: DetailWidgetProps<AdminOrder>) => {
  // Filter items that have customizations
  const itemsWithCustomizations = (order.items || []).filter(
    (item: any) => item.metadata?.customizations
  ) as OrderItem[]

  // Don't render if no items have customizations
  if (itemsWithCustomizations.length === 0) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Heading level="h2">Personalizari</Heading>
          <Badge size="2xsmall" color="purple">
            {itemsWithCustomizations.length} produs{itemsWithCustomizations.length > 1 ? "e" : ""}
          </Badge>
        </div>
        <Text size="small" className="text-ui-fg-muted">
          Detalii personalizare pentru produsele din comanda
        </Text>
      </div>

      <div className="px-6 py-4 space-y-4">
        {itemsWithCustomizations.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-ui-bg-subtle rounded-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <Text size="base" weight="plus">
                  {item.product_title}
                </Text>
                {item.variant_title && (
                  <Text size="small" className="text-ui-fg-muted">
                    {item.variant_title}
                  </Text>
                )}
              </div>
              <Badge size="2xsmall" color="grey">
                x{item.quantity}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(item.metadata?.customizations || {}).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <Text size="xsmall" className="text-ui-fg-muted uppercase">
                    {key.replace(/_/g, " ")}
                  </Text>
                  <Text size="base" weight="plus" className="font-mono">
                    {value}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderCustomizationsWidget

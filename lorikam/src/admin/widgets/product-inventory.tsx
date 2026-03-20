import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Button,
  toast,
  Input,
  Switch,
  Select,
  Badge,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { sdk } from "../lib/sdk"

type VariantInventory = {
  id: string
  title: string
  sku: string | null
  options: string
  manage_inventory: boolean
  inventory_item_id: string | null
  stock_by_location: Record<string, number>
}

type Location = {
  id: string
  name: string
}

type InventoryResponse = {
  variants: VariantInventory[]
  locations: Location[]
}

type VariantChange = {
  manage_inventory: boolean
  stocked_quantity: number
}

const ProductInventoryWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [changes, setChanges] = useState<Record<string, VariantChange>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch inventory data
  const {
    data: inventoryData,
    isLoading,
    error,
  } = useQuery<InventoryResponse>({
    queryFn: () =>
      sdk.client.fetch(`/admin/products/${product.id}/inventory`, {
        method: "GET",
      }),
    queryKey: ["product-inventory", product.id],
  })

  // Set default location when data loads
  useEffect(() => {
    const locs = Array.isArray(inventoryData?.locations) ? inventoryData.locations : []
    if (locs.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locs[0].id)
    }
  }, [inventoryData, selectedLocationId])

  // Initialize changes from current data
  useEffect(() => {
    if (inventoryData?.variants && selectedLocationId) {
      const initialChanges: Record<string, VariantChange> = {}
      for (const variant of inventoryData.variants) {
        initialChanges[variant.id] = {
          manage_inventory: variant.manage_inventory,
          stocked_quantity:
            variant.stock_by_location[selectedLocationId] ?? 0,
        }
      }
      setChanges(initialChanges)
      setHasChanges(false)
    }
  }, [inventoryData, selectedLocationId])

  // Mutation to save changes
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(changes).map(([variant_id, change]) => ({
        variant_id,
        manage_inventory: change.manage_inventory,
        stocked_quantity: change.manage_inventory
          ? change.stocked_quantity
          : undefined,
      }))

      return sdk.client.fetch(`/admin/products/${product.id}/inventory`, {
        method: "POST",
        body: {
          location_id: selectedLocationId,
          updates,
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["product-inventory", product.id],
      })
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[]
          return (
            key.includes("product") ||
            key.includes("variants") ||
            key.includes(product.id)
          )
        },
      })
      setHasChanges(false)
      toast.success("Stocul a fost actualizat!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const handleManageInventoryChange = (variantId: string, value: boolean) => {
    setChanges((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        manage_inventory: value,
      },
    }))
    setHasChanges(true)
  }

  const handleQuantityChange = (variantId: string, value: number) => {
    setChanges((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        stocked_quantity: value,
      },
    }))
    setHasChanges(true)
  }

  const handleEnableAllInventory = () => {
    const newChanges = { ...changes }
    for (const variantId of Object.keys(newChanges)) {
      newChanges[variantId] = {
        ...newChanges[variantId],
        manage_inventory: true,
      }
    }
    setChanges(newChanges)
    setHasChanges(true)
  }

  const handleSetAllQuantity = (quantity: number) => {
    const newChanges = { ...changes }
    for (const variantId of Object.keys(newChanges)) {
      if (newChanges[variantId].manage_inventory) {
        newChanges[variantId] = {
          ...newChanges[variantId],
          stocked_quantity: quantity,
        }
      }
    }
    setChanges(newChanges)
    setHasChanges(true)
  }

  const handleReset = () => {
    if (inventoryData?.variants && selectedLocationId) {
      const initialChanges: Record<string, VariantChange> = {}
      for (const variant of inventoryData.variants) {
        initialChanges[variant.id] = {
          manage_inventory: variant.manage_inventory,
          stocked_quantity:
            variant.stock_by_location[selectedLocationId] ?? 0,
        }
      }
      setChanges(initialChanges)
      setHasChanges(false)
    }
  }

  const handleSave = () => {
    saveMutation.mutate()
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">Se incarca...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">
            Eroare la incarcarea datelor de stoc.
          </Text>
        </div>
      </Container>
    )
  }

  const variants = inventoryData?.variants || []
  const locations = Array.isArray(inventoryData?.locations) ? inventoryData.locations : []

  if (variants.length === 0) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Gestionare Stoc</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Nu exista variante pentru acest produs.
          </Text>
        </div>
      </Container>
    )
  }

  const managedCount = Object.values(changes).filter(
    (c) => c.manage_inventory
  ).length

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Gestionare Stoc</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Activeaza inventarul si seteaza stocul pentru variante
          </Text>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={handleReset}
              disabled={saveMutation.isPending}
            >
              Anuleaza
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Se salveaza..." : "Salveaza"}
            </Button>
          </div>
        )}
      </div>

      {/* Location selector and quick actions */}
      <div className="px-6 py-4 bg-ui-bg-subtle">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Text size="small" className="text-ui-fg-muted">
              Locatie:
            </Text>
            <Select
              size="small"
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
            >
              <Select.Trigger>
                <Select.Value placeholder="Selecteaza locatia" />
              </Select.Trigger>
              <Select.Content>
                {locations.map((loc) => (
                  <Select.Item key={loc.id} value={loc.id}>
                    {loc.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="secondary"
              size="small"
              onClick={handleEnableAllInventory}
            >
              Activeaza toate
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => handleSetAllQuantity(10)}
            >
              Seteaza toate = 10
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => handleSetAllQuantity(50)}
            >
              = 50
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => handleSetAllQuantity(100)}
            >
              = 100
            </Button>
          </div>
        </div>

        <div className="mt-2">
          <Badge color={managedCount === variants.length ? "green" : "grey"}>
            {managedCount} / {variants.length} variante cu inventar activ
          </Badge>
        </div>
      </div>

      {/* Variants table */}
      <div className="px-6 py-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ui-border-base">
                <th className="text-left py-2 pr-4 font-medium text-ui-fg-muted">
                  Varianta
                </th>
                <th className="text-left py-2 px-4 font-medium text-ui-fg-muted">
                  SKU
                </th>
                <th className="text-center py-2 px-4 font-medium text-ui-fg-muted">
                  Inventar Activ
                </th>
                <th className="text-center py-2 pl-4 font-medium text-ui-fg-muted">
                  Stoc
                </th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => {
                const change = changes[variant.id]
                if (!change) return null

                return (
                  <tr
                    key={variant.id}
                    className="border-b border-ui-border-base last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <Text size="small" weight="plus">
                        {variant.title}
                      </Text>
                      {variant.options && (
                        <Text size="xsmall" className="text-ui-fg-muted">
                          {variant.options}
                        </Text>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Text size="small" className="text-ui-fg-muted">
                        {variant.sku || "-"}
                      </Text>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Switch
                        checked={change.manage_inventory}
                        onCheckedChange={(checked) =>
                          handleManageInventoryChange(variant.id, checked)
                        }
                      />
                    </td>
                    <td className="py-3 pl-4 text-center">
                      {change.manage_inventory ? (
                        <Input
                          type="number"
                          min={0}
                          value={change.stocked_quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              variant.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-20 text-center"
                          size="small"
                        />
                      ) : (
                        <Text size="small" className="text-ui-fg-muted">
                          -
                        </Text>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductInventoryWidget

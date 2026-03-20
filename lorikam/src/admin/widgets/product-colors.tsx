import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Button,
  toast,
  Tooltip,
  Checkbox,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { sdk } from "../lib/sdk"

type Color = {
  id: string
  name: string
  hex_codes: string[]
  display_order: number
}

type ProductWithColors = AdminProduct & {
  colors?: Color[]
}

type ColorsResponse = {
  colors: Color[]
}

const ProductColorsWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch all available colors
  const { data: colorsData, isLoading: colorsLoading, error: colorsError } = useQuery<ColorsResponse>({
    queryFn: () =>
      sdk.client.fetch("/admin/colors", {
        query: { limit: 100 },
      }),
    queryKey: ["colors"],
  })

  // Fetch product with linked colors
  const { data: productColorsData, isLoading: productColorsLoading, error: productColorsError } = useQuery<{
    colors: Color[]
  }>({
    queryFn: () =>
      sdk.client.fetch(`/admin/products/${product.id}/colors`, {
        method: "GET",
      }),
    queryKey: ["product-colors", product.id],
  })

  // Initialize selected colors from product data
  useEffect(() => {
    const colors = productColorsData?.colors
    if (colors && Array.isArray(colors)) {
      setSelectedColorIds(colors.map((c) => c.id))
    }
  }, [productColorsData])

  // Mutation to save linked colors
  const saveColorsMutation = useMutation({
    mutationFn: async (colorIds: string[]) => {
      return sdk.client.fetch(`/admin/products/${product.id}/colors`, {
        method: "POST",
        body: { color_ids: colorIds },
      })
    },
    onSuccess: async () => {
      // Invalidate all product-related queries to refresh the UI
      await queryClient.invalidateQueries({
        queryKey: ["product-colors", product.id],
      })
      await queryClient.invalidateQueries({
        queryKey: ["product", product.id],
      })
      // Invalidate variants queries (used by the variants table)
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
      toast.success("Culorile și variantele au fost salvate!")

      // Reload the page to show updated variants
      window.location.reload()
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const handleColorToggle = (colorId: string) => {
    setSelectedColorIds((prev) => {
      const newIds = prev.includes(colorId)
        ? prev.filter((id) => id !== colorId)
        : [...prev, colorId]
      return newIds
    })
    setHasChanges(true)
  }

  const handleSave = () => {
    saveColorsMutation.mutate(selectedColorIds)
  }

  const handleReset = () => {
    if (productColorsData?.colors) {
      setSelectedColorIds(productColorsData.colors.map((c) => c.id))
    } else {
      setSelectedColorIds([])
    }
    setHasChanges(false)
  }

  const renderColorPreview = (hexCodes: string[], size = "w-8 h-8") => {
    if (hexCodes.length === 0) {
      return (
        <div
          className={`${size} rounded-full border border-ui-border-base bg-ui-bg-subtle`}
        />
      )
    }

    if (hexCodes.length === 1) {
      return (
        <div
          className={`${size} rounded-full border border-ui-border-base`}
          style={{ backgroundColor: hexCodes[0] }}
        />
      )
    }

    // For 2 colors - two half circles using clip-path
    if (hexCodes.length === 2) {
      return (
        <div className={`${size} rounded-full border border-ui-border-base overflow-hidden relative`}>
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: hexCodes[0],
              clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: hexCodes[1],
              clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)",
            }}
          />
        </div>
      )
    }

    // For 3 colors - three segments
    if (hexCodes.length === 3) {
      return (
        <div className={`${size} rounded-full border border-ui-border-base overflow-hidden relative`}>
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: hexCodes[0],
              clipPath: "polygon(50% 50%, 50% 0, 100% 0, 100% 50%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: hexCodes[1],
              clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 0 100%, 0 50%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: hexCodes[2],
              clipPath: "polygon(50% 50%, 0 50%, 0 0, 50% 0)",
            }}
          />
        </div>
      )
    }

    // For 4+ colors - use horizontal stripes as fallback
    return (
      <div className={`${size} rounded-full border border-ui-border-base overflow-hidden flex flex-col`}>
        {hexCodes.map((hex, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
    )
  }

  const isLoading = colorsLoading || productColorsLoading
  const hasError = colorsError || productColorsError

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">Se incarca...</Text>
        </div>
      </Container>
    )
  }

  if (hasError) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">Eroare la incarcarea culorilor.</Text>
        </div>
      </Container>
    )
  }

  const availableColors = (colorsData?.colors || []).sort(
    (a, b) => a.display_order - b.display_order
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Culori Produs</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Selecteaza culorile - variantele vor fi create automat
          </Text>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={handleReset}
              disabled={saveColorsMutation.isPending}
            >
              Anuleaza
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSave}
              disabled={saveColorsMutation.isPending}
            >
              {saveColorsMutation.isPending ? "Se salveaza..." : "Salveaza"}
            </Button>
          </div>
        )}
      </div>

      <div className="px-6 py-4">
        {availableColors.length === 0 ? (
          <div>
            <Text size="small" className="text-ui-fg-muted mb-2">
              Nu exista culori definite.
            </Text>
            <Button
              variant="secondary"
              size="small"
              onClick={() => window.open("/app/colors", "_blank")}
            >
              Adauga Culori
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            {availableColors.map((color) => (
              <label
                key={color.id}
                className="flex items-center gap-3 p-3 bg-ui-bg-subtle rounded-lg cursor-pointer hover:bg-ui-bg-subtle-hover transition-colors"
              >
                <Checkbox
                  checked={selectedColorIds.includes(color.id)}
                  onCheckedChange={() => handleColorToggle(color.id)}
                />
                {renderColorPreview(color.hex_codes)}
                <div className="flex-1">
                  <Text size="base" weight="plus">
                    {color.name}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {color.hex_codes.join(", ")}
                  </Text>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {selectedColorIds.length > 0 && (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted mb-3">
            Culori selectate ({selectedColorIds.length}):
          </Text>
          <div className="flex flex-wrap gap-3">
            {availableColors
              .filter((c) => selectedColorIds.includes(c.id))
              .map((color) => (
                <Tooltip key={color.id} content={color.name}>
                  <div className="flex flex-col items-center gap-1">
                    {renderColorPreview(color.hex_codes)}
                    <Text size="xsmall" className="text-ui-fg-muted">
                      {color.name}
                    </Text>
                  </div>
                </Tooltip>
              ))}
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductColorsWidget

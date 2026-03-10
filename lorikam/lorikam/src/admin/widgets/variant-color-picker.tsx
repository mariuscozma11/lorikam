import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Button,
  toast,
  Tooltip,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { sdk } from "../lib/sdk"

type ColorMap = Record<string, string>

type ProductWithMetadata = AdminProduct & {
  metadata?: Record<string, unknown>
  options?: Array<{
    id: string
    title: string
    values?: Array<{ id: string; value: string }>
  }>
}

const VariantColorPickerWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()
  const [colorMap, setColorMap] = useState<ColorMap>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch product with options and metadata
  const { data: productData, isLoading } = useQuery({
    queryFn: () =>
      sdk.admin.product.retrieve(product.id, {
        fields: "+options,+options.values,+metadata",
      }),
    queryKey: ["product-color-options", product.id],
  })

  const typedProduct = productData?.product as ProductWithMetadata | undefined

  // Find the "Culoare" or "Culori" option
  const colorOption = typedProduct?.options?.find((opt) => {
    const title = opt.title.toLowerCase()
    return title === "culoare" || title === "culori"
  })

  // Initialize color map from metadata
  useEffect(() => {
    if (typedProduct?.metadata?.color_map) {
      setColorMap(typedProduct.metadata.color_map as ColorMap)
    }
  }, [typedProduct?.metadata?.color_map])

  // Mutation to save color map to metadata
  const saveColorsMutation = useMutation({
    mutationFn: async (newColorMap: ColorMap) => {
      return sdk.admin.product.update(product.id, {
        metadata: {
          ...typedProduct?.metadata,
          color_map: newColorMap,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["product-color-options", product.id],
      })
      setHasChanges(false)
      toast.success("Culorile au fost salvate cu succes!")
    },
    onError: (error) => {
      toast.error("Eroare la salvarea culorilor: " + (error as Error).message)
    },
  })

  const handleColorChange = (optionValue: string, hexColor: string) => {
    setColorMap((prev) => ({
      ...prev,
      [optionValue]: hexColor,
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    saveColorsMutation.mutate(colorMap)
  }

  const handleReset = () => {
    if (typedProduct?.metadata?.color_map) {
      setColorMap(typedProduct.metadata.color_map as ColorMap)
    } else {
      setColorMap({})
    }
    setHasChanges(false)
  }

  // Don't render if no "culoare" option exists
  if (!colorOption) {
    return null
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

  const optionValues = colorOption.values || []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Culori Variante</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Asociaza culori hexadecimale pentru optiunea "{colorOption?.title}"
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
        {optionValues.length === 0 ? (
          <Text size="small" className="text-ui-fg-muted">
            Nu exista valori pentru optiunea "{colorOption?.title}". Adauga
            variante cu valori de culoare mai intai.
          </Text>
        ) : (
          <div className="grid gap-4">
            {optionValues.map((optValue) => (
              <div
                key={optValue.id}
                className="flex items-center justify-between gap-4 p-3 bg-ui-bg-subtle rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Text size="base" weight="plus" className="min-w-[100px]">
                    {optValue.value}
                  </Text>

                  <div className="flex items-center gap-2">
                    <Tooltip content="Alege o culoare">
                      <input
                        type="color"
                        value={colorMap[optValue.value] || "#000000"}
                        onChange={(e) =>
                          handleColorChange(optValue.value, e.target.value)
                        }
                        className="w-10 h-10 cursor-pointer rounded border border-ui-border-base"
                        style={{
                          padding: 0,
                          backgroundColor: "transparent",
                        }}
                      />
                    </Tooltip>

                    <input
                      type="text"
                      value={colorMap[optValue.value] || ""}
                      onChange={(e) =>
                        handleColorChange(optValue.value, e.target.value)
                      }
                      placeholder="#000000"
                      className="w-24 px-2 py-1 text-sm border border-ui-border-base rounded bg-ui-bg-base"
                    />
                  </div>
                </div>

                {colorMap[optValue.value] && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full border border-ui-border-base shadow-sm"
                      style={{ backgroundColor: colorMap[optValue.value] }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {Object.keys(colorMap).length > 0 && (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted mb-3">
            Previzualizare culori:
          </Text>
          <div className="flex flex-wrap gap-3">
            {Object.entries(colorMap).map(([name, hex]) => (
              <Tooltip key={name} content={`${name}: ${hex}`}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-12 h-12 rounded-lg border border-ui-border-base shadow-sm cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: hex }}
                  />
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {name}
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

export default VariantColorPickerWidget

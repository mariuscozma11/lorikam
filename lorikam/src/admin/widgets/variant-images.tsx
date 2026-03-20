import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Button,
  toast,
  Checkbox,
  Badge,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect, useMemo } from "react"
import { sdk } from "../lib/sdk"

type Variant = {
  id: string
  title: string
  options?: { option_id: string; value: string; option?: { title: string } }[]
  images?: { id: string; url: string }[]
}

type ProductImage = {
  id: string
  url: string
  variants?: { id: string }[]
}

type VariantsResponse = {
  variants: Variant[]
}

type ColorGroup = {
  colorName: string | null
  colorHex: string[] | null
  variants: Variant[]
}

const VariantImagesWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null)
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch product with variants, options and images (with their variant associations)
  const { data: productData, isLoading: variantsLoading } = useQuery<{ product: AdminProduct & { variants: Variant[], options: { id: string, title: string }[], images: ProductImage[] } }>({
    queryFn: () =>
      sdk.client.fetch(`/admin/products/${product.id}`, {
        query: {
          fields: "*variants,*variants.options,*options,images.id,images.url,images.variants.id",
        },
      }),
    queryKey: ["product-variants-images", product.id],
  })

  // Build option ID to title map
  const optionIdToTitle = useMemo(() => {
    const map: Record<string, string> = {}
    const options = productData?.product?.options || []
    for (const opt of options) {
      map[opt.id] = opt.title
    }
    return map
  }, [productData])

  const variantsData = useMemo(() => {
    return { variants: productData?.product?.variants || [] }
  }, [productData])

  // Use images from productData (with variant associations) instead of product.images
  const productImages: ProductImage[] = productData?.product?.images || []

  // Get color map from product metadata
  const colorMap = useMemo(() => {
    return (product.metadata?.color_map as Record<string, string>) || {}
  }, [product.metadata])

  // Group variants by color
  const colorGroups = useMemo<ColorGroup[]>(() => {
    const variants = variantsData?.variants || []
    const groups: Map<string, ColorGroup> = new Map()
    const noColorVariants: Variant[] = []

    for (const variant of variants) {
      // Find the Culoare option by looking up the option title via option_id
      const colorOption = variant.options?.find((opt) => {
        const optionTitle = optionIdToTitle[opt.option_id]
        return optionTitle?.toLowerCase() === "culoare"
      })

      if (colorOption) {
        const colorName = colorOption.value
        if (!groups.has(colorName)) {
          const hexValue = colorMap[colorName]
          groups.set(colorName, {
            colorName,
            colorHex: hexValue ? hexValue.split(",").map((h) => h.trim()) : null,
            variants: [],
          })
        }
        groups.get(colorName)!.variants.push(variant)
      } else {
        noColorVariants.push(variant)
      }
    }

    const result: ColorGroup[] = []

    // Add color groups sorted alphabetically
    const sortedGroups = Array.from(groups.values()).sort((a, b) =>
      (a.colorName || "").localeCompare(b.colorName || "")
    )
    result.push(...sortedGroups)

    // Add no-color group at the end if there are any
    if (noColorVariants.length > 0) {
      result.push({
        colorName: null,
        colorHex: null,
        variants: noColorVariants,
      })
    }

    return result
  }, [variantsData, colorMap, optionIdToTitle])

  // Initialize selected variants when an image is selected
  // Read from image.variants (the correct Medusa data structure)
  const selectedImageId = selectedImage?.id
  useEffect(() => {
    if (selectedImageId && productImages.length > 0) {
      // Find the image with its variant associations
      const imageWithVariants = productImages.find(img => img.id === selectedImageId)
      const variantIdsWithImage = new Set<string>(
        (imageWithVariants?.variants || []).map(v => v.id)
      )
      console.log("[VariantImages] Loading variants for image:", selectedImageId)
      console.log("[VariantImages] Image has variants:", variantIdsWithImage.size)
      setSelectedVariantIds(variantIdsWithImage)
      setHasChanges(false)
    }
  }, [selectedImageId, productImages]) // Re-run when image or productImages changes

  // Mutation to save variant images (using batchImageVariants like Medusa dashboard)
  const saveVariantImagesMutation = useMutation({
    mutationFn: async ({
      imageId,
      variantIds,
    }: {
      imageId: string
      variantIds: string[]
    }) => {
      // Get initial variant IDs from the image
      const imageWithVariants = productImages.find(img => img.id === imageId)
      const initialVariantIds = (imageWithVariants?.variants || []).map(v => v.id)

      // Calculate what to add and remove
      const variantsToAdd = variantIds.filter(id => !initialVariantIds.includes(id))
      const variantsToRemove = initialVariantIds.filter(id => !variantIds.includes(id))

      console.log("[VariantImages] Initial variants:", initialVariantIds.length)
      console.log("[VariantImages] Adding variants:", variantsToAdd.length)
      console.log("[VariantImages] Removing variants:", variantsToRemove.length)

      // Call the batch endpoint (same as Medusa dashboard)
      return sdk.admin.product.batchImageVariants(product.id, imageId, {
        add: variantsToAdd,
        remove: variantsToRemove,
      })
    },
    onSuccess: async () => {
      // Invalidate and refetch
      await queryClient.invalidateQueries({
        queryKey: ["product-variants-images", product.id],
      })
      setHasChanges(false)
      toast.success("Imaginile variantelor au fost salvate!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const handleVariantToggle = (variantId: string) => {
    setSelectedVariantIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(variantId)) {
        newSet.delete(variantId)
      } else {
        newSet.add(variantId)
      }
      return newSet
    })
    setHasChanges(true)
  }

  const handleSelectAllInGroup = (group: ColorGroup, selected: boolean) => {
    setSelectedVariantIds((prev) => {
      const newSet = new Set(prev)
      for (const variant of group.variants) {
        if (selected) {
          newSet.add(variant.id)
        } else {
          newSet.delete(variant.id)
        }
      }
      return newSet
    })
    setHasChanges(true)
  }

  const isGroupFullySelected = (group: ColorGroup): boolean => {
    return group.variants.every((v) => selectedVariantIds.has(v.id))
  }

  const isGroupPartiallySelected = (group: ColorGroup): boolean => {
    const selected = group.variants.filter((v) => selectedVariantIds.has(v.id))
    return selected.length > 0 && selected.length < group.variants.length
  }

  const handleSave = () => {
    if (!selectedImage) return
    saveVariantImagesMutation.mutate({
      imageId: selectedImage.id,
      variantIds: Array.from(selectedVariantIds),
    })
  }

  const handleCancel = () => {
    if (selectedImage && productImages.length > 0) {
      const imageWithVariants = productImages.find(img => img.id === selectedImage.id)
      const variantIdsWithImage = new Set<string>(
        (imageWithVariants?.variants || []).map(v => v.id)
      )
      setSelectedVariantIds(variantIdsWithImage)
      setHasChanges(false)
    }
  }

  const renderColorPreview = (hexCodes: string[]) => {
    if (hexCodes.length === 1) {
      return (
        <div
          className="w-5 h-5 rounded-full border border-ui-border-base"
          style={{ backgroundColor: hexCodes[0] }}
        />
      )
    }

    if (hexCodes.length === 2) {
      return (
        <div className="w-5 h-5 rounded-full border border-ui-border-base overflow-hidden relative">
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

    return (
      <div className="w-5 h-5 rounded-full border border-ui-border-base overflow-hidden flex flex-col">
        {hexCodes.map((hex, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: hex }} />
        ))}
      </div>
    )
  }

  if (variantsLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">Se incarca...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Imagini Variante</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Asociaza imaginile cu variantele, grupate pe culori
        </Text>
      </div>

      {/* Image Selection */}
      <div className="px-6 py-4">
        <Text size="small" weight="plus" className="mb-3">
          Selecteaza imaginea:
        </Text>
        <div className="flex flex-wrap gap-2">
          {productImages.length === 0 ? (
            <Text size="small" className="text-ui-fg-muted">
              Nu exista imagini pentru acest produs.
            </Text>
          ) : (
            productImages.map((image) => (
              <button
                key={image.id}
                onClick={() => {
                  // Toggle: deselect if already selected, otherwise select
                  if (selectedImage?.id === image.id) {
                    setSelectedImage(null)
                    setHasChanges(false)
                  } else {
                    setSelectedImage(image)
                  }
                }}
                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage?.id === image.id
                    ? "border-ui-border-interactive ring-2 ring-ui-border-interactive"
                    : "border-ui-border-base hover:border-ui-border-strong"
                }`}
              >
                <img
                  src={image.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Variant Selection by Color */}
      {selectedImage && (
        <>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedImage.url}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <Text size="small" weight="plus">
                    Variante pentru aceasta imagine
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {selectedVariantIds.size} variante selectate
                  </Text>
                </div>
              </div>
              {hasChanges && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleCancel}
                    disabled={saveVariantImagesMutation.isPending}
                  >
                    Anuleaza
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleSave}
                    disabled={saveVariantImagesMutation.isPending}
                  >
                    {saveVariantImagesMutation.isPending
                      ? "Se salveaza..."
                      : "Salveaza"}
                  </Button>
                </div>
              )}
            </div>

            {/* Color Groups */}
            <div className="space-y-4">
              {colorGroups.map((group, groupIndex) => (
                <div
                  key={group.colorName || "no-color"}
                  className="border border-ui-border-base rounded-lg overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-ui-bg-subtle border-b border-ui-border-base">
                    <Checkbox
                      checked={isGroupFullySelected(group)}
                      indeterminate={isGroupPartiallySelected(group) || undefined}
                      onCheckedChange={(checked) =>
                        handleSelectAllInGroup(group, checked === true)
                      }
                    />
                    {group.colorHex && renderColorPreview(group.colorHex)}
                    <Text size="small" weight="plus">
                      {group.colorName || "Fara culoare"}
                    </Text>
                    <Badge size="2xsmall" color="grey">
                      {group.variants.length} variante
                    </Badge>
                    <Text size="xsmall" className="text-ui-fg-muted ml-auto">
                      {group.variants.filter((v) => selectedVariantIds.has(v.id)).length} selectate
                    </Text>
                  </div>

                  {/* Variants List */}
                  <div className="divide-y divide-ui-border-base">
                    {group.variants.map((variant) => (
                      <label
                        key={variant.id}
                        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-ui-bg-subtle-hover transition-colors"
                      >
                        <Checkbox
                          checked={selectedVariantIds.has(variant.id)}
                          onCheckedChange={() => handleVariantToggle(variant.id)}
                        />
                        <Text size="small">{variant.title}</Text>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!selectedImage && productImages.length > 0 && (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted">
            Selecteaza o imagine pentru a gestiona variantele asociate.
          </Text>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default VariantImagesWidget

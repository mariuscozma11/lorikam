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
  options?: { option_id: string; value: string }[]
  images?: { id: string; url: string }[]
}
type ProductImage = { id: string; url: string; variants?: { id: string }[] }
type ColorGroup = {
  colorName: string | null
  colorHex: string[] | null
  variants: Variant[]
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

// Standalone image↔variant (color) association UI, reusable on the product
// page widget and inside the create flow. Pass `bare` to drop the outer card.
export default function VariantImageAssigner({
  productId,
  bare = false,
}: {
  productId: string
  bare?: boolean
}) {
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null)
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set()
  )
  const [hasChanges, setHasChanges] = useState(false)

  const { data: productData, isLoading } = useQuery<{
    product: {
      metadata?: Record<string, any>
      variants: Variant[]
      options: { id: string; title: string }[]
      images: ProductImage[]
    }
  }>({
    queryFn: () =>
      sdk.client.fetch(`/admin/products/${productId}`, {
        query: {
          fields:
            "metadata,*variants,*variants.options,*options,images.id,images.url,images.variants.id",
        },
      }),
    queryKey: ["product-variants-images", productId],
  })

  const optionIdToTitle = useMemo(() => {
    const map: Record<string, string> = {}
    for (const opt of productData?.product?.options || []) map[opt.id] = opt.title
    return map
  }, [productData])

  const productImages: ProductImage[] = productData?.product?.images || []

  const colorMap = useMemo(
    () =>
      (productData?.product?.metadata?.color_map as Record<string, string>) ||
      {},
    [productData]
  )

  const colorGroups = useMemo<ColorGroup[]>(() => {
    const variants = productData?.product?.variants || []
    const groups: Map<string, ColorGroup> = new Map()
    const noColorVariants: Variant[] = []
    for (const variant of variants) {
      const colorOption = variant.options?.find(
        (opt) => optionIdToTitle[opt.option_id]?.toLowerCase() === "culoare"
      )
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
    result.push(
      ...Array.from(groups.values()).sort((a, b) =>
        (a.colorName || "").localeCompare(b.colorName || "")
      )
    )
    if (noColorVariants.length > 0) {
      result.push({ colorName: null, colorHex: null, variants: noColorVariants })
    }
    return result
  }, [productData, colorMap, optionIdToTitle])

  const selectedImageId = selectedImage?.id
  useEffect(() => {
    if (selectedImageId && productImages.length > 0) {
      const img = productImages.find((i) => i.id === selectedImageId)
      setSelectedVariantIds(new Set((img?.variants || []).map((v) => v.id)))
      setHasChanges(false)
    }
  }, [selectedImageId, productImages])

  const saveMutation = useMutation({
    mutationFn: async ({
      imageId,
      variantIds,
    }: {
      imageId: string
      variantIds: string[]
    }) => {
      const img = productImages.find((i) => i.id === imageId)
      const initial = (img?.variants || []).map((v) => v.id)
      const add = variantIds.filter((id) => !initial.includes(id))
      const remove = initial.filter((id) => !variantIds.includes(id))
      return sdk.admin.product.batchImageVariants(productId, imageId, {
        add,
        remove,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["product-variants-images", productId],
      })
      setHasChanges(false)
      toast.success("Imaginile variantelor au fost salvate!")
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const toggleVariant = (id: string) => {
    setSelectedVariantIds((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
    setHasChanges(true)
  }
  const selectGroup = (group: ColorGroup, selected: boolean) => {
    setSelectedVariantIds((prev) => {
      const n = new Set(prev)
      group.variants.forEach((v) => (selected ? n.add(v.id) : n.delete(v.id)))
      return n
    })
    setHasChanges(true)
  }
  const groupFull = (g: ColorGroup) =>
    g.variants.every((v) => selectedVariantIds.has(v.id))
  const groupPartial = (g: ColorGroup) => {
    const s = g.variants.filter((v) => selectedVariantIds.has(v.id))
    return s.length > 0 && s.length < g.variants.length
  }

  const body = (
    <>
      <div className="px-6 py-4">
        <Text size="small" weight="plus" className="mb-3">
          Selectează imaginea:
        </Text>
        <div className="flex flex-wrap gap-2">
          {productImages.length === 0 ? (
            <Text size="small" className="text-ui-fg-muted">
              Nu există imagini pentru acest produs.
            </Text>
          ) : (
            productImages.map((image) => (
              <button
                key={image.id}
                onClick={() =>
                  setSelectedImage((cur) =>
                    cur?.id === image.id ? null : image
                  )
                }
                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage?.id === image.id
                    ? "border-ui-border-interactive ring-2 ring-ui-border-interactive"
                    : "border-ui-border-base hover:border-ui-border-strong"
                }`}
              >
                <img src={image.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))
          )}
        </div>
      </div>

      {selectedImage && (
        <div className="px-6 py-4 border-t border-ui-border-base">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={selectedImage.url}
                alt=""
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <Text size="small" weight="plus">
                  Variante pentru această imagine
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  {selectedVariantIds.size} variante selectate
                </Text>
              </div>
            </div>
            {hasChanges && (
              <Button
                variant="primary"
                size="small"
                onClick={() =>
                  saveMutation.mutate({
                    imageId: selectedImage.id,
                    variantIds: Array.from(selectedVariantIds),
                  })
                }
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Se salvează..." : "Salvează"}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {colorGroups.map((group) => (
              <div
                key={group.colorName || "no-color"}
                className="border border-ui-border-base rounded-lg overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3 bg-ui-bg-subtle border-b border-ui-border-base">
                  <Checkbox
                    checked={groupFull(group)}
                    indeterminate={groupPartial(group) || undefined}
                    onCheckedChange={(c) => selectGroup(group, c === true)}
                  />
                  {group.colorHex && renderColorPreview(group.colorHex)}
                  <Text size="small" weight="plus">
                    {group.colorName || "Fără culoare"}
                  </Text>
                  <Badge size="2xsmall" color="grey">
                    {group.variants.length} variante
                  </Badge>
                </div>
                <div className="divide-y divide-ui-border-base">
                  {group.variants.map((variant) => (
                    <label
                      key={variant.id}
                      className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-ui-bg-subtle-hover transition-colors"
                    >
                      <Checkbox
                        checked={selectedVariantIds.has(variant.id)}
                        onCheckedChange={() => toggleVariant(variant.id)}
                      />
                      <Text size="small">{variant.title}</Text>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )

  if (isLoading) {
    const loading = (
      <div className="px-6 py-4">
        <Text className="text-ui-fg-muted">Se încarcă...</Text>
      </div>
    )
    return bare ? loading : <Container className="p-0">{loading}</Container>
  }

  if (bare) return <div>{body}</div>

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Imagini Variante</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Asociază imaginile cu variantele, grupate pe culori
        </Text>
      </div>
      {body}
    </Container>
  )
}

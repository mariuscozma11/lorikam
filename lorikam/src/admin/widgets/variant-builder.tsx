import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Button,
  toast,
  Checkbox,
  Input,
  Label,
  Badge,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { sdk } from "../lib/sdk"

type SizePreset = { id: string; name: string; sizes: string[] }
type Croi = {
  id: string
  label: string
  size_preset_id: string | null
  display_order: number
}

const VariantBuilderWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()

  const { data: croiData } = useQuery<{ crois: Croi[] }>({
    queryFn: () => sdk.client.fetch("/admin/crois"),
    queryKey: ["crois"],
  })
  const { data: presetData } = useQuery<{ size_presets: SizePreset[] }>({
    queryFn: () => sdk.client.fetch("/admin/size-presets"),
    queryKey: ["size-presets"],
  })

  const crois = useMemo(
    () => (croiData?.crois || []).sort((a, b) => a.display_order - b.display_order),
    [croiData]
  )
  const presets = presetData?.size_presets || []
  const presetById = useMemo(() => {
    const m: Record<string, SizePreset> = {}
    presets.forEach((p) => (m[p.id] = p))
    return m
  }, [presets])

  // selection state: croiId -> { included, sizes: Set }
  const [selection, setSelection] = useState<
    Record<string, { included: boolean; sizes: Set<string> }>
  >({})
  const [price, setPrice] = useState<string>("")

  const sizesForCroi = (c: Croi): string[] =>
    c.size_preset_id ? presetById[c.size_preset_id]?.sizes || [] : []

  const getState = (c: Croi) =>
    selection[c.id] || { included: false, sizes: new Set<string>() }

  const toggleCroi = (c: Croi) => {
    setSelection((prev) => {
      const cur = prev[c.id] || { included: false, sizes: new Set<string>() }
      const included = !cur.included
      return {
        ...prev,
        [c.id]: {
          included,
          // when first including, default to all sizes
          sizes:
            included && cur.sizes.size === 0
              ? new Set(sizesForCroi(c))
              : cur.sizes,
        },
      }
    })
  }

  const toggleSize = (c: Croi, size: string) => {
    setSelection((prev) => {
      const cur = prev[c.id] || { included: true, sizes: new Set<string>() }
      const next = new Set(cur.sizes)
      next.has(size) ? next.delete(size) : next.add(size)
      return { ...prev, [c.id]: { included: true, sizes: next } }
    })
  }

  const buildMutation = useMutation({
    mutationFn: (body: {
      selections: { croi: string; sizes: string[] }[]
      price?: number
    }) =>
      sdk.client.fetch<{ created: number; requested: number }>(
        `/admin/products/${product.id}/build-variants`,
        { method: "POST", body }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      if (res.created === 0) {
        toast.info("Toate variantele selectate există deja.")
      } else {
        toast.success(`${res.created} variante create.`)
      }
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const handleGenerate = () => {
    const selections = crois
      .map((c) => {
        const st = getState(c)
        if (!st.included) return null
        const sizes = Array.from(st.sizes)
        if (sizes.length === 0) return null
        return { croi: c.label, sizes }
      })
      .filter(Boolean) as { croi: string; sizes: string[] }[]

    if (selections.length === 0) {
      toast.error("Selectează cel puțin un croi și o mărime.")
      return
    }

    const parsedPrice = price.trim() ? parseFloat(price) : undefined
    buildMutation.mutate({
      selections,
      ...(parsedPrice !== undefined && !isNaN(parsedPrice)
        ? { price: parsedPrice }
        : {}),
    })
  }

  const totalToGenerate = crois.reduce((acc, c) => {
    const st = getState(c)
    return acc + (st.included ? st.sizes.size : 0)
  }, 0)

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Constructor variante</Heading>
        <Text size="small" className="text-ui-fg-muted mt-1">
          Alege croiurile și mărimile. Se creează variantele de bază (Croi ×
          Mărime). Culorile le adaugi din widgetul de culori.
        </Text>
      </div>

      <div className="px-6 py-4 space-y-5">
        {crois.length === 0 && (
          <Text className="text-ui-fg-muted">
            Niciun croi configurat. Adaugă din Setări → Croiuri.
          </Text>
        )}

        {crois.map((c) => {
          const st = getState(c)
          const sizes = sizesForCroi(c)
          return (
            <div
              key={c.id}
              className="rounded-lg border border-ui-border-base p-4"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={st.included}
                  onCheckedChange={() => toggleCroi(c)}
                  id={`croi-${c.id}`}
                />
                <Label htmlFor={`croi-${c.id}`} className="font-medium">
                  {c.label}
                </Label>
                {!c.size_preset_id && (
                  <Badge size="2xsmall" color="orange">
                    fără preset
                  </Badge>
                )}
              </div>

              {st.included && sizes.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3 pl-6">
                  {sizes.map((size) => (
                    <label
                      key={size}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <Checkbox
                        checked={st.sizes.has(size)}
                        onCheckedChange={() => toggleSize(c, size)}
                      />
                      <span className="text-sm">{size}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <div className="flex flex-col xsmall:flex-row xsmall:items-end gap-4">
          <div className="flex-1">
            <Label htmlFor="variant-price" className="font-medium">
              Preț (RON) — opțional, aplicat variantelor noi
            </Label>
            <Input
              id="variant-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="ex. 120"
              className="mt-2"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={buildMutation.isPending || totalToGenerate === 0}
          >
            {buildMutation.isPending
              ? "Se generează..."
              : `Generează variante${
                  totalToGenerate ? ` (${totalToGenerate})` : ""
                }`}
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default VariantBuilderWidget

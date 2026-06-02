import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Button,
  toast,
  Input,
  Label,
  Textarea,
  Checkbox,
  Badge,
} from "@medusajs/ui"
import { PlusMini } from "@medusajs/icons"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { sdk } from "../../lib/sdk"

type Team = { id: string; name: string }
type SizePreset = { id: string; name: string; sizes: string[] }
type Croi = {
  id: string
  label: string
  size_preset_id: string | null
  display_order: number
}
type Color = { id: string; name: string; hex_codes: string[] }

const NewProductPage = () => {
  const navigate = useNavigate()

  const [title, setTitle] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [teamId, setTeamId] = useState("")
  const [price, setPrice] = useState("")
  const [manageInventory, setManageInventory] = useState(true)
  const [description, setDescription] = useState("")
  const [selection, setSelection] = useState<
    Record<string, { included: boolean; sizes: Set<string> }>
  >({})
  const [colorIds, setColorIds] = useState<Set<string>>(new Set())

  const { data: teamData } = useQuery<{ teams: Team[] }>({
    queryFn: () => sdk.client.fetch("/admin/teams", { query: { limit: 100 } }),
    queryKey: ["teams"],
  })
  const { data: croiData } = useQuery<{ crois: Croi[] }>({
    queryFn: () => sdk.client.fetch("/admin/crois"),
    queryKey: ["crois"],
  })
  const { data: presetData } = useQuery<{ size_presets: SizePreset[] }>({
    queryFn: () => sdk.client.fetch("/admin/size-presets"),
    queryKey: ["size-presets"],
  })
  const { data: colorData } = useQuery<{ colors: Color[] }>({
    queryFn: () => sdk.client.fetch("/admin/colors", { query: { limit: 100 } }),
    queryKey: ["colors"],
  })

  const teams = teamData?.teams || []
  const colors = colorData?.colors || []
  const crois = useMemo(
    () =>
      (croiData?.crois || []).sort((a, b) => a.display_order - b.display_order),
    [croiData]
  )
  const presetById = useMemo(() => {
    const m: Record<string, SizePreset> = {}
    ;(presetData?.size_presets || []).forEach((p) => (m[p.id] = p))
    return m
  }, [presetData])

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
  const toggleColor = (id: string) =>
    setColorIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const totalVariants = useMemo(() => {
    const base = crois.reduce((acc, c) => {
      const st = getState(c)
      return acc + (st.included ? st.sizes.size : 0)
    }, 0)
    const colorMult = colorIds.size || 1
    return base * colorMult
  }, [crois, selection, colorIds])

  const createMutation = useMutation({
    mutationFn: async () => {
      const selections = crois
        .map((c) => {
          const st = getState(c)
          if (!st.included || st.sizes.size === 0) return null
          return { croi: c.label, sizes: Array.from(st.sizes) }
        })
        .filter(Boolean) as { croi: string; sizes: string[] }[]

      const { product } = await sdk.client.fetch<{ product: { id: string } }>(
        "/admin/products/full-create",
        {
          method: "POST",
          body: {
            title: title.trim(),
            status,
            team_id: teamId || null,
            price: parseFloat(price),
            manage_inventory: manageInventory,
            description: description.trim() || null,
            selections,
            color_ids: Array.from(colorIds),
          },
        }
      )
      return product
    },
    onSuccess: (product) => {
      toast.success("Produs creat cu succes!")
      navigate(`/products/${product.id}`)
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const canSubmit =
    title.trim() &&
    price.trim() &&
    !isNaN(parseFloat(price)) &&
    parseFloat(price) > 0 &&
    totalVariants > 0

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Adaugă produs</Heading>
        <Text size="small" className="text-ui-fg-muted mt-1">
          Configurează totul într-un singur loc: detalii, croiuri, mărimi,
          culori și preț.
        </Text>
      </div>

      <div className="px-6 py-6 space-y-8 max-w-3xl">
        {/* Details */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="np-title" className="font-medium">
              Nume produs
            </Label>
            <Input
              id="np-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex. Tricou oficial 2026"
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="np-status" className="font-medium">
                Status
              </Label>
              <select
                id="np-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "draft" | "published")
                }
                className="mt-2 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm"
              >
                <option value="draft">Ciornă</option>
                <option value="published">Publicat</option>
              </select>
            </div>
            <div>
              <Label htmlFor="np-team" className="font-medium">
                Echipă (opțional)
              </Label>
              <select
                id="np-team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="mt-2 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm"
              >
                <option value="">— Fără echipă (Lorikam Shop) —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="np-price" className="font-medium">
                Preț (RON)
              </Label>
              <Input
                id="np-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="ex. 120"
                className="mt-2"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={manageInventory}
                  onCheckedChange={() => setManageInventory((v) => !v)}
                />
                <span className="text-sm">Gestionează stocul</span>
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="np-desc" className="font-medium">
              Descriere (opțional)
            </Label>
            <Textarea
              id="np-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrierea produsului..."
              className="mt-2"
            />
          </div>
        </div>

        {/* Croi + sizes */}
        <div className="space-y-3">
          <Heading level="h2" className="text-base">
            Croiuri și mărimi
          </Heading>
          {crois.length === 0 && (
            <Text className="text-ui-fg-muted">
              Niciun croi configurat. Adaugă din Croiuri.
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
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <Heading level="h2" className="text-base">
            Culori (opțional)
          </Heading>
          {colors.length === 0 ? (
            <Text className="text-ui-fg-muted">Nicio culoare definită.</Text>
          ) : (
            <div className="flex flex-wrap gap-3">
              {colors.map((col) => {
                const selected = colorIds.has(col.id)
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => toggleColor(col.id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? "border-ui-border-interactive bg-ui-bg-base-pressed"
                        : "border-ui-border-base hover:border-ui-border-strong"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-ui-border-base"
                      style={{
                        background:
                          (col.hex_codes || []).length > 1
                            ? `linear-gradient(135deg, ${col.hex_codes.join(
                                ", "
                              )})`
                            : col.hex_codes?.[0] || "#fff",
                      }}
                    />
                    {col.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Button
            variant="primary"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !canSubmit}
          >
            {createMutation.isPending
              ? "Se creează..."
              : `Creează produs${
                  totalVariants ? ` (${totalVariants} variante)` : ""
                }`}
          </Button>
          {totalVariants > 0 && (
            <Text size="small" className="text-ui-fg-muted">
              {totalVariants} variante vor fi generate
            </Text>
          )}
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Adaugă produs",
  icon: PlusMini,
})

export default NewProductPage

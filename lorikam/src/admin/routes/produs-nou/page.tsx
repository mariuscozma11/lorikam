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
  Table,
  IconButton,
} from "@medusajs/ui"
import { TagSolid, Plus, ArrowLeft, Trash, XMark } from "@medusajs/icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import MDEditor from "@uiw/react-md-editor"
import remarkBreaks from "remark-breaks"
import { sdk } from "../../lib/sdk"
import VariantImageAssigner from "../../components/variant-image-assigner"
import ProductDetailsEditor from "../../components/product-details-editor"
import ProductImagesPanel from "../../components/product-images-panel"
import ProductTeamWidget from "../../widgets/product-team"
import VariantBuilderWidget from "../../widgets/variant-builder"
import ProductColorsWidget from "../../widgets/product-colors"
import ProductInventoryWidget from "../../widgets/product-inventory"
import ProductDescriptionWidget from "../../widgets/product-description"
import ProductCustomizationWidget from "../../widgets/product-customization"

type Team = { id: string; name: string }
type SizePreset = { id: string; name: string; sizes: string[] }
type Croi = {
  id: string
  label: string
  size_preset_id: string | null
  display_order: number
}
type Color = { id: string; name: string; hex_codes: string[] }
type CustomField = {
  key: string
  label: string
  type: "text" | "number"
  required: boolean
}
type ProductRow = {
  id: string
  title: string
  status: string
  thumbnail: string | null
  variants?: { id: string }[]
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Ciornă",
  published: "Publicat",
  proposed: "Propus",
  rejected: "Respins",
}

const slugifyKey = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")

const PREDEFINED_FIELDS: { label: string; type: "text" | "number"; required: boolean }[] = [
  { label: "Nume jucător", type: "text", required: true },
  { label: "Număr tricou", type: "number", required: true },
  { label: "Mesaj dedicație", type: "text", required: false },
]

const ProductHubPage = () => {
  const queryClient = useQueryClient()
  const [view, setView] = useState<"list" | "create" | "edit">("list")
  const [editingId, setEditingId] = useState<string | null>(null)

  const openEdit = (id: string) => {
    setEditingId(id)
    setView("edit")
  }

  if (view === "create") {
    return (
      <CreateProduct
        onBack={() => setView("list")}
        onEdit={openEdit}
        queryClient={queryClient}
      />
    )
  }
  if (view === "edit" && editingId) {
    return <EditProduct productId={editingId} onBack={() => setView("list")} />
  }
  return <ProductList onNew={() => setView("create")} onSelect={openEdit} />
}

/* ----------------------------- LIST ----------------------------- */
const ProductList = ({
  onNew,
  onSelect,
}: {
  onNew: () => void
  onSelect: (id: string) => void
}) => {
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery<{ products: ProductRow[]; count: number }>(
    {
      queryFn: () =>
        sdk.admin.product.list({
          q: search || undefined,
          limit: 50,
          fields: "id,title,status,thumbnail,variants.id",
        } as any) as any,
      queryKey: ["hub-products", search],
    }
  )
  const products = data?.products || []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Produse</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Gestionează produsele. Click pe un produs pentru editare completă.
          </Text>
        </div>
        <Button variant="primary" onClick={onNew}>
          <Plus />
          Adaugă produs nou
        </Button>
      </div>

      <div className="px-6 py-3">
        <Input
          placeholder="Caută după nume..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <Text className="text-ui-fg-muted">Se încarcă...</Text>
        ) : products.length === 0 ? (
          <Text className="text-ui-fg-muted">Niciun produs găsit.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Imagine</Table.HeaderCell>
                <Table.HeaderCell>Nume</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Variante</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {products.map((p) => (
                <Table.Row
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => onSelect(p.id)}
                >
                  <Table.Cell>
                    {p.thumbnail ? (
                      <img
                        src={p.thumbnail}
                        alt={p.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-ui-bg-subtle" />
                    )}
                  </Table.Cell>
                  <Table.Cell className="font-medium">{p.title}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="2xsmall"
                      color={p.status === "published" ? "green" : "grey"}
                    >
                      {STATUS_LABEL[p.status] || p.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{p.variants?.length ?? 0}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}

/* ---------------------------- CREATE ---------------------------- */
const CreateProduct = ({
  onBack,
  onEdit,
  queryClient,
}: {
  onBack: () => void
  onEdit: (id: string) => void
  queryClient: ReturnType<typeof useQueryClient>
}) => {
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
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldType, setNewFieldType] = useState<"text" | "number">("text")
  const [newFieldRequired, setNewFieldRequired] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)

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

  const toggleCroi = (c: Croi) =>
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
  const toggleSize = (c: Croi, size: string) =>
    setSelection((prev) => {
      const cur = prev[c.id] || { included: true, sizes: new Set<string>() }
      const next = new Set(cur.sizes)
      next.has(size) ? next.delete(size) : next.add(size)
      return { ...prev, [c.id]: { included: true, sizes: next } }
    })
  const toggleColor = (id: string) =>
    setColorIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const addCustomField = () => {
    const label = newFieldLabel.trim()
    if (!label) return
    const key = slugifyKey(label)
    if (!key || customFields.some((f) => f.key === key)) {
      toast.error("Etichetă invalidă sau deja existentă.")
      return
    }
    setCustomFields([
      ...customFields,
      { key, label, type: newFieldType, required: newFieldRequired },
    ])
    setNewFieldLabel("")
    setNewFieldRequired(false)
  }
  const removeCustomField = (key: string) =>
    setCustomFields(customFields.filter((f) => f.key !== key))

  const addPredefined = (pf: (typeof PREDEFINED_FIELDS)[number]) => {
    const key = slugifyKey(pf.label)
    if (customFields.some((f) => f.key === key)) return
    setCustomFields((prev) => [
      ...prev,
      { key, label: pf.label, type: pf.type, required: pf.required },
    ])
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach((f) => fd.append("files", f))
      const response = await fetch("/admin/uploads", {
        method: "POST",
        body: fd,
        credentials: "include",
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || "Încărcare eșuată")
      }
      const data = (await response.json()) as { files: { url: string }[] }
      setImageUrls((prev) => [...prev, ...data.files.map((f) => f.url)])
    } catch (e) {
      toast.error("Eroare la încărcare: " + (e as Error).message)
    } finally {
      setUploading(false)
    }
  }
  const removeImage = (url: string) =>
    setImageUrls((prev) => prev.filter((u) => u !== url))

  const totalVariants = useMemo(() => {
    const base = crois.reduce((acc, c) => {
      const st = getState(c)
      return acc + (st.included ? st.sizes.size : 0)
    }, 0)
    return base * (colorIds.size || 1)
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
            customization_fields: customFields,
            image_urls: imageUrls,
          },
        }
      )
      return product
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["hub-products"] })
      toast.success("Produs creat! Asociază imaginile pe culori mai jos.")
      setCreatedProductId(product.id)
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const canSubmit =
    title.trim() &&
    price.trim() &&
    !isNaN(parseFloat(price)) &&
    parseFloat(price) > 0 &&
    totalVariants > 0

  // Step 2 — after the product is created, associate images to colors inline
  if (createdProductId) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h1">Asociază imaginile pe culori</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Selectează o imagine, apoi bifează culorile/variantele cărora le
            aparține. Poți sări peste acest pas.
          </Text>
        </div>

        <VariantImageAssigner productId={createdProductId} bare />

        <div className="flex items-center gap-3 px-6 py-4">
          <Button variant="primary" onClick={() => onEdit(createdProductId)}>
            Editează produsul
          </Button>
          <Button variant="secondary" onClick={onBack}>
            Înapoi la produse
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center gap-3 px-6 py-4">
        <IconButton variant="transparent" onClick={onBack}>
          <ArrowLeft />
        </IconButton>
        <div>
          <Heading level="h1">Adaugă produs</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Configurează produsul. Imaginile le asociezi pe culori după creare.
          </Text>
        </div>
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
        </div>

        {/* Images */}
        <div className="space-y-3">
          <Heading level="h2" className="text-base">
            Imagini
          </Heading>
          <div className="flex flex-wrap gap-3">
            {imageUrls.map((url) => (
              <div key={url} className="relative w-24 h-24">
                <img
                  src={url}
                  alt=""
                  className="w-24 h-24 object-cover rounded border border-ui-border-base"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -top-2 -right-2 bg-ui-bg-base border border-ui-border-base rounded-full p-0.5"
                >
                  <XMark className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className="w-24 h-24 flex flex-col items-center justify-center gap-1 rounded border border-dashed border-ui-border-strong cursor-pointer hover:bg-ui-bg-subtle text-ui-fg-muted text-xs">
              <Plus />
              {uploading ? "..." : "Adaugă"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2" data-color-mode="light">
          <Heading level="h2" className="text-base">
            Descriere produs
          </Heading>
          <MDEditor
            value={description}
            onChange={(v) => setDescription(v || "")}
            height={240}
            previewOptions={{ remarkPlugins: [remarkBreaks] }}
          />
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
          {colorIds.size > 0 && (
            <Text size="small" className="text-ui-fg-muted">
              După creare vei putea asocia imaginile pe fiecare culoare (pasul
              următor).
            </Text>
          )}
        </div>

        {/* Personalizare */}
        <div className="space-y-3">
          <Heading level="h2" className="text-base">
            Personalizare produs (opțional)
          </Heading>
          <Text size="small" className="text-ui-fg-muted">
            Câmpuri pe care clientul le completează la comandă (ex. nume pe
            tricou, număr).
          </Text>

          {/* Quick-add predefined */}
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_FIELDS.filter(
              (pf) => !customFields.some((f) => f.key === slugifyKey(pf.label))
            ).map((pf) => (
              <button
                key={pf.label}
                type="button"
                onClick={() => addPredefined(pf)}
                className="flex items-center gap-1 rounded-full border border-dashed border-ui-border-strong px-3 py-1 text-sm text-ui-fg-subtle hover:bg-ui-bg-subtle"
              >
                <Plus className="w-3 h-3" />
                {pf.label}
              </button>
            ))}
          </div>

          {customFields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customFields.map((f) => (
                <Badge key={f.key} className="flex items-center gap-1">
                  {f.label} ({f.type === "text" ? "text" : "număr"}
                  {f.required ? ", obligatoriu" : ""})
                  <button
                    type="button"
                    onClick={() => removeCustomField(f.key)}
                    className="ml-1"
                  >
                    <XMark className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex flex-col xsmall:flex-row gap-2 xsmall:items-end">
            <div className="flex-1">
              <Label className="text-sm">Etichetă câmp</Label>
              <Input
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="ex. Nume pe tricou"
                className="mt-1"
              />
            </div>
            <select
              value={newFieldType}
              onChange={(e) =>
                setNewFieldType(e.target.value as "text" | "number")
              }
              className="rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm"
            >
              <option value="text">Text</option>
              <option value="number">Număr</option>
            </select>
            <label className="flex items-center gap-1.5 cursor-pointer px-1">
              <Checkbox
                checked={newFieldRequired}
                onCheckedChange={() => setNewFieldRequired((v) => !v)}
              />
              <span className="text-sm">Obligatoriu</span>
            </label>
            <Button variant="secondary" onClick={addCustomField}>
              <Plus />
              Adaugă
            </Button>
          </div>
        </div>

        {/* Submit */}
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
          <Button variant="secondary" onClick={onBack}>
            Anulează
          </Button>
        </div>
      </div>
    </Container>
  )
}

/* ----------------------------- EDIT ----------------------------- */
const EditProduct = ({
  productId,
  onBack,
}: {
  productId: string
  onBack: () => void
}) => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<{ product: any }>({
    queryFn: () =>
      sdk.admin.product.retrieve(productId, {
        fields: "id,title,status,description,metadata",
      } as any) as any,
    queryKey: ["product", productId],
  })
  const product = data?.product

  const deleteMutation = useMutation({
    mutationFn: () => sdk.admin.product.delete(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hub-products"] })
      toast.success("Produsul a fost șters!")
      onBack()
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  return (
    <div>
      <Container className="p-0 mb-4">
        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <IconButton variant="transparent" onClick={onBack}>
              <ArrowLeft />
            </IconButton>
            <div>
              <Heading level="h1">
                {product?.title || "Editează produs"}
              </Heading>
              <Text size="small" className="text-ui-fg-muted mt-1">
                Editează toate detaliile produsului într-un singur loc.
              </Text>
            </div>
          </div>
          <Button
            variant="danger"
            onClick={() => {
              if (
                confirm(
                  "Sigur vrei să ștergi acest produs? Acțiunea este ireversibilă."
                )
              )
                deleteMutation.mutate()
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash />
            {deleteMutation.isPending ? "Se șterge..." : "Șterge produs"}
          </Button>
        </div>
      </Container>

      {isLoading || !product ? (
        <Container className="p-0">
          <div className="px-6 py-8">
            <Text className="text-ui-fg-muted">Se încarcă...</Text>
          </div>
        </Container>
      ) : (
        <div className="flex flex-col gap-4">
          <ProductDetailsEditor
            productId={productId}
            initialTitle={product.title || ""}
            initialStatus={product.status || "draft"}
          />
          <ProductTeamWidget data={product} />
          <VariantBuilderWidget data={product} />
          <ProductColorsWidget data={product} />
          <ProductImagesPanel productId={productId} />
          <ProductInventoryWidget data={product} />
          <ProductDescriptionWidget data={product} />
          <ProductCustomizationWidget data={product} />
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Produse",
  icon: TagSolid,
})

export default ProductHubPage

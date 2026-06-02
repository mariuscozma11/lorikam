import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Button,
  toast,
  Input,
  Label,
  Table,
  Drawer,
  Badge,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"
import { Users, Plus } from "@medusajs/icons"

type SizePreset = { id: string; name: string; sizes: string[] }
type Croi = {
  id: string
  label: string
  size_preset_id: string | null
  display_order: number
}

const CroisPage = () => {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Croi | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [sizePresetId, setSizePresetId] = useState<string>("")
  const [displayOrder, setDisplayOrder] = useState(0)

  const { data, isLoading } = useQuery<{ crois: Croi[] }>({
    queryFn: () => sdk.client.fetch("/admin/crois"),
    queryKey: ["crois"],
  })
  const { data: presetData } = useQuery<{ size_presets: SizePreset[] }>({
    queryFn: () => sdk.client.fetch("/admin/size-presets"),
    queryKey: ["size-presets"],
  })

  const crois = data?.crois || []
  const presets = presetData?.size_presets || []
  const presetName = (id: string | null) =>
    presets.find((p) => p.id === id)?.name || "—"

  const resetForm = () => {
    setLabel("")
    setSizePresetId("")
    setDisplayOrder(0)
  }

  const createMutation = useMutation({
    mutationFn: (body: { label: string; size_preset_id: string | null; display_order: number }) =>
      sdk.client.fetch("/admin/crois", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crois"] })
      setIsDrawerOpen(false)
      resetForm()
      toast.success("Croiul a fost creat!")
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; label: string; size_preset_id: string | null; display_order: number }) =>
      sdk.client.fetch(`/admin/crois/${id}`, { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crois"] })
      setIsDrawerOpen(false)
      setSelected(null)
      resetForm()
      toast.success("Croiul a fost actualizat!")
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/crois/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crois"] })
      toast.success("Croiul a fost șters!")
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const handleCreate = () => {
    resetForm()
    const maxOrder = crois.length ? Math.max(...crois.map((c) => c.display_order)) : -1
    setDisplayOrder(maxOrder + 1)
    setIsCreating(true)
    setSelected(null)
    setIsDrawerOpen(true)
  }

  const handleEdit = (c: Croi) => {
    setSelected(c)
    setIsCreating(false)
    setLabel(c.label)
    setSizePresetId(c.size_preset_id || "")
    setDisplayOrder(c.display_order)
    setIsDrawerOpen(true)
  }

  const handleSave = () => {
    const body = {
      label,
      size_preset_id: sizePresetId || null,
      display_order: displayOrder,
    }
    if (isCreating) createMutation.mutate(body)
    else if (selected) updateMutation.mutate({ id: selected.id, ...body })
  }

  const handleDelete = (id: string) => {
    if (confirm("Sigur vrei să ștergi acest croi?")) deleteMutation.mutate(id)
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">Se încarcă...</Text>
        </div>
      </Container>
    )
  }

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Croiuri</Heading>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Tipuri de croi (Copil, Femei, Bărbați) și presetul lor de mărimi
            </Text>
          </div>
          <Button variant="primary" onClick={handleCreate}>
            <Plus />
            Adaugă croi
          </Button>
        </div>

        <div className="px-6 py-4">
          {crois.length === 0 ? (
            <Text className="text-ui-fg-muted">Niciun croi definit.</Text>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Croi</Table.HeaderCell>
                  <Table.HeaderCell>Preset mărimi</Table.HeaderCell>
                  <Table.HeaderCell>Ordine</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Acțiuni</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {crois
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((c) => (
                    <Table.Row key={c.id}>
                      <Table.Cell className="font-medium">{c.label}</Table.Cell>
                      <Table.Cell>
                        <Badge size="2xsmall">{presetName(c.size_preset_id)}</Badge>
                      </Table.Cell>
                      <Table.Cell>{c.display_order}</Table.Cell>
                      <Table.Cell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="secondary" size="small" onClick={() => handleEdit(c)}>
                            Editează
                          </Button>
                          <Button variant="danger" size="small" onClick={() => handleDelete(c.id)}>
                            Șterge
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
              </Table.Body>
            </Table>
          )}
        </div>
      </Container>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              {isCreating ? "Adaugă croi nou" : `Editează: ${selected?.label}`}
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="p-4 space-y-6">
            <div>
              <Label htmlFor="croi-label" className="font-medium">
                Denumire croi
              </Label>
              <Input
                id="croi-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="ex. Bărbați"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="croi-preset" className="font-medium">
                Preset mărimi
              </Label>
              <select
                id="croi-preset"
                value={sizePresetId}
                onChange={(e) => setSizePresetId(e.target.value)}
                className="mt-2 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm"
              >
                <option value="">— Fără preset —</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="croi-order" className="font-medium">
                Ordine afișare
              </Label>
              <Input
                id="croi-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDrawerOpen(false)
                setSelected(null)
                resetForm()
              }}
            >
              Anulează
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !label.trim()
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Se salvează..."
                : "Salvează"}
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  )
}

export const config = defineRouteConfig({
  label: "Croiuri",
  icon: Users,
})

export default CroisPage

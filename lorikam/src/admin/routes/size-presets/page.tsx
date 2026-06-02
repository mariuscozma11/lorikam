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
import { Tag, Plus, Trash } from "@medusajs/icons"

type SizePreset = {
  id: string
  name: string
  sizes: string[]
  display_order: number
}

type SizePresetsResponse = {
  size_presets: SizePreset[]
}

const SizePresetsPage = () => {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<SizePreset | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [name, setName] = useState("")
  const [sizes, setSizes] = useState<string[]>([""])
  const [displayOrder, setDisplayOrder] = useState(0)

  const { data, isLoading } = useQuery<SizePresetsResponse>({
    queryFn: () => sdk.client.fetch("/admin/size-presets"),
    queryKey: ["size-presets"],
  })

  const presets = data?.size_presets || []

  const resetForm = () => {
    setName("")
    setSizes([""])
    setDisplayOrder(0)
  }

  const createMutation = useMutation({
    mutationFn: (body: { name: string; sizes: string[]; display_order: number }) =>
      sdk.client.fetch("/admin/size-presets", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["size-presets"] })
      setIsDrawerOpen(false)
      resetForm()
      toast.success("Presetul a fost creat!")
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; name: string; sizes: string[]; display_order: number }) =>
      sdk.client.fetch(`/admin/size-presets/${id}`, { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["size-presets"] })
      setIsDrawerOpen(false)
      setSelected(null)
      resetForm()
      toast.success("Presetul a fost actualizat!")
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/size-presets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["size-presets"] })
      toast.success("Presetul a fost șters!")
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const handleCreate = () => {
    resetForm()
    const maxOrder = presets.length ? Math.max(...presets.map((p) => p.display_order)) : -1
    setDisplayOrder(maxOrder + 1)
    setIsCreating(true)
    setSelected(null)
    setIsDrawerOpen(true)
  }

  const handleEdit = (p: SizePreset) => {
    setSelected(p)
    setIsCreating(false)
    setName(p.name)
    setSizes(p.sizes.length ? [...p.sizes] : [""])
    setDisplayOrder(p.display_order)
    setIsDrawerOpen(true)
  }

  const handleSave = () => {
    const body = {
      name,
      sizes: sizes.map((s) => s.trim()).filter(Boolean),
      display_order: displayOrder,
    }
    if (isCreating) createMutation.mutate(body)
    else if (selected) updateMutation.mutate({ id: selected.id, ...body })
  }

  const handleDelete = (id: string) => {
    if (confirm("Sigur vrei să ștergi acest preset?")) deleteMutation.mutate(id)
  }

  const updateSize = (i: number, v: string) => {
    const next = [...sizes]
    next[i] = v
    setSizes(next)
  }
  const addSize = () => setSizes([...sizes, ""])
  const removeSize = (i: number) =>
    sizes.length > 1 && setSizes(sizes.filter((_, idx) => idx !== i))

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
            <Heading level="h1">Presetări mărimi</Heading>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Seturi reutilizabile de mărimi (ex. Adulți, Copii)
            </Text>
          </div>
          <Button variant="primary" onClick={handleCreate}>
            <Plus />
            Adaugă preset
          </Button>
        </div>

        <div className="px-6 py-4">
          {presets.length === 0 ? (
            <Text className="text-ui-fg-muted">
              Niciun preset definit. Adaugă primul!
            </Text>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Nume</Table.HeaderCell>
                  <Table.HeaderCell>Mărimi</Table.HeaderCell>
                  <Table.HeaderCell>Ordine</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Acțiuni</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {presets
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((p) => (
                    <Table.Row key={p.id}>
                      <Table.Cell className="font-medium">{p.name}</Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-1 flex-wrap">
                          {p.sizes.map((s, i) => (
                            <Badge key={i} size="2xsmall">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </Table.Cell>
                      <Table.Cell>{p.display_order}</Table.Cell>
                      <Table.Cell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="secondary" size="small" onClick={() => handleEdit(p)}>
                            Editează
                          </Button>
                          <Button variant="danger" size="small" onClick={() => handleDelete(p.id)}>
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
              {isCreating ? "Adaugă preset nou" : `Editează: ${selected?.name}`}
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="p-4 space-y-6">
            <div>
              <Label htmlFor="preset-name" className="font-medium">
                Nume preset
              </Label>
              <Input
                id="preset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex. Adulți"
                className="mt-2"
              />
            </div>

            <div>
              <Label className="font-medium">Mărimi</Label>
              <div className="space-y-2 mt-2">
                {sizes.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={s}
                      onChange={(e) => updateSize(i, e.target.value)}
                      placeholder="ex. M sau 12 ani"
                    />
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => removeSize(i)}
                      disabled={sizes.length === 1}
                    >
                      <Trash />
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" size="small" onClick={addSize}>
                  <Plus />
                  Adaugă mărime
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="preset-order" className="font-medium">
                Ordine afișare
              </Label>
              <Input
                id="preset-order"
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
                !name.trim() ||
                sizes.filter((s) => s.trim()).length === 0
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
  label: "Presetări mărimi",
  icon: Tag,
})

export default SizePresetsPage

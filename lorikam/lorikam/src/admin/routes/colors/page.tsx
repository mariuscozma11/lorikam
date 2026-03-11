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
  IconButton,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"
import { Swatch, Plus, Trash, XMark } from "@medusajs/icons"

type Color = {
  id: string
  name: string
  hex_codes: string[]
  display_order: number
}

type ColorsResponse = {
  colors: Color[]
  count: number
}

const ColorsPage = () => {
  const queryClient = useQueryClient()
  const [selectedColor, setSelectedColor] = useState<Color | null>(null)
  const [name, setName] = useState("")
  const [hexCodes, setHexCodes] = useState<string[]>(["#000000"])
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const { data, isLoading } = useQuery<ColorsResponse>({
    queryFn: () =>
      sdk.client.fetch("/admin/colors", {
        query: { limit: 100 },
      }),
    queryKey: ["colors"],
  })

  const createMutation = useMutation({
    mutationFn: async (colorData: {
      name: string
      hex_codes: string[]
      display_order: number
    }) => {
      return sdk.client.fetch<{ color: Color }>("/admin/colors", {
        method: "POST",
        body: colorData,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] })
      setIsDrawerOpen(false)
      resetForm()
      toast.success("Culoarea a fost creata!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...colorData
    }: {
      id: string
      name: string
      hex_codes: string[]
      display_order: number
    }) => {
      return sdk.client.fetch<{ color: Color }>(`/admin/colors/${id}`, {
        method: "POST",
        body: colorData,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] })
      setIsDrawerOpen(false)
      setSelectedColor(null)
      resetForm()
      toast.success("Culoarea a fost actualizata!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return sdk.client.fetch(`/admin/colors/${id}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] })
      toast.success("Culoarea a fost stearsa!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const resetForm = () => {
    setName("")
    setHexCodes(["#000000"])
    setDisplayOrder(0)
  }

  const handleCreate = () => {
    resetForm()
    // Auto-set display_order to max + 1
    const maxOrder = colors.length > 0
      ? Math.max(...colors.map((c) => c.display_order))
      : -1
    setDisplayOrder(maxOrder + 1)
    setIsCreating(true)
    setSelectedColor(null)
    setIsDrawerOpen(true)
  }

  const handleEdit = (color: Color) => {
    setSelectedColor(color)
    setIsCreating(false)
    setName(color.name)
    setHexCodes([...color.hex_codes])
    setDisplayOrder(color.display_order)
    setIsDrawerOpen(true)
  }

  const handleSave = () => {
    const colorData = {
      name,
      hex_codes: hexCodes.filter((h) => h.trim() !== ""),
      display_order: displayOrder,
    }

    if (isCreating) {
      createMutation.mutate(colorData)
    } else if (selectedColor) {
      updateMutation.mutate({ id: selectedColor.id, ...colorData })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Esti sigur ca vrei sa stergi aceasta culoare?")) {
      deleteMutation.mutate(id)
    }
  }

  const addHexCode = () => {
    setHexCodes([...hexCodes, "#000000"])
  }

  const removeHexCode = (index: number) => {
    if (hexCodes.length > 1) {
      setHexCodes(hexCodes.filter((_, i) => i !== index))
    }
  }

  const updateHexCode = (index: number, value: string) => {
    const newHexCodes = [...hexCodes]
    newHexCodes[index] = value
    setHexCodes(newHexCodes)
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

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">Se incarca...</Text>
        </div>
      </Container>
    )
  }

  const colors = data?.colors || []

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Culori</Heading>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Gestioneaza culorile predefinite pentru produse
            </Text>
          </div>
          <Button variant="primary" onClick={handleCreate}>
            <Plus />
            Adauga Culoare
          </Button>
        </div>

        <div className="px-6 py-4">
          {colors.length === 0 ? (
            <Text className="text-ui-fg-muted">
              Nu exista culori definite. Adauga prima culoare!
            </Text>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Culoare</Table.HeaderCell>
                  <Table.HeaderCell>Nume</Table.HeaderCell>
                  <Table.HeaderCell>Coduri HEX</Table.HeaderCell>
                  <Table.HeaderCell>Ordine</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Actiuni</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {colors
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((color) => (
                    <Table.Row key={color.id}>
                      <Table.Cell>{renderColorPreview(color.hex_codes)}</Table.Cell>
                      <Table.Cell className="font-medium">{color.name}</Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-1 flex-wrap">
                          {color.hex_codes.map((hex, i) => (
                            <code
                              key={i}
                              className="text-xs bg-ui-bg-subtle px-1.5 py-0.5 rounded"
                            >
                              {hex}
                            </code>
                          ))}
                        </div>
                      </Table.Cell>
                      <Table.Cell>{color.display_order}</Table.Cell>
                      <Table.Cell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleEdit(color)}
                          >
                            Editeaza
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleDelete(color.id)}
                          >
                            Sterge
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
              {isCreating ? "Adauga Culoare Noua" : `Editeaza: ${selectedColor?.name}`}
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="p-4 space-y-6">
            <div>
              <Label htmlFor="color-name" className="font-medium">
                Nume Culoare
              </Label>
              <Text size="small" className="text-ui-fg-muted mt-1 mb-2">
                Ex: Rosu, Negru, Rosu/Albastru (pentru culori compuse)
              </Text>
              <Input
                id="color-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Negru"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-medium">Coduri HEX</Label>
                <Button variant="secondary" size="small" onClick={addHexCode}>
                  <Plus />
                  Adauga Cod
                </Button>
              </div>
              <Text size="small" className="text-ui-fg-muted mb-3">
                Adauga mai multe coduri pentru culori compuse (ex: rosu/albastru)
              </Text>

              <div className="space-y-3">
                {hexCodes.map((hex, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={hex}
                      onChange={(e) => updateHexCode(index, e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer border border-ui-border-base"
                    />
                    <Input
                      value={hex}
                      onChange={(e) => updateHexCode(index, e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                    {hexCodes.length > 1 && (
                      <IconButton
                        variant="transparent"
                        onClick={() => removeHexCode(index)}
                      >
                        <XMark />
                      </IconButton>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="display-order" className="font-medium">
                Ordine Afisare
              </Label>
              <Text size="small" className="text-ui-fg-muted mt-1 mb-2">
                Culorile vor fi afisate in ordinea crescatoare a acestui numar
              </Text>
              <Input
                id="display-order"
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="pt-4 border-t">
              <Label className="font-medium mb-3 block">Previzualizare</Label>
              <div className="flex items-center gap-3">
                {renderColorPreview(hexCodes)}
                <Text>{name || "Fara nume"}</Text>
              </div>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDrawerOpen(false)
                setSelectedColor(null)
                resetForm()
              }}
            >
              Anuleaza
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !name.trim() ||
                hexCodes.filter((h) => h.trim()).length === 0
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Se salveaza..."
                : "Salveaza"}
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  )
}

export const config = defineRouteConfig({
  label: "Culori",
  icon: Swatch,
})

export default ColorsPage

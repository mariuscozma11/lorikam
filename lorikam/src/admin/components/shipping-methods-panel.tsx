import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  Table,
  IconButton,
  toast,
} from "@medusajs/ui"
import { Plus, Trash } from "@medusajs/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "../lib/sdk"

type ShippingMethod = {
  id: string
  name: string
  description: string
  price_ron: number
  price_eur: number
  is_enabled: boolean
}

type Draft = {
  name: string
  description: string
  price_ron: string
  price_eur: string
}

const EMPTY_DRAFT: Draft = {
  name: "",
  description: "",
  price_ron: "0",
  price_eur: "0",
}

const ShippingMethodsPanel = () => {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  // Local copy so prices stay editable while typing without refetch churn.
  const [edits, setEdits] = useState<Record<string, Partial<ShippingMethod>>>({})

  const { data, isLoading } = useQuery({
    queryKey: ["shipping-methods"],
    queryFn: async () =>
      sdk.client.fetch<{ shipping_methods: ShippingMethod[] }>(
        "/admin/shipping-methods",
        { method: "GET" }
      ),
  })

  const methods = data?.shipping_methods ?? []

  useEffect(() => {
    setEdits({})
  }, [data])

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["shipping-methods"] })

  const createMutation = useMutation({
    mutationFn: async () =>
      sdk.client.fetch("/admin/shipping-methods", {
        method: "POST",
        body: {
          name: draft.name.trim(),
          description: draft.description.trim(),
          price_ron: parseFloat(draft.price_ron) || 0,
          price_eur: parseFloat(draft.price_eur) || 0,
          is_enabled: true,
        },
      }),
    onSuccess: () => {
      invalidate()
      setDraft(EMPTY_DRAFT)
      setIsAdding(false)
      toast.success("Metoda de livrare a fost adaugata.")
    },
    onError: (error) => toast.error("Eroare: " + (error as Error).message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string
      body: Record<string, unknown>
    }) =>
      sdk.client.fetch(`/admin/shipping-methods/${id}`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      invalidate()
      toast.success("Metoda de livrare a fost salvata.")
    },
    onError: (error) => toast.error("Eroare: " + (error as Error).message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      sdk.client.fetch(`/admin/shipping-methods/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate()
      toast.success("Metoda de livrare a fost stearsa.")
    },
    onError: (error) => toast.error("Eroare: " + (error as Error).message),
  })

  const valueFor = (method: ShippingMethod, field: keyof ShippingMethod) =>
    edits[method.id]?.[field] ?? method[field]

  const setEdit = (
    id: string,
    field: keyof ShippingMethod,
    value: string | number | boolean
  ) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))

  const isDirty = (id: string) => Object.keys(edits[id] ?? {}).length > 0

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Metode de livrare</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Optiunile pe care le vede clientul la finalizarea comenzii
          </Text>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={() => setIsAdding((prev) => !prev)}
        >
          <Plus /> Adauga
        </Button>
      </div>

      {isAdding && (
        <div className="px-6 py-4 bg-ui-bg-subtle space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-name">Nume</Label>
              <Input
                id="new-name"
                value={draft.name}
                placeholder="ex. Fan Courier"
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="new-description">Descriere</Label>
              <Input
                id="new-description"
                value={draft.description}
                placeholder="ex. Livrare in 1-3 zile lucratoare"
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="new-price-ron">Pret (RON)</Label>
              <Input
                id="new-price-ron"
                type="number"
                min={0}
                value={draft.price_ron}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, price_ron: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="new-price-eur">Pret (EUR)</Label>
              <Input
                id="new-price-eur"
                type="number"
                min={0}
                value={draft.price_eur}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, price_eur: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                setDraft(EMPTY_DRAFT)
                setIsAdding(false)
              }}
            >
              Anuleaza
            </Button>
            <Button
              variant="primary"
              size="small"
              disabled={!draft.name.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Se salveaza..." : "Adauga"}
            </Button>
          </div>
        </div>
      )}

      <div className="px-6 py-4">
        {isLoading ? (
          <Text className="text-ui-fg-muted">Se incarca...</Text>
        ) : methods.length === 0 ? (
          <Text className="text-ui-fg-muted">
            Nicio metoda de livrare. Adauga una ca sa poti finaliza comenzi.
          </Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Nume</Table.HeaderCell>
                <Table.HeaderCell>Descriere</Table.HeaderCell>
                <Table.HeaderCell>RON</Table.HeaderCell>
                <Table.HeaderCell>EUR</Table.HeaderCell>
                <Table.HeaderCell>Activa</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {methods.map((method) => (
                <Table.Row key={method.id}>
                  <Table.Cell>
                    <Input
                      value={valueFor(method, "name") as string}
                      onChange={(e) =>
                        setEdit(method.id, "name", e.target.value)
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Input
                      value={valueFor(method, "description") as string}
                      onChange={(e) =>
                        setEdit(method.id, "description", e.target.value)
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={valueFor(method, "price_ron") as number}
                      onChange={(e) =>
                        setEdit(
                          method.id,
                          "price_ron",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={valueFor(method, "price_eur") as number}
                      onChange={(e) =>
                        setEdit(
                          method.id,
                          "price_eur",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Switch
                      checked={valueFor(method, "is_enabled") as boolean}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({
                          id: method.id,
                          body: { is_enabled: checked },
                        })
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-2">
                      {isDirty(method.id) && (
                        <Button
                          variant="primary"
                          size="small"
                          disabled={updateMutation.isPending}
                          onClick={() =>
                            updateMutation.mutate({
                              id: method.id,
                              body: {
                                name: valueFor(method, "name"),
                                description: valueFor(method, "description"),
                                price_ron: valueFor(method, "price_ron"),
                                price_eur: valueFor(method, "price_eur"),
                              },
                            })
                          }
                        >
                          Salveaza
                        </Button>
                      )}
                      <IconButton
                        variant="transparent"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (
                            confirm(
                              `Stergi metoda de livrare "${method.name}"?`
                            )
                          ) {
                            deleteMutation.mutate(method.id)
                          }
                        }}
                      >
                        <Trash className="text-ui-fg-error" />
                      </IconButton>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}

export default ShippingMethodsPanel

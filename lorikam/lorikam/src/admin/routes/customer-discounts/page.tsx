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
  Badge,
  Switch,
  Drawer,
  Textarea,
  Select,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { sdk } from "../../lib/sdk"
import { Users } from "@medusajs/icons"

type Customer = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
}

type CustomerDiscount = {
  id: string
  customer_id: string
  discount_percentage: number
  is_active: boolean
  is_collaborator: boolean
  notes: string | null
}

type CustomersResponse = {
  customers: Customer[]
  count: number
  offset: number
  limit: number
}

type SortField = "name" | "email" | "date" | "discount"
type SortOrder = "asc" | "desc"

const CustomerDiscountsPage = () => {
  const queryClient = useQueryClient()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [discountPercentage, setDiscountPercentage] = useState<number>(0)
  const [isActive, setIsActive] = useState<boolean>(true)
  const [isCollaborator, setIsCollaborator] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>("")
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Search and sort state for collaborators
  const [collabSearch, setCollabSearch] = useState("")
  const [collabSortField, setCollabSortField] = useState<SortField>("name")
  const [collabSortOrder, setCollabSortOrder] = useState<SortOrder>("asc")

  // Search and sort state for other customers
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerSortField, setCustomerSortField] = useState<SortField>("name")
  const [customerSortOrder, setCustomerSortOrder] = useState<SortOrder>("asc")

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryFn: async () => {
      const response = await sdk.client.fetch<CustomersResponse>(
        "/admin/customers?limit=100",
        {
          method: "GET",
        }
      )
      return response
    },
    queryKey: ["customers"],
  })

  // Fetch customer discounts
  const { data: discountsData, isLoading: discountsLoading } = useQuery({
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        customer_discounts: CustomerDiscount[]
      }>("/admin/customer-discounts", {
        method: "GET",
      })
      return response
    },
    queryKey: ["customer-discounts"],
  })

  // Save discount mutation
  const saveMutation = useMutation({
    mutationFn: async (data: {
      customer_id: string
      discount_percentage: number
      is_active: boolean
      is_collaborator: boolean
      notes: string | null
    }) => {
      return sdk.client.fetch<{ customer_discount: CustomerDiscount }>(
        "/admin/customer-discounts",
        {
          method: "POST",
          body: data,
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-discounts"] })
      setIsDrawerOpen(false)
      setSelectedCustomer(null)
      resetForm()
      toast.success("Salvat cu succes!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  // Delete discount mutation
  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      return sdk.client.fetch(`/admin/customer-discounts/${customerId}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-discounts"] })
      toast.success("Sters cu succes!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const resetForm = () => {
    setDiscountPercentage(0)
    setIsActive(true)
    setIsCollaborator(false)
    setNotes("")
  }

  const getCustomerDiscount = (customerId: string): CustomerDiscount | undefined => {
    return discountsData?.customer_discounts?.find(
      (d) => d.customer_id === customerId
    )
  }

  const getCustomerName = (customer: Customer): string => {
    return customer.first_name || customer.last_name
      ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
      : "Fara nume"
  }

  const handleEditDiscount = (customer: Customer) => {
    setSelectedCustomer(customer)
    const existingDiscount = getCustomerDiscount(customer.id)
    if (existingDiscount) {
      setDiscountPercentage(existingDiscount.discount_percentage)
      setIsActive(existingDiscount.is_active)
      setIsCollaborator(existingDiscount.is_collaborator ?? false)
      setNotes(existingDiscount.notes || "")
    } else {
      resetForm()
    }
    setIsDrawerOpen(true)
  }

  const handleSaveDiscount = () => {
    if (!selectedCustomer) return
    saveMutation.mutate({
      customer_id: selectedCustomer.id,
      discount_percentage: discountPercentage,
      is_active: isActive,
      is_collaborator: isCollaborator,
      notes: notes || null,
    })
  }

  const handleDeleteDiscount = (customerId: string) => {
    if (confirm("Esti sigur ca vrei sa stergi?")) {
      deleteMutation.mutate(customerId)
    }
  }

  // Filter and sort logic
  const filterAndSort = (
    customers: Customer[],
    search: string,
    sortField: SortField,
    sortOrder: SortOrder,
    isCollaboratorFilter: boolean
  ) => {
    let filtered = customers.filter((customer) => {
      const discount = getCustomerDiscount(customer.id)
      const isCollab = discount?.is_collaborator ?? false
      if (isCollaboratorFilter !== isCollab) return false

      if (!search) return true
      const name = getCustomerName(customer).toLowerCase()
      const email = customer.email.toLowerCase()
      const searchLower = search.toLowerCase()
      return name.includes(searchLower) || email.includes(searchLower)
    })

    filtered.sort((a, b) => {
      let aVal: string | number | Date
      let bVal: string | number | Date

      switch (sortField) {
        case "name":
          aVal = getCustomerName(a).toLowerCase()
          bVal = getCustomerName(b).toLowerCase()
          break
        case "email":
          aVal = a.email.toLowerCase()
          bVal = b.email.toLowerCase()
          break
        case "date":
          aVal = new Date(a.created_at)
          bVal = new Date(b.created_at)
          break
        case "discount":
          aVal = getCustomerDiscount(a.id)?.discount_percentage ?? 0
          bVal = getCustomerDiscount(b.id)?.discount_percentage ?? 0
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }

  const customers = customersData?.customers || []

  const collaborators = useMemo(
    () => filterAndSort(customers, collabSearch, collabSortField, collabSortOrder, true),
    [customers, discountsData, collabSearch, collabSortField, collabSortOrder]
  )

  const otherCustomers = useMemo(
    () => filterAndSort(customers, customerSearch, customerSortField, customerSortOrder, false),
    [customers, discountsData, customerSearch, customerSortField, customerSortOrder]
  )

  const isLoading = customersLoading || discountsLoading

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">Se incarca...</Text>
        </div>
      </Container>
    )
  }

  const renderTable = (
    data: Customer[],
    search: string,
    setSearch: (v: string) => void,
    sortField: SortField,
    setSortField: (v: SortField) => void,
    sortOrder: SortOrder,
    setSortOrder: (v: SortOrder) => void,
    emptyMessage: string
  ) => (
    <>
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Cauta dupa nume sau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <Select.Trigger className="w-[140px]">
              <Select.Value placeholder="Sorteaza dupa" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="name">Nume</Select.Item>
              <Select.Item value="email">Email</Select.Item>
              <Select.Item value="date">Data</Select.Item>
              <Select.Item value="discount">Reducere</Select.Item>
            </Select.Content>
          </Select>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      {data.length === 0 ? (
        <Text className="text-ui-fg-muted">{emptyMessage}</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Client</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Data inregistrarii</Table.HeaderCell>
              <Table.HeaderCell>Reducere</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actiuni</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((customer) => {
              const discount = getCustomerDiscount(customer.id)
              return (
                <Table.Row key={customer.id}>
                  <Table.Cell className="font-medium">
                    {getCustomerName(customer)}
                  </Table.Cell>
                  <Table.Cell>{customer.email}</Table.Cell>
                  <Table.Cell>
                    {new Date(customer.created_at).toLocaleDateString("ro-RO")}
                  </Table.Cell>
                  <Table.Cell>
                    {discount ? (
                      <Badge color="green">{discount.discount_percentage}%</Badge>
                    ) : (
                      <Text className="text-ui-fg-muted">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {discount ? (
                      discount.is_active ? (
                        <Badge color="green">Activ</Badge>
                      ) : (
                        <Badge color="grey">Inactiv</Badge>
                      )
                    ) : (
                      <Text className="text-ui-fg-muted">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleEditDiscount(customer)}
                      >
                        {discount ? "Editeaza" : "Adauga"}
                      </Button>
                      {discount && (
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleDeleteDiscount(customer.id)}
                        >
                          Sterge
                        </Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      )}
    </>
  )

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Collaborators Table */}
        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Heading level="h2">Colaboratori</Heading>
              <Text size="small" className="text-ui-fg-muted mt-1">
                Clienti marcati ca si colaboratori cu reduceri permanente
              </Text>
            </div>
            <Badge color="purple">{collaborators.length}</Badge>
          </div>
          <div className="px-6 py-4">
            {renderTable(
              collaborators,
              collabSearch,
              setCollabSearch,
              collabSortField,
              setCollabSortField,
              collabSortOrder,
              setCollabSortOrder,
              "Nu exista colaboratori."
            )}
          </div>
        </Container>

        {/* Other Customers Table */}
        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Heading level="h2">Alti Clienti</Heading>
              <Text size="small" className="text-ui-fg-muted mt-1">
                Toti ceilalti clienti inregistrati
              </Text>
            </div>
            <Badge color="grey">{otherCustomers.length}</Badge>
          </div>
          <div className="px-6 py-4">
            {renderTable(
              otherCustomers,
              customerSearch,
              setCustomerSearch,
              customerSortField,
              setCustomerSortField,
              customerSortOrder,
              setCustomerSortOrder,
              "Nu exista alti clienti."
            )}
          </div>
        </Container>
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              {selectedCustomer
                ? `${getCustomerName(selectedCustomer)}`
                : "Client"}
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="p-4 space-y-6">
            <div>
              <Label htmlFor="discount-percentage" className="font-medium">
                Procentaj Reducere (%)
              </Label>
              <Text size="small" className="text-ui-fg-muted mt-1 mb-2">
                Reducerea va fi aplicata automat la toate comenzile
              </Text>
              <Input
                id="discount-percentage"
                type="number"
                min={0}
                max={100}
                step={1}
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                placeholder="10"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-ui-bg-subtle rounded-lg">
              <div className="flex-1">
                <Label htmlFor="discount-active" className="font-medium">
                  Reducere Activa
                </Label>
                <Text size="small" className="text-ui-fg-muted mt-1">
                  Dezactiveaza temporar reducerea fara a o sterge
                </Text>
              </div>
              <Switch
                id="discount-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-ui-bg-subtle rounded-lg">
              <div className="flex-1">
                <Label htmlFor="is-collaborator" className="font-medium">
                  Colaborator
                </Label>
                <Text size="small" className="text-ui-fg-muted mt-1">
                  Marcheaza clientul ca si colaborator
                </Text>
              </div>
              <Switch
                id="is-collaborator"
                checked={isCollaborator}
                onCheckedChange={setIsCollaborator}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="font-medium">
                Note (optional)
              </Label>
              <Text size="small" className="text-ui-fg-muted mt-1 mb-2">
                Note interne
              </Text>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Colaborator marketing"
                rows={3}
              />
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDrawerOpen(false)
                setSelectedCustomer(null)
                resetForm()
              }}
            >
              Anuleaza
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveDiscount}
              disabled={saveMutation.isPending || discountPercentage <= 0}
            >
              {saveMutation.isPending ? "Se salveaza..." : "Salveaza"}
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  )
}

export const config = defineRouteConfig({
  label: "Colaboratori",
  icon: Users,
})

export default CustomerDiscountsPage

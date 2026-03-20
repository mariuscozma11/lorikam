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
  Switch,
  Textarea,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"
import { Buildings, Plus } from "@medusajs/icons"

type Team = {
  id: string
  name: string
  handle: string
  logo: string | null
  primary_color: string | null
  secondary_color: string | null
  description: string | null
  banner_image: string | null
  is_active: boolean
  created_at: string
}

type TeamsResponse = {
  teams: Team[]
  count: number
}

const TeamsPage = () => {
  const queryClient = useQueryClient()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [logo, setLogo] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#000000")
  const [secondaryColor, setSecondaryColor] = useState("#FFFFFF")
  const [description, setDescription] = useState("")
  const [bannerImage, setBannerImage] = useState("")
  const [isActive, setIsActive] = useState(true)

  const { data, isLoading } = useQuery<TeamsResponse>({
    queryFn: () =>
      sdk.client.fetch("/admin/teams", {
        query: { limit: 100 },
      }),
    queryKey: ["teams"],
  })

  const createMutation = useMutation({
    mutationFn: async (teamData: Partial<Team>) => {
      return sdk.client.fetch<{ team: Team }>("/admin/teams", {
        method: "POST",
        body: teamData,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] })
      setIsDrawerOpen(false)
      resetForm()
      toast.success("Echipa a fost creata!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...teamData }: { id: string } & Partial<Team>) => {
      return sdk.client.fetch<{ team: Team }>(`/admin/teams/${id}`, {
        method: "POST",
        body: teamData,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] })
      setIsDrawerOpen(false)
      setSelectedTeam(null)
      resetForm()
      toast.success("Echipa a fost actualizata!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return sdk.client.fetch(`/admin/teams/${id}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] })
      toast.success("Echipa a fost stearsa!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const resetForm = () => {
    setName("")
    setHandle("")
    setLogo("")
    setPrimaryColor("#000000")
    setSecondaryColor("#FFFFFF")
    setDescription("")
    setBannerImage("")
    setIsActive(true)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreating(true)
    setSelectedTeam(null)
    setIsDrawerOpen(true)
  }

  const handleEdit = (team: Team) => {
    setSelectedTeam(team)
    setIsCreating(false)
    setName(team.name)
    setHandle(team.handle)
    setLogo(team.logo || "")
    setPrimaryColor(team.primary_color || "#000000")
    setSecondaryColor(team.secondary_color || "#FFFFFF")
    setDescription(team.description || "")
    setBannerImage(team.banner_image || "")
    setIsActive(team.is_active)
    setIsDrawerOpen(true)
  }

  const handleSave = () => {
    const teamData = {
      name,
      handle,
      logo: logo || null,
      primary_color: primaryColor || null,
      secondary_color: secondaryColor || null,
      description: description || null,
      banner_image: bannerImage || null,
      is_active: isActive,
    }

    if (isCreating) {
      createMutation.mutate(teamData)
    } else if (selectedTeam) {
      updateMutation.mutate({ id: selectedTeam.id, ...teamData })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Esti sigur ca vrei sa stergi aceasta echipa?")) {
      deleteMutation.mutate(id)
    }
  }

  const generateHandle = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
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

  const teams = data?.teams || []

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Echipe Fan Shop</Heading>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Gestioneaza echipele partenere pentru Fan Shop
            </Text>
          </div>
          <Button variant="primary" onClick={handleCreate}>
            <Plus />
            Adauga Echipa
          </Button>
        </div>

        <div className="px-6 py-4">
          {teams.length === 0 ? (
            <Text className="text-ui-fg-muted">
              Nu exista echipe definite. Adauga prima echipa!
            </Text>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Logo</Table.HeaderCell>
                  <Table.HeaderCell>Nume</Table.HeaderCell>
                  <Table.HeaderCell>Handle</Table.HeaderCell>
                  <Table.HeaderCell>Culori</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">
                    Actiuni
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {teams.map((team) => (
                  <Table.Row key={team.id}>
                    <Table.Cell>
                      {team.logo ? (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-10 h-10 object-contain rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-ui-bg-subtle rounded flex items-center justify-center">
                          <Buildings className="text-ui-fg-muted" />
                        </div>
                      )}
                    </Table.Cell>
                    <Table.Cell className="font-medium">{team.name}</Table.Cell>
                    <Table.Cell>
                      <code className="text-xs bg-ui-bg-subtle px-1.5 py-0.5 rounded">
                        {team.handle}
                      </code>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-1">
                        {team.primary_color && (
                          <div
                            className="w-6 h-6 rounded border border-ui-border-base"
                            style={{ backgroundColor: team.primary_color }}
                            title={team.primary_color}
                          />
                        )}
                        {team.secondary_color && (
                          <div
                            className="w-6 h-6 rounded border border-ui-border-base"
                            style={{ backgroundColor: team.secondary_color }}
                            title={team.secondary_color}
                          />
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={team.is_active ? "green" : "grey"}>
                        {team.is_active ? "Activ" : "Inactiv"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleEdit(team)}
                        >
                          Editeaza
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleDelete(team.id)}
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
              {isCreating
                ? "Adauga Echipa Noua"
                : `Editeaza: ${selectedTeam?.name}`}
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="p-4 space-y-6 overflow-y-auto">
            <div>
              <Label htmlFor="team-name" className="font-medium">
                Nume Echipa *
              </Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (isCreating) {
                    setHandle(generateHandle(e.target.value))
                  }
                }}
                placeholder="Dinamo Zalau"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="team-handle" className="font-medium">
                Handle (URL) *
              </Label>
              <Text size="small" className="text-ui-fg-muted mt-1 mb-2">
                Va fi folosit in URL: /fan-shop/{handle || "handle"}
              </Text>
              <Input
                id="team-handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="dinamo-zalau"
              />
            </div>

            <div>
              <Label htmlFor="team-logo" className="font-medium">
                Logo URL
              </Label>
              <Input
                id="team-logo"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="mt-2"
              />
              {logo && (
                <div className="mt-2">
                  <img
                    src={logo}
                    alt="Preview"
                    className="w-16 h-16 object-contain rounded border"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary-color" className="font-medium">
                  Culoare Principala
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-ui-border-base"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondary-color" className="font-medium">
                  Culoare Secundara
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-ui-border-base"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="team-description" className="font-medium">
                Descriere
              </Label>
              <Textarea
                id="team-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrierea echipei..."
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="team-banner" className="font-medium">
                Banner URL
              </Label>
              <Input
                id="team-banner"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Status Activ</Label>
                <Text size="small" className="text-ui-fg-muted">
                  Echipele inactive nu vor aparea in storefront
                </Text>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDrawerOpen(false)
                setSelectedTeam(null)
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
                !handle.trim()
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
  label: "Echipe Fan Shop",
  icon: Buildings,
})

export default TeamsPage

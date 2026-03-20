import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Select,
  Button,
  toast,
  Badge,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { sdk } from "../lib/sdk"
import { useState, useEffect } from "react"

type Team = {
  id: string
  name: string
  handle: string
  logo: string | null
  is_active: boolean
}

type TeamsResponse = {
  teams: Team[]
}

type ProductWithTeam = AdminProduct & {
  team?: Team
}

const NO_TEAM_VALUE = "__no_team__"

const ProductTeamWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()
  const [selectedTeamId, setSelectedTeamId] = useState<string>(NO_TEAM_VALUE)

  // Fetch all teams
  const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useQuery<TeamsResponse>({
    queryFn: () =>
      sdk.client.fetch("/admin/teams", {
        query: { limit: 100 },
      }),
    queryKey: ["teams"],
  })

  // Fetch product's linked team
  const { data: productTeamData, isLoading: productLoading, error: productError } = useQuery<{
    team: Team | null
  }>({
    queryFn: () =>
      sdk.client.fetch(`/admin/products/${data.id}/team`),
    queryKey: ["product-team", data.id],
  })

  useEffect(() => {
    if (productTeamData?.team) {
      setSelectedTeamId(productTeamData.team.id)
    } else {
      setSelectedTeamId(NO_TEAM_VALUE)
    }
  }, [productTeamData])

  const linkMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return sdk.client.fetch(`/admin/teams/${teamId}/products`, {
        method: "POST",
        body: { product_id: data.id },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-team", data.id] })
      toast.success("Produsul a fost asociat echipei!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return sdk.client.fetch(`/admin/teams/${teamId}/products/${data.id}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-team", data.id] })
      setSelectedTeamId(NO_TEAM_VALUE)
      toast.success("Produsul a fost dezasociat de la echipa!")
    },
    onError: (error) => {
      toast.error("Eroare: " + (error as Error).message)
    },
  })

  const handleSave = () => {
    const currentTeam = productTeamData?.team

    // If no team selected and product has a team, unlink
    if (selectedTeamId === NO_TEAM_VALUE && currentTeam) {
      unlinkMutation.mutate(currentTeam.id)
      return
    }

    // If team selected is different from current
    if (selectedTeamId !== NO_TEAM_VALUE && selectedTeamId !== currentTeam?.id) {
      // If product already has a team, unlink first
      if (currentTeam) {
        unlinkMutation.mutate(currentTeam.id)
      }
      // Then link to new team
      linkMutation.mutate(selectedTeamId)
    }
  }

  if (teamsLoading || productLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">Se incarca...</Text>
        </div>
      </Container>
    )
  }

  if (teamsError || productError) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">Eroare la incarcarea datelor.</Text>
        </div>
      </Container>
    )
  }

  const teams = teamsData?.teams || []
  const currentTeam = productTeamData?.team
  const hasChanges = selectedTeamId !== (currentTeam?.id || NO_TEAM_VALUE)

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Echipa Fan Shop</Heading>
        <Text size="small" className="text-ui-fg-muted mt-1">
          Asociaza acest produs cu o echipa din Fan Shop. Produsele fara echipa
          vor aparea in Lorikam Shop.
        </Text>
      </div>

      <div className="px-6 py-4 space-y-4">
        {currentTeam && (
          <div className="flex items-center gap-2">
            <Text size="small" className="text-ui-fg-muted">
              Echipa curenta:
            </Text>
            <Badge color="blue">{currentTeam.name}</Badge>
          </div>
        )}

        <div>
          <Select
            value={selectedTeamId}
            onValueChange={setSelectedTeamId}
          >
            <Select.Trigger>
              <Select.Value placeholder="Selecteaza echipa (optional)" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value={NO_TEAM_VALUE}>
                Fara echipa (Lorikam Shop)
              </Select.Item>
              {teams.map((team) => (
                <Select.Item key={team.id} value={team.id}>
                  {team.name}
                  {!team.is_active && " (Inactiv)"}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        {hasChanges && (
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={linkMutation.isPending || unlinkMutation.isPending}
          >
            {linkMutation.isPending || unlinkMutation.isPending
              ? "Se salveaza..."
              : "Salveaza"}
          </Button>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductTeamWidget

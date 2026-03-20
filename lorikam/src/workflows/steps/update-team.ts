import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TEAM_MODULE } from "../../modules/team"

type UpdateTeamInput = {
  id: string
  name?: string
  handle?: string
  logo?: string | null
  primary_color?: string | null
  secondary_color?: string | null
  description?: string | null
  banner_image?: string | null
  is_active?: boolean
}

export const updateTeamStep = createStep(
  "update-team",
  async (input: UpdateTeamInput, { container }) => {
    const teamService = container.resolve(TEAM_MODULE)

    const previousTeam = await teamService.retrieveTeam(input.id)

    const team = await teamService.updateTeams(input)

    return new StepResponse(team, previousTeam)
  },
  async (previousTeam, { container }) => {
    if (!previousTeam) return

    const teamService = container.resolve(TEAM_MODULE)
    await teamService.updateTeams({
      id: previousTeam.id,
      name: previousTeam.name,
      handle: previousTeam.handle,
      logo: previousTeam.logo,
      primary_color: previousTeam.primary_color,
      secondary_color: previousTeam.secondary_color,
      description: previousTeam.description,
      banner_image: previousTeam.banner_image,
      is_active: previousTeam.is_active,
    })
  }
)

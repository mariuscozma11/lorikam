import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TEAM_MODULE } from "../../modules/team"

type CreateTeamInput = {
  name: string
  handle: string
  logo?: string | null
  primary_color?: string | null
  secondary_color?: string | null
  description?: string | null
  banner_image?: string | null
  is_active?: boolean
}

export const createTeamStep = createStep(
  "create-team",
  async (input: CreateTeamInput, { container }) => {
    const teamService = container.resolve(TEAM_MODULE)

    const team = await teamService.createTeams(input)

    return new StepResponse(team, team.id)
  },
  async (teamId, { container }) => {
    if (!teamId) return

    const teamService = container.resolve(TEAM_MODULE)
    await teamService.deleteTeams(teamId)
  }
)

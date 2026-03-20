import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TEAM_MODULE } from "../../modules/team"

type DeleteTeamInput = {
  id: string
}

export const deleteTeamStep = createStep(
  "delete-team",
  async (input: DeleteTeamInput, { container }) => {
    const teamService = container.resolve(TEAM_MODULE)

    const team = await teamService.retrieveTeam(input.id)

    await teamService.deleteTeams(input.id)

    return new StepResponse({ id: input.id }, team)
  },
  async (deletedTeam, { container }) => {
    if (!deletedTeam) return

    const teamService = container.resolve(TEAM_MODULE)
    await teamService.createTeams({
      id: deletedTeam.id,
      name: deletedTeam.name,
      handle: deletedTeam.handle,
      logo: deletedTeam.logo,
      primary_color: deletedTeam.primary_color,
      secondary_color: deletedTeam.secondary_color,
      description: deletedTeam.description,
      banner_image: deletedTeam.banner_image,
      is_active: deletedTeam.is_active,
    })
  }
)

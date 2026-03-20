import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateTeamStep } from "./steps/update-team"

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

export const updateTeamWorkflow = createWorkflow(
  "update-team",
  function (input: UpdateTeamInput) {
    const team = updateTeamStep(input)

    return new WorkflowResponse(team)
  }
)

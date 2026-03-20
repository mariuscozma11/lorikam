import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createTeamStep } from "./steps/create-team"

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

export const createTeamWorkflow = createWorkflow(
  "create-team",
  function (input: CreateTeamInput) {
    const team = createTeamStep(input)

    return new WorkflowResponse(team)
  }
)

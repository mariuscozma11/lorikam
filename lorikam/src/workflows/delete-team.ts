import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deleteTeamStep } from "./steps/delete-team"

type DeleteTeamInput = {
  id: string
}

export const deleteTeamWorkflow = createWorkflow(
  "delete-team",
  function (input: DeleteTeamInput) {
    const result = deleteTeamStep(input)

    return new WorkflowResponse(result)
  }
)

import { createWorkflow, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep, dismissRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { TEAM_MODULE } from "../modules/team"

type LinkProductTeamInput = {
  product_id: string
  team_id: string
}

type UnlinkProductTeamInput = {
  product_id: string
  team_id: string
}

export const linkProductTeamWorkflow = createWorkflow(
  "link-product-team",
  function (input: LinkProductTeamInput) {
    // Order must match defineLink: product first, then team
    const linkData = transform({ input }, ({ input }) => [{
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
      [TEAM_MODULE]: {
        team_id: input.team_id,
      },
    }])

    createRemoteLinkStep(linkData)

    return new WorkflowResponse({ success: true })
  }
)

export const unlinkProductTeamWorkflow = createWorkflow(
  "unlink-product-team",
  function (input: UnlinkProductTeamInput) {
    // Order must match defineLink: product first, then team
    const linkData = transform({ input }, ({ input }) => [{
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
      [TEAM_MODULE]: {
        team_id: input.team_id,
      },
    }])

    dismissRemoteLinkStep(linkData)

    return new WorkflowResponse({ success: true })
  }
)

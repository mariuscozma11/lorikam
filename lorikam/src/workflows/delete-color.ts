import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import ColorModuleService from "../modules/color/service"
import { COLOR_MODULE } from "../modules/color"

export type DeleteColorStepInput = {
  id: string
}

export const deleteColorStep = createStep(
  "delete-color-step",
  async (input: DeleteColorStepInput, { container }) => {
    const colorModuleService: ColorModuleService =
      container.resolve(COLOR_MODULE)

    const color = await colorModuleService.retrieveColor(input.id)
    await colorModuleService.deleteColors(input.id)

    return new StepResponse({ id: input.id }, color)
  },
  async (deletedColor: any, { container }) => {
    const colorModuleService: ColorModuleService =
      container.resolve(COLOR_MODULE)
    await colorModuleService.createColors(deletedColor)
  }
)

type DeleteColorWorkflowInput = {
  id: string
}

export const deleteColorWorkflow = createWorkflow(
  "delete-color",
  function (input: DeleteColorWorkflowInput) {
    const result = deleteColorStep(input)
    return new WorkflowResponse(result)
  }
)

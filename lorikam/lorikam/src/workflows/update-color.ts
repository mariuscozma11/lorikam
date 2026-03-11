import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import ColorModuleService from "../modules/color/service"
import { COLOR_MODULE } from "../modules/color"

export type UpdateColorStepInput = {
  id: string
  name?: string
  hex_codes?: string[]
  display_order?: number
}

export const updateColorStep = createStep(
  "update-color-step",
  async (input: UpdateColorStepInput, { container }) => {
    const colorModuleService: ColorModuleService =
      container.resolve(COLOR_MODULE)

    const { id, ...updateData } = input
    const color = await colorModuleService.updateColors({
      selector: { id },
      data: {
        name: updateData.name,
        hex_codes: updateData.hex_codes as any,
        display_order: updateData.display_order,
      },
    })

    return new StepResponse(color[0], { id, ...updateData })
  },
  async (previousData: UpdateColorStepInput, { container }) => {
    if (!previousData) return
    const colorModuleService: ColorModuleService =
      container.resolve(COLOR_MODULE)
    const { id, ...restoreData } = previousData
    await colorModuleService.updateColors({
      selector: { id },
      data: {
        name: restoreData.name,
        hex_codes: restoreData.hex_codes as any,
        display_order: restoreData.display_order,
      },
    })
  }
)

type UpdateColorWorkflowInput = {
  id: string
  name?: string
  hex_codes?: string[]
  display_order?: number
}

export const updateColorWorkflow = createWorkflow(
  "update-color",
  function (input: UpdateColorWorkflowInput) {
    const color = updateColorStep(input)
    return new WorkflowResponse(color)
  }
)

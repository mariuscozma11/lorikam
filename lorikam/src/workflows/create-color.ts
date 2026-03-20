import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import ColorModuleService from "../modules/color/service"
import { COLOR_MODULE } from "../modules/color"

export type CreateColorStepInput = {
  name: string
  hex_codes: string[]
  display_order?: number
}

export const createColorStep = createStep(
  "create-color-step",
  async (input: CreateColorStepInput, { container }) => {
    const colorModuleService: ColorModuleService =
      container.resolve(COLOR_MODULE)

    // Auto-calculate display_order if not provided
    let displayOrder = input.display_order
    if (displayOrder === undefined || displayOrder === 0) {
      const existingColors = await colorModuleService.listColors(
        {},
        { order: { display_order: "DESC" }, take: 1 }
      )
      displayOrder = existingColors.length > 0
        ? (existingColors[0].display_order || 0) + 1
        : 1
    }

    const color = await colorModuleService.createColors({
      name: input.name,
      hex_codes: input.hex_codes as any,
      display_order: displayOrder,
    })
    return new StepResponse(color, color.id)
  },
  async (id: string, { container }) => {
    const colorModuleService: ColorModuleService =
      container.resolve(COLOR_MODULE)
    await colorModuleService.deleteColors(id)
  }
)

type CreateColorWorkflowInput = {
  name: string
  hex_codes: string[]
  display_order?: number
}

export const createColorWorkflow = createWorkflow(
  "create-color",
  function (input: CreateColorWorkflowInput) {
    const color = createColorStep(input)
    return new WorkflowResponse(color)
  }
)

import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { VARIANT_PRESET_MODULE } from "../modules/variant-preset"
import VariantPresetModuleService from "../modules/variant-preset/service"

export type CreateSizePresetInput = {
  name: string
  sizes: string[]
  display_order?: number
}

const createSizePresetStep = createStep(
  "create-size-preset-step",
  async (input: CreateSizePresetInput, { container }) => {
    const service: VariantPresetModuleService =
      container.resolve(VARIANT_PRESET_MODULE)
    const preset = await service.createSizePresets({
      name: input.name,
      sizes: input.sizes as any,
      display_order: input.display_order ?? 0,
    })
    return new StepResponse(preset, preset.id)
  },
  async (id: string, { container }) => {
    const service: VariantPresetModuleService =
      container.resolve(VARIANT_PRESET_MODULE)
    await service.deleteSizePresets(id)
  }
)

export const createSizePresetWorkflow = createWorkflow(
  "create-size-preset",
  function (input: CreateSizePresetInput) {
    return new WorkflowResponse(createSizePresetStep(input))
  }
)

export type UpdateSizePresetInput = {
  id: string
  name?: string
  sizes?: string[]
  display_order?: number
}

const updateSizePresetStep = createStep(
  "update-size-preset-step",
  async (input: UpdateSizePresetInput, { container }) => {
    const service: VariantPresetModuleService =
      container.resolve(VARIANT_PRESET_MODULE)
    const preset = await service.updateSizePresets({
      id: input.id,
      ...(input.name !== undefined && { name: input.name }),
      ...(input.sizes !== undefined && { sizes: input.sizes as any }),
      ...(input.display_order !== undefined && {
        display_order: input.display_order,
      }),
    })
    return new StepResponse(preset)
  }
)

export const updateSizePresetWorkflow = createWorkflow(
  "update-size-preset",
  function (input: UpdateSizePresetInput) {
    return new WorkflowResponse(updateSizePresetStep(input))
  }
)

const deleteSizePresetStep = createStep(
  "delete-size-preset-step",
  async (id: string, { container }) => {
    const service: VariantPresetModuleService =
      container.resolve(VARIANT_PRESET_MODULE)
    await service.deleteSizePresets(id)
    return new StepResponse(id)
  }
)

export const deleteSizePresetWorkflow = createWorkflow(
  "delete-size-preset",
  function (input: { id: string }) {
    return new WorkflowResponse(deleteSizePresetStep(input.id))
  }
)

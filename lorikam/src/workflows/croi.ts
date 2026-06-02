import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { VARIANT_PRESET_MODULE } from "../modules/variant-preset"
import VariantPresetModuleService from "../modules/variant-preset/service"

export type CreateCroiInput = {
  label: string
  size_preset_id?: string | null
  display_order?: number
}

const createCroiStep = createStep(
  "create-croi-step",
  async (input: CreateCroiInput, { container }) => {
    const service: VariantPresetModuleService =
      container.resolve(VARIANT_PRESET_MODULE)
    const croi = await service.createCrois({
      label: input.label,
      size_preset_id: input.size_preset_id ?? null,
      display_order: input.display_order ?? 0,
    })
    return new StepResponse(croi, croi.id)
  },
  async (id: string, { container }) => {
    const service: VariantPresetModuleService =
      container.resolve(VARIANT_PRESET_MODULE)
    await service.deleteCrois(id)
  }
)

export const createCroiWorkflow = createWorkflow(
  "create-croi",
  function (input: CreateCroiInput) {
    return new WorkflowResponse(createCroiStep(input))
  }
)

export type UpdateCroiInput = {
  id: string
  label?: string
  size_preset_id?: string | null
  display_order?: number
}

const updateCroiStep = createStep(
  "update-croi-step",
  async (input: UpdateCroiInput, { container }) => {
    const service: VariantPresetModuleService =
      container.resolve(VARIANT_PRESET_MODULE)
    const croi = await service.updateCrois({
      id: input.id,
      ...(input.label !== undefined && { label: input.label }),
      ...(input.size_preset_id !== undefined && {
        size_preset_id: input.size_preset_id,
      }),
      ...(input.display_order !== undefined && {
        display_order: input.display_order,
      }),
    })
    return new StepResponse(croi)
  }
)

export const updateCroiWorkflow = createWorkflow(
  "update-croi",
  function (input: UpdateCroiInput) {
    return new WorkflowResponse(updateCroiStep(input))
  }
)

const deleteCroiStep = createStep(
  "delete-croi-step",
  async (id: string, { container }) => {
    const service: VariantPresetModuleService =
      container.resolve(VARIANT_PRESET_MODULE)
    await service.deleteCrois(id)
    return new StepResponse(id)
  }
)

export const deleteCroiWorkflow = createWorkflow(
  "delete-croi",
  function (input: { id: string }) {
    return new WorkflowResponse(deleteCroiStep(input.id))
  }
)

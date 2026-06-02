import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { VARIANT_PRESET_MODULE } from "../../../../modules/variant-preset"
import {
  updateSizePresetWorkflow,
  deleteSizePresetWorkflow,
} from "../../../../workflows/size-preset"
import { UpdateSizePresetType } from "../validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const service = req.scope.resolve(VARIANT_PRESET_MODULE)
  const size_preset = await service.retrieveSizePreset(id)
  res.json({ size_preset })
}

export const POST = async (
  req: MedusaRequest<UpdateSizePresetType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { result } = await updateSizePresetWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })
  res.json({ size_preset: result })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  await deleteSizePresetWorkflow(req.scope).run({ input: { id } })
  res.json({ id, deleted: true })
}

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { VARIANT_PRESET_MODULE } from "../../../modules/variant-preset"
import { createSizePresetWorkflow } from "../../../workflows/size-preset"
import { CreateSizePresetType } from "./validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve(VARIANT_PRESET_MODULE)
  const size_presets = await service.listSizePresets(
    {},
    { order: { display_order: "ASC" } }
  )
  res.json({ size_presets })
}

export const POST = async (
  req: MedusaRequest<CreateSizePresetType>,
  res: MedusaResponse
) => {
  const { result } = await createSizePresetWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.status(201).json({ size_preset: result })
}

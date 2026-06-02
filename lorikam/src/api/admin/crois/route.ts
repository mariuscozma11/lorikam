import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { VARIANT_PRESET_MODULE } from "../../../modules/variant-preset"
import { createCroiWorkflow } from "../../../workflows/croi"
import { CreateCroiType } from "./validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve(VARIANT_PRESET_MODULE)
  const crois = await service.listCrois(
    {},
    { order: { display_order: "ASC" } }
  )
  res.json({ crois })
}

export const POST = async (
  req: MedusaRequest<CreateCroiType>,
  res: MedusaResponse
) => {
  const { result } = await createCroiWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.status(201).json({ croi: result })
}

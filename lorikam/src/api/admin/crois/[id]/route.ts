import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { VARIANT_PRESET_MODULE } from "../../../../modules/variant-preset"
import {
  updateCroiWorkflow,
  deleteCroiWorkflow,
} from "../../../../workflows/croi"
import { UpdateCroiType } from "../validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const service = req.scope.resolve(VARIANT_PRESET_MODULE)
  const croi = await service.retrieveCroi(id)
  res.json({ croi })
}

export const POST = async (
  req: MedusaRequest<UpdateCroiType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { result } = await updateCroiWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })
  res.json({ croi: result })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  await deleteCroiWorkflow(req.scope).run({ input: { id } })
  res.json({ id, deleted: true })
}

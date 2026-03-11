import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { updateColorWorkflow } from "../../../../workflows/update-color"
import { deleteColorWorkflow } from "../../../../workflows/delete-color"
import { UpdateColorType } from "../validators"
import { COLOR_MODULE } from "../../../../modules/color"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const colorService = req.scope.resolve(COLOR_MODULE)

  const color = await colorService.retrieveColor(id)
  res.json({ color })
}

export const POST = async (
  req: MedusaRequest<UpdateColorType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateColorWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  res.json({ color: result })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params

  await deleteColorWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id, deleted: true })
}

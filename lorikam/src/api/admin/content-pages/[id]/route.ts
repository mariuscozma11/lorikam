import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_PAGE_MODULE } from "../../../../modules/content-page"
import {
  updateContentPageWorkflow,
  deleteContentPageWorkflow,
} from "../../../../workflows/content-page"
import { UpdateContentPageType } from "../validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const service = req.scope.resolve(CONTENT_PAGE_MODULE)
  const content_page = await service.retrieveContentPage(id)
  res.json({ content_page })
}

export const POST = async (
  req: MedusaRequest<UpdateContentPageType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { result } = await updateContentPageWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })
  res.json({ content_page: result })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  await deleteContentPageWorkflow(req.scope).run({ input: { id } })
  res.json({ id, deleted: true })
}

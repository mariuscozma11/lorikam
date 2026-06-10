import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_PAGE_MODULE } from "../../../modules/content-page"
import { createContentPageWorkflow } from "../../../workflows/content-page"
import { CreateContentPageType } from "./validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve(CONTENT_PAGE_MODULE)
  const content_pages = await service.listContentPages(
    {},
    { order: { slug: "ASC" } }
  )
  res.json({ content_pages })
}

export const POST = async (
  req: MedusaRequest<CreateContentPageType>,
  res: MedusaResponse
) => {
  const { result } = await createContentPageWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.status(201).json({ content_page: result })
}

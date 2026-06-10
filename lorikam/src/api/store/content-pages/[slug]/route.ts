import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CONTENT_PAGE_MODULE } from "../../../../modules/content-page"

// GET /store/content-pages/:slug - public, published pages only
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { slug } = req.params
  const service = req.scope.resolve(CONTENT_PAGE_MODULE)

  const [page] = await service.listContentPages({
    slug,
    is_published: true,
  })

  if (!page) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Content page '${slug}' not found`
    )
  }

  res.json({ content_page: page })
}

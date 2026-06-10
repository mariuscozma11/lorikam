import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_SETTING_MODULE } from "../../../modules/site-setting"
import { upsertSiteSettingWorkflow } from "../../../workflows/site-setting"
import { UpsertSiteSettingType } from "./validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve(SITE_SETTING_MODULE)
  const site_settings = await service.listSiteSettings({})
  res.json({ site_settings })
}

export const POST = async (
  req: MedusaRequest<UpsertSiteSettingType>,
  res: MedusaResponse
) => {
  const { result } = await upsertSiteSettingWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.json({ site_setting: result })
}

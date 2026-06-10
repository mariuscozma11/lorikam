import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_SETTING_MODULE } from "../../../modules/site-setting"

// GET /store/site-settings - public; returns all settings as a flat map
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve(SITE_SETTING_MODULE)
  const settings = await service.listSiteSettings({})
  const map: Record<string, string | null> = {}
  for (const s of settings) map[s.key] = s.value
  res.json({ settings: map })
}

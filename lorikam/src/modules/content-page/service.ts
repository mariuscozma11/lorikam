import { MedusaService } from "@medusajs/framework/utils"
import ContentPage from "./models/content-page"

class ContentPageModuleService extends MedusaService({
  ContentPage,
}) {}

export default ContentPageModuleService

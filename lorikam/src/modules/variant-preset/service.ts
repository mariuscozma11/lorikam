import { MedusaService } from "@medusajs/framework/utils"
import SizePreset from "./models/size-preset"
import Croi from "./models/croi"

class VariantPresetModuleService extends MedusaService({
  SizePreset,
  Croi,
}) {}

export default VariantPresetModuleService

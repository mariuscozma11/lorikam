import { MedusaService } from "@medusajs/framework/utils"
import Color from "./models/color"

class ColorModuleService extends MedusaService({
  Color,
}) {}

export default ColorModuleService

import { Module } from "@medusajs/framework/utils"
import VariantPresetModuleService from "./service"

export const VARIANT_PRESET_MODULE = "variantPreset"

const VariantPresetModule = Module(VARIANT_PRESET_MODULE, {
  service: VariantPresetModuleService,
})

export default VariantPresetModule

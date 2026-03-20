import { Module } from "@medusajs/framework/utils"
import ColorModuleService from "./service"

export const COLOR_MODULE = "color"

const ColorModule = Module(COLOR_MODULE, {
  service: ColorModuleService,
})

export default ColorModule

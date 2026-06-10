import { Module } from "@medusajs/framework/utils"
import SiteSettingModuleService from "./service"

export const SITE_SETTING_MODULE = "siteSetting"

const SiteSettingModule = Module(SITE_SETTING_MODULE, {
  service: SiteSettingModuleService,
})

export default SiteSettingModule

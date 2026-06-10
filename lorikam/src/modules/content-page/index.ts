import { Module } from "@medusajs/framework/utils"
import ContentPageModuleService from "./service"

export const CONTENT_PAGE_MODULE = "contentPage"

const ContentPageModule = Module(CONTENT_PAGE_MODULE, {
  service: ContentPageModuleService,
})

export default ContentPageModule

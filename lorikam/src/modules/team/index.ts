import TeamModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const TEAM_MODULE = "team"

export default Module(TEAM_MODULE, {
  service: TeamModuleService,
})

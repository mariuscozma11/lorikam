import { MedusaService } from "@medusajs/framework/utils"
import Team from "./models/team"

class TeamModuleService extends MedusaService({
  Team,
}) {}

export default TeamModuleService

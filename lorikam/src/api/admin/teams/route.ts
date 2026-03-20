import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createTeamWorkflow } from "../../../workflows/create-team"
import { CreateTeamSchema } from "./middlewares"

// GET /admin/teams - List all teams
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data: teams, metadata } = await query.graph({
    entity: "team",
    ...req.queryConfig,
  })

  return res.json({
    teams,
    count: metadata?.count ?? teams.length,
    limit: req.queryConfig?.pagination?.take ?? 50,
    offset: req.queryConfig?.pagination?.skip ?? 0,
  })
}

// POST /admin/teams - Create a team
export async function POST(
  req: MedusaRequest<CreateTeamSchema>,
  res: MedusaResponse
) {
  const { result } = await createTeamWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(201).json({ team: result })
}

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { updateTeamWorkflow } from "../../../../workflows/update-team"
import { deleteTeamWorkflow } from "../../../../workflows/delete-team"
import { UpdateTeamSchema } from "../middlewares"

// GET /admin/teams/:id - Get a single team
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data: teams } = await query.graph({
    entity: "team",
    filters: { id },
    ...req.queryConfig,
  })

  if (!teams || teams.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Team with id ${id} not found`)
  }

  return res.json({ team: teams[0] })
}

// POST /admin/teams/:id - Update a team
export async function POST(
  req: MedusaRequest<UpdateTeamSchema>,
  res: MedusaResponse
) {
  const { id } = req.params

  const { result } = await updateTeamWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  return res.json({ team: result })
}

// DELETE /admin/teams/:id - Delete a team
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  await deleteTeamWorkflow(req.scope).run({
    input: { id },
  })

  return res.json({ id, deleted: true })
}

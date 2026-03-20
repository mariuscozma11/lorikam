import { MiddlewareRoute, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "zod"

export const CreateTeamSchema = z.object({
  name: z.string().min(1),
  handle: z.string().min(1),
  logo: z.string().nullable().optional(),
  primary_color: z.string().nullable().optional(),
  secondary_color: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  banner_image: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
})

export type CreateTeamSchema = z.infer<typeof CreateTeamSchema>

export const UpdateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  handle: z.string().min(1).optional(),
  logo: z.string().nullable().optional(),
  primary_color: z.string().nullable().optional(),
  secondary_color: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  banner_image: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
})

export type UpdateTeamSchema = z.infer<typeof UpdateTeamSchema>

export const LinkProductSchema = z.object({
  product_id: z.string().min(1),
})

export type LinkProductSchema = z.infer<typeof LinkProductSchema>

export const GetTeamsSchema = createFindParams()

export const teamMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/teams",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(GetTeamsSchema, {
        defaults: ["id", "name", "handle", "logo", "primary_color", "secondary_color", "is_active", "created_at"],
        isList: true,
        defaultLimit: 50,
      }),
    ],
  },
  {
    matcher: "/admin/teams/:id",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(GetTeamsSchema, {
        defaults: ["id", "name", "handle", "logo", "primary_color", "secondary_color", "description", "banner_image", "is_active", "created_at", "products.*"],
        isList: false,
      }),
    ],
  },
  {
    matcher: "/admin/teams",
    method: "POST",
    middlewares: [validateAndTransformBody(CreateTeamSchema)],
  },
  {
    matcher: "/admin/teams/:id",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdateTeamSchema)],
  },
  {
    matcher: "/admin/teams/:id/products",
    method: "POST",
    middlewares: [validateAndTransformBody(LinkProductSchema)],
  },
]

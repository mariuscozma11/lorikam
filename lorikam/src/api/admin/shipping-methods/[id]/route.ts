import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  deleteShippingOptionsWorkflow,
  updateShippingOptionsWorkflow,
} from "@medusajs/medusa/core-flows"
import { UpdateShippingMethodType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateShippingMethodType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const body = req.validatedBody

  const { data: existing } = await query.graph({
    entity: "shipping_option",
    filters: { id },
    fields: [
      "id",
      "name",
      "type.label",
      "type.code",
      "type.description",
      "prices.amount",
      "prices.currency_code",
      "rules.id",
      "rules.attribute",
      "rules.value",
      "rules.operator",
    ],
  })

  const option = existing?.[0] as any

  if (!option) {
    res.status(404).json({ message: "Metoda de livrare nu există." })
    return
  }

  const currentRon =
    option.prices?.find((p: any) => p.currency_code === "ron")?.amount ?? 0
  const currentEur =
    option.prices?.find((p: any) => p.currency_code === "eur")?.amount ?? 0

  // Rules are replaced wholesale, so send every existing one back — passing
  // ids keeps them updated in place instead of recreated.
  const rules: any[] = (option.rules ?? []).map((rule: any) => {
    if (rule.attribute === "enabled_in_store" && body.is_enabled !== undefined) {
      return {
        id: rule.id,
        attribute: rule.attribute,
        value: body.is_enabled ? "true" : "false",
        operator: rule.operator,
      }
    }
    return {
      id: rule.id,
      attribute: rule.attribute,
      value: rule.value,
      operator: rule.operator,
    }
  })

  const hasEnabledRule = rules.some(
    (r: any) => r.attribute === "enabled_in_store"
  )
  if (!hasEnabledRule && body.is_enabled !== undefined) {
    rules.push({
      attribute: "enabled_in_store",
      value: body.is_enabled ? "true" : "false",
      operator: "eq",
    })
  }

  await updateShippingOptionsWorkflow(req.scope).run({
    input: [
      {
        id,
        ...(body.name ? { name: body.name } : {}),
        type: {
          label: body.name ?? option.type?.label ?? option.name,
          description: body.description ?? option.type?.description ?? "",
          code: option.type?.code ?? "livrare",
        },
        prices: [
          { currency_code: "ron", amount: body.price_ron ?? currentRon },
          { currency_code: "eur", amount: body.price_eur ?? currentEur },
        ],
        rules,
      },
    ],
  })

  res.json({ id, success: true })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteShippingOptionsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.json({ id, object: "shipping_method", deleted: true })
}

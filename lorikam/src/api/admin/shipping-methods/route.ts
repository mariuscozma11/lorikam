import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"
import { CreateShippingMethodType } from "./validators"

// Slug used for the shipping option "type". Not shown to customers, but it
// must be unique-ish per option, so derive it from the name.
const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "livrare"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "price_type",
      "service_zone_id",
      "type.description",
      "prices.amount",
      "prices.currency_code",
      "rules.id",
      "rules.attribute",
      "rules.value",
    ],
  })

  res.json({
    shipping_methods: options.map((option: any) => ({
      id: option.id,
      name: option.name,
      description: option.type?.description ?? "",
      price_ron:
        option.prices?.find((p: any) => p.currency_code === "ron")?.amount ?? 0,
      price_eur:
        option.prices?.find((p: any) => p.currency_code === "eur")?.amount ?? 0,
      // Absent rule means the option is visible in the store (Medusa's default).
      is_enabled:
        option.rules?.find((r: any) => r.attribute === "enabled_in_store")
          ?.value !== "false",
    })),
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateShippingMethodType>,
  res: MedusaResponse
) => {
  const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT)

  const [serviceZone] = await fulfillmentService.listServiceZones(
    {},
    { take: 1 }
  )
  const [shippingProfile] = await fulfillmentService.listShippingProfiles(
    { type: "default" },
    { take: 1 }
  )

  if (!serviceZone || !shippingProfile) {
    res.status(400).json({
      message:
        "Nu există o zonă de livrare configurată. Rulează scriptul setup-shipping.",
    })
    return
  }

  const body = req.validatedBody
  const isEnabled = body.is_enabled ?? true

  const { result } = await createShippingOptionsWorkflow(req.scope).run({
    input: [
      {
        name: body.name,
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: serviceZone.id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: body.name,
          description: body.description ?? "",
          code: slugify(body.name),
        },
        prices: [
          { currency_code: "ron", amount: body.price_ron },
          { currency_code: "eur", amount: body.price_eur ?? 0 },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: isEnabled ? "true" : "false",
            operator: "eq",
          },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  })

  res.json({ shipping_method: result[0] })
}

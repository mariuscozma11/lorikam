import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { COLOR_MODULE } from "../modules/color"
import { TEAM_MODULE } from "../modules/team"

export const CROI_OPTION_TITLE = "Croi"
export const SIZE_OPTION_TITLE = "Mărime"
export const COLOR_OPTION_TITLE = "Culoare"

export type FullProductSelection = { croi: string; sizes: string[] }

export type CreateFullProductInput = {
  title: string
  status?: "draft" | "published"
  team_id?: string | null
  price: number
  selections: FullProductSelection[]
  color_ids?: string[]
  manage_inventory?: boolean
  description?: string | null
}

const uniq = (arr: string[]) => Array.from(new Set(arr))

const createFullProductStep = createStep(
  "create-full-product-step",
  async (input: CreateFullProductInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const colorService = container.resolve(COLOR_MODULE)
    const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

    // Resolve selected colors (name + hex) for the Culoare option + color_map
    let colors: { id: string; name: string; hex_codes: string[] }[] = []
    if (input.color_ids?.length) {
      colors = (await colorService.listColors({ id: input.color_ids })) as any
    }
    const colorNames = colors.map((c) => c.name)

    const colorMap: Record<string, string> = {}
    for (const c of colors) {
      const hex = (c.hex_codes || []) as string[]
      if (hex.length === 1) colorMap[c.name] = hex[0]
      else if (hex.length > 1) colorMap[c.name] = hex.join(",")
    }

    // Build options
    const croiValues = uniq(input.selections.map((s) => s.croi))
    const sizeValues = uniq(input.selections.flatMap((s) => s.sizes))

    const options: { title: string; values: string[] }[] = [
      { title: CROI_OPTION_TITLE, values: croiValues },
      { title: SIZE_OPTION_TITLE, values: sizeValues },
    ]
    if (colorNames.length) {
      options.push({ title: COLOR_OPTION_TITLE, values: colorNames })
    }

    // Build variants = valid (croi, size) [× color]
    const manageInventory = input.manage_inventory ?? true
    const variants: any[] = []
    for (const sel of input.selections) {
      for (const size of sel.sizes) {
        const colorLoop = colorNames.length ? colorNames : [null]
        for (const color of colorLoop) {
          const opts: Record<string, string> = {
            [CROI_OPTION_TITLE]: sel.croi,
            [SIZE_OPTION_TITLE]: size,
          }
          if (color) opts[COLOR_OPTION_TITLE] = color
          variants.push({
            title: [sel.croi, size, color].filter(Boolean).join(" / "),
            options: opts,
            manage_inventory: manageInventory,
            prices: [{ amount: input.price, currency_code: "ron" }],
          })
        }
      }
    }

    // Default sales channel (so the product is visible in the storefront)
    const channels = await salesChannelService.listSalesChannels(
      {},
      { take: 1, order: { created_at: "ASC" } }
    )
    const salesChannelId = channels?.[0]?.id

    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: input.title,
            status: input.status ?? "draft",
            ...(input.description
              ? { description: input.description }
              : {}),
            options,
            variants,
            ...(colorNames.length ? { metadata: { color_map: colorMap } } : {}),
            ...(salesChannelId
              ? { sales_channels: [{ id: salesChannelId }] }
              : {}),
          },
        ],
      },
    })

    const product = result[0]

    // Link team
    if (input.team_id) {
      await link.create({
        [Modules.PRODUCT]: { product_id: product.id },
        [TEAM_MODULE]: { team_id: input.team_id },
      })
    }

    // Link colors
    if (input.color_ids?.length) {
      await link.create(
        input.color_ids.map((color_id) => ({
          [Modules.PRODUCT]: { product_id: product.id },
          [COLOR_MODULE]: { color_id },
        }))
      )
    }

    return new StepResponse(product, product.id)
  },
  async (productId: string, { container }) => {
    if (!productId) return
    const productService = container.resolve(Modules.PRODUCT)
    await productService.deleteProducts([productId])
  }
)

export const createFullProductWorkflow = createWorkflow(
  "create-full-product",
  function (input: CreateFullProductInput) {
    return new WorkflowResponse(createFullProductStep(input))
  }
)

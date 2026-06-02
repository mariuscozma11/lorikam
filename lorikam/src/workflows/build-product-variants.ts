import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { createProductVariantsWorkflow } from "@medusajs/medusa/core-flows"

export const CROI_OPTION_TITLE = "Croi"
export const SIZE_OPTION_TITLE = "Mărime"

export type VariantSelection = {
  croi: string
  sizes: string[]
}

export type BuildProductVariantsInput = {
  product_id: string
  selections: VariantSelection[]
  price?: number
  manage_inventory?: boolean
}

const uniq = (arr: string[]) => Array.from(new Set(arr))

const buildProductVariantsStep = createStep(
  "build-product-variants-step",
  async (input: BuildProductVariantsInput, { container }) => {
    const productService = container.resolve(Modules.PRODUCT)

    // Remove Medusa's auto-generated "Default option" (+ its default variant)
    // that a bare draft product starts with. Otherwise new Croi/Mărime variants
    // are rejected for not providing a value for that leftover option.
    const cleanupProduct = await productService.retrieveProduct(
      input.product_id,
      { relations: ["options", "options.values", "variants", "variants.options"] }
    )
    const defaultOption = cleanupProduct.options?.find((o: any) =>
      ["default option", "default"].includes(o.title?.toLowerCase())
    )
    if (defaultOption) {
      const defaultVariantIds = (cleanupProduct.variants || [])
        .filter((v: any) =>
          (v.options || []).some((o: any) => o.option_id === defaultOption.id)
        )
        .map((v: any) => v.id)
      if (defaultVariantIds.length) {
        await productService.deleteProductVariants(defaultVariantIds)
      }
      await productService.deleteProductOptions([defaultOption.id])
    }

    const croiValues = uniq(input.selections.map((s) => s.croi))
    const sizeValues = uniq(input.selections.flatMap((s) => s.sizes))

    // Ensure the Croi + Mărime options exist with all needed values
    const ensureOption = async (title: string, values: string[]) => {
      const product = await productService.retrieveProduct(input.product_id, {
        relations: ["options", "options.values"],
      })
      const existing = product.options?.find(
        (o: any) => o.title?.toLowerCase() === title.toLowerCase()
      )
      if (!existing) {
        await productService.createProductOptions({
          product_id: input.product_id,
          title,
          values,
        })
        return
      }
      const existingValues = (existing.values || []).map((v: any) => v.value)
      const union = uniq([...existingValues, ...values])
      if (union.length > existingValues.length) {
        await productService.updateProductOptions(existing.id, {
          values: union,
        })
      }
    }

    await ensureOption(CROI_OPTION_TITLE, croiValues)
    await ensureOption(SIZE_OPTION_TITLE, sizeValues)

    // Refetch to map option ids -> titles and to read existing variants
    const product = await productService.retrieveProduct(input.product_id, {
      relations: ["options", "options.values", "variants", "variants.options"],
    })

    const optionIdToTitle: Record<string, string> = {}
    for (const opt of product.options || []) {
      optionIdToTitle[opt.id] = opt.title
    }

    const signatureOf = (entries: { title: string; value: string }[]) =>
      entries
        .map((e) => `${e.title}:${e.value}`)
        .sort()
        .join("|")

    // Existing variant signatures (only considering Croi + Mărime)
    const existingSignatures = new Set<string>()
    for (const variant of product.variants || []) {
      const entries = ((variant.options || []) as any[])
        .map((o) => ({
          title: optionIdToTitle[o.option_id],
          value: o.value,
        }))
        .filter(
          (e) =>
            e.title === CROI_OPTION_TITLE || e.title === SIZE_OPTION_TITLE
        )
      if (entries.length) {
        existingSignatures.add(signatureOf(entries))
      }
    }

    const manageInventory = input.manage_inventory ?? true
    const variantsToCreate: any[] = []

    for (const sel of input.selections) {
      for (const size of sel.sizes) {
        const entries = [
          { title: CROI_OPTION_TITLE, value: sel.croi },
          { title: SIZE_OPTION_TITLE, value: size },
        ]
        const sig = signatureOf(entries)
        if (existingSignatures.has(sig)) {
          continue
        }
        existingSignatures.add(sig)

        variantsToCreate.push({
          product_id: input.product_id,
          title: `${sel.croi} / ${size}`,
          manage_inventory: manageInventory,
          options: {
            [CROI_OPTION_TITLE]: sel.croi,
            [SIZE_OPTION_TITLE]: size,
          },
          prices:
            input.price !== undefined && input.price > 0
              ? [{ amount: input.price, currency_code: "ron" }]
              : undefined,
        })
      }
    }

    let created = 0
    if (variantsToCreate.length > 0) {
      try {
        await createProductVariantsWorkflow(container).run({
          input: { product_variants: variantsToCreate },
        })
        created = variantsToCreate.length
      } catch (e) {
        // Fallback: create individually without prices
        for (const v of variantsToCreate) {
          try {
            await productService.createProductVariants({
              product_id: v.product_id,
              title: v.title,
              manage_inventory: v.manage_inventory,
              options: v.options,
            })
            created++
          } catch {
            // skip individual failures
          }
        }
      }
    }

    return new StepResponse({ created, requested: variantsToCreate.length })
  }
)

export const buildProductVariantsWorkflow = createWorkflow(
  "build-product-variants",
  function (input: BuildProductVariantsInput) {
    return new WorkflowResponse(buildProductVariantsStep(input))
  }
)

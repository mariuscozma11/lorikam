import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { COLOR_MODULE } from "../modules/color"
import { createProductVariantsWorkflow } from "@medusajs/medusa/core-flows"

export type SyncProductColorsInput = {
  product_id: string
  color_ids: string[]
}

const COLOR_OPTION_TITLE = "Culoare"

export const syncProductColorsStep = createStep(
  "sync-product-colors-step",
  async (input: SyncProductColorsInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const colorService = container.resolve(COLOR_MODULE)
    const productService = container.resolve(Modules.PRODUCT)

    // Get current linked colors
    const { data: [productWithColors] } = await query.graph({
      entity: "product",
      filters: { id: input.product_id },
      fields: ["id", "color.*"],
    })

    const colorArray = Array.isArray(productWithColors?.color)
      ? productWithColors.color
      : productWithColors?.color
        ? [productWithColors.color]
        : []
    const previousColorIds = colorArray.map((c: any) => c.id)
    const previousColorNames = colorArray.map((c: any) => c.name)

    // Dismiss existing links
    if (previousColorIds.length > 0) {
      await link.dismiss({
        [Modules.PRODUCT]: { product_id: input.product_id },
        [COLOR_MODULE]: { color_id: previousColorIds },
      })
    }

    // Create new links
    if (input.color_ids.length > 0) {
      const links = input.color_ids.map((colorId) => ({
        [Modules.PRODUCT]: { product_id: input.product_id },
        [COLOR_MODULE]: { color_id: colorId },
      }))
      await link.create(links)
    }

    // Fetch the linked colors
    let colorMap: Record<string, string> = {}
    let colorNames: string[] = []

    if (input.color_ids.length > 0) {
      const colors = await colorService.listColors({
        id: input.color_ids,
      })

      // Sort by display_order
      colors.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))

      // Build color map and names
      colors.forEach((color: any) => {
        colorNames.push(color.name)
        const hexCodes = color.hex_codes || []
        if (hexCodes.length === 1) {
          colorMap[color.name] = hexCodes[0]
        } else if (hexCodes.length > 1) {
          colorMap[color.name] = hexCodes.join(",")
        }
      })
    }

    // Get product with options and variants
    let product = await productService.retrieveProduct(input.product_id, {
      select: ["id", "metadata", "title"],
      relations: ["options", "options.values", "variants", "variants.options"],
    })
    const existingMetadata = product.metadata || {}

    // Find "Culoare" option if it exists
    let colorOption = product.options?.find(
      (opt: any) => opt.title.toLowerCase() === COLOR_OPTION_TITLE.toLowerCase()
    )

    // Determine colors to remove (were linked before but not now)
    const colorsToRemove = previousColorNames.filter(
      (name: string) => !colorNames.includes(name)
    )

    // Handle cleanup: remove variants with colors that are no longer linked
    if (colorsToRemove.length > 0 && colorOption) {
      const colorOptionId = colorOption.id
      const variantsToDelete: string[] = []

      for (const variant of product.variants || []) {
        const variantColorOption = variant.options?.find(
          (o: any) => o.option_id === colorOptionId
        )
        if (variantColorOption && colorsToRemove.includes(variantColorOption.value)) {
          variantsToDelete.push(variant.id)
        }
      }

      // Delete variants with removed colors
      if (variantsToDelete.length > 0) {
        await productService.deleteProductVariants(variantsToDelete)
      }

      // Remove unused option values
      const optionValuesToDelete = colorOption.values
        ?.filter((v: any) => colorsToRemove.includes(v.value))
        .map((v: any) => v.id) || []

      if (optionValuesToDelete.length > 0) {
        await productService.deleteProductOptionValues(optionValuesToDelete)
      }
    }

    // If no colors selected, remove the entire Culoare option if it exists and has no variants using it
    if (colorNames.length === 0 && colorOption) {
      // Refresh product to get updated variants
      product = await productService.retrieveProduct(input.product_id, {
        relations: ["options", "options.values", "variants", "variants.options"],
      })

      colorOption = product.options?.find(
        (opt: any) => opt.title.toLowerCase() === COLOR_OPTION_TITLE.toLowerCase()
      )

      // Check if any variants still use this option
      const variantsUsingColorOption = (product.variants || []).filter((v: any) =>
        v.options?.some((o: any) => o.option_id === colorOption?.id)
      )

      if (variantsUsingColorOption.length === 0 && colorOption) {
        // Safe to delete the option
        await productService.deleteProductOptions([colorOption.id])
      }
    }

    // Create or update color option with new values
    if (colorNames.length > 0) {
      // Refresh product after potential deletions
      product = await productService.retrieveProduct(input.product_id, {
        select: ["id", "metadata", "title"],
        relations: ["options", "options.values", "variants", "variants.options"],
      })

      colorOption = product.options?.find(
        (opt: any) => opt.title.toLowerCase() === COLOR_OPTION_TITLE.toLowerCase()
      )

      // Check if we need to add new color values
      const existingColorValues = colorOption?.values?.map((v: any) => v.value) || []
      const missingColorValues = colorNames.filter((name) => !existingColorValues.includes(name))

      if (!colorOption) {
        // Create new "Culoare" option with all color values
        await productService.createProductOptions({
          product_id: input.product_id,
          title: COLOR_OPTION_TITLE,
          values: colorNames,
        })
      } else if (missingColorValues.length > 0) {
        // Need to add new values - delete and recreate the option
        // This is necessary because upsertProductOptions doesn't properly create option values

        // First, delete all variants that use this option (they'll be recreated)
        const variantsWithColorOption = (product.variants || []).filter((v: any) =>
          v.options?.some((o: any) => o.option_id === colorOption!.id)
        )

        if (variantsWithColorOption.length > 0) {
          await productService.deleteProductVariants(variantsWithColorOption.map((v: any) => v.id))
        }

        // Delete the old option
        await productService.deleteProductOptions([colorOption.id])

        // Create new option with all values
        const allColorValues = [...new Set([...existingColorValues, ...missingColorValues])]
        await productService.createProductOptions({
          product_id: input.product_id,
          title: COLOR_OPTION_TITLE,
          values: allColorValues,
        })
      }

      // Refresh product to get updated options with all values
      product = await productService.retrieveProduct(input.product_id, {
        select: ["id", "metadata", "title"],
        relations: ["options", "options.values", "variants", "variants.options"],
      })

      const allOptions = product.options || []

      // Re-fetch existing variants AFTER option creation to get fresh data
      const refreshedProduct = await productService.retrieveProduct(input.product_id, {
        relations: ["variants", "variants.options"],
      })
      const existingVariants = refreshedProduct.variants || []

      // Get color option again after refresh
      colorOption = allOptions.find(
        (opt: any) => opt.title.toLowerCase() === COLOR_OPTION_TITLE.toLowerCase()
      )

      // Build a flexible price map for inheritance
      // Map: option_id -> option_value -> first_variant_id
      // This allows inheriting prices from any existing option, not just a specific one
      const optionValueToVariant: Map<string, Map<string, string>> = new Map()

      // Initialize maps for all non-color options
      for (const option of allOptions) {
        if (option.id === colorOption?.id) continue
        optionValueToVariant.set(option.id, new Map())
      }

      // Populate maps with first variant for each option value
      for (const variant of existingVariants) {
        for (const opt of (variant.options || []) as any[]) {
          if (opt.option_id === colorOption?.id) continue
          const optionMap = optionValueToVariant.get(opt.option_id)
          if (optionMap && !optionMap.has(opt.value)) {
            optionMap.set(opt.value, variant.id)
          }
        }
      }

      // Get base variants (existing variants without color option)
      // These represent the valid option combinations we should extend with colors
      const baseVariants = existingVariants.filter((v: any) => {
        // Check if this variant has the color option
        const hasColorOption = (v.options || []).some(
          (o: any) => o.option_id === colorOption?.id
        )
        return !hasColorOption
      })

      // Fetch prices for ALL base variants (not just the ones in optionValueToVariant)
      const variantIdToPrices: Map<string, any[]> = new Map()
      const baseVariantIds = baseVariants.map((v: any) => v.id)

      if (baseVariantIds.length > 0) {
        try {
          const { data: variantsWithPriceData } = await query.graph({
            entity: "variant",
            filters: { id: baseVariantIds },
            fields: ["id", "price_set.prices.*"],
          })

          for (const v of variantsWithPriceData || []) {
            const prices = (v as any).price_set?.prices || []
            if (prices.length > 0) {
              variantIdToPrices.set(v.id, prices)
            }
          }
        } catch (e) {
          // Silently handle price fetch errors
        }
      }

      // Build option title map for creating variant options
      const optionIdToTitle: Record<string, string> = {}
      for (const option of allOptions) {
        optionIdToTitle[option.id] = option.title
      }

      // Also track existing variants WITH colors to avoid duplicates
      const existingVariantKeys = new Set(
        existingVariants.map((v: any) =>
          (v.options || [])
            .map((o: any) => `${o.option_id}:${o.value}`)
            .sort()
            .join("|")
        )
      )

      let createdCount = 0
      let skippedCount = 0
      const variantsToCreate: any[] = []

      // For each base variant, create new variants with each color
      for (const baseVariant of baseVariants) {
        const baseOptions = (baseVariant.options || []) as any[]

        // Get prices from this base variant
        const basePrices = variantIdToPrices.get(baseVariant.id) || []

        for (const colorName of colorNames) {
          // Build the new variant's option key to check for duplicates
          const newOptionEntries = [
            ...baseOptions.map((o: any) => `${o.option_id}:${o.value}`),
            `${colorOption!.id}:${colorName}`
          ].sort().join("|")

          // Skip if this combination already exists
          if (existingVariantKeys.has(newOptionEntries)) {
            skippedCount++
            continue
          }

          // Build variant title
          const variantTitle = [
            ...baseOptions.map((o: any) => o.value),
            colorName
          ].join(" / ")

          // Build variant options using TITLES as keys
          const variantOptions: Record<string, string> = {}
          for (const opt of baseOptions) {
            const title = optionIdToTitle[opt.option_id]
            if (title) {
              variantOptions[title] = opt.value
            }
          }
          variantOptions[COLOR_OPTION_TITLE] = colorName

          // Format prices for the workflow - include rules for region-specific prices
          const prices = basePrices.map((p: any) => {
            const price: any = {
              amount: p.amount,
              currency_code: p.currency_code,
            }
            // Copy rules (contains region_id for region-specific prices)
            if (p.rules && Object.keys(p.rules).length > 0) {
              price.rules = p.rules
            }
            return price
          })

          variantsToCreate.push({
            product_id: input.product_id,
            title: variantTitle,
            manage_inventory: false,
            options: variantOptions,
            prices: prices.length > 0 ? prices : undefined,
          })
        }
      }

      // Handle case where there are NO base variants (product has no variants yet)
      // In this case, just create one variant per color
      if (baseVariants.length === 0) {
        for (const colorName of colorNames) {
          const newOptionKey = `${colorOption!.id}:${colorName}`

          if (existingVariantKeys.has(newOptionKey)) {
            skippedCount++
            continue
          }

          variantsToCreate.push({
            product_id: input.product_id,
            title: colorName,
            manage_inventory: false,
            options: { [COLOR_OPTION_TITLE]: colorName },
          })
        }
      }

      // Create all variants using the workflow (handles prices properly)
      if (variantsToCreate.length > 0) {
        try {
          await createProductVariantsWorkflow(container).run({
            input: {
              product_variants: variantsToCreate,
            },
          })
          createdCount = variantsToCreate.length
        } catch (error: any) {

          // Fallback: create variants one by one without prices
          for (const variantData of variantsToCreate) {
            try {
              await productService.createProductVariants({
                product_id: variantData.product_id,
                title: variantData.title,
                manage_inventory: false,
                options: variantData.options,
              })
              createdCount++
            } catch (err: any) {
              // Silently handle individual variant creation errors
            }
          }
        }
      }
    }

    // Update product metadata with color_map
    await productService.updateProducts(input.product_id, {
      metadata: {
        ...existingMetadata,
        color_map: colorMap,
      },
    })

    return new StepResponse(
      { product_id: input.product_id, color_ids: input.color_ids },
      { product_id: input.product_id, previous_color_ids: previousColorIds }
    )
  },
  async (previousData, { container }) => {
    if (!previousData) return

    const link = container.resolve(ContainerRegistrationKeys.LINK)

    // Restore previous links
    if (previousData.previous_color_ids.length > 0) {
      const links = previousData.previous_color_ids.map((colorId: string) => ({
        [Modules.PRODUCT]: { product_id: previousData.product_id },
        [COLOR_MODULE]: { color_id: colorId },
      }))
      await link.create(links)
    }
  }
)

export const syncProductColorsWorkflow = createWorkflow(
  "sync-product-colors",
  function (input: SyncProductColorsInput) {
    const result = syncProductColorsStep(input)
    return new WorkflowResponse(result)
  }
)

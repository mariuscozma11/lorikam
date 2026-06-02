import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { VARIANT_PRESET_MODULE } from "../modules/variant-preset"
import VariantPresetModuleService from "../modules/variant-preset/service"

// Idempotent: seeds default size presets + crois if none exist yet.
// Run with: npx medusa exec ./src/scripts/seed-variant-presets.ts
export default async function seedVariantPresets({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const service: VariantPresetModuleService = container.resolve(
    VARIANT_PRESET_MODULE
  )

  const existing = await service.listSizePresets({}, { take: 1 })
  if (existing.length > 0) {
    logger.info("Variant presets already seeded, skipping.")
    return
  }

  const [adultPreset, kidPreset] = await service.createSizePresets([
    {
      name: "Adulți",
      sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as any,
      display_order: 1,
    },
    {
      name: "Copii",
      sizes: ["4 ani", "6 ani", "8 ani", "10 ani", "12 ani", "14 ani"] as any,
      display_order: 2,
    },
  ])

  await service.createCrois([
    { label: "Bărbați", size_preset_id: adultPreset.id, display_order: 1 },
    { label: "Femei", size_preset_id: adultPreset.id, display_order: 2 },
    { label: "Copil", size_preset_id: kidPreset.id, display_order: 3 },
  ])

  logger.info("Seeded default size presets and crois.")
}

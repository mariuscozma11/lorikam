import {
  createTaxRegionsWorkflow,
  updateRegionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

// Romanian VAT setup. The store previously had tax regions without a single
// tax rate, so every order came out with tax_total = 0.
//
// Prices in this store are entered VAT-inclusive (120 RON is what the customer
// pays), so the region is flagged tax inclusive — otherwise the 21% would be
// added on top and 120 would become 145.20.
//
// Idempotent — safe to run multiple times.
//   Run with: npx medusa exec ./src/scripts/setup-tax.ts
const VAT_RATE = 21;

export default async function setupTax({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const taxModuleService = container.resolve(Modules.TAX);
  const regionModuleService = container.resolve(Modules.REGION);

  // 1) Tax region for Romania (get-or-create).
  let [roTaxRegion] = await taxModuleService.listTaxRegions({
    country_code: "ro",
  });

  if (!roTaxRegion) {
    const { result } = await createTaxRegionsWorkflow(container).run({
      // provider_id is required — a tax region without it makes every cart
      // creation fail with "Unable to retrieve the tax provider with id: null".
      input: [{ country_code: "ro", provider_id: "tp_system" }],
    });
    roTaxRegion = result[0];
    logger.info("Created tax region for RO.");
  } else if (!roTaxRegion.provider_id) {
    await taxModuleService.updateTaxRegions({
      id: roTaxRegion.id,
      provider_id: "tp_system",
    });
    logger.info("Repaired RO tax region: attached the system tax provider.");
  }

  // 2) Default 21% rate on it. `is_default` means it applies to everything in
  //    the region that has no more specific override.
  const existingRates = await taxModuleService.listTaxRates({
    tax_region_id: roTaxRegion.id,
  });
  const defaultRate = existingRates.find((r) => r.is_default);

  if (!defaultRate) {
    await taxModuleService.createTaxRates([
      {
        tax_region_id: roTaxRegion.id,
        name: `TVA ${VAT_RATE}%`,
        code: "tva",
        rate: VAT_RATE,
        is_default: true,
      },
    ]);
    logger.info(`Created default TVA rate of ${VAT_RATE}% for RO.`);
  } else if (defaultRate.rate !== VAT_RATE) {
    await taxModuleService.updateTaxRates(
      { id: defaultRate.id },
      { rate: VAT_RATE, name: `TVA ${VAT_RATE}%` }
    );
    logger.info(
      `Updated RO default TVA rate from ${defaultRate.rate}% to ${VAT_RATE}%.`
    );
  } else {
    logger.info(`RO default TVA rate already ${VAT_RATE}%.`);
  }

  // 3) Prices are gross, so mark the region tax inclusive. Without this the
  //    21% is added on top of the displayed price instead of extracted from it.
  const regions = await regionModuleService.listRegions({});

  for (const region of regions) {
    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { is_tax_inclusive: true },
      },
    });
    logger.info(`Region "${region.name}" set to tax-inclusive pricing.`);
  }

  // 4) Currency-level preference too. Setting it only on the region leaves the
  //    per-currency preference at false and tax still gets added on top.
  await updateStoresWorkflow(container).run({
    input: {
      selector: {},
      update: {
        supported_currencies: [
          { currency_code: "ron", is_default: true, is_tax_inclusive: true },
          { currency_code: "eur", is_tax_inclusive: true },
        ],
      },
    },
  });
  logger.info("Store currencies (RON, EUR) set to tax-inclusive.");

  logger.info("Tax setup done.");
}

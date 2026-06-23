import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

// Store bootstrap WITHOUT products: currencies (RON default + EUR), regions
// (Romania + Europe), tax regions, default sales channel, stock location,
// fulfillment + shipping, and a publishable API key for the storefront.
// Idempotent — safe to run multiple times.
//   Run with: npx medusa exec ./src/scripts/seed.ts
export default async function seedStore({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);

  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);
  const regionModuleService = container.resolve(Modules.REGION);
  const taxModuleService = container.resolve(Modules.TAX);
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const apiKeyModuleService = container.resolve(Modules.API_KEY);

  const roCountries = ["ro"];
  const euCountries = [
    "de", "fr", "it", "es", "nl", "be", "at", "pt", "ie",
    "fi", "gr", "pl", "cz", "hu", "bg", "sk", "hr", "si", "lt", "lv", "ee", "lu", "cy", "mt", "dk", "se",
  ];
  const allCountries = [...roCountries, ...euCountries];

  // 1) Default sales channel (get-or-create)
  let [defaultSalesChannel] = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });
  if (!defaultSalesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "Default Sales Channel" }] },
    });
    defaultSalesChannel = result[0];
    logger.info("Created default sales channel.");
  }

  // 2) Store: supported currencies (RON default, EUR) + default sales channel
  const [store] = await storeModuleService.listStores();
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          { currency_code: "ron", is_default: true },
          { currency_code: "eur" },
        ],
        default_sales_channel_id: defaultSalesChannel.id,
      },
    },
  });
  logger.info("Store currencies set: RON (default), EUR.");

  // 3) Regions (get-or-create by name)
  const existingRegions = await regionModuleService.listRegions({});
  const regionsToCreate = [
    { name: "Romania", currency_code: "ron", countries: roCountries },
    { name: "Europa", currency_code: "eur", countries: euCountries },
  ].filter((r) => !existingRegions.some((er) => er.name === r.name));

  if (regionsToCreate.length) {
    await createRegionsWorkflow(container).run({
      input: {
        regions: regionsToCreate.map((r) => ({
          name: r.name,
          currency_code: r.currency_code,
          countries: r.countries,
          payment_providers: ["pp_system_default"],
        })),
      },
    });
    logger.info(`Created regions: ${regionsToCreate.map((r) => r.name).join(", ")}.`);
  } else {
    logger.info("Regions already exist, skipping.");
  }

  // 4) Tax regions (only for countries without one)
  const existingTax = await taxModuleService.listTaxRegions({});
  const existingTaxCountries = new Set(
    existingTax.map((t) => t.country_code).filter(Boolean)
  );
  const taxToCreate = allCountries.filter((c) => !existingTaxCountries.has(c));
  if (taxToCreate.length) {
    await createTaxRegionsWorkflow(container).run({
      input: taxToCreate.map((country_code) => ({ country_code })),
    });
    logger.info(`Created ${taxToCreate.length} tax regions.`);
  }

  // 5) Stock location (get-or-create)
  let [stockLocation] = await stockLocationModuleService.listStockLocations({
    name: "Depozit principal",
  });
  if (!stockLocation) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Depozit principal",
            address: { city: "București", country_code: "RO", address_1: "" },
          },
        ],
      },
    });
    stockLocation = result[0];
    logger.info("Created stock location.");

    // Link stock location to the manual fulfillment provider + sales channel
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });
    await link.create({
      [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    });
  }

  // 6) Fulfillment set + service zone + shipping option (only once)
  const existingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = existingProfiles[0];
  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default", type: "default" }] },
    });
    shippingProfile = result[0];
  }

  const existingSets = await fulfillmentModuleService.listFulfillmentSets({
    name: "Livrare Lorikam",
  });
  if (!existingSets.length) {
    const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Livrare Lorikam",
      type: "shipping",
      service_zones: [
        {
          name: "Romania & Europa",
          geo_zones: allCountries.map((country_code) => ({
            country_code,
            type: "country" as const,
          })),
        },
      ],
    });

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    });

    const serviceZoneId = fulfillmentSet.service_zones[0].id;
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Livrare standard",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Standard",
            description: "Livrare în 2-4 zile lucrătoare.",
            code: "standard",
          },
          prices: [
            { currency_code: "ron", amount: 20 },
            { currency_code: "eur", amount: 7 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    });
    logger.info("Created fulfillment set + standard shipping option.");
  }

  // 7) Publishable API key for the storefront (get-or-create) + link
  let [publishableKey] = await apiKeyModuleService.listApiKeys({
    type: "publishable",
  });
  if (!publishableKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { type: "publishable", title: "Storefront", created_by: "seed" },
        ],
      },
    });
    publishableKey = result[0];
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: publishableKey.id, add: [defaultSalesChannel.id] },
    });
    logger.info("Created publishable API key + linked to sales channel.");
  }

  logger.info("──────────────────────────────────────────────");
  logger.info(`PUBLISHABLE KEY (pune-o în storefront .env): ${publishableKey.token}`);
  logger.info("──────────────────────────────────────────────");
  logger.info("Store seed complete (RON+EUR, Romania+Europa, no products).");
}

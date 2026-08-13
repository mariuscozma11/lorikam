import {
  createShippingOptionsWorkflow,
  deleteShippingOptionsWorkflow,
  updateServiceZonesWorkflow,
} from "@medusajs/medusa/core-flows";
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

// Shipping bootstrap for the RO store: makes sure the service zone covers
// Romania (+ EU), removes the demo options that ship with Medusa's default
// seed (EUR/USD only — never selectable in a RON cart), and creates the two
// real options: "Ridicare personală" and "Cargus".
//
// Without a geo zone for `ro` the storefront gets zero shipping options, the
// shipping step can never complete, and "Continuă către plată" stays disabled.
//
// Idempotent — safe to run multiple times.
//   Run with: npx medusa exec ./src/scripts/setup-shipping.ts
export default async function setupShipping({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  const roCountries = ["ro"];
  const euCountries = [
    "de", "fr", "it", "es", "nl", "be", "at", "pt", "ie",
    "fi", "gr", "pl", "cz", "hu", "bg", "sk", "hr", "si", "lt", "lv", "ee",
    "lu", "cy", "mt", "dk", "se",
  ];
  const allCountries = [...roCountries, ...euCountries];

  // 1) Service zone — reuse the existing one so we don't end up with two
  //    competing fulfillment sets on the same stock location.
  const [serviceZone] = await fulfillmentModuleService.listServiceZones(
    {},
    { relations: ["geo_zones"], take: 1 }
  );

  if (!serviceZone) {
    throw new Error(
      "No service zone found. Run `npx medusa exec ./src/scripts/seed.ts` first."
    );
  }

  const existingCountries = new Set(
    (serviceZone.geo_zones ?? [])
      .map((z) => z.country_code)
      .filter((c): c is string => !!c)
  );
  const missingCountries = allCountries.filter((c) => !existingCountries.has(c));

  if (missingCountries.length) {
    await updateServiceZonesWorkflow(container).run({
      input: {
        selector: { id: serviceZone.id },
        update: {
          // geo_zones replaces the whole list, so send existing + missing.
          geo_zones: [
            ...Array.from(existingCountries),
            ...missingCountries,
          ].map((country_code) => ({ country_code, type: "country" as const })),
        },
      },
    });
    logger.info(
      `Service zone "${serviceZone.name}": added ${missingCountries.join(", ")}.`
    );
  } else {
    logger.info(`Service zone "${serviceZone.name}" already covers RO + EU.`);
  }

  // 2) Shipping profile + provider used by every option below.
  const [shippingProfile] = await fulfillmentModuleService.listShippingProfiles(
    { type: "default" },
    { take: 1 }
  );
  if (!shippingProfile) {
    throw new Error(
      "No default shipping profile found. Run `npx medusa exec ./src/scripts/seed.ts` first."
    );
  }

  const allOptions = await fulfillmentModuleService.listShippingOptions({});
  const existingOptions = allOptions.filter(
    (o) => o.service_zone_id === serviceZone.id
  );

  // 3) Drop Medusa's demo options — priced in EUR/USD only, so they can never
  //    be picked in a RON cart, and they clutter the admin list.
  const demoNames = ["Standard Shipping", "Express Shipping"];
  const demoOptions = existingOptions.filter((o) => demoNames.includes(o.name));
  if (demoOptions.length) {
    await deleteShippingOptionsWorkflow(container).run({
      input: { ids: demoOptions.map((o) => o.id) },
    });
    logger.info(`Removed demo options: ${demoOptions.map((o) => o.name).join(", ")}.`);
  }

  // 4) The real options. Prices are stored as-is (20 = 20 RON, not bani).
  const wanted = [
    {
      name: "Ridicare personală",
      code: "pickup",
      label: "Ridicare personală",
      description: "Ridici comanda de la sediul Lorikam, gratuit.",
      prices: [
        { currency_code: "ron", amount: 0 },
        { currency_code: "eur", amount: 0 },
      ],
    },
    {
      name: "Cargus",
      code: "cargus",
      label: "Cargus",
      description: "Livrare prin curier Cargus în 1-3 zile lucrătoare.",
      prices: [
        { currency_code: "ron", amount: 25 },
        { currency_code: "eur", amount: 6 },
      ],
    },
  ];

  const missingOptions = wanted.filter(
    (w) => !existingOptions.some((o) => o.name === w.name)
  );

  if (missingOptions.length) {
    await createShippingOptionsWorkflow(container).run({
      input: missingOptions.map((o) => ({
        name: o.name,
        price_type: "flat" as const,
        provider_id: "manual_manual",
        service_zone_id: serviceZone.id,
        shipping_profile_id: shippingProfile.id,
        type: { label: o.label, description: o.description, code: o.code },
        prices: o.prices,
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
          { attribute: "is_return", value: "false", operator: "eq" as const },
        ],
      })),
    });
    logger.info(`Created options: ${missingOptions.map((o) => o.name).join(", ")}.`);
  } else {
    logger.info("Both shipping options already exist.");
  }

  // 5) Backfill: every product must be linked to a shipping profile, or the
  //    cart rejects all shipping methods with "cart items require shipping
  //    profiles that are not satisfied by the current shipping methods".
  //    Products made through the custom "Produse" hub had no link.
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "shipping_profile.id"],
  });

  const unlinked = products.filter((p: any) => !p.shipping_profile?.id);

  if (unlinked.length) {
    await link.create(
      unlinked.map((p: any) => ({
        [Modules.PRODUCT]: { product_id: p.id },
        [Modules.FULFILLMENT]: { shipping_profile_id: shippingProfile.id },
      }))
    );
    logger.info(`Linked ${unlinked.length} product(s) to the default shipping profile.`);
  } else {
    logger.info("All products already have a shipping profile.");
  }

  logger.info("Shipping setup done.");
}

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// Intentionally empty. All store configuration (currencies, regions,
// sales channels, stock locations, tax, products) is done via the admin
// dashboard after deployment.
export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  logger.info("Seed is intentionally empty. Configure the store via the admin dashboard.");
}

import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const isProduction = process.env.NODE_ENV === "production";

// Notification provider: Resend when a key is set, otherwise the local
// (console) provider so the dev server boots without credentials.
const hasResend = !!process.env.RESEND_API_KEY;
const notificationProvider = hasResend
  ? {
      resolve: "./src/modules/resend-notification",
      id: "resend",
      options: {
        channels: ["email"],
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.RESEND_FROM || "Lorikam <onboarding@resend.dev>",
      },
    }
  : {
      resolve: "@medusajs/medusa/notification-local",
      id: "local",
      options: {
        channels: ["email"],
      },
    };

// Stripe payment provider: only register when a key is present, otherwise the
// payment module fails to load ("Required option `apiKey` is missing").
// Without it, the built-in system (manual) provider still allows test checkout.
const stripeProviders = process.env.STRIPE_API_KEY
  ? [
      {
        resolve: "@medusajs/medusa/payment-stripe",
        id: "stripe",
        options: {
          apiKey: process.env.STRIPE_API_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        },
      },
    ]
  : [];

if (isProduction) {
  const required = ["JWT_SECRET", "COOKIE_SECRET", "DATABASE_URL", "STORE_CORS", "ADMIN_CORS", "AUTH_CORS"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars in production: ${missing.join(", ")}`);
  }
  if (process.env.JWT_SECRET === "supersecret" || process.env.COOKIE_SECRET === "supersecret") {
    throw new Error("JWT_SECRET and COOKIE_SECRET must not use the insecure default in production");
  }
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Pool must allow >1 connection: migrations hold one connection for the
    // advisory lock and need another for the migration transaction. A max of
    // 1 deadlocks (transaction acquire times out after 60s, retries forever).
    databaseDriverOptions: {
      pool: { min: 2, max: 10 },
    },
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "./src/modules/shipping-settings",
    },
    {
      resolve: "./src/modules/customer-discount",
    },
    {
      resolve: "./src/modules/color",
    },
    {
      resolve: "./src/modules/team",
    },
    {
      resolve: "./src/modules/variant-preset",
    },
    {
      resolve: "./src/modules/content-page",
    },
    {
      resolve: "./src/modules/site-setting",
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              // Uploaded files are served at <public-backend>/static. Without
              // a real backend URL the provider emits localhost URLs that break
              // in production.
              upload_dir: "static",
              backend_url: `${
                process.env.BACKEND_PUBLIC_URL || "http://localhost:9000"
              }/static`,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [notificationProvider],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: stripeProviders,
      },
    },
  ],
});

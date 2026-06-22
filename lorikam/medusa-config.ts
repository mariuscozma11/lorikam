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
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [notificationProvider],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
  ],
});

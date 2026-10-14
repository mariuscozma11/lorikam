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
          // Automatic capture. The default (false) uses Stripe's manual
          // capture: the PaymentIntent stops at `requires_capture`, the order
          // lands as `authorized`, and somebody has to press Capture in admin
          // for every single order. Stripe releases an uncaptured
          // authorization after about 7 days, so one missed click means the
          // money is never collected and the customer's hold just disappears.
          //
          // The trade-off: with capture on, a cart that fails to complete
          // after the charge needs a refund instead of a free authorization
          // void. That is the better problem to have for a small store.
          capture: true,
        },
      },
    ]
  : [];

// Infrastructure modules backed by Redis.
//
// `projectConfig.redisUrl` below only backs the server's session store. Per
// Medusa's config reference, modules that connect to Redis "aren't affected and
// need their own Redis configuration" — so without these three the production
// boot silently falls back to in-memory implementations and logs:
//
//   Local Event Bus installed. This is not recommended for production.
//   Locking module: Using "in-memory" as default.
//
// That matters here because every customer email is sent from a subscriber:
// with the local event bus they run in-process with no persistence and no
// retry, so a restart or crash between `order.placed` and the Resend call loses
// that order confirmation permanently. Workflow state dies with the container
// for the same reason, and in-memory locking is only safe at all because the
// service is pinned to a single replica.
//
// Registered only when REDIS_URL is set, so `yarn dev` without a local Redis
// still boots on the in-memory defaults — same conditional pattern as the
// Stripe and Resend providers above.
const redisInfraModules = process.env.REDIS_URL
  ? [
      {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: {
          redisUrl: process.env.REDIS_URL,
          jobOptions: {
            // Keep finished jobs for an hour so a failure is still inspectable,
            // without letting the queue grow without bound.
            removeOnComplete: { age: 3600, count: 1000 },
            removeOnFail: { age: 3600, count: 1000 },
          },
        },
      },
      {
        // Note the extra nesting: this module reads options.redis.redisUrl,
        // unlike the event bus which takes options.redisUrl directly.
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: {
          redis: { redisUrl: process.env.REDIS_URL },
        },
      },
      {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl: process.env.REDIS_URL },
            },
          ],
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

  // Warned about, not thrown on: the store still serves pages and takes carts
  // without these, so refusing to boot would be worse than degraded operation.
  // But each one fails silently and invisibly in production, which is why they
  // are shouted about at startup instead.
  //
  //   RESEND_API_KEY missing -> notification falls back to the console provider,
  //     so order confirmations are written to stdout and no customer gets mail.
  //   STRIPE_API_KEY missing -> no payment provider is registered, so checkout
  //     can only complete through the manual provider and no money moves.
  //   REDIS_URL missing -> event bus, workflow engine and locking run in-memory;
  //     emails are lost on restart and the service cannot be scaled past one.
  const degraded: string[] = [];
  if (!process.env.RESEND_API_KEY) degraded.push("RESEND_API_KEY (no customer emails will be sent)");
  if (!process.env.STRIPE_API_KEY) degraded.push("STRIPE_API_KEY (no card payments possible)");
  if (!process.env.REDIS_URL) degraded.push("REDIS_URL (in-memory event bus, emails lost on restart)");
  if (degraded.length) {
    console.warn(
      `[medusa-config] Running in production WITHOUT: ${degraded.join("; ")}`
    );
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
    ...redisInfraModules,
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

const c = require("ansi-colors")

const requiredEnvs = [
  {
    key: "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
    // TODO: we need a good doc to point this to
    description:
      "Learn how to create a publishable key: https://docs.medusajs.com/v2/resources/storefront-development/publishable-api-keys",
  },
  {
    // src/lib/config.ts silently falls back to http://localhost:9000, so a
    // missing value doesn't fail the build — it just ships a storefront that
    // can't reach the backend (and next.config.js then allows no backend
    // image host either). Better to stop here than to find out in production.
    key: "MEDUSA_BACKEND_URL",
    description:
      'Public URL of the Medusa backend, e.g. "https://api.lorikam.com" (no trailing slash).',
  },
  {
    // src/lib/util/env.ts falls back to https://localhost:8000, which ends up
    // baked into canonicals, OG tags, metadataBase and the sitemap.
    key: "NEXT_PUBLIC_BASE_URL",
    description:
      'Public URL of this storefront, e.g. "https://lorikam.com" (no trailing slash).',
  },
]

function checkEnvVariables() {
  const missingEnvs = requiredEnvs.filter(function (env) {
    return !process.env[env.key]
  })

  if (missingEnvs.length > 0) {
    console.error(
      c.red.bold("\n🚫 Error: Missing required environment variables\n")
    )

    missingEnvs.forEach(function (env) {
      console.error(c.yellow(`  ${c.bold(env.key)}`))
      if (env.description) {
        console.error(c.dim(`    ${env.description}\n`))
      }
    })

    console.error(
      c.yellow(
        "\nPlease set these variables in your .env file or environment before starting the application.\n"
      )
    )

    process.exit(1)
  }
}

module.exports = checkEnvVariables

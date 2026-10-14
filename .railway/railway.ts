import {
  bucket,
  defineRailway,
  github,
  group,
  postgres,
  preserve,
  project,
  redis,
  service,
  volume,
} from "railway/iac";

// Lorikam infrastructure, as code.
//
// Scope: the Medusa backend only. The storefront stays on Vercel — it is not
// declared here, and its env vars are managed in the Vercel dashboard (see
// DEPLOY.md, step "Storefront").
//
// Apply with `npm run deploy` (= `railway config apply`). Preview first with
// `npm run plan`. Both commands are non-destructive until you confirm.
//
// NOTE: editors will flag `railway/iac` as unresolved — there is no such
// package on npm (the `railway` name belongs to an unrelated 2012 project).
// The Railway CLI evaluates this file with its own built-in TypeScript engine,
// so `plan` / `apply` work regardless of what the editor thinks.

// Amsterdam. Closest Railway region to RO customers, and keeps EU personal
// data in the EU. The volume must sit in the same region as the service that
// mounts it.
//
// Two different spellings on purpose. A service's replica map accepts the
// region name, but a volume stores the concrete zone Railway placed it in, and
// reports drift against anything else:
//
//   ~ Update backend-static config.region ("europe-west4-drams3a" -> "europe-west4")
//   ! 1 destructive change(s) will remove Railway resources or variables.
//
// Applying that recreates the volume and takes every uploaded image with it, so
// VOLUME_ZONE must stay exactly as Railway reports it. Check with
// `railway volume list` after any region change.
const REGION = "europe-west4";
const VOLUME_ZONE = "europe-west4-drams3a";

// A Railway-generated domain (backend-production-c8c0.up.railway.app) also
// points at this service, for testing before api.lorikam.ro has DNS. It is not
// declared here: Railway generates it outside IaC, and it needs no CORS entry
// because the admin at /app is served by this same service, so its API calls
// are same-origin. Anything cross-origin (a separately hosted admin, or a
// storefront on localhost) does need adding to the lists below.

export default defineRailway(() => {
  const db = postgres("postgres");
  const cache = redis("redis");

  // Product images are written to disk by Medusa's `file-local` provider
  // (see medusa-config.ts). Without a volume they vanish on every redeploy.
  //
  // 500 MB is the per-volume ceiling on the current Railway plan; asking for
  // more fails the whole change set with "Max size of 500 MB on current plan",
  // which also rolls back the service being created alongside it. Raise this
  // after upgrading the plan, or move uploads to R2/S3 (@medusajs/file-s3).
  const uploads = volume("backend-static", { region: VOLUME_ZONE, sizeMB: 500 });

  // Where Postgres point-in-time recovery stores continuous backups. Created by
  // `railway postgres pitr enable`, NOT by this file -- but it must be declared
  // here anyway: anything Railway holds that the config does not mention is
  // treated as removable, and the next apply planned
  //
  //   - Delete bucket Postgres-PITR
  //   ! 1 destructive change(s) will remove Railway resources or variables.
  //
  // which would have deleted the database backups. The name must match exactly
  // what `railway status` reports.
  //
  // The region must also match exactly, or the plan fails with "Bucket region
  // cannot be changed after creation". Read it with `railway bucket info
  // --bucket Postgres-PITR --json`.
  //
  // NOTE: Railway placed this in "sjc" (San Jose, US), not in the EU, even
  // though Postgres runs in europe-west4. These backups contain customer
  // personal data, so under GDPR this is a US transfer. Railway gives no way to
  // pick the bucket region when enabling PITR; moving it means disabling PITR,
  // creating an EU bucket and re-enabling. Flagged, not resolved.
  const pitrBackups = bucket("Postgres-PITR", { region: "sjc" });

  const backend = service("backend", {
    source: github("mariuscozma11/lorikam", {
      branch: "main",
      rootDirectory: "lorikam",
    }),

    // Railway builds lorikam/Dockerfile automatically; the image's CMD starts
    // the server, so no `build` / `start` override belongs here.

    // Migrations run once per deploy, between build and traffic switch —
    // not in the container CMD, which would re-run them on every replica.
    preDeploy: "yarn medusa db:migrate",

    // Medusa serves /health once the server is actually listening. Railway
    // holds the old deploy until this passes, so a failed migration or bad
    // env var never takes the store down.
    healthcheck: "/health",
    // `medusa build` + migrations are slow on a cold start; the 30s default
    // would fail the deploy before the server finishes booting.
    healthcheckTimeout: 300,

    replicas: { [REGION]: 1 },

    volumeMounts: {
      "/app/static": uploads,
    },

    // NOTE: no `domains` here. Railway rejects custom-domain registration from
    // IaC ("Custom-domain registration is not supported by Railway
    // configuration"), even though the docs show a `domains` option. The domain
    // is created once from the CLI instead — scripts/railway-bootstrap.ps1 does
    // it, or by hand:
    //   railway domain api.lorikam.com --service backend --port 9000

    env: {
      NODE_ENV: "production",

      // Railway injects its own PORT. Pinning it to 9000 keeps the container,
      // the Dockerfile's EXPOSE, and the domain's target port in agreement —
      // a mismatch here surfaces as a 502 from the edge proxy, not as an
      // application error, which is a miserable thing to debug.
      PORT: "9000",

      DATABASE_URL: db.env.DATABASE_URL,
      REDIS_URL: cache.env.REDIS_URL,

      // CORS — the storefront is on Vercel, so its own domains go in
      // STORE_CORS, not the Railway one.
      //
      // lorikam.com, not lorikam.ro: lorikam.ro was never registered (it has no
      // nameservers at all), while lorikam.com is the domain the business
      // actually owns. Everything here was originally written against the .ro
      // name, which would never have resolved.
      // localhost:8000 is the storefront's dev port (see its package.json).
      // Kept here on purpose: without it the browser blocks every client-side
      // call from a local storefront against this backend, which makes the one
      // environment where the checkout can actually be rehearsed useless. It
      // grants nothing to a third party - an attacker cannot make a visitor's
      // browser treat their machine as localhost:8000.
      // The Vercel production URL is listed alongside the final domains because
      // the storefront is served from it until lorikam.com is pointed at
      // Vercel. Without it the browser blocks every client-side call from the
      // deployed storefront, which looks like a broken store rather than a
      // CORS problem. Drop it once the custom domain is live.
      STORE_CORS: [
        "https://lorikam.com",
        "https://www.lorikam.com",
        // Vercel's production alias for the project. Note this is the short
        // one: the per-deployment URLs (lorikam-<hash>-...vercel.app) change on
        // every deploy and are not worth listing.
        "https://lorikam.vercel.app",
        "http://localhost:8000",
      ].join(","),
      ADMIN_CORS: "https://api.lorikam.com",
      AUTH_CORS:
        "https://api.lorikam.com,https://lorikam.com,https://www.lorikam.com",

      // Used to build public URLs for uploaded images. Must be the final
      // custom domain, not *.up.railway.app — these URLs are persisted in the
      // database, so they would rot if the domain changed later.
      BACKEND_PUBLIC_URL: "https://api.lorikam.com",

      // Default sender. Can be overridden from the admin UI (Emailuri →
      // Expeditor) without a redeploy. The domain must be verified in Resend
      // or Resend answers 403 and no mail goes out at all.
      RESEND_FROM: "Lorikam <comenzi@lorikam.com>",

      // Secrets live in Railway, never in git. `preserve()` means "keep the
      // value that is already there", so applying this file never clobbers
      // them. Set them once with scripts/railway-bootstrap.ps1, or by hand:
      //   railway variable set JWT_SECRET=... --service backend
      JWT_SECRET: preserve(),
      COOKIE_SECRET: preserve(),
      STRIPE_API_KEY: preserve(),
      STRIPE_WEBHOOK_SECRET: preserve(),
      RESEND_API_KEY: preserve(),
    },
  });

  return project("lorikam", {
    // pitrBackups sits inside the group because Railway created it there,
    // alongside the Postgres service it backs up. Declaring it at top level
    // instead plans a groupId change to null on every apply.
    resources: [group("Backend", [backend, db, cache, pitrBackups]), uploads],
  });
});

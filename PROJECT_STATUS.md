# Lorikam — Project Status & Delivery Plan

_Last updated: 2026-06-10_

Stack: **Medusa v2.13.1** backend (`lorikam/`) + **Next.js 15** storefront (`lorikam-storefront/`).
Market: **Romania + Europe**, currency **RON**, language **Romanian**.

> See **`DELIVERY_PLAN.md`** for: what to test/add, CI/CD, hosting, and the full manual test plan.

---

## ✅ Done (2026-06-10 session)

- **Configurable variant system**: `variantPreset` module (size presets + croi linked to presets), admin settings pages, defaults seeded.
- **Custom product hub** (`Produse`): list → create → edit → delete, fully replacing the native product page. One-step create (croi×size×color variants, price, team/color links, images with per-image color tagging auto-linked, description, personalizare). Reuses all custom widgets as a composed editor.
- **Content CMS** (`contentPage`): admin markdown editor (`Documente`) + storefront legal pages (T&C, privacy, cookies, returns).
- **Designed About page** with hero, story, value cards, animated stats, CTA.
- **Uploadable site graphics** (`siteSetting`): admin `Imagini site` uploads logo, hero, banners, About images, OG image; storefront uses them with fallback.
- **Breadcrumbs** across all shop/product/content pages.
- **Bug fixes**: image→color auto-link (verified), upload endpoint (use built-in), publishable key/region.

---

## ✅ Done earlier (2026-06-02)

### Storefront
- Fixed boot: correct publishable API key + default region `ro` in `.env.local`.
- **Full Romanian translation** of the storefront (~80 files: account, checkout, cart, products, store, common, layout, app metadata). Brand strings switched from "Medusa Store" → "Lorikam".
- **Logo** in navbar (center) and footer (replaces text).
- **New footer**: brand + social (Facebook, Instagram), Fan Shop links, Teams (mapped from API), Legal column, copyright.
- **Homepage rebuilt** (no more blank/collection dependency): Hero (image + CTAs) → Feature highlights → Promo cards (Lorikam/Fan Shop) → Latest products (newest 8) → About teaser.
- **Banners**: Lorikam Shop + Fan Shop pages (full image, no crop). Team page banner fixed to match.
- **Filters**: hide Medusa's "Default" option/value (variant-less products no longer create junk filter).
- **Nav icons**: account (user icon) + cart (bag icon) with **red count badge**.
- Fixed Latest-products pagination off-by-one.

### Backend — production hardening (in scope)
- Multer upload limits (5MB / 5 files); fixed upload encoding (`base64`) so images aren't corrupted.
- Error-message leak gated behind non-production.
- Secrets guard: server refuses to boot in production with missing/`supersecret` JWT/COOKIE/CORS/DB.
- CORS cleaned (`docs.medusajs.com` removed); `.env.template` rewritten for handoff.
- `static/` uploads removed from git + gitignored.
- `seed.ts` emptied (store configured post-deploy via admin); RON/region defaults documented.

### Backend — variant/product system (new)
- **`variantPreset` module**: `SizePreset` (reusable size sets) + `Croi` (configurable cut, linked to a size preset). Migrated. Defaults seeded (Adulți XS–XXXL, Copii 4–14 ani; Bărbați/Femei→Adulți, Copil→Copii).
- **Admin settings pages**: _Presetări mărimi_ and _Croiuri_ (full CRUD).
- **Variant Builder widget** on product page (Croi × Mărime; colors layered by existing color system).
- **Full "Adaugă produs" page**: one form → creates product fully configured (Croi × Mărime × Culoare variants + RON price + team link + color links + sales channel) in one workflow, with rollback.

---

## 🚧 Remaining for client delivery

### 1. Backend production config — _needs keys/decisions, then env-only_
- [x] **Notification provider** (order emails) — Resend module (`src/modules/resend-notification`) + `order.placed` subscriber done. Set `RESEND_API_KEY` + `RESEND_FROM` in prod env (dev falls back to local console provider).
- [ ] **File storage** — confirm deploy target; if multi-instance, add `@medusajs/file-s3` (R2/S3) + keys. Single host w/ persistent volume is OK as-is.
- [ ] **Stripe** — live `STRIPE_API_KEY` + `STRIPE_WEBHOOK_SECRET` in prod env.
- [ ] **Secrets** — generate strong `JWT_SECRET` + `COOKIE_SECRET` (`openssl rand -base64 48`).
- [ ] **CORS** — set real prod domains in `STORE_CORS` / `ADMIN_CORS` / `AUTH_CORS`.

### 2. Deployment
- [ ] Choose host (Railway / VPS+Coolify / Render+Vercel).
- [ ] `npx medusa db:migrate` on prod.
- [ ] `npx medusa exec ./src/scripts/seed-variant-presets.ts` (seed croi/size defaults).
- [ ] Create admin user: `npx medusa user -e <email> -p <pass>`.
- [ ] Configure store in admin: currency RON, regions (Romania + Europe), sales channel, **publishable key → storefront `.env.local`**, stock location.
- [ ] Storefront env: `MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_STRIPE_KEY`, `NEXT_PUBLIC_DEFAULT_REGION=ro`.
- [ ] Domain + SSL for both apps.

### 3. Content / legal — _required for RO ecommerce (ANPC/GDPR)_
- [ ] **Legal pages** (footer links currently 404): Termeni și condiții, Politica de confidențialitate, Politica de cookie-uri, Retururi și rambursări.
- [ ] **About page** (`/about` — About teaser links here).
- [x] **Cookie consent** banner (GDPR) — admin-configurable (text + toggle) via `Setări site`.
- [x] **Social URLs + company data** — admin-editable via `Setări site`; footer reads them; ANPC SAL/SOL links added.
- [ ] Client adds real products, team logos/banners, descriptions, and fills `Setări site` / `Documente`.

### 4. Code cleanup / polish
- [x] Removed dead `featured-products` home component.
- [x] Fixed all storefront TS errors — `npx tsc --noEmit` is green.
- [x] CI added (`.github/workflows/ci.yml`): backend build + storefront typecheck.
- [ ] Decide: keep both the standalone **Variant Builder widget** and the full create page, or drop one.
- [ ] Higher-res hero/banner image (current 1600px softens on large screens).

### 5. QA before handoff
- [ ] Full purchase flow on `/ro`: browse → product (croi→size→color cascade) → cart → checkout → Stripe → order email.
- [ ] Admin flow: create product via "Adaugă produs" → edit stock → publish → appears in storefront.
- [ ] Test on mobile.
- [ ] Verify region/currency/tax (RON VAT 19%).

---

## Notes / decisions made
- **Variant model**: Croi + Mărime as pruned options (only valid combos); colors layered by existing color system; color availability handled by **stock** (0 = unavailable, red-X in selector).
- **Size sets are data** (presets), not hardcoded — client edits in admin.
- Storefront **Croi filter** + cascading selector work automatically (Croi is a standard product option).

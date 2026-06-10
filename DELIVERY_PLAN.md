# Lorikam — Plan de livrare

_Ultima actualizare: 2026-06-10_

Cuprins:
1. [Ce trebuie testat și adăugat](#1-ce-trebuie-testat-și-adăugat)
2. [CI/CD simplu cu open source](#2-cicd-simplu-cu-open-source)
3. [Unde hostăm — raport calitate/preț](#3-unde-hostăm--raport-calitatepreț)
4. [Plan de testare manuală](#4-plan-de-testare-manuală)

---

## 1. Ce trebuie testat și adăugat

### De adăugat înainte de lansare (blocant)
- [ ] **Emailuri tranzacționale** — provider de notificări (Resend recomandat). Fără el clientul nu primește confirmare de comandă / resetare parolă.
- [ ] **Stripe live** — `STRIPE_API_KEY` (live) + `STRIPE_WEBHOOK_SECRET` în prod.
- [ ] **Stocare fișiere prod** — dacă rulezi pe >1 instanță, `@medusajs/file-s3` cu Cloudflare R2. Pe o singură mașină cu volum persistent, e ok și local.
- [ ] **Secrete prod** — `JWT_SECRET`, `COOKIE_SECRET` (`openssl rand -base64 48`).
- [ ] **CORS prod** — domeniile reale în `STORE_CORS` / `ADMIN_CORS` / `AUTH_CORS`.
- [ ] **Banner consimțământ cookie-uri** (GDPR) — pagina de politică există, lipsește bannerul.
- [ ] **Date reale** — completează paginile legale (CUI, adresă, ANPC/SOL) din `Documente`, URL-uri reale social în footer, grafica reală din `Imagini site`.

### De adăugat (important, nu blocant)
- [ ] **SEO**: `sitemap.xml`, `robots.txt`, meta description per pagină, date structurate (Product schema.org).
- [ ] **Analytics**: Google Analytics 4 + Meta Pixel.
- [ ] **Monitorizare erori**: Sentry (free tier) pe backend + storefront.
- [ ] **ReCAPTCHA / rate-limit** pe login și formulare (sau Cloudflare în față).

### Curățenie cod
- [ ] Erori TS preexistente (`filters.ts:249`, `fan-shop templates` `id`, checkout `service_zone`) — blochează un `next build` curat.
- [ ] Șterge componenta moartă `home/components/featured-products`.

### Teste automate de adăugat (vezi §2 pentru rulare în CI)
- [ ] **Unit** (Vitest/Jest): `lib/util/filters.ts`, helpers preț, `extractProductOptions`.
- [ ] **Integration** (Medusa test-utils): rute custom — `/admin/products/full-create`, `/store/teams`, `/store/content-pages/:slug`, `/store/site-settings`.
- [ ] **E2E** (Playwright): flux complet `/ro` — browse → produs → coș → checkout (Stripe test).

---

## 2. CI/CD simplu cu open source

**Scule:** GitHub Actions (gratuit) + Docker + Coolify/Dokploy (PaaS self-host, open source) sau Render.

### Pipeline propus
- **La PR / push**: lint + typecheck + build (ambele proiecte). Blochează merge dacă pică.
- **La push pe `main`**: deploy automat (webhook către Coolify/Render).

### `.github/workflows/ci.yml` (punct de plecare)
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  backend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: lorikam } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: yarn, cache-dependency-path: lorikam/yarn.lock }
      - run: yarn install --frozen-lockfile
      - run: yarn build        # medusa build (type-checks + compilează)
  storefront:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: lorikam-storefront } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: yarn, cache-dependency-path: lorikam-storefront/yarn.lock }
      - run: yarn install --frozen-lockfile
      - run: npx tsc --noEmit   # typecheck (după ce rezolvi erorile preexistente)
      - run: yarn build
```
> Notă: `next build` are nevoie de erorile TS preexistente rezolvate. Până atunci, rulează doar `tsc --noEmit` informativ (fără să blocheze) sau ține pasul de storefront pe `continue-on-error: true`.

### Deploy (cel mai simplu)
- **Coolify/Dokploy**: conectezi repo-ul GitHub → auto-deploy la push pe `main`. Build via Dockerfile sau buildpack. Zero YAML de deploy.
- **Render**: „Blueprint" `render.yaml`, auto-deploy la push.
- **Railway**: conectezi repo → deploy automat.

---

## 3. Unde hostăm — raport calitate/preț

### Recomandare principală (cel mai bun preț/perf) — VPS + Coolify
| Componentă | Soluție | Cost/lună |
|-----------|---------|-----------|
| Server | **Hetzner CX22** (2 vCPU, 4GB) cu **Coolify** | ~€4–5 |
| Postgres | pe același VPS (container) sau **Neon** free | €0 |
| Redis | pe VPS (opțional — momentan in-memory) | €0 |
| Storefront | **Vercel** (Hobby, gratuit) | €0 |
| Fișiere | **Cloudflare R2** (egress gratuit) | ~€0 |
| Email | **Resend** (3k/lună gratuit) | €0 |
| **Total** | | **~€5/lună** |

Coolify (open source) îți dă experiență tip Heroku pe serverul tău: deploy din GitHub, SSL automat (Let's Encrypt), backups, logs.

### Alternativă „zero DevOps" — Railway / Render
- **Railway**: backend + Postgres + Redis click-deploy, ~$10–25/lună. Cel mai puțin efort.
- **Render**: backend (~$7) + Postgres (~$7) + storefront pe Vercel. ~$15/lună.

### Verdict pentru Lorikam (B2B-first, volum online mic)
**Hetzner + Coolify + Vercel + R2 + Resend ≈ €5/lună** = cel mai bun raport. Dacă vrei zero mentenanță și plătește clientul, **Railway**.

---

## 4. Plan de testare manuală

Testează pe `/ro`. Marchează ✅/❌.

### Storefront — public
- [ ] **Home**: hero + CTA, highlights, promo cards (Lorikam/Fan Shop), produse noi, about teaser, footer.
- [ ] **Limbă/monedă**: tot textul în RO, prețuri în RON.
- [ ] **Navigare**: logo → home, meniu shop, iconițe cont + coș, badge roșu coș.
- [ ] **Breadcrumbs**: apar pe shop, produs, colecție, categorie, Lorikam, Fan Shop, echipă, legal, about (NU pe home).
- [ ] **Magazin** (`/store`): grid produse, filtre (culoare, croi, mărime, preț), sortare. „Default" NU apare ca filtru.
- [ ] **Produs**: galerie imagini, selector Croi → Mărime → Culoare (cascadă, indisponibile cu X roșu), preț, personalizare (nume/număr), adaugă în coș, descriere markdown.
- [ ] **Fan Shop**: banner, listă echipe, pagină echipă cu branding (culori/logo/banner), produse echipă.
- [ ] **Lorikam Shop**: banner, produse fără echipă.
- [ ] **Coș**: adaugă/șterge, cantități, sumar, reducere colaborator (dacă e cazul).
- [ ] **Checkout**: adresă, livrare, plată Stripe (test card `4242…`), plasare comandă, pagină confirmare.
- [ ] **Cont**: register, login, profil, adrese, istoric comenzi.
- [ ] **Pagini**: About (hero, story, stats animate, CTA), Termeni, Confidențialitate, Cookie-uri, Retururi.
- [ ] **Mobil**: hamburger, layout responsive, bannere full.

### Admin — `/app`
- [ ] **Login** cu adminul.
- [ ] **Produse** (hub): listă + căutare; **Adaugă produs** → nume, status, echipă, preț, croiuri+mărimi, culori, imagini cu tag culoare, descriere, personalizare (chip-uri predefinite) → creare → imaginile apar pe culorile corecte.
- [ ] **Editor produs**: detalii, echipă, constructor variante, culori, imagini (upload + asociere), stoc, descriere, personalizare, **șterge produs**.
- [ ] **Croiuri** + **Presetări mărimi**: CRUD, relația croi→preset.
- [ ] **Culori**: CRUD, generare variante automată.
- [ ] **Documente**: editează T&C etc. în markdown → se văd pe storefront.
- [ ] **Imagini site**: încarcă logo/hero/bannere/about/OG → se schimbă pe storefront.
- [ ] **Echipe**: CRUD, logo/banner, link produse.
- [ ] **Stoc**: setează cantități per variantă/locație → se reflectă pe storefront (în stoc / epuizat).
- [ ] **Reduceri client** + **Setări livrare**.

### Verificări finale pre-lansare
- [ ] Email confirmare comandă ajunge.
- [ ] Webhook Stripe confirmă plata (status comandă).
- [ ] TVA 19% RO aplicat corect.
- [ ] Domeniu + SSL pe ambele aplicații.
- [ ] Parola de protecție storefront scoasă (dacă a fost).

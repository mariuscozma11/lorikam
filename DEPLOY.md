# Lorikam — Deploy pe Coolify (VPS) cu Docker

Stack: backend Medusa (`lorikam/`) + storefront Next.js (`lorikam-storefront/`), ambele cu Dockerfile, plus Postgres și Redis. Recomandat: **Hetzner CX22** (2 vCPU / 4GB) cu **Coolify**.

> Ordinea contează: **DB/Redis → backend → config store → storefront**. Storefront-ul se construiește cu date din backend (SSG), deci backendul trebuie să fie deja public când buildezi storefront-ul.

---

## 0. Pregătire server
1. VPS curat (Ubuntu 22.04+). Instalează Coolify: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`.
2. Pointează domeniile (DNS A record):
   - `api.lorikam.ro` → IP server (backend)
   - `lorikam.ro` + `www` → IP server (storefront)
3. În Coolify: conectează contul GitHub (sau deploy key) la repo.

---

## 1. Bază de date + Redis (Coolify → Resources)
- **PostgreSQL** (Coolify one-click). Notează `DATABASE_URL` intern.
- **Redis** (Coolify one-click). Notează `REDIS_URL` intern.

---

## 2. Backend (Coolify → New Resource → Application, din Git)
- **Base directory:** `lorikam`
- **Build pack:** Dockerfile (`lorikam/Dockerfile`)
- **Port:** `9000`
- **Persistent storage:** montează un volum la `/app/static` (imagini încărcate prin file provider local).
- **Environment variables:**

```
NODE_ENV=production
DATABASE_URL=postgres://...        # din resursa Postgres
REDIS_URL=redis://...              # din resursa Redis
JWT_SECRET=<openssl rand -base64 48>
COOKIE_SECRET=<openssl rand -base64 48>
STORE_CORS=https://lorikam.ro,https://www.lorikam.ro
ADMIN_CORS=https://api.lorikam.ro
AUTH_CORS=https://api.lorikam.ro,https://lorikam.ro,https://www.lorikam.ro
# Stripe (test pentru teste, live la lansare)
STRIPE_API_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
# Email (fără cheie => provider local/consolă)
RESEND_API_KEY=re_...
RESEND_FROM=Lorikam <comenzi@lorikam.ro>
```

- **Domain:** `https://api.lorikam.ro` (Coolify face SSL automat).
- Deploy. La pornire rulează automat `medusa db:migrate` (vezi `CMD` din Dockerfile).

### 2b. Config one-time (Coolify → Terminal pe containerul backend)
```bash
# seed presetări croi/mărimi
npx medusa exec ./src/scripts/seed-variant-presets.ts
# user admin
npx medusa user -e admin@lorikam.ro -p <parolă-puternică>
```
Apoi intră în **admin** `https://api.lorikam.ro/app` și configurează:
- Regiune **Romania** (+ Europe), monedă **RON**, tax 19%.
- **Sales channel** + **Stock location**.
- **Publishable key** (Settings → API keys) → o folosești la storefront (pasul 3).
- Webhook Stripe → `https://api.lorikam.ro/hooks/payment/stripe` (copiază secretul în `STRIPE_WEBHOOK_SECRET`).

---

## 3. Storefront (Coolify → New Resource → Application, din Git)
- **Base directory:** `lorikam-storefront`
- **Build pack:** Dockerfile (`lorikam-storefront/Dockerfile`)
- **Port:** `8000`
- **Build arguments** (necesare la BUILD — SSG):

```
MEDUSA_BACKEND_URL=https://api.lorikam.ro
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...   # din admin, pasul 2b
NEXT_PUBLIC_BASE_URL=https://lorikam.ro
NEXT_PUBLIC_DEFAULT_REGION=ro
NEXT_PUBLIC_STRIPE_KEY=pk_...               # Stripe publishable
```

- **Environment variables** (la RUNTIME — aceleași valori; `MEDUSA_BACKEND_URL` și `NEXT_PUBLIC_*` se folosesc și server-side):

```
MEDUSA_BACKEND_URL=https://api.lorikam.ro
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_BASE_URL=https://lorikam.ro
NEXT_PUBLIC_DEFAULT_REGION=ro
NEXT_PUBLIC_STRIPE_KEY=pk_...
```

- **Domain:** `https://lorikam.ro` (+ www). Deploy.

---

## 4. După deploy — date reale (din admin)
- **Setări site:** date firmă (CUI, reg., adresă, email, telefon), social, text cookie, `seo_title/description`, `ga4_id`, `meta_pixel_id`.
- **Documente:** Termeni, Confidențialitate, Cookie-uri, Retururi.
- **Imagini site:** logo, hero, bannere, OG.
- **Produse + Echipe.**

---

## 5. Verificări finale
- [ ] `https://api.lorikam.ro/health` răspunde; admin `/app` se loghează.
- [ ] Storefront `https://lorikam.ro/ro` încarcă; `sitemap.xml` + `robots.txt` ok.
- [ ] Flux complet: produs → coș → checkout → plată Stripe (test) → email confirmare (Resend).
- [ ] Webhook Stripe confirmă comanda (status în admin).
- [ ] Analytics apar doar după accept cookie.
- [ ] Auto-deploy: push pe `main` → Coolify rebuildează (activează webhook în Coolify).

---

## Note
- **CI** (`.github/workflows/ci.yml`) rulează build backend + typecheck storefront la fiecare push/PR — ține-l ca gate înainte de deploy.
- **Backups:** activează backup automat pe resursa Postgres în Coolify.
- **Scalare:** dacă treci pe >1 instanță backend, scoate `db:migrate` din `CMD` și rulează-l ca pas separat, + mută fișierele pe S3/R2 (`@medusajs/file-s3`).

# Lorikam — Deploy pe Railway (din terminal)

Backend-ul Medusa (`lorikam/`) + Postgres + Redis rulează pe **Railway**, descrise
ca infrastructure-as-code în [`.railway/railway.ts`](.railway/railway.ts).
Storefront-ul (`lorikam-storefront/`) rămâne pe **Vercel** — nu e declarat în
Railway, se configurează din dashboard-ul Vercel (pasul 6).

Tot deploy-ul se face din terminal. Nu e nevoie de click-uri în dashboard
decât pentru DNS și configurarea magazinului din admin.

---

## 0. Scule pe mașina locală (o singură dată)

```bash
node --version      # trebuie 22+
railway --version   # 5.58+
npm install         # în rădăcina repo-ului — instalează SDK-ul railway
```

Dacă lipsesc:

```bash
winget install --id OpenJS.NodeJS.22 --source winget
npm install -g @railway/cli
```

### Windows: `npm` blocat de execution policy

Pe un Windows curat, toate scope-urile sunt `Undefined`, deci politica efectivă
e `Restricted` și shim-ul `npm.ps1` nu poate porni:

```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running
scripts is disabled on this system.
```

Fix durabil (nu cere admin):

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Alternativ, fără să schimbi nimic: folosește `npm.cmd run <script>` în loc de
`npm run <script>` — `.cmd` nu trece prin shim-ul PowerShell.

**Node 22+ e obligatoriu local**, deși aplicația rulează pe Node 20. CLI-ul
evaluează `.railway/railway.ts` cu `node --experimental-strip-types`, flag care
nu există în Node 20 (`node: bad option`). Nu afectează producția: imaginea se
construiește tot din `node:20-slim`, iar CI-ul rămâne pe 20.

`npm install` în rădăcină e și el obligatoriu — `.railway/railway.ts` importă
`railway/iac` din pachetul `railway` (3.x). Atenție la versiune: pe npm există
și un `railway@1.x` complet nelegat (un framework MVC din 2012), iar un pin de
tip `^1.0.0` instalează ăla și `bin`-ul lui umbrește CLI-ul real. `package.json`
cere `^3.11.0`.

### Windows: de ce comenzile merg prin `npm run`

SDK-ul `railway/iac` verifică versiunea CLI-ului cu
`execFileSync(process.env._ || "railway", ["--version"])`. Pe Windows `process.env._`
nu există, iar `railway` se rezolvă la `railway.cmd` / `railway.ps1` — care nu
sunt executabile, deci `execFileSync` crapă și SDK-ul raportează greșit:

```
Error: This version of railway/iac requires Railway CLI 5.42.1 or newer.
```

`scripts/_railway-env.ps1` rezolvă `railway.exe` real și setează `$env:_`. Toate
scripturile din `package.json` trec prin el, deci folosește `npm run plan` /
`npm run deploy`, nu `railway config ...` direct. Restul comenzilor (`logs`,
`ssh`, `domain`) funcționează și direct — doar comenzile `config *` au nevoie de
fix.

---

## 1. Login

```bash
railway login
```

Deschide browserul. În sesiuni headless: `railway login --browserless`.

---

## 2. Chei third-party → `.env.railway`

Secretele nu stau în git. Creează `.env.railway` în rădăcina repo-ului
(e în `.gitignore`):

```
STRIPE_API_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

`JWT_SECRET` și `COOKIE_SECRET` **nu** se pun aici — se generează automat la
pasul 3 și nu trebuie să le vadă nimeni.

> `RESEND_FROM` e deja în `.railway/railway.ts` (`comenzi@lorikam.com`).
> Domeniul trebuie verificat în Resend, altfel Resend răspunde 403 și nu pleacă
> niciun email. Expeditorul se poate schimba ulterior din admin
> (**Emailuri → Expeditor**), fără redeploy.

---

## 3. Bootstrap

Vezi întâi ce s-ar schimba (read-only):

```bash
npm run plan
```

Apoi:

```bash
npm run bootstrap
```

Face, în ordine:

1. verifică CLI-ul, SDK-ul și login-ul;
2. `railway init --name lorikam` dacă directorul nu e deja legat la un proiect;
3. `railway config apply` — creează Postgres, Redis, volumul `backend-static` și
   serviciul `backend` (îți arată planul și cere confirmare înainte);
4. adaugă domeniul `api.lorikam.ro` pe portul 9000;
5. generează `JWT_SECRET` + `COOKIE_SECRET`, citește restul din `.env.railway`;
6. redeploy cu variabilele noi.

`npm run bootstrap -- -Yes` sare peste confirmare (pentru rulări scriptate),
`-Force` suprascrie secretele existente, `-SkipApply` atinge doar domeniul +
variabilele.

Scriptul e idempotent — poate fi rulat din nou. Secretele deja setate nu se
suprascriu decât cu `-Force`.

> **Primul deploy pică și e normal.** Serviciul se creează la pasul 3 înainte ca
> secretele să existe, iar `medusa-config.ts` refuză să pornească în producție
> fără `JWT_SECRET` / `COOKIE_SECRET`. Pasul 4 le setează, pasul 5 redeployează,
> și de acolo e verde. Nu opri scriptul între timp.

Ce e declarat în `.railway/railway.ts`, dacă vrei să verifici înainte:

| Resursă | Detaliu |
|---|---|
| `postgres` / `redis` | plugin-uri Railway; `DATABASE_URL` / `REDIS_URL` se injectează prin referință, nu copiate manual |
| volum `backend-static` | montat la `/app/static` — imaginile de produs scrise de provider-ul `file-local` (vezi `medusa-config.ts`). Fără el se pierd la fiecare redeploy |
| `backend` | build din `lorikam/Dockerfile`, healthcheck `/health`, regiune `europe-west4` (Amsterdam) |
| migrații | `preDeploy: yarn medusa db:migrate` — o dată per deploy, nu per container |
| domeniu | **nu** e în IaC — Railway refuză înregistrarea de domenii custom din `config apply` („Custom-domain registration is not supported by Railway configuration"), deși documentația arată o opțiune `domains`. Se adaugă din CLI, la pasul 4 |
| `PORT=9000` | fixat ca să corespundă cu `EXPOSE 9000` și cu portul domeniului; un mismatch aici apare ca 502 din edge proxy, nu ca eroare de aplicație |

---

## 4. Domeniu custom + DNS

Domeniul e adăugat de `npm run bootstrap` (pasul 4). Ia CNAME-ul:

```bash
npm run domain
```

### Testare înainte de DNS

Nu trebuie să aștepți DNS-ul ca să testezi. Generează un domeniu Railway din
dashboard (**serviciul backend → Settings → Networking → Generate Domain**,
port `9000`) și folosește-l ca `https://<ceva>.up.railway.app`. Backend-ul și
admin-ul (`/app`) funcționează acolo fără schimbări de CORS, fiindcă admin-ul e
servit de același serviciu — deci cererile lui sunt same-origin.

CLI-ul **nu** poate genera domeniul dacă serviciul are deja unul custom
(`railway domain` întoarce domeniul existent), de aceea pasul e din dashboard.

Ce rămâne legat de `api.lorikam.ro`: `BACKEND_PUBLIC_URL`. Imaginile încărcate
primesc URL-uri `https://api.lorikam.ro/static/...` salvate **în baza de date**,
deci nu se vor afișa până când DNS-ul e activ. Nu încărca imagini de produs
definitive înainte de DNS (sau schimbă temporar `BACKEND_PUBLIC_URL` pe domeniul
Railway și reîncarcă-le mai târziu).

Pune-l în DNS. SSL e automat după ce propagă.

`ADMIN_CORS` / `AUTH_CORS` / `BACKEND_PUBLIC_URL` sunt deja setate pe domeniul
final. `BACKEND_PUBLIC_URL` trebuie să rămână domeniul definitiv, **nu**
`*.up.railway.app` — URL-urile imaginilor se salvează în baza de date și s-ar
strica la schimbarea domeniului.

---

## 5. Configurare magazin (o singură dată)

Necesită un backend live și sănătos:

```bash
npm run setup:store
```

Prima dată ai nevoie de o cheie SSH înregistrată la Railway:

```bash
ssh-keygen -t ed25519            # dacă nu ai deja ~/.ssh/id_ed25519
railway ssh keys add             # înregistrează cheia
```

Fără ea: `No registered SSH keys found`.

Rulează, în ordine (toate idempotente):

| Script | Ce face |
|---|---|
| `seed` | monede (RON default + EUR), regiunile **Romania** / **Europa**, 27 regiuni de taxe, stock location „Depozit principal", fulfillment set „Livrare Lorikam" **cu service zone**. Afișează și **publishable key**-ul pentru storefront. |
| `seed-variant-presets` | presetări croi / mărimi |
| `setup-shipping` | zone RO+EU, metodele Ridicare personală + Cargus |
| `setup-tax` | TVA 21% RO, prețuri cu TVA inclus pe ambele regiuni |
| `medusa user` | user admin (parola afișată o singură dată) |

> **Ordinea nu e opțională.** `setup-shipping` are nevoie de service zone-ul creat
> de `seed`; fără el se oprește cu `No service zone found. Run seed.ts first.`

> **Scripturile sunt `.js` în container, nu `.ts`.** Imaginea rulează
> `.medusa/server`, adică output-ul compilat de `medusa build`. Scriptul încearcă
> `.js`, apoi `.ts`, și afișează conținutul directorului dacă nu găsește nimic.

> **Merge non-interactiv.** Foloseşte `ssh` simplu prin blocul de config generat
> de `railway ssh config`, nu `railway ssh` — acela cere TTY și se blochează fără
> el, fără niciun mesaj. Deci poate rula și din CI sau de un agent.
>
> Comenzi ad-hoc în container, tot fără TTY:
> ```bash
> ssh railway-backend "npx medusa exec ./src/scripts/seed-colors.js"
> ```

> **`npx medusa user` întoarce exit 0 chiar și când eșuează** (ex. email deja
> existent, care doar loghează un MedusaError). Scriptul se uită la output, nu la
> exit code — altfel raporta succes și afișa o parolă care nu fusese setată.
> Dacă userul există deja, parola **nu** se schimbă.

Apoi în admin, pe domeniul backend-ului, la `/app`:

- **Publishable key** — deja afișată de `seed` (`pk_...`), sau din Settings → API keys → pasul 6
- Webhook Stripe → `https://api.lorikam.ro/hooks/payment/stripe_stripe`
  Ruta e `/hooks/payment/{provider_id}_{id}`. Cu `/hooks/payment/stripe` Medusa
  caută `pp_stripe`, întoarce 200, dar în log apare `Could not resolve 'pp_stripe'`
  și plata nu se capturează.

---

## 6. Storefront (Vercel)

În **Vercel → Project Settings → Environment Variables** (Production):

```
MEDUSA_BACKEND_URL=https://api.lorikam.ro
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...   # din admin, pasul 5
NEXT_PUBLIC_BASE_URL=https://lorikam.ro
NEXT_PUBLIC_DEFAULT_REGION=ro
NEXT_PUBLIC_STRIPE_KEY=pk_...
```

**Redeploy cu rebuild, obligatoriu.** `MEDUSA_BACKEND_URL` se folosește și la
build — storefront-ul prerenderează pagini (categorii, produse) prin
`generateStaticParams`, cu date din backend. Un redeploy care refolosește
cache-ul de build nu ia valorile noi pentru paginile statice.

---

## 7. Deploy-uri următoare

| Ce schimbi | Ce rulezi |
|---|---|
| cod backend | `git push` pe `main` — Railway redeployează singur |
| infra sau variabile din `.railway/railway.ts` | `npm run plan`, apoi `npm run deploy` |
| doar un redeploy la ultimul commit | `npm run redeploy` |
| cod storefront | `git push` — Vercel redeployează singur |

---

## 8. Comenzi utile

```bash
npm run logs          # log-uri de runtime
npm run logs:build    # log-uri de build
npm run status        # ce există în proiect
npm run vars          # variabilele serviciului backend
npm run shell         # shell în containerul backend
npm run migrate       # migrații manuale
npm run db            # psql în Postgres (cere psql local)
```

---

## 9. Verificări finale

- [ ] `https://api.lorikam.ro/health` răspunde; admin `/app` se loghează
- [ ] Storefront `https://lorikam.ro/ro` încarcă; `sitemap.xml` + `robots.txt` ok
- [ ] Flux complet: produs → coș → checkout → plată Stripe (test) → email confirmare
- [ ] Webhook Stripe confirmă comanda (status în admin)
- [ ] Upload imagine în admin → URL-ul generat e `https://api.lorikam.ro/static/...`
- [ ] Imaginea supraviețuiește unui `npm run redeploy` (confirmă volumul)
- [ ] Analytics apar doar după accept cookie
- [ ] Push pe `main` → deploy automat

---

## Note

- **CI** (`.github/workflows/ci.yml`) rulează build backend + typecheck storefront
  la fiecare push/PR. Ține-l ca gate înainte de deploy.
- **Backups:** activează backup automat pe serviciul Postgres din dashboard-ul
  Railway (nu e încă exprimabil în IaC).
- **Fișiere la scară:** volumul de la `/app/static` e legat de un singur serviciu.
  La >1 replică, trece pe `@medusajs/file-s3` (Cloudflare R2 / S3) — migrațiile
  sunt deja scoase din `CMD`, deci restul e gata pentru multi-instanță.
- **Middleware storefront:** `lorikam-storefront/src/middleware.ts` apelează
  `getRegionMap(...)` fără try/catch (linia ~115). Dacă backend-ul nu răspunde,
  excepția iese ca `MIDDLEWARE_INVOCATION_FAILED` (500) pe **toate** paginile,
  pentru că middleware-ul rulează la fiecare request din matcher. Cu backend-ul
  funcțional nu se vede, dar dacă vrei fail-open în loc de 500 total, se poate
  adăuga un try/catch acolo — spune și îl fac separat.
- **Plan B (VPS):** ghidul vechi de Coolify a fost scos. E în istoricul git dacă
  e nevoie vreodată: `git log --all -- DEPLOY.md`.

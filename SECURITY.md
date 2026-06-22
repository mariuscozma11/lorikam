# Securitate — audit dependențe

_Ultima rulare: 2026-06-22 (`yarn npm audit --all --recursive`)_

## Acțiuni făcute
- **Medusa** `2.13.1 → 2.16.0` (backend) — fix oficial pentru CVE-uri în mikro-orm, multer, path-to-regexp etc.
- **Next.js** `15.3.9 → 15.5.19` (storefront) — fix CVE-uri Next.
- **Resolutions** (override-uri sigure, același major, patch drop-in):
  - backend: `fast-xml-parser 4.5.6`, `form-data 4.0.6`, `protobufjs 7.6.4`
  - storefront: `flatted 3.4.2`
- Rezultat: **0 vulnerabilități `critical`** pe ambele proiecte. Build-uri verzi.

## Ce a rămas (și de ce)
Restul avizelor (`high`/`moderate`/`low`) sunt **transitive** — nu sunt dependențele noastre directe, ci ale framework-ului. Nu pot fi forțate fără a strica framework-ul; se rezolvă când Medusa/Next lansează versiuni noi. Categorii:

1. **Scule de build/dev — NU rulează în producție** (cea mai mare parte): `vite`, `webpack`, `esbuild`, `rollup`, `@babel/*`, `eslint`, `jest`, `node-gyp`/`tar`, `@medusajs/test-utils`, `ts-node`. Imaginea de producție conține doar `.medusa/server` (deps runtime) + Next standalone, deci acestea nu sunt suprafață de atac live.
2. **OpenTelemetry / gRPC** (`@grpc/*`): folosite doar dacă activezi instrumentarea OTEL — noi nu o folosim.
3. **AWS SDK** (`@aws-sdk/*`): tras tranzitiv; relevant doar la file provider S3 (neactivat).
4. **Frunze runtime cu ReDoS, exploatabilitate mică** (`minimatch`, `brace-expansion`, `picomatch`, `qs`, `lodash`): pinning-ul peste mai multe majore ar strica framework-ul; risc real mic pentru un shop B2B cu volum mic.

## Mentenanță recomandată
- Rulează `yarn npm audit --all --recursive` periodic (e și parte din review-ul pre-deploy).
- La fiecare release Medusa/Next: `yarn up @medusajs/* next`, apoi build + typecheck.
- **Cloudflare** în fața site-ului (WAF + rate-limit) — acoperă cele mai multe vectori rămași la nivel de rețea.
- Reevaluează `resolutions` la upgrade de framework (s-ar putea să nu mai fie necesare).

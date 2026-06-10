import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CONTENT_PAGE_MODULE } from "../modules/content-page"
import ContentPageModuleService from "../modules/content-page/service"

// Idempotent: seeds default content pages (legal + about) if missing.
// Run: npx medusa exec ./src/scripts/seed-content-pages.ts
export default async function seedContentPages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const service: ContentPageModuleService = container.resolve(
    CONTENT_PAGE_MODULE
  )

  const defaults: {
    slug: string
    title: string
    content: string
  }[] = [
    {
      slug: "termeni-si-conditii",
      title: "Termeni și condiții",
      content: `_Ultima actualizare: [DATĂ]_

## 1. Informații generale

Acest site este deținut și operat de **[DENUMIRE FIRMĂ S.R.L.]**, CUI **[CUI]**, înregistrată la Registrul Comerțului cu nr. **[J__/____/____]**, cu sediul în **[ADRESĂ]**.

## 2. Acceptarea termenilor

Prin utilizarea acestui site și plasarea unei comenzi, accepți prezentii termeni și condiții.

## 3. Produse și prețuri

Prețurile sunt exprimate în RON și includ TVA. Ne rezervăm dreptul de a modifica prețurile fără notificare prealabilă.

## 4. Comenzi și plată

[Descrie procesul de comandă și metodele de plată acceptate.]

## 5. Livrare

[Descrie condițiile și termenele de livrare.]

## 6. Dreptul de retragere

Conform legislației în vigoare, ai dreptul de a returna produsele în termen de 14 zile. Vezi [Politica de retur](/retururi).

## 7. Contact

Pentru orice întrebare: **[email@exemplu.ro]**.`,
    },
    {
      slug: "politica-de-confidentialitate",
      title: "Politica de confidențialitate",
      content: `_Ultima actualizare: [DATĂ]_

## Operator de date

**[DENUMIRE FIRMĂ S.R.L.]**, CUI **[CUI]**, cu sediul în **[ADRESĂ]**, prelucrează datele tale cu caracter personal în conformitate cu Regulamentul (UE) 2016/679 (GDPR).

## Ce date colectăm

- Date de identificare și contact (nume, email, telefon, adresă)
- Date privind comenzile și plățile
- Date tehnice (cookie-uri, adresă IP)

## Scopul prelucrării

- Procesarea și livrarea comenzilor
- Comunicări legate de cont și comenzi
- Obligații legale și fiscale

## Drepturile tale

Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție. Pentru exercitarea lor, contactează-ne la **[email@exemplu.ro]**.

## Plângeri

Te poți adresa Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP).`,
    },
    {
      slug: "politica-cookie-uri",
      title: "Politica de cookie-uri",
      content: `_Ultima actualizare: [DATĂ]_

## Ce sunt cookie-urile

Cookie-urile sunt fișiere mici stocate pe dispozitivul tău pentru a îmbunătăți experiența de navigare.

## Ce cookie-uri folosim

- **Esențiale:** necesare pentru funcționarea site-ului (coș, sesiune)
- **De analiză:** ne ajută să înțelegem cum este folosit site-ul
- **De marketing:** [dacă este cazul]

## Gestionarea cookie-urilor

Poți controla și șterge cookie-urile din setările browserului. Dezactivarea unor cookie-uri poate afecta funcționarea site-ului.

## Contact

Pentru întrebări: **[email@exemplu.ro]**.`,
    },
    {
      slug: "retururi",
      title: "Retururi și rambursări",
      content: `_Ultima actualizare: [DATĂ]_

## Dreptul de retragere

Conform O.U.G. 34/2014, ai dreptul de a returna produsele în termen de **14 zile** de la primire, fără a fi nevoie să justifici decizia.

## Cum returnezi

1. Contactează-ne la **[email@exemplu.ro]** cu numărul comenzii.
2. Ambalează produsul în starea originală, cu etichetele atașate.
3. Expediază produsul la adresa **[ADRESĂ RETUR]**.

## Rambursarea

Banii sunt returnați în maximum 14 zile de la primirea produsului returnat, prin aceeași metodă de plată.

## Produse exceptate

[Listează produsele care nu pot fi returnate, dacă este cazul — ex. produse personalizate.]

## Contact

**[email@exemplu.ro]** · **[+40 7xx xxx xxx]**`,
    },
  ]

  let created = 0
  for (const def of defaults) {
    const [existing] = await service.listContentPages({ slug: def.slug })
    if (existing) continue
    await service.createContentPages({
      slug: def.slug,
      title: def.title,
      content: def.content,
      is_published: true,
    })
    created++
  }

  logger.info(
    created > 0
      ? `Seeded ${created} content page(s).`
      : "Content pages already present, nothing to seed."
  )
}

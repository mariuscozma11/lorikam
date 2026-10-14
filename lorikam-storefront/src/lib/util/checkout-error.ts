// Medusa and Stripe answer in English, and Next.js replaces the message of any
// error *thrown* inside a Server Action with a generic English sentence in
// production. Either way an English string would land in front of a Romanian
// customer at the exact moment of paying, so map the cases we actually see and
// fall back to a Romanian sentence instead of leaking the raw text.
const GENERIC_ERROR =
  "Ceva nu a funcționat. Te rugăm să încerci din nou în câteva momente sau să ne contactezi."

// Matched in order, so the more specific patterns come first.
const TRANSLATIONS: [RegExp, string][] = [
  [
    /out of stock|insufficient inventory|not enough inventory|does not have the required inventory|inventory quantity/i,
    "Unul dintre produsele din coș nu mai este disponibil în cantitatea cerută. Te rugăm să actualizezi coșul și să reiei comanda.",
  ],
  [
    /tax|taxes could not|tax calculation/i,
    "Nu am putut calcula TVA-ul pentru comanda ta. Te rugăm să încerci din nou în câteva momente.",
  ],
  [
    /insufficient funds/i,
    "Fonduri insuficiente pe card. Te rugăm să folosești alt card.",
  ],
  [
    /declined|do not honor/i,
    "Plata a fost refuzată de banca emitentă. Te rugăm să folosești alt card sau să contactezi banca.",
  ],
  [
    /expired/i,
    "Cardul folosit a expirat. Te rugăm să folosești alt card.",
  ],
  [
    /payment (session|collection|method)|not authorized|authorization|payment provider|payment_provider/i,
    "Plata nu a putut fi autorizată. Te rugăm să reiei pasul de plată sau să folosești alt card.",
  ],
  [
    /shipping (option|method)|fulfillment/i,
    "Metoda de livrare selectată nu mai este disponibilă. Te rugăm să alegi altă metodă de livrare.",
  ],
  [
    /promotion|promo code|discount/i,
    "Codul de reducere nu mai este valabil pentru această comandă.",
  ],
  [
    /cart (was )?not found|no existing cart|cart does not exist/i,
    "Coșul tău nu mai este disponibil. Te rugăm să îl verifici și să reiei comanda.",
  ],
  [
    /no response received|fetch failed|network|timeout|ETIMEDOUT|ECONNREFUSED/i,
    "Nu am putut comunica cu serverul. Verifică conexiunea la internet și încearcă din nou.",
  ],
]

/**
 * Turns a raw Medusa/Stripe/Next error message into Romanian copy that is safe
 * to show a customer. Messages that are already Romanian pass through: ours and
 * Stripe's (Elements is initialised with locale "ro") carry diacritics.
 */
export default function translateCheckoutError(
  message?: string | null
): string {
  if (!message) {
    return GENERIC_ERROR
  }

  for (const [pattern, translation] of TRANSLATIONS) {
    if (pattern.test(message)) {
      return translation
    }
  }

  return /[ăâîșț]/i.test(message) ? message : GENERIC_ERROR
}

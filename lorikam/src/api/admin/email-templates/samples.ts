// Sample payloads so the client can see the real email without placing an
// order. Shapes mirror what the subscriber/workflow actually pass.
export const ORDER_SAMPLE = {
  display_id: 1042,
  currency_code: "ron",
  total: 265,
  tax_total: 46.03,
  shipping_total: 25,
  customer: { first_name: "Ionuț", last_name: "Popescu" },
  items: [
    {
      product_title: "Tricou SCM Poli",
      variant_title: "Copil / 12 ani / Negru",
      quantity: 2,
      unit_price: 120,
    },
  ],
  shipping_address: {
    first_name: "Ionuț",
    last_name: "Popescu",
    address_1: "Strada Martirilor 18",
    city: "Timișoara",
    province: "Timiș",
    postal_code: "300123",
    country_code: "ro",
    phone: "+40 722 000 000",
  },
}

export const SAMPLES: Record<string, any> = {
  "order-placed": { order: ORDER_SAMPLE },
  "order-shipped": {
    order: ORDER_SAMPLE,
    tracking_numbers: ["7012345678"],
  },
  "order-delivered": { order: ORDER_SAMPLE },
  "order-canceled": { order: ORDER_SAMPLE },
  "customer-welcome": {
    customer: {
      first_name: "Ionuț",
      last_name: "Popescu",
      email: "ionut@example.ro",
    },
  },
  // The merchant alert shows two things the customer emails never render — the
  // chosen shipping method and the line-item personalisation — so its sample
  // adds them instead of ORDER_SAMPLE growing fields the other previews would
  // silently ignore.
  "order-placed-merchant": {
    order: {
      ...ORDER_SAMPLE,
      email: "ionut@example.ro",
      shipping_methods: [{ name: "Curier rapid (Cargus)", amount: 25 }],
      items: ORDER_SAMPLE.items.map((item) => ({
        ...item,
        metadata: {
          customizations: { nume_tricou: "POPESCU", numar_tricou: "10" },
          customization_labels: {
            nume_tricou: "Nume tricou",
            numar_tricou: "Număr tricou",
          },
        },
      })),
    },
  },
  "password-reset": {
    email: "ionut@example.ro",
    actor_type: "customer",
    // Shape only — the real link is built by the subscriber from
    // STOREFRONT_URL and the token on the event.
    reset_url:
      "https://lorikam.com/account/reset-password?token=eyJhbGciOi…&email=ionut%40example.ro",
  },
  "contact-message": {
    contact: {
      name: "Maria Ionescu",
      email: "maria@example.ro",
      phone: "+40 733 111 222",
      message: "Bună ziua,\nAș dori o ofertă pentru 20 de tricouri.",
    },
  },
}

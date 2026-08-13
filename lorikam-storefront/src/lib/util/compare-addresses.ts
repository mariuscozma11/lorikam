import { isEqual, pick } from "lodash"

const FIELDS = [
  "first_name",
  "last_name",
  "address_1",
  "company",
  "postal_code",
  "city",
  "country_code",
  "province",
  "phone",
]

// Saved customer addresses come back with `null` for empty optional fields
// while form input gives `""`, and casing/spacing varies between the two.
// Without normalising, two identical addresses compare as different.
const normalize = (address: any) => {
  const picked = pick(address || {}, FIELDS) as Record<string, unknown>

  return FIELDS.reduce<Record<string, string>>((acc, field) => {
    const value = picked[field]
    acc[field] =
      typeof value === "string" ? value.trim().toLowerCase() : value == null ? "" : String(value)
    return acc
  }, {})
}

export default function compareAddresses(address1: any, address2: any) {
  return isEqual(normalize(address1), normalize(address2))
}

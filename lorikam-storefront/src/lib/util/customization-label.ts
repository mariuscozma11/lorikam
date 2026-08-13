// Customization values are keyed by a slug ("numar_tricou"). Line items store
// the original labels alongside them, so prefer those — prettifying the slug
// loses diacritics and turns "Număr tricou" into "Num R Tricou".
export default function customizationLabel(
  key: string,
  labels?: Record<string, string> | null
) {
  const label = labels?.[key]

  if (label) {
    return label
  }

  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

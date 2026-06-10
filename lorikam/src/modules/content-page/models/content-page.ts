import { model } from "@medusajs/framework/utils"

// An admin-editable content page (legal documents, about, company info).
// Rendered as Markdown on the storefront, looked up by slug.
const ContentPage = model.define("content_page", {
  id: model.id().primaryKey(),
  slug: model.text().unique(),
  title: model.text(),
  content: model.text().nullable(), // Markdown
  is_published: model.boolean().default(true),
})

export default ContentPage

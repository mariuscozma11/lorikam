import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sendContactMessageWorkflow } from "../../../workflows/send-contact"
import { ContactType } from "./validators"

// POST /store/contact — sends the contact form message to the store email.
export const POST = async (
  req: MedusaRequest<ContactType>,
  res: MedusaResponse
) => {
  await sendContactMessageWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.json({ success: true })
}

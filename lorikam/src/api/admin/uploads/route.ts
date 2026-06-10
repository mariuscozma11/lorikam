import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"

// POST /admin/uploads - upload one or more images, returns their URLs
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const files = req.files as Express.Multer.File[]

  if (!files?.length) {
    return res.status(400).json({ message: "No file uploaded" })
  }

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ]
  for (const f of files) {
    if (!allowed.includes(f.mimetype)) {
      return res
        .status(400)
        .json({ message: "Doar imagini (JPEG, PNG, GIF, WebP, SVG)" })
    }
  }

  try {
    const { result } = await uploadFilesWorkflow(req.scope).run({
      input: {
        files: files.map((f) => ({
          filename: f.originalname,
          mimeType: f.mimetype,
          content: f.buffer.toString("base64"),
          access: "public",
        })),
      },
    })

    return res.json({
      files: result.map((f) => ({ id: f.id, url: f.url })),
    })
  } catch (error) {
    console.error("Upload error:", error)
    const isProd = process.env.NODE_ENV === "production"
    return res.status(500).json({
      message: isProd
        ? "Eroare la încărcare"
        : "Eroare la încărcare: " + (error as Error).message,
    })
  }
}

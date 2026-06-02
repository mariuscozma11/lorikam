import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"

// POST /admin/teams/upload - Upload team images (logo or banner)
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const files = req.files as Express.Multer.File[]

  if (!files || files.length === 0) {
    return res.status(400).json({
      message: "No file uploaded",
    })
  }

  // Validate file types - only allow images
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ]

  for (const file of files) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message:
          "Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP, SVG)",
      })
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

    // Return the first file (we typically upload one at a time)
    const uploadedFile = result[0]

    return res.json({
      file: {
        id: uploadedFile.id,
        url: uploadedFile.url,
      },
    })
  } catch (error) {
    console.error("File upload error:", error)
    const isProd = process.env.NODE_ENV === "production"
    return res.status(500).json({
      message: isProd
        ? "Failed to upload file"
        : "Failed to upload file: " + (error as Error).message,
    })
  }
}

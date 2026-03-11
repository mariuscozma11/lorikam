import { ExecArgs } from "@medusajs/framework/types"
import { COLOR_MODULE } from "../modules/color"
import ColorModuleService from "../modules/color/service"

const romanianColors = [
  { name: "Negru", hex_codes: ["#000000"], display_order: 1 },
  { name: "Alb", hex_codes: ["#FFFFFF"], display_order: 2 },
  { name: "Roșu", hex_codes: ["#FF0000"], display_order: 3 },
  { name: "Albastru", hex_codes: ["#0000FF"], display_order: 4 },
  { name: "Verde", hex_codes: ["#008000"], display_order: 5 },
  { name: "Galben", hex_codes: ["#FFFF00"], display_order: 6 },
  { name: "Portocaliu", hex_codes: ["#FFA500"], display_order: 7 },
  { name: "Mov", hex_codes: ["#800080"], display_order: 8 },
  { name: "Roz", hex_codes: ["#FFC0CB"], display_order: 9 },
  { name: "Gri", hex_codes: ["#808080"], display_order: 10 },
  { name: "Maro", hex_codes: ["#8B4513"], display_order: 11 },
  { name: "Bleumarin", hex_codes: ["#000080"], display_order: 12 },
  { name: "Bej", hex_codes: ["#F5F5DC"], display_order: 13 },
  { name: "Turcoaz", hex_codes: ["#40E0D0"], display_order: 14 },
  { name: "Coral", hex_codes: ["#FF7F50"], display_order: 15 },
]

export default async function seedColors({ container }: ExecArgs) {
  const colorService: ColorModuleService = container.resolve(COLOR_MODULE)

  console.log("Seeding Romanian colors...")

  for (const colorData of romanianColors) {
    // Check if color already exists
    const existing = await colorService.listColors({ name: colorData.name })

    if (existing.length > 0) {
      console.log(`Color "${colorData.name}" already exists, skipping...`)
      continue
    }

    await colorService.createColors({
      name: colorData.name,
      hex_codes: colorData.hex_codes as any,
      display_order: colorData.display_order,
    })
    console.log(`Created color: ${colorData.name}`)
  }

  console.log("Color seeding complete!")
}
